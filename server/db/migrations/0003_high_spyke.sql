CREATE TABLE "attendance_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"class_id" bigint,
	"one_to_one_session_id" bigint,
	"event_type" varchar(20) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE "class_ledger_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" bigint NOT NULL,
	"enrollment_id" bigint,
	"type" varchar(20) NOT NULL,
	"amount" integer NOT NULL,
	"reference_class_id" bigint,
	"reference_one_to_one_id" bigint,
	"remarks" text,
	"created_by" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "validity_end_date" timestamp;--> statement-breakpoint
ALTER TABLE "teacher_salary_configs" ADD COLUMN "demo_base_rate" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_salary_configs" ADD COLUMN "demo_conversion_bonus" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_locked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_one_to_one_session_id_one_to_one_sessions_id_fk" FOREIGN KEY ("one_to_one_session_id") REFERENCES "public"."one_to_one_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_ledger_transactions" ADD CONSTRAINT "class_ledger_transactions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_ledger_transactions" ADD CONSTRAINT "class_ledger_transactions_enrollment_id_batch_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."batch_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_ledger_transactions" ADD CONSTRAINT "class_ledger_transactions_reference_class_id_classes_id_fk" FOREIGN KEY ("reference_class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_ledger_transactions" ADD CONSTRAINT "class_ledger_transactions_reference_one_to_one_id_one_to_one_sessions_id_fk" FOREIGN KEY ("reference_one_to_one_id") REFERENCES "public"."one_to_one_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_ledger_transactions" ADD CONSTRAINT "class_ledger_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;