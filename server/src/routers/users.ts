import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and, sql } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users, profiles, batchEnrollments, batches } from "@db/schema";
import { sendNotification } from "../lib/notificationEngine";
import { recalculateStudentFees } from "../lib/feeEngine";

async function ensureUserProfileAndIds(db: any, user: any) {
  if (user && (user.role === "student" || user.role === "teacher")) {
    const isStudent = user.role === "student";
    const prefix = isStudent ? "STU" : "TCH";
    if (!user.profile) {
      const studentId = `${prefix}${1000 + user.id}`;
      const enrollmentNumber = isStudent
        ? `ENR${new Date().getFullYear()}${1000 + user.id}`
        : null;
      const [newProfile] = await db
        .insert(profiles)
        .values({
          userId: user.id,
          studentId,
          enrollmentNumber,
          feesTotal: "0",
          feesBalance: "0",
        })
        .returning();
      user.profile = newProfile;
    } else if (
      !user.profile.studentId ||
      (isStudent && !user.profile.enrollmentNumber)
    ) {
      const studentId = user.profile.studentId || `${prefix}${1000 + user.id}`;
      const enrollmentNumber = isStudent
        ? user.profile.enrollmentNumber ||
          `ENR${new Date().getFullYear()}${1000 + user.id}`
        : null;
      const [updatedProfile] = await db
        .update(profiles)
        .set({ studentId, enrollmentNumber })
        .where(eq(profiles.userId, user.id))
        .returning();
      user.profile = updatedProfile;
    }

    if (isStudent) {
      // Recalculate fees and reload profile to match latest course enrollments
      await recalculateStudentFees(db, user.id);
      user.profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, user.id),
      });
    }
  }
}

export const userRouter = createRouter({
  list: adminQuery
    .input(
      z
        .object({
          role: z
            .enum([
              "all",
              "student",
              "teacher",
              "admin",
              "academic_head",
              "super_admin",
            ])
            .default("all"),
          search: z.string().optional(),
          status: z
            .enum(["all", "active", "inactive", "suspended", "on_hold"])
            .default("all"),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.role && input.role !== "all")
        filters.push(eq(users.role, input.role));
      if (input?.status && input.status !== "all")
        filters.push(eq(users.status, input.status));
      if (input?.search) {
        filters.push(
          sql`${users.name} ILIKE ${"%" + input.search + "%"} OR ${users.phone} ILIKE ${"%" + input.search + "%"} OR ${users.email} ILIKE ${"%" + input.search + "%"}`
        );
      }

      const where = filters.length > 0 ? and(...filters) : undefined;
      const list = await db.query.users.findMany({
        where,
        limit: input?.limit || 50,
        offset: input?.offset || 0,
        orderBy: desc(users.createdAt),
        with: {
          profile: true,
          enrollments: {
            where: eq(batchEnrollments.status, "active"),
            with: {
              batch: {
                with: {
                  module: true,
                },
              },
            },
          },
        },
      });
      for (const u of list) {
        await ensureUserProfileAndIds(db, u);
      }
      return list;
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({
        where: eq(users.id, input.id),
        with: {
          profile: true,
          enrollments: {
            where: eq(batchEnrollments.status, "active"),
            with: {
              batch: {
                with: {
                  module: true,
                },
              },
            },
          },
        },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      await ensureUserProfileAndIds(db, user);
      return user;
    }),

  create: adminQuery
    .input(
      z.object({
        name: z.string().min(2),
        phone: z.string().min(10),
        email: z.string().email().optional(),
        username: z.string().min(3),
        password: z.string().min(6),
        role: z.enum([
          "student",
          "teacher",
          "admin",
          "academic_head",
          "super_admin",
        ]),
        course: z.string().optional(),
        batch: z.string().optional(),
        feesTotal: z.number().optional(),
        discount: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const existingUsername = await db.query.users.findFirst({
        where: eq(users.username, input.username),
      });
      if (existingUsername) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already exists",
        });
      }

      const existingPhone = await db.query.users.findFirst({
        where: eq(users.phone, input.phone),
      });
      if (existingPhone) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Phone already registered",
        });
      }

      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.default.hash(input.password, 10);

      const result = await db
        .insert(users)
        .values({
          unionId: `user_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: input.name,
          phone: input.phone,
          email: input.email,
          username: input.username,
          password: hashedPassword,
          role: input.role,
        })
        .returning({ id: users.id });

      const userId = result[0]?.id;

      const isStudent = input.role === "student";
      if (isStudent || input.course || input.feesTotal) {
        const studentId = isStudent ? `STU${1000 + userId}` : null;
        const enrollmentNumber = isStudent
          ? `ENR${new Date().getFullYear()}${1000 + userId}`
          : null;
        const discountVal = input.discount || 0;
        const feesTotalVal = input.feesTotal || 0;
        await db.insert(profiles).values({
          userId,
          studentId,
          enrollmentNumber,
          course: input.course || null,
          batch: input.batch || null,
          feesTotal: String(feesTotalVal),
          discount: String(discountVal),
          feesBalance: String(feesTotalVal - discountVal),
        });
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        with: { profile: true },
      });
      await ensureUserProfileAndIds(db, user);
      return user;
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        status: z
          .enum(["active", "inactive", "suspended", "on_hold"])
          .optional(),
        course: z.string().optional(),
        batch: z.string().optional(),
        feesTotal: z.number().optional(),
        discount: z.number().optional(),
        completionDate: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const {
        id,
        course,
        batch,
        feesTotal,
        discount,
        completionDate,
        ...userData
      } = input;

      await db.update(users).set(userData).where(eq(users.id, id));

      if (
        course !== undefined ||
        batch !== undefined ||
        feesTotal !== undefined ||
        discount !== undefined ||
        completionDate !== undefined
      ) {
        const existingProfile = await db.query.profiles.findFirst({
          where: eq(profiles.userId, id),
        });
        if (existingProfile) {
          let feesBalance: string | undefined;
          const currentFeesTotal =
            feesTotal !== undefined
              ? feesTotal
              : parseFloat(existingProfile.feesTotal ?? "0");
          const currentDiscount =
            discount !== undefined
              ? discount
              : parseFloat(existingProfile.discount ?? "0");
          const feesPaid = parseFloat(existingProfile.feesPaid ?? "0");
          feesBalance = String(currentFeesTotal - currentDiscount - feesPaid);

          await db
            .update(profiles)
            .set({
              course,
              batch,
              feesTotal:
                feesTotal !== undefined ? String(feesTotal) : undefined,
              discount: discount !== undefined ? String(discount) : undefined,
              feesBalance,
              completionDate,
            })
            .where(eq(profiles.userId, id));
        } else {
          const userObj = await db.query.users.findFirst({
            where: eq(users.id, id),
          });
          const isStudent = userObj?.role === "student";
          const studentId = isStudent ? `STU${1000 + id}` : null;
          const enrollmentNumber = isStudent
            ? `ENR${new Date().getFullYear()}${1000 + id}`
            : null;
          const feesTotalVal = feesTotal || 0;
          const discountVal = discount || 0;
          await db.insert(profiles).values({
            userId: id,
            studentId,
            enrollmentNumber,
            course,
            batch,
            feesTotal: String(feesTotalVal),
            discount: String(discountVal),
            feesBalance: String(feesTotalVal - discountVal),
            completionDate,
          });
        }

        // Task 15.1 — auto-enroll in community group batch when completionDate is set
        if (completionDate) {
          const communityBatch = await db.query.batches.findFirst({
            where: eq(batches.isCommunityGroup, true),
          });
          if (communityBatch) {
            // Only enroll if not already enrolled
            const existingEnrollment =
              await db.query.batchEnrollments.findFirst({
                where: and(
                  eq(batchEnrollments.batchId, communityBatch.id),
                  eq(batchEnrollments.studentId, id)
                ),
              });
            if (!existingEnrollment) {
              await db.insert(batchEnrollments).values({
                batchId: communityBatch.id,
                studentId: id,
                status: "active",
              });
              await sendNotification(
                id,
                "Welcome to the Community Group",
                `Congratulations on completing your course! You have been enrolled in the community group: ${communityBatch.name}.`,
                "community_group_welcome"
              );
            }
          }
        }
      }

      const resUser = await db.query.users.findFirst({
        where: eq(users.id, id),
        with: { profile: true },
      });
      await ensureUserProfileAndIds(db, resUser);
      return resUser;
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(users).where(eq(users.id, input.id));
      return { success: true };
    }),

  myProfile: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
      with: {
        profile: true,
        enrollments: {
          where: eq(batchEnrollments.status, "active"),
          with: {
            batch: {
              with: {
                module: true,
              },
            },
          },
        },
      },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    await ensureUserProfileAndIds(db, user);
    return user;
  }),

  myBatches: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    if (ctx.user.role === "teacher") {
      return db.query.batches.findMany({
        where: eq(batches.teacherId, ctx.user.id),
        with: { module: true, teacher: true },
      });
    }
    const enrollments = await db.query.batchEnrollments.findMany({
      where: and(
        eq(batchEnrollments.studentId, ctx.user.id),
        eq(batchEnrollments.status, "active")
      ),
      with: { batch: { with: { module: true, teacher: true } } },
    });
    return enrollments;
  }),

  importStudents: adminQuery
    .input(
      z.array(
        z.object({
          name: z.string(),
          phone: z.string(),
          email: z.string().optional(),
          course: z.string().optional(),
          batch: z.string().optional(),
          feesTotal: z.number().optional(),
        })
      )
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const bcrypt = await import("bcryptjs");
      const results = [];
      for (const s of input) {
        const hashedPassword = await bcrypt.default.hash(s.phone.slice(-6), 10);
        const result = await db
          .insert(users)
          .values({
            unionId: `user_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            name: s.name,
            phone: s.phone,
            email: s.email,
            username: s.phone,
            password: hashedPassword,
            role: "student",
          })
          .returning({ id: users.id });
        const userId = result[0]?.id;

        const studentId = `STU${1000 + userId}`;
        const enrollmentNumber = `ENR${new Date().getFullYear()}${1000 + userId}`;

        await db.insert(profiles).values({
          userId,
          studentId,
          enrollmentNumber,
          course: s.course || null,
          batch: s.batch || null,
          feesTotal: String(s.feesTotal || 0),
          feesBalance: String(s.feesTotal || 0),
        });
        results.push(userId);
      }
      return { imported: results.length };
    }),
});
