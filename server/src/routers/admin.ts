import { z } from "zod";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { createRouter, adminQuery } from "../middleware";
import { recalculateStudentFees } from "../lib/feeEngine";
import { getDb } from "../queries/connection";
import {
  payments,
  teacherSalaries,
  profiles,
  users,
  flexibilityRequests,
  feedback,
  notifications,
  violations,
  classes,
  oneToOneSessions,
  batches,
  attendance,
  messages,
  batchEnrollments,
  modules,
} from "@db/schema";
import { sendNotification } from "../lib/notificationEngine";

export const adminRouter = createRouter({
  // ─── Payments / Fees ────────────────────────────────────────────────────────

  listPayments: adminQuery
    .input(
      z
        .object({
          studentId: z.number().optional(),
          status: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.studentId)
        filters.push(eq(payments.studentId, input.studentId));
      if (input?.status)
        filters.push(
          eq(
            payments.status,
            input.status as "paid" | "partial" | "unpaid" | "overdue"
          )
        );
      const where = filters.length > 0 ? and(...filters) : undefined;
      return db.query.payments.findMany({
        where,
        orderBy: desc(payments.createdAt),
        with: { student: true, course: true },
      });
    }),

  createPayment: adminQuery
    .input(
      z.object({
        studentId: z.number(),
        courseId: z.number().optional(),
        amount: z.number(),
        type: z.string().default("tuition"),
        dueDate: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db
        .insert(payments)
        .values({
          studentId: input.studentId,
          courseId: input.courseId,
          amount: String(input.amount),
          type: input.type,
          dueDate: input.dueDate,
          notes: input.notes,
          status: "unpaid",
        })
        .returning({ id: payments.id });
      return db.query.payments.findFirst({
        where: eq(payments.id, result[0]?.id),
        with: { student: true, course: true },
      });
    }),

  // Task 9.4 — reactivate enrollments and update profile fees on payment
  recordPayment: adminQuery
    .input(
      z.object({
        paymentId: z.number(),
        amount: z.number(),
        transactionId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const payment = await db.query.payments.findFirst({
        where: eq(payments.id, input.paymentId),
      });
      if (!payment) throw new Error("Payment not found");

      await db
        .update(payments)
        .set({
          status: "paid",
          paidAt: new Date(),
          transactionId: input.transactionId,
        })
        .where(eq(payments.id, input.paymentId));

      // Reactivate all inactive enrollments for the student
      const inactiveEnrollments = await db.query.batchEnrollments.findMany({
        where: and(
          eq(batchEnrollments.studentId, payment.studentId),
          eq(batchEnrollments.status, "inactive")
        ),
      });
      for (const enrollment of inactiveEnrollments) {
        await db
          .update(batchEnrollments)
          .set({ status: "active" })
          .where(eq(batchEnrollments.id, enrollment.id));
      }

      // Update profile feesPaid and recalculate feesBalance
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, payment.studentId),
      });
      if (profile) {
        const feesPaid = parseFloat(profile.feesPaid ?? "0") + input.amount;
        await db
          .update(profiles)
          .set({
            feesPaid: String(feesPaid),
          })
          .where(eq(profiles.userId, payment.studentId));

        await recalculateStudentFees(db, payment.studentId);
      }

      return { success: true };
    }),

  // ─── Flexibility Requests ────────────────────────────────────────────────────

  listRequests: adminQuery
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const where = input?.status
        ? eq(
            flexibilityRequests.status,
            input.status as "pending" | "approved" | "rejected"
          )
        : undefined;
      return db.query.flexibilityRequests.findMany({
        where,
        orderBy: desc(flexibilityRequests.requestedAt),
        with: { student: true, fromBatch: true, toBatch: true },
      });
    }),

  // Tasks 10.1–10.3 — apply enrollment state changes, notify, append timeline
  resolveRequest: adminQuery
    .input(
      z.object({
        requestId: z.number(),
        status: z.enum(["approved", "rejected"]),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      const request = await db.query.flexibilityRequests.findFirst({
        where: eq(flexibilityRequests.id, input.requestId),
      });
      if (!request) throw new Error("Request not found");

      await db
        .update(flexibilityRequests)
        .set({
          status: input.status,
          adminNote: input.note,
          resolvedAt: new Date(),
          resolvedBy: ctx.user.id,
        })
        .where(eq(flexibilityRequests.id, input.requestId));

      // Task 10.1 — apply enrollment state changes on approval
      if (input.status === "approved") {
        const { requestType, fromBatchId, toBatchId, studentId } = request;

        if (requestType === "hold" && fromBatchId) {
          await db
            .update(batchEnrollments)
            .set({ status: "on_hold" })
            .where(
              and(
                eq(batchEnrollments.batchId, fromBatchId),
                eq(batchEnrollments.studentId, studentId)
              )
            );
        } else if (requestType === "rejoin" && fromBatchId) {
          await db
            .update(batchEnrollments)
            .set({ status: "active" })
            .where(
              and(
                eq(batchEnrollments.batchId, fromBatchId),
                eq(batchEnrollments.studentId, studentId)
              )
            );
        } else if (requestType === "batch_change" && fromBatchId && toBatchId) {
          await db
            .update(batchEnrollments)
            .set({ status: "inactive", leftAt: new Date() })
            .where(
              and(
                eq(batchEnrollments.batchId, fromBatchId),
                eq(batchEnrollments.studentId, studentId)
              )
            );
          await db.insert(batchEnrollments).values({
            batchId: toBatchId,
            studentId,
            status: "active",
          });
        }
      }

      // Task 10.2 — notify student
      const statusLabel = input.status === "approved" ? "approved" : "rejected";
      await sendNotification(
        request.studentId,
        "Flexibility Request Update",
        `Your ${request.requestType} request has been ${statusLabel}.${input.note ? ` Note: ${input.note}` : ""}`,
        "flexibility_request_resolved"
      );

      // Task 10.3 — append to activityTimeline
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, request.studentId),
      });
      if (profile) {
        const timeline = Array.isArray(profile.activityTimeline)
          ? profile.activityTimeline
          : [];
        timeline.push({
          type: request.requestType,
          status: input.status,
          timestamp: new Date().toISOString(),
          adminNote: input.note ?? null,
        });
        await db
          .update(profiles)
          .set({ activityTimeline: timeline })
          .where(eq(profiles.userId, request.studentId));
      }

      return { success: true };
    }),

  // ─── Teacher Salaries ────────────────────────────────────────────────────────

  listSalaries: adminQuery
    .input(
      z
        .object({
          teacherId: z.number().optional(),
          month: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.teacherId)
        filters.push(eq(teacherSalaries.teacherId, input.teacherId));
      if (input?.month) filters.push(eq(teacherSalaries.month, input.month));
      const where = filters.length > 0 ? and(...filters) : undefined;
      return db.query.teacherSalaries.findMany({
        where,
        with: { teacher: true },
      });
    }),

  calculateSalary: adminQuery
    .input(
      z.object({
        teacherId: z.number(),
        month: z.string(),
        groupClassRate: z.number().default(0),
        oneToOneRate: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const groupCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(classes)
        .where(
          and(
            eq(classes.teacherId, input.teacherId),
            eq(classes.status, "completed"),
            eq(classes.classType, "group"),
            sql`TO_CHAR(${classes.scheduledAt}, 'YYYY-MM') = ${input.month}`
          )
        );
      const oneToOneCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(oneToOneSessions)
        .where(
          and(
            eq(oneToOneSessions.teacherId, input.teacherId),
            eq(oneToOneSessions.status, "completed"),
            sql`TO_CHAR(${oneToOneSessions.scheduledAt}, 'YYYY-MM') = ${input.month}`
          )
        );

      const gc = Number(groupCount[0]?.count || 0);
      const oc = Number(oneToOneCount[0]?.count || 0);
      const total = gc * input.groupClassRate + oc * input.oneToOneRate;

      const result = await db
        .insert(teacherSalaries)
        .values({
          teacherId: input.teacherId,
          month: input.month,
          groupClassesCount: gc,
          oneToOneCount: oc,
          groupClassRate: String(input.groupClassRate),
          oneToOneRate: String(input.oneToOneRate),
          totalAmount: String(total),
        })
        .returning({ id: teacherSalaries.id });
      return db.query.teacherSalaries.findFirst({
        where: eq(teacherSalaries.id, result[0]?.id),
      });
    }),

  // Task 12.1 — salary report export (structured JSON for client-side generation)
  exportSalaryReport: adminQuery
    .input(
      z.object({
        teacherId: z.number(),
        month: z.string(),
        format: z.enum(["pdf", "excel"]).default("excel"),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const teacher = await db.query.users.findFirst({
        where: eq(users.id, input.teacherId),
      });
      const salary = await db.query.teacherSalaries.findFirst({
        where: and(
          eq(teacherSalaries.teacherId, input.teacherId),
          eq(teacherSalaries.month, input.month)
        ),
        with: { teacher: true },
      });

      return {
        format: input.format,
        message: "Use this structured data for client-side report generation.",
        data: {
          teacher: teacher
            ? { id: teacher.id, name: teacher.name, email: teacher.email }
            : null,
          month: input.month,
          salary: salary ?? null,
        },
      };
    }),

  // ─── Feedback ────────────────────────────────────────────────────────────────

  listFeedback: adminQuery.query(async () => {
    const db = getDb();
    return db.query.feedback.findMany({
      orderBy: desc(feedback.createdAt),
      with: { student: true, teacher: true, class: true },
    });
  }),

  // ─── Notifications ───────────────────────────────────────────────────────────

  listNotifications: adminQuery
    .input(z.object({ userId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const where = input?.userId
        ? eq(notifications.userId, input.userId)
        : undefined;
      return db.query.notifications.findMany({
        where,
        orderBy: desc(notifications.createdAt),
        with: { user: true },
      });
    }),

  sendNotification: adminQuery
    .input(
      z.object({
        userId: z.number(),
        title: z.string(),
        message: z.string(),
        type: z.string(),
        data: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(notifications).values(input);
      return { success: true };
    }),

  // ─── Violations / Discipline ─────────────────────────────────────────────────

  listViolations: adminQuery.query(async () => {
    const db = getDb();
    return db.query.violations.findMany({
      orderBy: desc(violations.createdAt),
      with: { user: true, reporter: true },
    });
  }),

  // Task 14.1 — notify subject user after violation creation
  createViolation: adminQuery
    .input(
      z.object({
        userId: z.number(),
        type: z.string(),
        description: z.string(),
        action: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(violations).values({
        ...input,
        reportedBy: ctx.user.id,
      });

      await sendNotification(
        input.userId,
        "Violation Recorded",
        `A ${input.type} violation has been recorded against your account. ${input.description}`,
        "violation_created"
      );

      return { success: true };
    }),

  // Task 14.2 — resolve violation
  resolveViolation: adminQuery
    .input(z.object({ violationId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(violations)
        .set({ status: "resolved", resolvedAt: new Date() })
        .where(eq(violations.id, input.violationId));
      return { success: true };
    }),

  // Task 14.3 — suspend user
  suspendUser: adminQuery
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ status: "suspended" })
        .where(eq(users.id, input.userId));
      return { success: true };
    }),

  // ─── Reports & Analytics ─────────────────────────────────────────────────────

  getDashboardStats: adminQuery.query(async () => {
    const db = getDb();
    const totalStudents = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "student"));
    const totalTeachers = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "teacher"));
    const totalBatches = await db
      .select({ count: sql<number>`count(*)` })
      .from(batches);
    const totalClasses = await db
      .select({ count: sql<number>`count(*)` })
      .from(classes)
      .where(eq(classes.status, "completed"));
    const pendingFees = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(eq(payments.status, "unpaid"));

    return {
      totalStudents: Number(totalStudents[0]?.count || 0),
      totalTeachers: Number(totalTeachers[0]?.count || 0),
      totalBatches: Number(totalBatches[0]?.count || 0),
      totalClasses: Number(totalClasses[0]?.count || 0),
      pendingFees: Number(pendingFees[0]?.total || 0),
    };
  }),

  getStudentReport: adminQuery
    .input(z.object({ studentId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, input.studentId),
      });
      const attendanceRecords = await db.query.attendance.findMany({
        where: eq(attendance.studentId, input.studentId),
      });
      const total = attendanceRecords.length;
      const present = attendanceRecords.filter(
        a => a.status === "present"
      ).length;
      const paymentsList = await db.query.payments.findMany({
        where: eq(payments.studentId, input.studentId),
      });

      return {
        attendance: {
          total,
          present,
          percentage: total > 0 ? Math.round((present / total) * 100) : 0,
        },
        payments: paymentsList,
        profile,
      };
    }),

  // Tasks 13.1 + 13.2 — teacher report with performance classification
  getTeacherReport: adminQuery
    .input(z.object({ teacherId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      // Total completed classes handled
      const teacherClasses = await db.query.classes.findMany({
        where: and(
          eq(classes.teacherId, input.teacherId),
          eq(classes.status, "completed")
        ),
      });
      const totalClasses = teacherClasses.length;

      // Student engagement rate: avg chat count per class
      let totalChatCount = 0;
      for (const cls of teacherClasses) {
        const records = await db.query.attendance.findMany({
          where: eq(attendance.classId, cls.id),
        });
        totalChatCount += records.reduce(
          (sum, r) => sum + (r.chatCount ?? 0),
          0
        );
      }
      const studentEngagementRate =
        totalClasses > 0 ? totalChatCount / totalClasses : 0;

      // Student retention rate: active enrollments / total enrollments for teacher's batches
      const teacherBatches = await db.query.batches.findMany({
        where: eq(batches.teacherId, input.teacherId),
      });
      let totalEnrollments = 0;
      let activeEnrollments = 0;
      for (const batch of teacherBatches) {
        const enrollments = await db.query.batchEnrollments.findMany({
          where: eq(batchEnrollments.batchId, batch.id),
        });
        totalEnrollments += enrollments.length;
        activeEnrollments += enrollments.filter(
          e => e.status === "active"
        ).length;
      }
      const studentRetentionRate =
        totalEnrollments > 0
          ? Math.round((activeEnrollments / totalEnrollments) * 100)
          : 0;

      // Course completion rate: students who have a completionDate / total enrolled students
      const enrolledStudentIds = new Set<number>();
      for (const batch of teacherBatches) {
        const enrollments = await db.query.batchEnrollments.findMany({
          where: eq(batchEnrollments.batchId, batch.id),
        });
        enrollments.forEach(e => enrolledStudentIds.add(e.studentId));
      }
      const totalStudents = enrolledStudentIds.size;
      let completedStudents = 0;
      for (const studentId of enrolledStudentIds) {
        const profile = await db.query.profiles.findFirst({
          where: eq(profiles.userId, studentId),
        });
        if (profile?.completionDate) completedStudents++;
      }
      const courseCompletionRate =
        totalStudents > 0
          ? Math.round((completedStudents / totalStudents) * 100)
          : 0;

      // Task 13.2 — student completion rate classification
      const studentCompletionRate = courseCompletionRate;
      let performanceLabel: string;
      if (studentCompletionRate === 100) {
        performanceLabel = "Best";
      } else if (studentCompletionRate < 60) {
        performanceLabel = "Needs Improvement";
      } else {
        performanceLabel = "Average";
      }

      return {
        totalClasses,
        studentEngagementRate: Math.round(studentEngagementRate * 100) / 100,
        studentRetentionRate,
        courseCompletionRate,
        studentCompletionRate,
        performanceLabel,
      };
    }),

  // Task 13.3 — ranked teacher list by studentCompletionRate
  listTeachersByPerformance: adminQuery.query(async () => {
    const db = getDb();
    const teachers = await db.query.users.findMany({
      where: eq(users.role, "teacher"),
    });

    const results = [];
    for (const teacher of teachers) {
      const teacherBatches = await db.query.batches.findMany({
        where: eq(batches.teacherId, teacher.id),
      });

      const enrolledStudentIds = new Set<number>();
      for (const batch of teacherBatches) {
        const enrollments = await db.query.batchEnrollments.findMany({
          where: eq(batchEnrollments.batchId, batch.id),
        });
        enrollments.forEach(e => enrolledStudentIds.add(e.studentId));
      }

      const totalStudents = enrolledStudentIds.size;
      let completedStudents = 0;
      for (const studentId of enrolledStudentIds) {
        const profile = await db.query.profiles.findFirst({
          where: eq(profiles.userId, studentId),
        });
        if (profile?.completionDate) completedStudents++;
      }

      const studentCompletionRate =
        totalStudents > 0
          ? Math.round((completedStudents / totalStudents) * 100)
          : 0;

      // Task 17.3 — flag teachers with completion rate < 60% (feature-flagged)
      const needsImprovement =
        process.env.FEATURE_AI_INSIGHTS === "true"
          ? studentCompletionRate < 60
          : undefined;

      results.push({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        studentCompletionRate,
        ...(needsImprovement !== undefined ? { needsImprovement } : {}),
      });
    }

    return results.sort(
      (a, b) => b.studentCompletionRate - a.studentCompletionRate
    );
  }),

  // Task 13.4 — student leaderboard with composite score
  getLeaderboard: adminQuery.query(async () => {
    const db = getDb();
    const students = await db.query.users.findMany({
      where: eq(users.role, "student"),
    });

    const results = [];
    for (const student of students) {
      const attendanceRecords = await db.query.attendance.findMany({
        where: eq(attendance.studentId, student.id),
      });
      const total = attendanceRecords.length;
      const present = attendanceRecords.filter(
        a => a.status === "present"
      ).length;
      const attendancePct = total > 0 ? Math.round((present / total) * 100) : 0;

      const chatActivity = attendanceRecords.reduce(
        (sum, r) => sum + (r.chatCount ?? 0),
        0
      );
      const compositeScore = attendancePct + chatActivity;

      // Task 17.2 — flag at-risk students (feature-flagged)
      const atRisk =
        process.env.FEATURE_AI_INSIGHTS === "true"
          ? attendancePct < 60
          : undefined;

      results.push({
        id: student.id,
        name: student.name,
        attendancePct,
        chatActivity,
        compositeScore,
        ...(atRisk !== undefined ? { atRisk } : {}),
      });
    }

    return results.sort((a, b) => b.compositeScore - a.compositeScore);
  }),

  // Task 13.5 — export student/teacher reports (structured JSON for client-side generation)
  exportStudentReport: adminQuery
    .input(
      z.object({
        studentId: z.number(),
        format: z.enum(["pdf", "excel"]).default("excel"),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const student = await db.query.users.findFirst({
        where: eq(users.id, input.studentId),
      });
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, input.studentId),
      });
      const attendanceRecords = await db.query.attendance.findMany({
        where: eq(attendance.studentId, input.studentId),
      });
      const total = attendanceRecords.length;
      const present = attendanceRecords.filter(
        a => a.status === "present"
      ).length;
      const paymentsList = await db.query.payments.findMany({
        where: eq(payments.studentId, input.studentId),
      });

      return {
        format: input.format,
        message: "Use this structured data for client-side report generation.",
        data: {
          student: student
            ? { id: student.id, name: student.name, email: student.email }
            : null,
          profile,
          attendance: {
            total,
            present,
            percentage: total > 0 ? Math.round((present / total) * 100) : 0,
          },
          payments: paymentsList,
        },
      };
    }),

  exportTeacherReport: adminQuery
    .input(
      z.object({
        teacherId: z.number(),
        format: z.enum(["pdf", "excel"]).default("excel"),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const teacher = await db.query.users.findFirst({
        where: eq(users.id, input.teacherId),
      });
      const teacherClasses = await db.query.classes.findMany({
        where: and(
          eq(classes.teacherId, input.teacherId),
          eq(classes.status, "completed")
        ),
      });
      const salaries = await db.query.teacherSalaries.findMany({
        where: eq(teacherSalaries.teacherId, input.teacherId),
      });

      return {
        format: input.format,
        message: "Use this structured data for client-side report generation.",
        data: {
          teacher: teacher
            ? { id: teacher.id, name: teacher.name, email: teacher.email }
            : null,
          totalCompletedClasses: teacherClasses.length,
          salaries,
        },
      };
    }),

  getClassChatReport: adminQuery
    .input(z.object({ classId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const cls = await db.query.classes.findFirst({
        where: eq(classes.id, input.classId),
      });
      if (!cls) return [];

      const filters = [eq(messages.batchId, cls.batchId)];
      if (cls.startedAt)
        filters.push(sql`${messages.createdAt} >= ${cls.startedAt}`);
      if (cls.endedAt)
        filters.push(sql`${messages.createdAt} <= ${cls.endedAt}`);

      const rows = await db
        .select({
          studentId: messages.senderId,
          studentName: users.name,
          messageCount: sql<number>`count(*)`,
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(and(...filters))
        .groupBy(messages.senderId, users.name);

      return rows.map(r => ({
        studentId: r.studentId,
        studentName: r.studentName,
        messageCount: Number(r.messageCount),
      }));
    }),

  getTeacherChatReport: adminQuery
    .input(z.object({ teacherId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const teacherClasses = await db.query.classes.findMany({
        where: eq(classes.teacherId, input.teacherId),
      });

      const result = [];
      for (const cls of teacherClasses) {
        const filters = [
          eq(messages.batchId, cls.batchId),
          eq(messages.senderId, input.teacherId),
        ];
        if (cls.startedAt)
          filters.push(sql`${messages.createdAt} >= ${cls.startedAt}`);
        if (cls.endedAt)
          filters.push(sql`${messages.createdAt} <= ${cls.endedAt}`);

        const rows = await db
          .select({ messageCount: sql<number>`count(*)` })
          .from(messages)
          .where(and(...filters));

        result.push({
          classId: cls.id,
          classTitle: cls.title,
          messageCount: Number(rows[0]?.messageCount ?? 0),
        });
      }
      return result;
    }),

  getUserStats: adminQuery
    .input(
      z.object({
        userId: z.number(),
        role: z.enum([
          "student",
          "teacher",
          "admin",
          "academic_head",
          "super_admin",
        ]),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const userId = input.userId;

      if (input.role === "student") {
        await recalculateStudentFees(db, userId);

        const enrollments = await db.query.batchEnrollments.findMany({
          where: eq(batchEnrollments.studentId, userId),
          with: {
            batch: {
              with: {
                module: true,
              },
            },
          },
        });

        const courses = [];
        for (const e of enrollments) {
          const batch = e.batch;
          const attendedResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(attendance)
            .innerJoin(classes, eq(attendance.classId, classes.id))
            .where(
              and(
                eq(attendance.studentId, userId),
                eq(attendance.status, "present"),
                eq(classes.batchId, batch.id)
              )
            );

          const leftResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(classes)
            .where(
              and(
                eq(classes.batchId, batch.id),
                eq(classes.status, "scheduled")
              )
            );

          courses.push({
            batchId: batch.id,
            batchName: batch.name,
            moduleName: batch.module?.name || "Unknown Module",
            attended: Number(attendedResult[0]?.count || 0),
            left: Number(leftResult[0]?.count || 0),
          });
        }

        const unpaidPayments = await db.query.payments.findMany({
          where: and(
            eq(payments.studentId, userId),
            sql`${payments.status} IN ('unpaid', 'overdue')`
          ),
        });
        const pendingFees = unpaidPayments.reduce(
          (sum, p) => sum + parseFloat(p.amount ?? "0"),
          0
        );

        const profile = await db.query.profiles.findFirst({
          where: eq(profiles.userId, userId),
        });

        return {
          role: "student",
          courses,
          pendingFees,
          feesTotal: profile ? parseFloat(profile.feesTotal ?? "0") : 0,
          discount: profile ? parseFloat(profile.discount ?? "0") : 0,
          feesBalance: profile ? parseFloat(profile.feesBalance ?? "0") : 0,
        };
      } else if (input.role === "teacher") {
        const completedClasses = await db
          .select({ count: sql<number>`count(*)` })
          .from(classes)
          .where(
            and(eq(classes.teacherId, userId), eq(classes.status, "completed"))
          );

        const teacherBatches = await db.query.batches.findMany({
          where: eq(batches.teacherId, userId),
        });
        const batchIds = teacherBatches.map(b => b.id);

        let uniqueStudentsCount = 0;
        if (batchIds.length > 0) {
          const result = await db
            .select({
              count: sql<number>`count(distinct ${batchEnrollments.studentId})`,
            })
            .from(batchEnrollments)
            .where(
              and(
                sql`${batchEnrollments.batchId} IN ${batchIds}`,
                eq(batchEnrollments.status, "active")
              )
            );
          uniqueStudentsCount = Number(result[0]?.count || 0);
        }

        return {
          role: "teacher",
          classesGiven: Number(completedClasses[0]?.count || 0),
          studentsManaged: uniqueStudentsCount,
        };
      }

      return { role: input.role };
    }),

  getCourseReport: adminQuery
    .input(z.object({ moduleId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const moduleId = input.moduleId;

      const course = await db.query.modules.findFirst({
        where: eq(modules.id, moduleId),
      });
      if (!course) {
        throw new Error("Course not found");
      }

      // Find all batches for this course
      const courseBatches = await db.query.batches.findMany({
        where: eq(batches.moduleId, moduleId),
      });
      const batchIds = courseBatches.map(b => b.id);

      let totalStudents = 0;
      let activeStudentsList: any[] = [];
      let totalFeesCollected = 0;
      let totalFeesOutstanding = 0;
      let avgAttendancePct = 0;

      if (batchIds.length > 0) {
        // Enrolled students in this course
        const enrollments = await db.query.batchEnrollments.findMany({
          where: and(
            inArray(batchEnrollments.batchId, batchIds),
            eq(batchEnrollments.status, "active")
          ),
          with: {
            student: {
              with: {
                profile: true,
              },
            },
            batch: true,
          },
        });
        totalStudents = enrollments.length;
        activeStudentsList = enrollments.map(e => ({
          id: e.student.id,
          name: e.student.name,
          studentId: e.student.profile?.studentId || String(e.student.id),
          batchName: e.batch?.name || "-",
          feesBalance: e.student.profile?.feesBalance
            ? parseFloat(e.student.profile.feesBalance)
            : 0,
        }));

        // Average Attendance for classes in these batches
        const classesList = await db.query.classes.findMany({
          where: inArray(classes.batchId, batchIds),
        });
        const classIds = classesList.map(c => c.id);

        if (classIds.length > 0) {
          const attendanceRecords = await db.query.attendance.findMany({
            where: inArray(attendance.classId, classIds),
          });
          const totalAtt = attendanceRecords.length;
          const presentAtt = attendanceRecords.filter(
            a => a.status === "present"
          ).length;
          avgAttendancePct =
            totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;
        }
      }

      // Fees collected and outstanding for this course
      const paymentsList = await db.query.payments.findMany({
        where: eq(payments.courseId, moduleId),
      });
      totalFeesCollected = paymentsList
        .filter(p => p.status === "paid")
        .reduce((sum, p) => sum + parseFloat(p.amount ?? "0"), 0);
      totalFeesOutstanding = paymentsList
        .filter(p => p.status === "unpaid" || p.status === "overdue")
        .reduce((sum, p) => sum + parseFloat(p.amount ?? "0"), 0);

      return {
        courseName: course.name,
        fees: course.fees ? parseFloat(course.fees) : 0,
        totalBatches: courseBatches.length,
        totalStudents,
        totalFeesCollected,
        totalFeesOutstanding,
        avgAttendance: avgAttendancePct,
        students: activeStudentsList,
      };
    }),
});
