import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  json,
  decimal,
  bigint,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", [
  "super_admin",
  "admin",
  "academic_head",
  "teacher",
  "student",
]);
export const statusEnum = pgEnum("status", [
  "active",
  "inactive",
  "suspended",
  "on_hold",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "paid",
  "partial",
  "unpaid",
  "overdue",
]);
export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "voice",
  "image",
  "video",
  "pdf",
]);
export const classTypeEnum = pgEnum("class_type", ["group", "one_to_one"]);
export const classStatusEnum = pgEnum("class_status", [
  "scheduled",
  "ongoing",
  "completed",
  "cancelled",
]);
export const sessionStatusEnum = pgEnum("session_status", [
  "scheduled",
  "ongoing",
  "completed",
  "cancelled",
]);
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "late",
]);
export const requestTypeEnum = pgEnum("request_type", [
  "hold",
  "rejoin",
  "batch_change",
]);
export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "approved",
  "rejected",
]);
export const materialTypeEnum = pgEnum("material_type", [
  "text",
  "voice",
  "image",
  "video",
  "pdf",
]);

// Users table
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    unionId: varchar("union_id", { length: 255 }).notNull().unique(),
    username: varchar("username", { length: 100 }).unique(),
    password: varchar("password", { length: 255 }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 20 }),
    role: roleEnum("role").notNull().default("student"),
    status: statusEnum("status").notNull().default("active"),
    avatar: varchar("avatar", { length: 500 }),
    deviceToken: varchar("device_token", { length: 500 }),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  table => ({
    usernameIdx: uniqueIndex("username_idx").on(table.username),
    phoneIdx: index("phone_idx").on(table.phone),
    roleIdx: index("role_idx").on(table.role),
  })
);

// Profiles table
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  studentId: varchar("student_id", { length: 50 }).unique(),
  enrollmentNumber: varchar("enrollment_number", { length: 50 }).unique(),
  course: varchar("course", { length: 255 }),
  batch: varchar("batch", { length: 255 }),
  batchTime: varchar("batch_time", { length: 50 }),
  feesTotal: decimal("fees_total", { precision: 10, scale: 2 }).default("0"),
  feesPaid: decimal("fees_paid", { precision: 10, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  feesBalance: decimal("fees_balance", { precision: 10, scale: 2 }).default(
    "0"
  ),
  paymentStatus: paymentStatusEnum("payment_status").default("unpaid"),
  admissionDate: timestamp("admission_date").defaultNow(),
  completionDate: timestamp("completion_date"),
  activityTimeline: json("activity_timeline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Modules (Course Groups)
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  fees: decimal("fees", { precision: 10, scale: 2 }).default("0"),
  maxStudents: integer("max_students").default(50),
  minStudents: integer("min_students").default(5),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Batches (Sub Groups)
export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  moduleId: bigint("module_id", { mode: "number" })
    .notNull()
    .references(() => modules.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  timeSlot: varchar("time_slot", { length: 50 }),
  teacherId: bigint("teacher_id", { mode: "number" }).references(
    () => users.id
  ),
  maxStudents: integer("max_students").default(30),
  status: varchar("status", { length: 20 }).default("active"),
  isCommunityGroup: boolean("is_community_group").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Batch Enrollments
export const batchEnrollments = pgTable(
  "batch_enrollments",
  {
    id: serial("id").primaryKey(),
    batchId: bigint("batch_id", { mode: "number" })
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    studentId: bigint("student_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    leftAt: timestamp("left_at"),
    status: varchar("status", { length: 20 }).default("active"),
  },
  table => ({
    uniqueEnrollment: uniqueIndex("unique_enrollment_idx").on(
      table.batchId,
      table.studentId
    ),
  })
);

// Messages (Chat)
export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    batchId: bigint("batch_id", { mode: "number" })
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    senderId: bigint("sender_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: messageTypeEnum("type").notNull().default("text"),
    content: text("content").notNull(),
    mediaUrl: text("media_url"),
    replyToId: bigint("reply_to_id", { mode: "number" }),
    reactions: json("reactions"),
    isAnnouncement: boolean("is_announcement").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => ({
    batchIdIdx: index("msg_batch_idx").on(table.batchId),
    senderIdIdx: index("msg_sender_idx").on(table.senderId),
    createdAtIdx: index("msg_created_idx").on(table.createdAt),
  })
);

// Classes (Live Sessions)
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  batchId: bigint("batch_id", { mode: "number" }).references(() => batches.id, {
    onDelete: "cascade",
  }),
  batchIds: json("batch_ids").$type<number[]>(),
  moduleId: bigint("module_id", { mode: "number" }).references(
    () => modules.id,
    { onDelete: "cascade" }
  ),
  teacherId: bigint("teacher_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  classType: classTypeEnum("class_type").notNull().default("group"),
  status: classStatusEnum("status").notNull().default("scheduled"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  duration: integer("duration").default(0),
  meetingUrl: varchar("meeting_url", { length: 500 }),
  recordingUrl: varchar("recording_url", { length: 500 }),
  recordingDeletedAt: timestamp("recording_deleted_at"),
  reminderSentAt: timestamp("reminder_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// One-to-One Class Sessions
export const oneToOneSessions = pgTable("one_to_one_sessions", {
  id: serial("id").primaryKey(),
  teacherId: bigint("teacher_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  studentId: bigint("student_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  classId: bigint("class_id", { mode: "number" }).references(() => classes.id),
  sessionLength: integer("session_length").notNull().default(30),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: sessionStatusEnum("session_status").notNull().default("scheduled"),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  completedAt: timestamp("completed_at"),
  recordingUrl: varchar("recording_url", { length: 500 }),
  recordingDeletedAt: timestamp("recording_deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Attendance
export const attendance = pgTable(
  "attendance",
  {
    id: serial("id").primaryKey(),
    classId: bigint("class_id", { mode: "number" })
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    studentId: bigint("student_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    chatCount: integer("chat_count").default(0),
    status: attendanceStatusEnum("attendance_status")
      .notNull()
      .default("absent"),
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  },
  table => ({
    uniqueAttendance: uniqueIndex("unique_attendance_idx").on(
      table.classId,
      table.studentId
    ),
  })
);

// Flexibility Requests (Hold, Rejoin, Batch Change)
export const flexibilityRequests = pgTable("flexibility_requests", {
  id: serial("id").primaryKey(),
  studentId: bigint("student_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  requestType: requestTypeEnum("request_type").notNull(),
  fromBatchId: bigint("from_batch_id", { mode: "number" }).references(
    () => batches.id
  ),
  toBatchId: bigint("to_batch_id", { mode: "number" }).references(
    () => batches.id
  ),
  reason: text("reason"),
  status: requestStatusEnum("request_status").notNull().default("pending"),
  adminNote: text("admin_note"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: bigint("resolved_by", { mode: "number" }).references(
    () => users.id
  ),
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  studentId: bigint("student_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  courseId: bigint("course_id", { mode: "number" }).references(
    () => modules.id,
    { onDelete: "cascade" }
  ),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type", { length: 50 }).default("tuition"),
  status: paymentStatusEnum("payment_status").notNull().default("paid"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  transactionId: varchar("transaction_id", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Teacher Salaries
export const teacherSalaries = pgTable("teacher_salaries", {
  id: serial("id").primaryKey(),
  teacherId: bigint("teacher_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  month: varchar("month", { length: 7 }).notNull(),
  groupClassesCount: integer("group_classes_count").default(0),
  oneToOneCount: integer("one_to_one_count").default(0),
  groupClassRate: decimal("group_class_rate", {
    precision: 10,
    scale: 2,
  }).default("0"),
  oneToOneRate: decimal("one_to_one_rate", { precision: 10, scale: 2 }).default(
    "0"
  ),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default(
    "0"
  ),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Feedback
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  studentId: bigint("student_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  teacherId: bigint("teacher_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  classId: bigint("class_id", { mode: "number" }).references(() => classes.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isRead: boolean("is_read").default(false),
  data: json("data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Discipline / Violations
export const violations = pgTable("violations", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  reportedBy: bigint("reported_by", { mode: "number" }).references(
    () => users.id
  ),
  type: varchar("type", { length: 100 }).notNull(),
  description: text("description").notNull(),
  action: varchar("action", { length: 100 }),
  status: varchar("status", { length: 20 }).default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

// Learning Materials
export const learningMaterials = pgTable("learning_materials", {
  id: serial("id").primaryKey(),
  batchId: bigint("batch_id", { mode: "number" })
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: materialTypeEnum("material_type").notNull().default("text"),
  contentUrl: varchar("content_url", { length: 500 }),
  scheduledDate: timestamp("scheduled_date"),
  createdBy: bigint("created_by", { mode: "number" })
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// OTP Codes
export const otpCodes = pgTable(
  "otp_codes",
  {
    id: serial("id").primaryKey(),
    phone: varchar("phone", { length: 20 }).notNull(),
    code: varchar("code", { length: 10 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    used: boolean("used").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => ({
    phoneIdx: index("otp_phone_idx").on(table.phone),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type Batch = typeof batches.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type FeedbackItem = typeof feedback.$inferSelect;
export type FlexibilityRequest = typeof flexibilityRequests.$inferSelect;
