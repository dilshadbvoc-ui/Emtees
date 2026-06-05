import { eq, and, isNull, isNotNull, lte, gte, lt, ne } from "drizzle-orm";
import { getDb } from "../queries/connection";
import {
  classes,
  batchEnrollments,
  payments,
  oneToOneSessions,
  profiles,
} from "@db/schema";
import {
  sendBulkNotification,
  sendNotification,
  getAdminUserIds,
} from "./notificationEngine";

const RECORDING_RETENTION_DAYS = Number(
  process.env.RECORDING_RETENTION_DAYS ?? 90
);

// Task 9.1 — mark overdue payments and notify student + admins
async function checkOverduePayments(): Promise<void> {
  const db = getDb();
  const now = new Date();

  const overduePayments = await db.query.payments.findMany({
    where: and(
      lt(payments.dueDate, now),
      ne(payments.status, "paid"),
      ne(payments.status, "overdue")
    ),
  });

  if (overduePayments.length === 0) return;

  const adminIds = await getAdminUserIds();

  for (const payment of overduePayments) {
    await db
      .update(payments)
      .set({ status: "overdue" })
      .where(eq(payments.id, payment.id));

    await sendNotification(
      payment.studentId,
      "Payment Overdue",
      `Your payment of ${payment.amount} is overdue. Please pay as soon as possible.`,
      "fee_overdue"
    );

    if (adminIds.length > 0) {
      await sendBulkNotification(
        adminIds,
        "Student Payment Overdue",
        `A student's payment of ${payment.amount} is overdue.`,
        "fee_overdue"
      );
    }
  }
}

// Task 9.2 — send 3-day fee-due reminders
async function checkFeeReminders(): Promise<void> {
  const db = getDb();
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const upcomingPayments = await db.query.payments.findMany({
    where: and(
      lte(payments.dueDate, threeDaysLater),
      gte(payments.dueDate, now),
      ne(payments.status, "paid")
    ),
  });

  for (const payment of upcomingPayments) {
    await sendNotification(
      payment.studentId,
      "Fee Reminder",
      `Your payment of ${payment.amount} is due soon. Please pay before the due date.`,
      "fee_reminder"
    );
  }
}

// Task 9.3 — deactivate enrollments after 7-day grace period
async function deactivateUnpaidEnrollments(): Promise<void> {
  const db = getDb();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const overduePayments = await db.query.payments.findMany({
    where: and(
      eq(payments.status, "overdue"),
      lt(payments.dueDate, sevenDaysAgo)
    ),
  });

  for (const payment of overduePayments) {
    const activeEnrollments = await db.query.batchEnrollments.findMany({
      where: and(
        eq(batchEnrollments.studentId, payment.studentId),
        eq(batchEnrollments.status, "active")
      ),
    });

    for (const enrollment of activeEnrollments) {
      await db
        .update(batchEnrollments)
        .set({ status: "inactive" })
        .where(eq(batchEnrollments.id, enrollment.id));
    }
  }
}

// Task 11.2 — auto-complete expired one-to-one sessions
async function expireOneToOneSessions(): Promise<void> {
  const db = getDb();
  const now = new Date();

  const expiredSessions = await db.query.oneToOneSessions.findMany({
    where: and(
      lt(oneToOneSessions.validUntil, now),
      ne(oneToOneSessions.status, "completed")
    ),
  });

  for (const session of expiredSessions) {
    await db
      .update(oneToOneSessions)
      .set({ status: "completed", completedAt: now })
      .where(eq(oneToOneSessions.id, session.id));
  }
}

// Task 11.4 — clean up expired recording URLs
async function cleanupExpiredRecordings(): Promise<void> {
  const db = getDb();
  const cutoff = new Date(
    Date.now() - RECORDING_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  const expiredSessions = await db.query.oneToOneSessions.findMany({
    where: and(
      isNotNull(oneToOneSessions.recordingUrl),
      lt(oneToOneSessions.createdAt, cutoff)
    ),
  });

  const now = new Date();
  for (const session of expiredSessions) {
    await db
      .update(oneToOneSessions)
      .set({ recordingUrl: null, recordingDeletedAt: now })
      .where(eq(oneToOneSessions.id, session.id));
  }
}

async function sendClassReminders(): Promise<void> {
  const db = getDb();
  const now = new Date();
  const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);

  // Find scheduled classes starting within the next 10 minutes that haven't been reminded yet
  const upcoming = await db.query.classes.findMany({
    where: and(
      eq(classes.status, "scheduled"),
      lte(classes.scheduledAt, tenMinutesLater),
      gte(classes.scheduledAt, now),
      isNull(classes.reminderSentAt)
    ),
  });

  for (const cls of upcoming) {
    const enrollments = await db.query.batchEnrollments.findMany({
      where: and(
        eq(batchEnrollments.batchId, cls.batchId),
        eq(batchEnrollments.status, "active")
      ),
    });
    const studentIds = enrollments.map(e => e.studentId);
    if (studentIds.length > 0) {
      await sendBulkNotification(
        studentIds,
        "Class Reminder",
        `${cls.title} starts in 10 minutes`,
        "class_reminder"
      );
    }
    await db
      .update(classes)
      .set({ reminderSentAt: new Date() })
      .where(eq(classes.id, cls.id));
  }
}

export function startScheduler(): void {
  setInterval(async () => {
    try {
      await sendClassReminders();
      await checkOverduePayments();
      await checkFeeReminders();
      await deactivateUnpaidEnrollments();
      await expireOneToOneSessions();
      await cleanupExpiredRecordings();
    } catch (err) {
      console.error("[scheduler] error:", err);
    }
  }, 60 * 1000);
}
