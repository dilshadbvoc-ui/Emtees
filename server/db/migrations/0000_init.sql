CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late');--> statement-breakpoint
CREATE TYPE "public"."class_status" AS ENUM('scheduled', 'ongoing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."class_type" AS ENUM('group', 'one_to_one');--> statement-breakpoint
CREATE TYPE "public"."material_type" AS ENUM('text', 'voice', 'image', 'video', 'pdf');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'voice', 'image', 'video', 'pdf');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('paid', 'partial', 'unpaid', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."request_type" AS ENUM('hold', 'rejoin', 'batch_change', 'batch_removal');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('super_admin', 'admin', 'academic_head', 'teacher', 'student', 'sales_executive');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled', 'reschedule_request_pending');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'inactive', 'suspended', 'on_hold');--> statement-breakpoint
CREATE TABLE "announcement_dismissals" (
	"id" serial PRIMARY KEY NOT NULL,
	"announcement_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"dismissed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"audience_type" varchar(50) NOT NULL,
	"audience_id" integer,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignment_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" bigint NOT NULL,
	"assignment_id" bigint NOT NULL,
	"submission_file_url" text NOT NULL,
	"submission_file_name" varchar(255),
	"submitted_date" timestamp DEFAULT now() NOT NULL,
	"marks" integer,
	"feedback" text,
	"status" varchar(50) DEFAULT 'Submitted' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"module_id" bigint NOT NULL,
	"batch_id" bigint NOT NULL,
	"due_date" timestamp NOT NULL,
	"attachment_url" text,
	"attachment_name" varchar(255),
	"created_by" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_id" bigint,
	"one_to_one_session_id" bigint,
	"student_id" bigint NOT NULL,
	"teacher_id" bigint,
	"batch_id" bigint,
	"module_id" bigint,
	"chat_count" integer DEFAULT 0,
	"attendance_status" "attendance_status" DEFAULT 'absent' NOT NULL,
	"joined_at" timestamp,
	"left_at" timestamp,
	"duration" integer DEFAULT 0,
	"remarks" text,
	"meeting_id" varchar(255),
	"attendance_date" timestamp,
	"session_type" varchar(50) DEFAULT 'group',
	"created_by" bigint,
	"updated_by" bigint,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" bigint NOT NULL,
	"batch_id" bigint NOT NULL,
	"consecutive_absences" integer DEFAULT 7 NOT NULL,
	"last_attendance_date" timestamp,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "batch_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" bigint NOT NULL,
	"field_name" varchar(255) NOT NULL,
	"previous_value" text,
	"new_value" text,
	"changed_by" bigint NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" bigint NOT NULL,
	"student_id" bigint NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp,
	"status" varchar(20) DEFAULT 'active',
	"payment_type" varchar(50) DEFAULT 'FULL_PAYMENT' NOT NULL,
	"assigned_teachers" json DEFAULT '[]'::json,
	"module_id" bigint,
	"one_on_one_30_allocated" integer DEFAULT 0 NOT NULL,
	"one_on_one_45_allocated" integer DEFAULT 0 NOT NULL,
	"one_on_one_60_allocated" integer DEFAULT 0 NOT NULL,
	"group_30_allocated" integer DEFAULT 0 NOT NULL,
	"group_45_allocated" integer DEFAULT 0 NOT NULL,
	"group_60_allocated" integer DEFAULT 0 NOT NULL,
	"one_on_one_30_used" integer DEFAULT 0 NOT NULL,
	"one_on_one_45_used" integer DEFAULT 0 NOT NULL,
	"one_on_one_60_used" integer DEFAULT 0 NOT NULL,
	"group_30_used" integer DEFAULT 0 NOT NULL,
	"group_45_used" integer DEFAULT 0 NOT NULL,
	"group_60_used" integer DEFAULT 0 NOT NULL,
	"student_fee_config_id" bigint
);
--> statement-breakpoint
CREATE TABLE "batch_fee_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" bigint NOT NULL,
	"previous_fee" numeric(10, 2) NOT NULL,
	"updated_fee" numeric(10, 2) NOT NULL,
	"admin_id" bigint NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" bigint NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"time_slot" varchar(50),
	"session_type" varchar(50) DEFAULT 'group',
	"teacher_id" bigint,
	"max_students" integer DEFAULT 30,
	"status" varchar(20) DEFAULT 'active',
	"is_community_group" boolean DEFAULT false,
	"start_date" timestamp,
	"duration" varchar(255),
	"course_fee" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_id" bigint NOT NULL,
	"batch_id" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_join_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_id" bigint NOT NULL,
	"student_id" bigint NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" bigint NOT NULL,
	"teacher_id" bigint NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"class_type" "class_type" DEFAULT 'group' NOT NULL,
	"status" "class_status" DEFAULT 'scheduled' NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"duration" integer DEFAULT 0,
	"actual_duration" integer,
	"meeting_url" varchar(500),
	"meeting_room_id" varchar(255),
	"recording_url" varchar(500),
	"recording_deleted_at" timestamp,
	"reminder_sent_at" timestamp,
	"reminder_1day_sent_at" timestamp,
	"reminder_1hour_sent_at" timestamp,
	"reminder_10min_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_active_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"active_date" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_careers" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"company" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"location" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"link" varchar(500),
	"published_by" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" bigint NOT NULL,
	"author_id" bigint NOT NULL,
	"content" text NOT NULL,
	"parent_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_lesson_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"content_url" text,
	"youtube_url" varchar(255),
	"text_content" text,
	"file_name" varchar(255),
	"published_by" bigint NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_post_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"reaction" varchar(50) DEFAULT 'like' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255),
	"content" text NOT NULL,
	"author_id" bigint NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"media_url" text,
	"media_name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_saved_careers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"career_id" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_success_stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_name" varchar(255) NOT NULL,
	"course_completed" varchar(255) NOT NULL,
	"achievement" text NOT NULL,
	"photo_url" text,
	"testimonial" text NOT NULL,
	"published_by" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" bigint NOT NULL,
	"teacher_id" bigint NOT NULL,
	"class_id" bigint,
	"batch_id" bigint,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flexibility_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" bigint NOT NULL,
	"request_type" "request_type" NOT NULL,
	"from_batch_id" bigint,
	"to_batch_id" bigint,
	"reason" text,
	"request_status" "request_status" DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" bigint
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "id_sequences" (
	"role_prefix" varchar(10) PRIMARY KEY NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" bigint NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"material_type" "material_type" DEFAULT 'text' NOT NULL,
	"content_url" varchar(500),
	"scheduled_date" timestamp,
	"created_by" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"module_id" bigint NOT NULL,
	"batch_id" bigint NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"uploaded_by" bigint NOT NULL,
	"file_url" text NOT NULL,
	"upload_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_type" varchar(20) NOT NULL,
	"student_id" bigint,
	"batch_id" bigint,
	"teacher_id" bigint NOT NULL,
	"module_id" bigint NOT NULL,
	"session_date" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"video_url" text NOT NULL,
	"thumbnail_url" text,
	"uploaded_by" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" bigint NOT NULL,
	"sender_id" bigint NOT NULL,
	"type" "message_type" DEFAULT 'text' NOT NULL,
	"content" text NOT NULL,
	"media_url" varchar(500),
	"reply_to_id" bigint,
	"reactions" json,
	"is_announcement" boolean DEFAULT false,
	"deleted_at" timestamp,
	"deleted_for_users" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"learning_objectives" text,
	"topics" text,
	"teacher_id" bigint,
	"duration" varchar(255),
	"max_students" integer DEFAULT 50,
	"min_students" integer DEFAULT 5,
	"status" varchar(20) DEFAULT 'active',
	"course_fee" numeric(10, 2) DEFAULT '0',
	"minimum_down_payment" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"is_read" boolean DEFAULT false,
	"data" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "one_to_one_reschedule_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" bigint NOT NULL,
	"previous_scheduled_at" timestamp NOT NULL,
	"proposed_scheduled_at" timestamp NOT NULL,
	"reason" text NOT NULL,
	"status" "request_status" DEFAULT 'pending' NOT NULL,
	"admin_remarks" text,
	"requested_by" bigint NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" bigint
);
--> statement-breakpoint
CREATE TABLE "one_to_one_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" bigint NOT NULL,
	"student_id" bigint NOT NULL,
	"class_id" bigint,
	"title" varchar(255) DEFAULT '1-to-1 Session' NOT NULL,
	"remarks" text,
	"created_by" bigint,
	"session_length" integer DEFAULT 30 NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"session_status" "session_status" DEFAULT 'scheduled' NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"actual_duration" integer,
	"teacher_attendance" varchar(50),
	"student_attendance" varchar(50),
	"meeting_room_id" varchar(255),
	"meeting_url" varchar(500),
	"reminder_1day_sent_at" timestamp,
	"reminder_1hour_sent_at" timestamp,
	"reminder_10min_sent_at" timestamp,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"completed_at" timestamp,
	"recording_url" varchar(500),
	"recording_deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" bigint NOT NULL,
	"student_fee_config_id" bigint,
	"amount" numeric(10, 2) NOT NULL,
	"type" varchar(50) DEFAULT 'tuition',
	"payment_status" "payment_status" DEFAULT 'paid' NOT NULL,
	"due_date" timestamp,
	"paid_at" timestamp,
	"transaction_id" varchar(255),
	"notes" text,
	"batch_id" bigint,
	"installment_number" integer,
	"paid_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"criteria" json NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_by" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_report_id" integer,
	"version" integer DEFAULT 1 NOT NULL,
	"is_latest" boolean DEFAULT true NOT NULL,
	"target_user_id" bigint NOT NULL,
	"type" varchar(20) NOT NULL,
	"config_id" bigint,
	"assessment_period" varchar(50) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"auto_metrics" json NOT NULL,
	"qualitative_scores" json NOT NULL,
	"total_score" numeric(5, 2) NOT NULL,
	"grade" varchar(10),
	"remarks" text,
	"created_by" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "private_message_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" bigint NOT NULL,
	"action" varchar(50) NOT NULL,
	"sender_id" bigint,
	"receiver_id" bigint,
	"message_id" bigint,
	"details" text,
	"performed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "private_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" bigint NOT NULL,
	"receiver_id" bigint NOT NULL,
	"content" text NOT NULL,
	"type" "message_type" DEFAULT 'text' NOT NULL,
	"media_url" varchar(500),
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"enrollment_id" varchar(255),
	"course" varchar(255),
	"batch" varchar(255),
	"batch_time" varchar(50),
	"fees_total" numeric(10, 2) DEFAULT '0',
	"fees_paid" numeric(10, 2) DEFAULT '0',
	"fees_balance" numeric(10, 2) DEFAULT '0',
	"payment_status" "payment_status" DEFAULT 'unpaid',
	"min_initial_payment" numeric(10, 2),
	"payment_due_date" timestamp,
	"grace_period_days" integer DEFAULT 7 NOT NULL,
	"admission_date" timestamp DEFAULT now(),
	"payment_option" varchar(20) DEFAULT 'full_payment',
	"payment_type" varchar(50) DEFAULT 'full_payment',
	"one_on_one_enabled" boolean DEFAULT false NOT NULL,
	"group_session_enabled" boolean DEFAULT false NOT NULL,
	"session_type" varchar(50) DEFAULT 'group',
	"enrollment_status" varchar(50) DEFAULT 'waiting_for_batch',
	"module_id" bigint,
	"preferred_class_time" varchar(50),
	"down_payment" numeric(10, 2) DEFAULT '0',
	"remaining_balance" numeric(10, 2) DEFAULT '0',
	"total_course_fee" numeric(10, 2) DEFAULT '0',
	"completion_date" timestamp,
	"activity_timeline" json,
	"package_config" json DEFAULT '{"oneToOne":{"total":0,"min30":0,"min45":0,"min60":0},"group":{"total":0,"min30":0,"min45":0,"min60":0}}'::json,
	"allocated_one_to_one_sessions" integer DEFAULT 0 NOT NULL,
	"allocated_group_sessions" integer DEFAULT 0 NOT NULL,
	"total_allocated_sessions" integer DEFAULT 0 NOT NULL,
	"attended_one_to_one_sessions" integer DEFAULT 0 NOT NULL,
	"attended_group_sessions" integer DEFAULT 0 NOT NULL,
	"total_attended_sessions" integer DEFAULT 0 NOT NULL,
	"remaining_one_to_one_sessions" integer DEFAULT 0 NOT NULL,
	"remaining_group_sessions" integer DEFAULT 0 NOT NULL,
	"total_remaining_sessions" integer DEFAULT 0 NOT NULL,
	"documents" json DEFAULT '[]'::json,
	"gender" varchar(50),
	"dob" timestamp,
	"educational_qualification" text,
	"qualification_id" integer,
	"specialization" text,
	"experience" text,
	"address" text,
	"postal_code" varchar(20),
	"department" varchar(255),
	"parent_name" varchar(255),
	"parent_phone" varchar(20),
	"parent_country_code" varchar(10),
	"parent_country_iso" varchar(10),
	"parent_phone_number" varchar(20),
	"parent_full_international_number" varchar(50),
	"notes" text,
	"photo" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qualification_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"qualification_id" integer,
	"action" varchar(50) NOT NULL,
	"performed_by" integer,
	"old_value" text,
	"new_value" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qualifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "qualifications_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sales_executives" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"employee_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320),
	"phone" varchar(50),
	"country_code" varchar(10),
	"country_iso" varchar(10),
	"phone_number" varchar(20),
	"full_international_number" varchar(50),
	"username" varchar(100) NOT NULL,
	"password" varchar(255) NOT NULL,
	"referral_code" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sales_executives_employee_id_unique" UNIQUE("employee_id"),
	CONSTRAINT "sales_executives_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "session_allocation_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" bigint NOT NULL,
	"changed_by" bigint NOT NULL,
	"previous_one_to_one" integer NOT NULL,
	"new_one_to_one" integer NOT NULL,
	"previous_group" integer NOT NULL,
	"new_group" integer NOT NULL,
	"reason" text,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_class_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" bigint NOT NULL,
	"allocation" json DEFAULT '{"oneToOne":{"teacherId":null,"sessions30":0,"sessions45":0,"sessions60":0,"completed30":0,"completed45":0,"completed60":0,"remaining30":0,"remaining45":0,"remaining60":0},"group":{"teacherId":null,"batchId":null,"sessions30":0,"sessions45":0,"sessions60":0,"completed30":0,"completed45":0,"completed60":0,"remaining30":0,"remaining45":0,"remaining60":0}}'::json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_class_allocations_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "student_course_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" bigint NOT NULL,
	"changed_by" bigint NOT NULL,
	"change_type" varchar(50) NOT NULL,
	"old_value" text,
	"new_value" text,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_fee_configurations" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" bigint NOT NULL,
	"total_course_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount_type" varchar(20) DEFAULT 'flat' NOT NULL,
	"final_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"payment_mode" varchar(50) DEFAULT 'FULL_PAYMENT' NOT NULL,
	"down_payment" numeric(10, 2) DEFAULT '0' NOT NULL,
	"number_of_installments" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_id_sequence" (
	"prefix" varchar(50) PRIMARY KEY NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	"number_length" integer DEFAULT 4 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_salaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" bigint NOT NULL,
	"month" varchar(7) NOT NULL,
	"group_classes_count" integer DEFAULT 0,
	"one_to_one_count" integer DEFAULT 0,
	"basic_salary" numeric(10, 2) DEFAULT '0',
	"group_30min_count" integer DEFAULT 0,
	"group_45min_count" integer DEFAULT 0,
	"group_60min_count" integer DEFAULT 0,
	"one_to_one_30min_count" integer DEFAULT 0,
	"one_to_one_45min_count" integer DEFAULT 0,
	"one_to_one_60min_count" integer DEFAULT 0,
	"group_30min_rate" numeric(10, 2) DEFAULT '0',
	"group_45min_rate" numeric(10, 2) DEFAULT '0',
	"group_60min_rate" numeric(10, 2) DEFAULT '0',
	"one_to_one_30min_rate" numeric(10, 2) DEFAULT '0',
	"one_to_one_45min_rate" numeric(10, 2) DEFAULT '0',
	"one_to_one_60min_rate" numeric(10, 2) DEFAULT '0',
	"net_salary" numeric(10, 2) DEFAULT '0',
	"total_amount" numeric(10, 2) DEFAULT '0',
	"status" varchar(20) DEFAULT 'pending',
	"payment_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_salary_config_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" bigint NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"previous_value" numeric(10, 2),
	"new_value" numeric(10, 2) NOT NULL,
	"changed_by" bigint NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_salary_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" bigint NOT NULL,
	"basic_salary" numeric(10, 2) DEFAULT '0' NOT NULL,
	"group_30min_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"group_45min_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"group_60min_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"one_to_one_30min_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"one_to_one_45min_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"one_to_one_60min_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teacher_salary_configs_teacher_id_unique" UNIQUE("teacher_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"union_id" varchar(255) NOT NULL,
	"username" varchar(100),
	"password" varchar(255),
	"name" varchar(255) NOT NULL,
	"email" varchar(320),
	"phone" varchar(20),
	"country_code" varchar(10),
	"country_iso" varchar(10),
	"phone_number" varchar(20),
	"full_international_number" varchar(50),
	"role" "role" DEFAULT 'student' NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"avatar" varchar(500),
	"device_token" varchar(500),
	"last_login_at" timestamp,
	"notifications_paused_until" timestamp,
	"can_view_salary_reports" boolean DEFAULT false NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"sales_executive_id" integer,
	"referral_code" varchar(50),
	"registration_source" varchar(50) DEFAULT 'direct',
	"gender" varchar(50),
	"date_of_birth" timestamp,
	"educational_qualification" text,
	"qualification_id" integer,
	"specialization" varchar(255),
	"teaching_experience" integer,
	"address" text,
	"postal_code" varchar(20),
	"department" varchar(255),
	CONSTRAINT "users_union_id_unique" UNIQUE("union_id"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "violations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"reported_by" bigint,
	"type" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"action" varchar(100),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"batch" varchar(255),
	"level" varchar(50) DEFAULT 'Warning' NOT NULL,
	"reason" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "announcement_dismissals" ADD CONSTRAINT "announcement_dismissals_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_dismissals" ADD CONSTRAINT "announcement_dismissals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_one_to_one_session_id_one_to_one_sessions_id_fk" FOREIGN KEY ("one_to_one_session_id") REFERENCES "public"."one_to_one_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_alerts" ADD CONSTRAINT "attendance_alerts_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_alerts" ADD CONSTRAINT "attendance_alerts_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_audit_logs" ADD CONSTRAINT "batch_audit_logs_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_audit_logs" ADD CONSTRAINT "batch_audit_logs_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_enrollments" ADD CONSTRAINT "batch_enrollments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_enrollments" ADD CONSTRAINT "batch_enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_enrollments" ADD CONSTRAINT "batch_enrollments_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_enrollments" ADD CONSTRAINT "batch_enrollments_student_fee_config_id_student_fee_configurations_id_fk" FOREIGN KEY ("student_fee_config_id") REFERENCES "public"."student_fee_configurations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_fee_audit_logs" ADD CONSTRAINT "batch_fee_audit_logs_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_fee_audit_logs" ADD CONSTRAINT "batch_fee_audit_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_batches" ADD CONSTRAINT "class_batches_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_batches" ADD CONSTRAINT "class_batches_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_join_requests" ADD CONSTRAINT "class_join_requests_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_join_requests" ADD CONSTRAINT "class_join_requests_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_active_users" ADD CONSTRAINT "community_active_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_careers" ADD CONSTRAINT "community_careers_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_lesson_views" ADD CONSTRAINT "community_lesson_views_lesson_id_community_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."community_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_lesson_views" ADD CONSTRAINT "community_lesson_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_lessons" ADD CONSTRAINT "community_lessons_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_post_reactions" ADD CONSTRAINT "community_post_reactions_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_post_reactions" ADD CONSTRAINT "community_post_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_saved_careers" ADD CONSTRAINT "community_saved_careers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_saved_careers" ADD CONSTRAINT "community_saved_careers_career_id_community_careers_id_fk" FOREIGN KEY ("career_id") REFERENCES "public"."community_careers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_success_stories" ADD CONSTRAINT "community_success_stories_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flexibility_requests" ADD CONSTRAINT "flexibility_requests_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flexibility_requests" ADD CONSTRAINT "flexibility_requests_from_batch_id_batches_id_fk" FOREIGN KEY ("from_batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flexibility_requests" ADD CONSTRAINT "flexibility_requests_to_batch_id_batches_id_fk" FOREIGN KEY ("to_batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flexibility_requests" ADD CONSTRAINT "flexibility_requests_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_materials" ADD CONSTRAINT "learning_materials_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_materials" ADD CONSTRAINT "learning_materials_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_notes" ADD CONSTRAINT "learning_notes_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_notes" ADD CONSTRAINT "learning_notes_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_notes" ADD CONSTRAINT "learning_notes_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_videos" ADD CONSTRAINT "learning_videos_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_videos" ADD CONSTRAINT "learning_videos_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_videos" ADD CONSTRAINT "learning_videos_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_videos" ADD CONSTRAINT "learning_videos_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_videos" ADD CONSTRAINT "learning_videos_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_to_one_reschedule_requests" ADD CONSTRAINT "one_to_one_reschedule_requests_session_id_one_to_one_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."one_to_one_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_to_one_reschedule_requests" ADD CONSTRAINT "one_to_one_reschedule_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_to_one_reschedule_requests" ADD CONSTRAINT "one_to_one_reschedule_requests_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_to_one_sessions" ADD CONSTRAINT "one_to_one_sessions_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_to_one_sessions" ADD CONSTRAINT "one_to_one_sessions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_to_one_sessions" ADD CONSTRAINT "one_to_one_sessions_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "one_to_one_sessions" ADD CONSTRAINT "one_to_one_sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_fee_config_id_student_fee_configurations_id_fk" FOREIGN KEY ("student_fee_config_id") REFERENCES "public"."student_fee_configurations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_configs" ADD CONSTRAINT "performance_configs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reports" ADD CONSTRAINT "performance_reports_parent_report_id_performance_reports_id_fk" FOREIGN KEY ("parent_report_id") REFERENCES "public"."performance_reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reports" ADD CONSTRAINT "performance_reports_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reports" ADD CONSTRAINT "performance_reports_config_id_performance_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."performance_configs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reports" ADD CONSTRAINT "performance_reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_message_audit_logs" ADD CONSTRAINT "private_message_audit_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_messages" ADD CONSTRAINT "private_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_messages" ADD CONSTRAINT "private_messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_qualification_id_qualifications_id_fk" FOREIGN KEY ("qualification_id") REFERENCES "public"."qualifications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_executives" ADD CONSTRAINT "sales_executives_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_allocation_logs" ADD CONSTRAINT "session_allocation_logs_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_allocation_logs" ADD CONSTRAINT "session_allocation_logs_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_class_allocations" ADD CONSTRAINT "student_class_allocations_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_audit_logs" ADD CONSTRAINT "student_course_audit_logs_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_audit_logs" ADD CONSTRAINT "student_course_audit_logs_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fee_configurations" ADD CONSTRAINT "student_fee_configurations_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_salaries" ADD CONSTRAINT "teacher_salaries_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_salary_config_audit_logs" ADD CONSTRAINT "teacher_salary_config_audit_logs_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_salary_config_audit_logs" ADD CONSTRAINT "teacher_salary_config_audit_logs_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_salary_configs" ADD CONSTRAINT "teacher_salary_configs_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_qualification_id_qualifications_id_fk" FOREIGN KEY ("qualification_id") REFERENCES "public"."qualifications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_attendance_idx" ON "attendance" USING btree ("class_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_oto_attendance_idx" ON "attendance" USING btree ("one_to_one_session_id","student_id");--> statement-breakpoint
CREATE INDEX "attendance_teacher_idx" ON "attendance" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "attendance_student_idx" ON "attendance" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "attendance_date_idx" ON "attendance" USING btree ("attendance_date");--> statement-breakpoint
CREATE INDEX "attendance_batch_idx" ON "attendance" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "attendance_module_idx" ON "attendance" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "att_alert_student_idx" ON "attendance_alerts" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "att_alert_batch_idx" ON "attendance_alerts" USING btree ("batch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_enrollment_idx" ON "batch_enrollments" USING btree ("batch_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_class_batch_idx" ON "class_batches" USING btree ("class_id","batch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_class_student_join_idx" ON "class_join_requests" USING btree ("class_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_active_date_idx" ON "community_active_users" USING btree ("user_id","active_date");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_lesson_user_view_idx" ON "community_lesson_views" USING btree ("lesson_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_post_user_reaction_idx" ON "community_post_reactions" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_career_idx" ON "community_saved_careers" USING btree ("user_id","career_id");--> statement-breakpoint
CREATE INDEX "holiday_date_idx" ON "holidays" USING btree ("date");--> statement-breakpoint
CREATE INDEX "msg_batch_idx" ON "messages" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "msg_sender_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "msg_created_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pm_audit_admin_idx" ON "private_message_audit_logs" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "pm_audit_time_idx" ON "private_message_audit_logs" USING btree ("performed_at");--> statement-breakpoint
CREATE INDEX "pm_sender_idx" ON "private_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "pm_receiver_idx" ON "private_messages" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "pm_created_idx" ON "private_messages" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollment_id_unique" ON "profiles" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "parent_full_phone_idx" ON "profiles" USING btree ("parent_full_international_number");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_code_idx" ON "sales_executives" USING btree ("referral_code");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_id_idx" ON "sales_executives" USING btree ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exec_full_phone_idx" ON "sales_executives" USING btree ("full_international_number");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_student_fee_config_idx" ON "student_fee_configurations" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "phone_idx" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "union_id_idx" ON "users" USING btree ("union_id");--> statement-breakpoint
CREATE UNIQUE INDEX "country_phone_idx" ON "users" USING btree ("country_code","phone_number");--> statement-breakpoint
CREATE UNIQUE INDEX "full_int_phone_idx" ON "users" USING btree ("full_international_number");