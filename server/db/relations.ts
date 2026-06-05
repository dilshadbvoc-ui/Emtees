import { relations } from "drizzle-orm";
import {
  users,
  profiles,
  modules,
  batches,
  batchEnrollments,
  messages,
  classes,
  attendance,
  flexibilityRequests,
  payments,
  teacherSalaries,
  feedback,
  notifications,
  violations,
  learningMaterials,
  oneToOneSessions,
} from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  sentMessages: many(messages),
  enrollments: many(batchEnrollments),
  attendance: many(attendance),
  feedbackGiven: many(feedback, { relationName: "studentFeedback" }),
  feedbackReceived: many(feedback, { relationName: "teacherFeedback" }),
  notifications: many(notifications),
  violations: many(violations),
  salaries: many(teacherSalaries),
  payments: many(payments),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const modulesRelations = relations(modules, ({ many }) => ({
  batches: many(batches),
  payments: many(payments),
}));

export const batchesRelations = relations(batches, ({ one, many }) => ({
  module: one(modules, {
    fields: [batches.moduleId],
    references: [modules.id],
  }),
  teacher: one(users, {
    fields: [batches.teacherId],
    references: [users.id],
  }),
  enrollments: many(batchEnrollments),
  messages: many(messages),
  classes: many(classes),
  materials: many(learningMaterials),
}));

export const batchEnrollmentsRelations = relations(
  batchEnrollments,
  ({ one }) => ({
    batch: one(batches, {
      fields: [batchEnrollments.batchId],
      references: [batches.id],
    }),
    student: one(users, {
      fields: [batchEnrollments.studentId],
      references: [users.id],
    }),
  })
);

export const messagesRelations = relations(messages, ({ one }) => ({
  batch: one(batches, {
    fields: [messages.batchId],
    references: [batches.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  batch: one(batches, {
    fields: [classes.batchId],
    references: [batches.id],
  }),
  module: one(modules, {
    fields: [classes.moduleId],
    references: [modules.id],
  }),
  teacher: one(users, {
    fields: [classes.teacherId],
    references: [users.id],
  }),
  attendance: many(attendance),
  oneToOneSessions: many(oneToOneSessions),
}));

export const oneToOneSessionsRelations = relations(
  oneToOneSessions,
  ({ one }) => ({
    class: one(classes, {
      fields: [oneToOneSessions.classId],
      references: [classes.id],
    }),
    teacher: one(users, {
      fields: [oneToOneSessions.teacherId],
      references: [users.id],
    }),
    student: one(users, {
      fields: [oneToOneSessions.studentId],
      references: [users.id],
    }),
  })
);

export const attendanceRelations = relations(attendance, ({ one }) => ({
  class: one(classes, {
    fields: [attendance.classId],
    references: [classes.id],
  }),
  student: one(users, {
    fields: [attendance.studentId],
    references: [users.id],
  }),
}));

export const flexibilityRequestsRelations = relations(
  flexibilityRequests,
  ({ one }) => ({
    student: one(users, {
      fields: [flexibilityRequests.studentId],
      references: [users.id],
    }),
    fromBatch: one(batches, {
      fields: [flexibilityRequests.fromBatchId],
      references: [batches.id],
    }),
    toBatch: one(batches, {
      fields: [flexibilityRequests.toBatchId],
      references: [batches.id],
    }),
    resolver: one(users, {
      fields: [flexibilityRequests.resolvedBy],
      references: [users.id],
    }),
  })
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  student: one(users, {
    fields: [payments.studentId],
    references: [users.id],
  }),
  course: one(modules, {
    fields: [payments.courseId],
    references: [modules.id],
  }),
}));

export const teacherSalariesRelations = relations(
  teacherSalaries,
  ({ one }) => ({
    teacher: one(users, {
      fields: [teacherSalaries.teacherId],
      references: [users.id],
    }),
  })
);

export const feedbackRelations = relations(feedback, ({ one }) => ({
  student: one(users, {
    fields: [feedback.studentId],
    references: [users.id],
  }),
  teacher: one(users, {
    fields: [feedback.teacherId],
    references: [users.id],
  }),
  class: one(classes, {
    fields: [feedback.classId],
    references: [classes.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const violationsRelations = relations(violations, ({ one }) => ({
  user: one(users, {
    fields: [violations.userId],
    references: [users.id],
  }),
  reporter: one(users, {
    fields: [violations.reportedBy],
    references: [users.id],
  }),
}));

export const learningMaterialsRelations = relations(
  learningMaterials,
  ({ one }) => ({
    batch: one(batches, {
      fields: [learningMaterials.batchId],
      references: [batches.id],
    }),
    creator: one(users, {
      fields: [learningMaterials.createdBy],
      references: [users.id],
    }),
  })
);
