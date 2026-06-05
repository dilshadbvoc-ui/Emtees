import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { flexibilityRequests, feedback, notifications } from "@db/schema";

export const studentRouter = createRouter({
  // Flexibility Requests
  createRequest: authedQuery
    .input(
      z.object({
        requestType: z.enum(["hold", "rejoin", "batch_change"]),
        fromBatchId: z.number().optional(),
        toBatchId: z.number().optional(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const result = await db
        .insert(flexibilityRequests)
        .values({
          studentId: ctx.user.id,
          ...input,
        })
        .returning({ id: flexibilityRequests.id });
      return db.query.flexibilityRequests.findFirst({
        where: eq(flexibilityRequests.id, result[0]?.id),
      });
    }),

  myRequests: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.flexibilityRequests.findMany({
      where: eq(flexibilityRequests.studentId, ctx.user.id),
      orderBy: desc(flexibilityRequests.requestedAt),
      with: { fromBatch: true, toBatch: true },
    });
  }),

  // Feedback
  submitFeedback: authedQuery
    .input(
      z.object({
        teacherId: z.number(),
        classId: z.number().optional(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(feedback).values({
        studentId: ctx.user.id,
        ...input,
      });
      return { success: true };
    }),

  // Notifications
  myNotifications: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.notifications.findMany({
      where: eq(notifications.userId, ctx.user.id),
      orderBy: desc(notifications.createdAt),
    });
  }),

  markNotificationRead: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, input.id));
      return { success: true };
    }),
});
