import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, inArray, gte, lte } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import {
  departments,
  departmentModules,
  departmentTeachers,
  users,
  batches,
  batchEnrollments,
  attendance,
  classes,
} from "@db/schema";

export const departmentRouter = createRouter({
  // 1. List all departments
  list: authedQuery
    .query(async ({ ctx }) => {
      const db = getDb();
      if (!["super_admin", "admin", "academic_head"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const depts = await db.query.departments.findMany({
        with: {
          head: { columns: { id: true, username: true, name: true } },
          departmentModules: {
            with: { module: { columns: { id: true, name: true } } },
          },
          departmentTeachers: {
            with: { teacher: { columns: { id: true, name: true } } },
          },
        },
        orderBy: (d, { asc }) => [asc(d.name)],
      });
      return depts.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        isActive: d.isActive,
        head: d.head,
        modules: d.departmentModules.map((dm) => dm.module),
        teachers: d.departmentTeachers.map((dt) => dt.teacher),
        createdAt: d.createdAt,
      }));
    }),

  // 2. Get MY department (academic_head)
  getMyDepartment: authedQuery
    .query(async ({ ctx }) => {
      const db = getDb();
      if (ctx.user.role !== "academic_head") throw new TRPCError({ code: "FORBIDDEN" });
      const dept = await db.query.departments.findFirst({
        where: eq(departments.headUserId, ctx.user.id),
        with: {
          head: { columns: { id: true, username: true, name: true } },
          departmentModules: {
            with: { module: { columns: { id: true, name: true, status: true } } },
          },
        },
      });
      if (!dept) return null;
      const moduleIds = dept.departmentModules.map((dm) => dm.moduleId);
      let studentCount = 0;
      if (moduleIds.length > 0) {
        const batchRows = await db.select({ id: batches.id }).from(batches).where(inArray(batches.moduleId, moduleIds));
        const batchIds = batchRows.map((b) => b.id);
        if (batchIds.length > 0) {
          const enrollments = await db.select({ studentId: batchEnrollments.studentId }).from(batchEnrollments)
            .where(and(inArray(batchEnrollments.batchId, batchIds), eq(batchEnrollments.status, "active")));
          studentCount = new Set(enrollments.map((e) => e.studentId)).size;
        }
      }
      return { ...dept, modules: dept.departmentModules.map((dm) => dm.module), studentCount };
    }),

  // 3. Create department
  create: adminQuery
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      headUserId: z.number().nullable().optional(),
      moduleIds: z.array(z.number()).default([]),
      teacherIds: z.array(z.number()).default([]),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role === "academic_head") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Academic heads cannot create departments" });
      }
      const db = getDb();
      const [dept] = await db.insert(departments).values({
        name: input.name,
        description: input.description,
        headUserId: input.headUserId ?? null,
        isActive: input.isActive,
      }).returning();
      if (input.moduleIds.length > 0) {
        await db.insert(departmentModules).values(input.moduleIds.map((moduleId) => ({ departmentId: dept.id, moduleId })));
      }
      if (input.teacherIds.length > 0) {
        await db.insert(departmentTeachers).values(input.teacherIds.map((teacherId) => ({ departmentId: dept.id, teacherId })));
      }
      return dept;
    }),

  // 4. Update department
  update: adminQuery
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional().nullable(),
      headUserId: z.number().nullable().optional(),
      moduleIds: z.array(z.number()).optional(),
      teacherIds: z.array(z.number()).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role === "academic_head") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Academic heads cannot update departments" });
      }
      const db = getDb();
      const { id, moduleIds, teacherIds, ...fields } = input;
      const updateData: any = { updatedAt: new Date() };
      if (fields.name !== undefined) updateData.name = fields.name;
      if (fields.description !== undefined) updateData.description = fields.description;
      if (fields.headUserId !== undefined) updateData.headUserId = fields.headUserId;
      if (fields.isActive !== undefined) updateData.isActive = fields.isActive;
      await db.update(departments).set(updateData).where(eq(departments.id, id));
      if (moduleIds !== undefined) {
        await db.delete(departmentModules).where(eq(departmentModules.departmentId, id));
        if (moduleIds.length > 0) {
          await db.insert(departmentModules).values(moduleIds.map((moduleId) => ({ departmentId: id, moduleId })));
        }
      }
      if (teacherIds !== undefined) {
        await db.delete(departmentTeachers).where(eq(departmentTeachers.departmentId, id));
        if (teacherIds.length > 0) {
          await db.insert(departmentTeachers).values(teacherIds.map((teacherId) => ({ departmentId: id, teacherId })));
        }
      }
      return { success: true };
    }),

  // 5. Delete department
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role === "academic_head") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Academic heads cannot delete departments" });
      }
      const db = getDb();
      await db.delete(departments).where(eq(departments.id, input.id));
      return { success: true };
    }),

  // 6. List academic heads for dropdown
  listAcademicHeads: adminQuery
    .query(async () => {
      const db = getDb();
      return db.select({ id: users.id, name: users.name, username: users.username })
        .from(users).where(eq(users.role, "academic_head"));
    }),

  // 6b. List teachers for dropdown
  listTeachers: adminQuery
    .query(async () => {
      const db = getDb();
      return db.select({ id: users.id, name: users.name, username: users.username })
        .from(users).where(eq(users.role, "teacher"));
    }),

  // 7. Get students enrolled in my department's modules
  getMyStudents: authedQuery
    .query(async ({ ctx }) => {
      const db = getDb();
      if (ctx.user.role !== "academic_head") throw new TRPCError({ code: "FORBIDDEN" });
      const dept = await db.query.departments.findFirst({
        where: eq(departments.headUserId, ctx.user.id),
        with: { departmentModules: true },
      });
      if (!dept) return [];
      const moduleIds = dept.departmentModules.map((dm) => dm.moduleId);
      if (moduleIds.length === 0) return [];
      const batchRows = await db
        .select({ id: batches.id, name: batches.name, moduleId: batches.moduleId })
        .from(batches)
        .where(inArray(batches.moduleId, moduleIds));
      const batchIds = batchRows.map((b) => b.id);
      if (batchIds.length === 0) return [];

      const { profiles } = await import("@db/schema");
      const enrollments = await db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          phoneNumber: users.phone,
          studentId: profiles.enrollmentId,
          batchName: batches.name,
          enrolledAt: batchEnrollments.joinedAt,
        })
        .from(batchEnrollments)
        .innerJoin(users, eq(batchEnrollments.studentId, users.id))
        .innerJoin(batches, eq(batchEnrollments.batchId, batches.id))
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(and(inArray(batchEnrollments.batchId, batchIds), eq(batchEnrollments.status, "active")));

      // Deduplicate by student id
      const seen = new Set<number>();
      return enrollments
        .filter((e) => { if (seen.has(e.id)) return false; seen.add(e.id); return true; })
        .map((e) => ({
          ...e
        }));
    }),

  // 8. Get attendance report for students in my department
  getMyStudentsReport: authedQuery
    .input(z.object({
      from: z.string().optional(),
      to: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      if (ctx.user.role !== "academic_head") throw new TRPCError({ code: "FORBIDDEN" });
      const dept = await db.query.departments.findFirst({
        where: eq(departments.headUserId, ctx.user.id),
        with: { departmentModules: true },
      });
      if (!dept) return [];
      const moduleIds = dept.departmentModules.map((dm) => dm.moduleId);
      if (moduleIds.length === 0) return [];
      const batchRows = await db.select({ id: batches.id }).from(batches).where(inArray(batches.moduleId, moduleIds));
      const batchIds = batchRows.map((b) => b.id);
      if (batchIds.length === 0) return [];

      // Get student ids in these batches
      const enrollmentRows = await db
        .select({ studentId: batchEnrollments.studentId })
        .from(batchEnrollments)
        .where(and(inArray(batchEnrollments.batchId, batchIds), eq(batchEnrollments.status, "active")));
      const studentIds = [...new Set(enrollmentRows.map((e) => e.studentId))];
      if (studentIds.length === 0) return [];

      const { attendance } = await import("@db/schema");

      // Fetch attendance records for these students
      let query = db
        .select({
          studentId: attendance.studentId,
          status: attendance.status,
          studentName: users.name,
          studentUsername: users.username,
        })
        .from(attendance)
        .innerJoin(users, eq(attendance.studentId, users.id))
        .innerJoin(classes, eq(attendance.classId, classes.id))
        .$dynamic();

      const conditions = [inArray(attendance.studentId, studentIds)];
      if (input.from) conditions.push(gte(classes.scheduledAt, new Date(input.from)));
      if (input.to) conditions.push(lte(classes.scheduledAt, new Date(input.to)));
      query = query.where(and(...conditions));
      const rows = await query;

      // Aggregate per student
      const map = new Map<number, { name: string; username: string; present: number; absent: number; late: number; total: number }>();
      for (const r of rows) {
        if (!map.has(r.studentId)) {
          map.set(r.studentId, { name: r.studentName ?? "", username: r.studentUsername ?? "", present: 0, absent: 0, late: 0, total: 0 });
        }
        const s = map.get(r.studentId)!;
        s.total++;
        if (r.status === "present") s.present++;
        else if (r.status === "absent") s.absent++;
        else if (r.status === "late") s.late++;
      }
      return Array.from(map.entries()).map(([id, v]) => ({ studentId: id, ...v }));
    }),
});
