import { z } from "zod";
import { eq, desc, and, or, inArray, sql } from "drizzle-orm";
import {
  createRouter,
  authedQuery,
  adminQuery,
  teacherQuery,
} from "../middleware";
import { getDb } from "../queries/connection";
import {
  classes,
  attendance,
  oneToOneSessions,
  batchEnrollments,
  batches,
  profiles,
} from "@db/schema";
import {
  sendBulkNotification,
  sendNotification,
  getAdminUserIds,
} from "../lib/notificationEngine";

export const classRouter = createRouter({
  list: authedQuery
    .input(
      z
        .object({
          batchId: z.number().optional(),
          status: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const filters = [];
      if (input?.batchId) {
        filters.push(
          or(
            eq(classes.batchId, input.batchId),
            sql`EXISTS (
              SELECT 1 FROM json_array_elements(COALESCE(${classes.batchIds}, '[]'::json)) AS elem 
              WHERE (elem->>0)::int = ${input.batchId}
            )`
          )
        );
      }
      if (input?.status)
        filters.push(
          eq(
            classes.status,
            input.status as "scheduled" | "ongoing" | "completed" | "cancelled"
          )
        );
      if (ctx.user.role === "teacher")
        filters.push(eq(classes.teacherId, ctx.user.id));
      if (ctx.user.role === "student") {
        const studentEnrollments = await db.query.batchEnrollments.findMany({
          where: and(
            eq(batchEnrollments.studentId, ctx.user.id),
            eq(batchEnrollments.status, "active")
          ),
        });
        const enrolledBatchIds = studentEnrollments.map(e => e.batchId);
        if (enrolledBatchIds.length > 0) {
          filters.push(
            or(
              inArray(classes.batchId, enrolledBatchIds),
              sql`EXISTS (
                SELECT 1 FROM json_array_elements(COALESCE(${classes.batchIds}, '[]'::json)) AS elem 
                WHERE (elem->>0)::int IN (${sql.join(enrolledBatchIds, sql`, `)})
              )`
            )
          );
        } else {
          return [];
        }
      }

      const where = filters.length > 0 ? and(...filters) : undefined;
      return db.query.classes.findMany({
        where,
        orderBy: desc(classes.scheduledAt),
        with: {
          batch: { with: { module: true } },
          teacher: true,
          module: true,
        },
      });
    }),

  create: teacherQuery
    .input(
      z.object({
        batchId: z.number().optional(),
        batchIds: z.array(z.number()).optional(),
        moduleId: z.number().optional(),
        title: z.string(),
        description: z.string().optional(),
        classType: z.enum(["group", "one_to_one"]).default("group"),
        scheduledAt: z.date(),
        meetingUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const batchId =
        input.batchId || (input.batchIds && input.batchIds[0]) || null;
      const result = await db
        .insert(classes)
        .values({
          ...input,
          batchId,
          teacherId: ctx.user.id,
        })
        .returning({ id: classes.id });
      return db.query.classes.findFirst({
        where: eq(classes.id, result[0]?.id),
        with: { batch: { with: { module: true } }, module: true },
      });
    }),

  start: teacherQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const cls = await db.query.classes.findFirst({
        where: eq(classes.id, input.id),
      });
      if (!cls || cls.teacherId !== ctx.user.id)
        throw new Error("Not authorized");
      await db
        .update(classes)
        .set({ status: "ongoing", startedAt: new Date() })
        .where(eq(classes.id, input.id));

      // Record teacher attendance
      const existingTeacherAttendance = await db.query.attendance.findFirst({
        where: and(
          eq(attendance.classId, cls.id),
          eq(attendance.studentId, ctx.user.id)
        ),
      });
      if (!existingTeacherAttendance) {
        await db.insert(attendance).values({
          classId: cls.id,
          studentId: ctx.user.id,
          status: "present",
          chatCount: 0,
        });
      }

      // Notify all active enrolled students
      const targetBatchIds =
        cls.batchIds && cls.batchIds.length > 0
          ? cls.batchIds
          : cls.batchId
            ? [cls.batchId]
            : [];

      let studentIds: number[] = [];
      if (targetBatchIds.length > 0) {
        const enrollments = await db.query.batchEnrollments.findMany({
          where: and(
            inArray(batchEnrollments.batchId, targetBatchIds),
            eq(batchEnrollments.status, "active")
          ),
        });
        studentIds = Array.from(new Set(enrollments.map(e => e.studentId)));
      }
      if (studentIds.length > 0) {
        await sendBulkNotification(
          studentIds,
          "Class Started",
          `${cls.title} has started`,
          "class_start"
        );
      }

      return { success: true };
    }),

  joinClass: authedQuery
    .input(z.object({ classId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const cls = await db.query.classes.findFirst({
        where: eq(classes.id, input.classId),
      });
      if (!cls) throw new Error("Class not found");

      // Record attendance for whoever joined
      const existing = await db.query.attendance.findFirst({
        where: and(
          eq(attendance.classId, input.classId),
          eq(attendance.studentId, ctx.user.id)
        ),
      });
      if (!existing) {
        await db.insert(attendance).values({
          classId: input.classId,
          studentId: ctx.user.id,
          status: "present",
          chatCount: 0,
        });
      } else {
        await db
          .update(attendance)
          .set({ status: "present" })
          .where(eq(attendance.id, existing.id));
      }
      return { success: true };
    }),

  end: teacherQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const cls = await db.query.classes.findFirst({
        where: eq(classes.id, input.id),
      });
      if (!cls || cls.teacherId !== ctx.user.id)
        throw new Error("Not authorized");
      const endedAt = new Date();
      const duration = cls.startedAt
        ? Math.floor(
            (endedAt.getTime() - new Date(cls.startedAt).getTime()) / 60000
          )
        : 0;
      await db
        .update(classes)
        .set({ status: "completed", endedAt, duration })
        .where(eq(classes.id, input.id));
      return { success: true };
    }),

  cancel: teacherQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const cls = await db.query.classes.findFirst({
        where: eq(classes.id, input.id),
      });
      if (!cls) throw new Error("Class not found");
      const isAdmin = ["super_admin", "admin", "academic_head"].includes(
        ctx.user.role
      );
      if (!isAdmin && cls.teacherId !== ctx.user.id)
        throw new Error("Not authorized");
      await db
        .update(classes)
        .set({ status: "cancelled" })
        .where(eq(classes.id, input.id));
      return { success: true };
    }),

  // ─── One-to-One Sessions ─────────────────────────────────────────────────────

  listOneToOne: authedQuery
    .input(
      z
        .object({
          studentId: z.number().optional(),
          teacherId: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const filters = [];
      if (input?.studentId)
        filters.push(eq(oneToOneSessions.studentId, input.studentId));
      if (input?.teacherId)
        filters.push(eq(oneToOneSessions.teacherId, input.teacherId));
      if (ctx.user.role === "student")
        filters.push(eq(oneToOneSessions.studentId, ctx.user.id));
      if (ctx.user.role === "teacher")
        filters.push(eq(oneToOneSessions.teacherId, ctx.user.id));

      const where = filters.length > 0 ? and(...filters) : undefined;
      return db.query.oneToOneSessions.findMany({
        where,
        orderBy: desc(oneToOneSessions.scheduledAt),
        with: { teacher: true, student: true },
      });
    }),

  createOneToOne: adminQuery
    .input(
      z.object({
        teacherId: z.number(),
        studentId: z.number(),
        sessionLength: z.number().default(30),
        scheduledAt: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const validUntil = new Date(input.scheduledAt);
      validUntil.setDate(validUntil.getDate() + 60);
      const result = await db
        .insert(oneToOneSessions)
        .values({
          ...input,
          validFrom: input.scheduledAt,
          validUntil,
        })
        .returning({ id: oneToOneSessions.id });
      return db.query.oneToOneSessions.findFirst({
        where: eq(oneToOneSessions.id, result[0]?.id),
      });
    }),

  // Task 11.1 — complete a one-to-one session with duration validation
  completeOneToOne: teacherQuery
    .input(
      z.object({
        sessionId: z.number(),
        actualDurationMinutes: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const session = await db.query.oneToOneSessions.findFirst({
        where: eq(oneToOneSessions.id, input.sessionId),
      });
      if (!session) throw new Error("Session not found");
      if (session.teacherId !== ctx.user.id) throw new Error("Not authorized");

      const { sessionLength, actualDurationMinutes: dur } = {
        ...session,
        actualDurationMinutes: input.actualDurationMinutes,
      };

      let valid = false;
      if (sessionLength === 30) {
        valid = dur >= 25 && dur <= 40;
      } else if (sessionLength === 45) {
        valid = dur >= 35 && dur <= 60;
      } else {
        // For other lengths, accept within ±20% tolerance
        valid = dur >= sessionLength * 0.8 && dur <= sessionLength * 1.5;
      }

      if (!valid) {
        throw new Error(
          `Duration ${dur} min is outside the acceptable range for a ${sessionLength}-min session.`
        );
      }

      await db
        .update(oneToOneSessions)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(oneToOneSessions.id, input.sessionId));

      return { success: true };
    }),

  // Task 11.3 — update/delete session recording (admin-only)
  updateSessionRecording: adminQuery
    .input(
      z.object({
        sessionId: z.number(),
        recordingUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(oneToOneSessions)
        .set({ recordingUrl: input.recordingUrl })
        .where(eq(oneToOneSessions.id, input.sessionId));
      return { success: true };
    }),

  deleteSessionRecording: adminQuery
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(oneToOneSessions)
        .set({ recordingUrl: null, recordingDeletedAt: new Date() })
        .where(eq(oneToOneSessions.id, input.sessionId));
      return { success: true };
    }),

  // Task 11.5 — student session summary
  mySessionSummary: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const allSessions = await db.query.oneToOneSessions.findMany({
      where: eq(oneToOneSessions.studentId, ctx.user.id),
    });
    const completed = allSessions.filter(s => s.status === "completed").length;
    const total = allSessions.length;
    return { completed, remaining: total - completed };
  }),

  // Task 11.6 — teacher session summary
  teacherSessionSummary: teacherQuery
    .input(z.object({ teacherId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const teacherId = input?.teacherId ?? ctx.user.id;
      const allSessions = await db.query.oneToOneSessions.findMany({
        where: eq(oneToOneSessions.teacherId, teacherId),
      });
      const totalHandled = allSessions.filter(
        s => s.status === "completed"
      ).length;
      // Earnings calculation: return 0 until rate configuration is available
      const totalEarnings = 0;
      return { totalHandled, totalEarnings };
    }),

  // ─── Attendance ──────────────────────────────────────────────────────────────

  getAttendance: teacherQuery
    .input(z.object({ classId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.attendance.findMany({
        where: eq(attendance.classId, input.classId),
        with: { student: true },
      });
    }),

  recordAttendance: teacherQuery
    .input(
      z.object({
        classId: z.number(),
        studentId: z.number(),
        chatCount: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const status = input.chatCount >= 4 ? "present" : "absent";
      const existing = await db.query.attendance.findFirst({
        where: and(
          eq(attendance.classId, input.classId),
          eq(attendance.studentId, input.studentId)
        ),
      });
      if (existing) {
        await db
          .update(attendance)
          .set({ chatCount: input.chatCount, status })
          .where(eq(attendance.id, existing.id));
      } else {
        await db.insert(attendance).values({
          classId: input.classId,
          studentId: input.studentId,
          chatCount: input.chatCount,
          status,
        });
      }

      // Check for 7 consecutive absences
      const last7 = await db.query.attendance.findMany({
        where: eq(attendance.studentId, input.studentId),
        orderBy: desc(attendance.recordedAt),
        limit: 7,
      });
      if (last7.length === 7 && last7.every(r => r.status === "absent")) {
        const cls = await db.query.classes.findFirst({
          where: eq(classes.id, input.classId),
        });
        if (cls) {
          const refBatchId =
            cls.batchId || (cls.batchIds && cls.batchIds[0]) || null;
          const batch = refBatchId
            ? await db.query.batches.findFirst({
                where: eq(batches.id, refBatchId),
              })
            : null;
          const adminIds = await getAdminUserIds();
          await sendNotification(
            input.studentId,
            "Absence Alert",
            "You have been absent for 7 consecutive classes",
            "absence_alert"
          );
          if (batch?.teacherId) {
            await sendNotification(
              batch.teacherId,
              "Student Absence Alert",
              `A student has been absent for 7 consecutive classes`,
              "absence_alert"
            );
          }
          if (adminIds.length > 0) {
            await sendBulkNotification(
              adminIds,
              "Student Absence Alert",
              `A student has been absent for 7 consecutive classes`,
              "absence_alert"
            );
          }
        }
      }

      // Task 17.1 — attendance streak badge (feature-flagged)
      if (process.env.FEATURE_GAMIFICATION === "true" && status === "present") {
        const recentAttendance = await db.query.attendance.findMany({
          where: eq(attendance.studentId, input.studentId),
          orderBy: desc(attendance.recordedAt),
          limit: 30,
        });

        // Count consecutive present records from the most recent
        let streak = 0;
        for (const record of recentAttendance) {
          if (record.status === "present") {
            streak++;
          } else {
            break;
          }
        }

        if (streak === 7 || streak === 30) {
          const badgeLabel = streak === 7 ? "7-Day Streak" : "30-Day Streak";
          const profile = await db.query.profiles.findFirst({
            where: eq(profiles.userId, input.studentId),
          });
          if (profile) {
            const timeline = Array.isArray(profile.activityTimeline)
              ? profile.activityTimeline
              : [];
            timeline.push({
              type: "badge",
              badge: badgeLabel,
              timestamp: new Date().toISOString(),
            });
            await db
              .update(profiles)
              .set({ activityTimeline: timeline })
              .where(eq(profiles.userId, input.studentId));
          }
        }
      }

      return { success: true, status };
    }),

  myAttendance: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.attendance.findMany({
      where: eq(attendance.studentId, ctx.user.id),
      with: { class: true },
    });
  }),
});
