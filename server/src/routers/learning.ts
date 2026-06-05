import { z } from "zod";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createRouter,
  authedQuery,
  adminQuery,
  teacherQuery,
} from "../middleware";
import { getDb } from "../queries/connection";
import {
  modules,
  batches,
  batchEnrollments,
  messages,
  learningMaterials,
  profiles,
} from "@db/schema";
import {
  sendBulkNotification,
  getAdminUserIds,
} from "../lib/notificationEngine";
import { recalculateStudentFees } from "../lib/feeEngine";

export const learningRouter = createRouter({
  // Modules
  listModules: authedQuery.query(async () => {
    const db = getDb();
    return db.query.modules.findMany({
      orderBy: desc(modules.createdAt),
      with: { batches: true },
    });
  }),

  createModule: adminQuery
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        fees: z.number().optional(),
        maxStudents: z.number().optional(),
        minStudents: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { fees, ...data } = input;
      const result = await db
        .insert(modules)
        .values({
          ...data,
          fees: fees !== undefined ? String(fees) : undefined,
        })
        .returning({ id: modules.id });
      return db.query.modules.findFirst({
        where: eq(modules.id, result[0]?.id),
      });
    }),

  // Batches
  listBatches: authedQuery
    .input(z.object({ moduleId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      if (input?.moduleId) {
        return db.query.batches.findMany({
          where: eq(batches.moduleId, input.moduleId),
          with: {
            module: true,
            teacher: true,
            enrollments: {
              where: eq(batchEnrollments.status, "active"),
              with: {
                student: {
                  with: {
                    profile: true,
                  },
                },
              },
            },
          },
        });
      }
      return db.query.batches.findMany({
        with: {
          module: true,
          teacher: true,
          enrollments: {
            where: eq(batchEnrollments.status, "active"),
            with: {
              student: {
                with: {
                  profile: true,
                },
              },
            },
          },
        },
      });
    }),

  createBatch: adminQuery
    .input(
      z.object({
        moduleId: z.number(),
        name: z.string(),
        timeSlot: z.string().optional(),
        teacherId: z.number().optional(),
        maxStudents: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db
        .insert(batches)
        .values(input)
        .returning({ id: batches.id });
      return db.query.batches.findFirst({
        where: eq(batches.id, result[0]?.id),
        with: { module: true },
      });
    }),

  enrollStudent: adminQuery
    .input(z.object({ batchId: z.number(), studentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      // Check for existing active enrollment
      const existing = await db.query.batchEnrollments.findFirst({
        where: and(
          eq(batchEnrollments.batchId, input.batchId),
          eq(batchEnrollments.studentId, input.studentId),
          eq(batchEnrollments.status, "active")
        ),
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Student already enrolled in this batch",
        });
      }

      await db.insert(batchEnrollments).values({
        batchId: input.batchId,
        studentId: input.studentId,
      });

      // Recalculate student fees total and balance
      await recalculateStudentFees(db, input.studentId);

      // Capacity alert: notify admins if over maxStudents
      const batch = await db.query.batches.findFirst({
        where: eq(batches.id, input.batchId),
      });
      const [{ value: activeCount }] = await db
        .select({ value: count() })
        .from(batchEnrollments)
        .where(
          and(
            eq(batchEnrollments.batchId, input.batchId),
            eq(batchEnrollments.status, "active")
          )
        );

      if (batch?.maxStudents != null && activeCount > batch.maxStudents) {
        const adminIds = await getAdminUserIds();
        await sendBulkNotification(
          adminIds,
          "Batch Overcrowded",
          `Batch "${batch.name}" has exceeded its maximum capacity (${activeCount}/${batch.maxStudents}).`,
          "capacity_alert",
          {
            batchId: input.batchId,
            activeCount,
            maxStudents: batch.maxStudents,
          }
        );
      }

      return { success: true };
    }),

  removeStudent: adminQuery
    .input(z.object({ batchId: z.number(), studentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(batchEnrollments)
        .set({ status: "inactive", leftAt: new Date() })
        .where(
          and(
            eq(batchEnrollments.batchId, input.batchId),
            eq(batchEnrollments.studentId, input.studentId)
          )
        );

      // Recalculate student fees total and balance
      await recalculateStudentFees(db, input.studentId);

      // Capacity alert: notify admins if under minStudents
      const batch = await db.query.batches.findFirst({
        where: eq(batches.id, input.batchId),
        with: { module: true },
      });
      const [{ value: activeCount }] = await db
        .select({ value: count() })
        .from(batchEnrollments)
        .where(
          and(
            eq(batchEnrollments.batchId, input.batchId),
            eq(batchEnrollments.status, "active")
          )
        );

      const minStudents = batch?.module?.minStudents;
      if (minStudents != null && activeCount < minStudents) {
        const adminIds = await getAdminUserIds();
        await sendBulkNotification(
          adminIds,
          "Batch Underpopulated",
          `Batch "${batch?.name}" has fallen below the minimum student count (${activeCount}/${minStudents}).`,
          "capacity_alert",
          { batchId: input.batchId, activeCount, minStudents }
        );
      }

      return { success: true };
    }),

  // Messages (Chat)
  listMessages: authedQuery
    .input(
      z.object({
        batchId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();
      // Verify user is in the batch
      const enrollment = await db.query.batchEnrollments.findFirst({
        where: and(
          eq(batchEnrollments.batchId, input.batchId),
          eq(batchEnrollments.studentId, ctx.user.id)
        ),
      });
      const isTeacher = await db.query.batches.findFirst({
        where: eq(batches.id, input.batchId),
      });
      const allowed =
        enrollment ||
        isTeacher?.teacherId === ctx.user.id ||
        ["admin", "super_admin", "academic_head"].includes(ctx.user.role);
      if (!allowed) return [];

      const results = await db.query.messages.findMany({
        where: eq(messages.batchId, input.batchId),
        orderBy: desc(messages.createdAt),
        limit: input.limit,
        offset: input.offset,
        with: { sender: true },
      });

      // Strip phone number from sender data for privacy
      return results.map(msg => ({
        ...msg,
        sender: msg.sender ? { ...msg.sender, phone: undefined } : msg.sender,
      }));
    }),

  sendMessage: authedQuery
    .input(
      z.object({
        batchId: z.number(),
        content: z.string(),
        type: z
          .enum(["text", "voice", "image", "video", "pdf"])
          .default("text"),
        mediaUrl: z.string().optional(),
        replyToId: z.number().optional(),
        isAnnouncement: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Payment gate: students with overdue payment cannot send messages
      if (ctx.user.role === "student") {
        const profile = await db.query.profiles.findFirst({
          where: eq(profiles.userId, ctx.user.id),
        });
        if (profile?.paymentStatus === "overdue") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Payment required to send messages",
          });
        }
      }

      // Announcement gate: only teachers and admins can make announcements
      if (input.isAnnouncement === true && ctx.user.role === "student") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only teachers and admins can make announcements",
        });
      }

      const result = await db
        .insert(messages)
        .values({
          batchId: input.batchId,
          senderId: ctx.user.id,
          content: input.content,
          type: input.type,
          mediaUrl: input.mediaUrl,
          replyToId: input.replyToId,
          isAnnouncement: input.isAnnouncement ?? false,
        })
        .returning({ id: messages.id });
      return db.query.messages.findFirst({
        where: eq(messages.id, result[0]?.id),
        with: { sender: true },
      });
    }),

  addReaction: authedQuery
    .input(z.object({ messageId: z.number(), emoji: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const message = await db.query.messages.findFirst({
        where: eq(messages.id, input.messageId),
      });
      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }

      // Read existing reactions, default to {}
      const reactions =
        (message.reactions as Record<string, number[]> | null) ?? {};
      const emojiUsers = reactions[input.emoji] ?? [];

      // Toggle: remove if present, add if not
      if (emojiUsers.includes(ctx.user.id)) {
        reactions[input.emoji] = emojiUsers.filter(id => id !== ctx.user.id);
        if (reactions[input.emoji].length === 0) {
          delete reactions[input.emoji];
        }
      } else {
        reactions[input.emoji] = [...emojiUsers, ctx.user.id];
      }

      await db
        .update(messages)
        .set({ reactions })
        .where(eq(messages.id, input.messageId));

      return { success: true, reactions };
    }),

  // Learning Materials
  listMaterials: authedQuery
    .input(z.object({ batchId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();

      if (ctx.user.role === "student") {
        // Students only see materials that are not scheduled or whose scheduled date has passed
        return db.query.learningMaterials.findMany({
          where: and(
            eq(learningMaterials.batchId, input.batchId),
            sql`(${learningMaterials.scheduledDate} IS NULL OR ${learningMaterials.scheduledDate} <= NOW())`
          ),
          orderBy: desc(learningMaterials.createdAt),
        });
      }

      return db.query.learningMaterials.findMany({
        where: eq(learningMaterials.batchId, input.batchId),
        orderBy: desc(learningMaterials.createdAt),
      });
    }),

  createMaterial: teacherQuery
    .input(
      z.object({
        batchId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        type: z
          .enum(["text", "voice", "image", "video", "pdf"])
          .default("text"),
        contentUrl: z.string().optional(),
        scheduledDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const result = await db
        .insert(learningMaterials)
        .values({
          ...input,
          createdBy: ctx.user.id,
        })
        .returning({ id: learningMaterials.id });
      return db.query.learningMaterials.findFirst({
        where: eq(learningMaterials.id, result[0]?.id),
      });
    }),

  updateModule: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        fees: z.number().optional(),
        maxStudents: z.number().optional(),
        minStudents: z.number().optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, fees, ...data } = input;
      await db
        .update(modules)
        .set({
          ...data,
          fees: fees !== undefined ? String(fees) : undefined,
        })
        .where(eq(modules.id, id));
      return db.query.modules.findFirst({ where: eq(modules.id, id) });
    }),

  updateBatch: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        timeSlot: z.string().optional(),
        teacherId: z.number().nullable().optional(),
        maxStudents: z.number().optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db
        .update(batches)
        .set({
          ...data,
          teacherId: data.teacherId === 0 ? null : data.teacherId,
        })
        .where(eq(batches.id, id));
      return db.query.batches.findFirst({
        where: eq(batches.id, id),
        with: { module: true },
      });
    }),
});
