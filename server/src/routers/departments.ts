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
  studentClassAllocations,
  sessionAllocationLogs,
} from "@db/schema";
import { updateStudentSessionBalances } from "../lib/sessionHelper";

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
          allocation: studentClassAllocations.allocation,
        })
        .from(batchEnrollments)
        .innerJoin(users, eq(batchEnrollments.studentId, users.id))
        .innerJoin(batches, eq(batchEnrollments.batchId, batches.id))
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .leftJoin(studentClassAllocations, eq(users.id, studentClassAllocations.studentId))
        .where(and(inArray(batchEnrollments.batchId, batchIds), eq(batchEnrollments.status, "active")));

      // Deduplicate by student id
      const seen = new Set<number>();
      return enrollments
        .filter((e) => { if (seen.has(e.id)) return false; seen.add(e.id); return true; })
        .map((e) => ({
          ...e
        }));
    }),

  // 7b. Update student class allocation (Academic Head)
  updateStudentAllocation: authedQuery
    .input(z.object({
      studentId: z.number(),
      allocation: z.any(), // expecting ClassAllocationValue structure
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      if (ctx.user.role !== "academic_head") throw new TRPCError({ code: "FORBIDDEN" });

      // Verify the student belongs to the academic head's department
      const dept = await db.query.departments.findFirst({
        where: eq(departments.headUserId, ctx.user.id),
        with: { departmentModules: true },
      });
      if (!dept) throw new TRPCError({ code: "FORBIDDEN", message: "No department assigned" });

      const moduleIds = dept.departmentModules.map((dm) => dm.moduleId);
      if (moduleIds.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No modules assigned to your department" });
      }
      
      const batchRows = await db.select({ id: batches.id }).from(batches).where(inArray(batches.moduleId, moduleIds));
      const batchIds = batchRows.map((b) => b.id);
      
      if (batchIds.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No batches found for your department" });
      }

      const isMyStudent = await db.query.batchEnrollments.findFirst({
        where: and(
          eq(batchEnrollments.studentId, input.studentId),
          inArray(batchEnrollments.batchId, batchIds),
          eq(batchEnrollments.status, "active")
        ),
      });

      if (!isMyStudent) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Student does not belong to your department" });
      }

      const deptTeachers = await db.query.departmentTeachers.findMany({
        where: eq(departmentTeachers.departmentId, dept.id)
      });
      const validTeacherIds = deptTeachers.map(dt => dt.teacherId);

      const newAllocPayload = input.allocation;

      if (newAllocPayload.oneToOne?.teacherId && !validTeacherIds.includes(newAllocPayload.oneToOne.teacherId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Selected One-to-One teacher is not in your department" });
      }
      if (newAllocPayload.group?.teacherId && !validTeacherIds.includes(newAllocPayload.group.teacherId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Selected Group teacher is not in your department" });
      }
      if (newAllocPayload.group?.batchId && !batchIds.includes(newAllocPayload.group.batchId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Selected Group batch is not in your department" });
      }

      await db.transaction(async (tx: any) => {
        const existingAlloc = await tx.query.studentClassAllocations.findFirst({
          where: eq(studentClassAllocations.studentId, input.studentId),
        });

        let prevOneToOne = 0;
        let prevGroup = 0;
        let newOneToOne = 0;
        let newGroup = 0;

        if (existingAlloc && existingAlloc.allocation) {
          const old = existingAlloc.allocation as any;
          prevOneToOne = (old.oneToOne?.sessions30 || 0) + (old.oneToOne?.sessions45 || 0) + (old.oneToOne?.sessions60 || 0);
          prevGroup = (old.group?.sessions30 || 0) + (old.group?.sessions45 || 0) + (old.group?.sessions60 || 0);
          
          newOneToOne = prevOneToOne;
          newGroup = prevGroup;

          const mergedAlloc = {
            oneToOne: {
              ...old.oneToOne,
              teacherId: newAllocPayload.oneToOne.teacherId || null,
              designatedTime: newAllocPayload.oneToOne.designatedTime || "",
              // Academic Head cannot change allocated session counts
            },
            group: {
              ...old.group,
              teacherId: newAllocPayload.group.teacherId || null,
              batchId: newAllocPayload.group.batchId || null,
              designatedTime: newAllocPayload.group.designatedTime || "",
            }
          };

          await tx.update(studentClassAllocations)
            .set({ allocation: mergedAlloc, updatedAt: new Date() })
            .where(eq(studentClassAllocations.studentId, input.studentId));
        } else {
          // If no existing alloc, initialize with zero completed but read counts from batchEnrollments
          const defaultAlloc = {
            oneToOne: {
              teacherId: newAllocPayload.oneToOne.teacherId || null,
              designatedTime: newAllocPayload.oneToOne.designatedTime || "",
              sessions30: isMyStudent.oneOnOne30Allocated || 0,
              sessions45: isMyStudent.oneOnOne45Allocated || 0,
              sessions60: isMyStudent.oneOnOne60Allocated || 0,
              completed30: isMyStudent.oneOnOne30Used || 0,
              completed45: isMyStudent.oneOnOne45Used || 0,
              completed60: isMyStudent.oneOnOne60Used || 0,
              remaining30: Math.max(0, (isMyStudent.oneOnOne30Allocated || 0) - (isMyStudent.oneOnOne30Used || 0)),
              remaining45: Math.max(0, (isMyStudent.oneOnOne45Allocated || 0) - (isMyStudent.oneOnOne45Used || 0)),
              remaining60: Math.max(0, (isMyStudent.oneOnOne60Allocated || 0) - (isMyStudent.oneOnOne60Used || 0)),
            },
            group: {
              teacherId: newAllocPayload.group.teacherId || null,
              batchId: newAllocPayload.group.batchId || null,
              designatedTime: newAllocPayload.group.designatedTime || "",
              sessions30: isMyStudent.group30Allocated || 0,
              sessions45: isMyStudent.group45Allocated || 0,
              sessions60: isMyStudent.group60Allocated || 0,
              completed30: isMyStudent.group30Used || 0,
              completed45: isMyStudent.group45Used || 0,
              completed60: isMyStudent.group60Used || 0,
              remaining30: Math.max(0, (isMyStudent.group30Allocated || 0) - (isMyStudent.group30Used || 0)),
              remaining45: Math.max(0, (isMyStudent.group45Allocated || 0) - (isMyStudent.group45Used || 0)),
              remaining60: Math.max(0, (isMyStudent.group60Allocated || 0) - (isMyStudent.group60Used || 0)),
            }
          };
          newOneToOne = (defaultAlloc.oneToOne.sessions30) + (defaultAlloc.oneToOne.sessions45) + (defaultAlloc.oneToOne.sessions60);
          newGroup = (defaultAlloc.group.sessions30) + (defaultAlloc.group.sessions45) + (defaultAlloc.group.sessions60);
          
          await tx.insert(studentClassAllocations).values({
            studentId: input.studentId,
            allocation: defaultAlloc,
          });
        }

        await tx.insert(sessionAllocationLogs).values({
          studentId: input.studentId,
          changedBy: ctx.user.id,
          previousOneToOne: prevOneToOne,
          newOneToOne: newOneToOne,
          previousGroup: prevGroup,
          newGroup: newGroup,
          reason: "Academic Head Allocation Update",
        });

        await updateStudentSessionBalances(tx, input.studentId);
      });

      await updateStudentSessionBalances(db, input.studentId);
      return { success: true };
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
