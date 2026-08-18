CREATE TABLE "demo_classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_exec_id" bigint NOT NULL,
	"teacher_id" bigint NOT NULL,
	"student_name" varchar(255) NOT NULL,
	"student_phone" varchar(50),
	"student_email" varchar(320),
	"module_id" bigint,
	"scheduled_at" timestamp,
	"jitsi_room" varchar(255) NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"converted_to_enrollment" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"duration_minutes" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "department_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"department_id" bigint NOT NULL,
	"module_id" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "department_teachers" (
	"id" serial PRIMARY KEY NOT NULL,
	"department_id" bigint NOT NULL,
	"teacher_id" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"head_user_id" bigint,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "teacher_salaries" ADD COLUMN "demo_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "teacher_salaries" ADD COLUMN "demo_base_rate" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "demo_classes" ADD CONSTRAINT "demo_classes_sales_exec_id_sales_executives_id_fk" FOREIGN KEY ("sales_exec_id") REFERENCES "public"."sales_executives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_classes" ADD CONSTRAINT "demo_classes_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_classes" ADD CONSTRAINT "demo_classes_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_modules" ADD CONSTRAINT "department_modules_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_modules" ADD CONSTRAINT "department_modules_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_teachers" ADD CONSTRAINT "department_teachers_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_teachers" ADD CONSTRAINT "department_teachers_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_user_id_users_id_fk" FOREIGN KEY ("head_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_dept_module_idx" ON "department_modules" USING btree ("department_id","module_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_dept_teacher_idx" ON "department_teachers" USING btree ("department_id","teacher_id");