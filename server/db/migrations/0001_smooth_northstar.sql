CREATE TABLE "report_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"config" json NOT NULL,
	"created_by" bigint,
	"is_global" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_closures" (
	"id" serial PRIMARY KEY NOT NULL,
	"closing_date" timestamp NOT NULL,
	"month_str" varchar(20),
	"clean_month_str" varchar(20),
	"ca_category" varchar(100),
	"ca_id" bigint,
	"asm_id" bigint,
	"group_id" bigint,
	"course_name" varchar(255),
	"adm_no" varchar(50),
	"student_id" bigint,
	"student_name" varchar(255),
	"type" varchar(50),
	"total_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"first_inst" numeric(10, 2) DEFAULT '0' NOT NULL,
	"second_inst" numeric(10, 2) DEFAULT '0' NOT NULL,
	"third_inst" numeric(10, 2) DEFAULT '0' NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"points" numeric(10, 2) DEFAULT '0' NOT NULL,
	"base_amount_for_points" numeric(10, 2) DEFAULT '0' NOT NULL,
	"bank" varchar(255),
	"is_verified" boolean DEFAULT false,
	"verification_status" varchar(50),
	"course_change_status" varchar(100),
	"ob_number" varchar(100),
	"lead_status" varchar(100),
	"remarks" text,
	"is_deleted" boolean DEFAULT false,
	"created_by" bigint,
	"updated_by" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"asm_id" bigint,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sales_groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sales_points_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"ca_category_match" varchar(100),
	"course_match" varchar(255),
	"min_total_fee" numeric(10, 2),
	"max_total_fee" numeric(10, 2),
	"min_payment_percent" numeric(5, 2),
	"fixed_points_award" numeric(10, 2),
	"formula" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_class_allocations" ALTER COLUMN "allocation" SET DEFAULT '{"oneToOne":{"teacherId":null,"designatedTime":"","sessions30":0,"sessions45":0,"sessions60":0,"completed30":0,"completed45":0,"completed60":0,"remaining30":0,"remaining45":0,"remaining60":0},"group":{"teacherId":null,"batchId":null,"designatedTime":"","sessions30":0,"sessions45":0,"sessions60":0,"completed30":0,"completed45":0,"completed60":0,"remaining30":0,"remaining45":0,"remaining60":0}}'::json;--> statement-breakpoint
ALTER TABLE "one_to_one_sessions" ADD COLUMN "teacher_duration" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "one_to_one_sessions" ADD COLUMN "student_duration" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sales_executives" ADD COLUMN "group_id" bigint;--> statement-breakpoint
ALTER TABLE "sales_executives" ADD COLUMN "is_asm" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_closures" ADD CONSTRAINT "sales_closures_ca_id_sales_executives_id_fk" FOREIGN KEY ("ca_id") REFERENCES "public"."sales_executives"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_closures" ADD CONSTRAINT "sales_closures_asm_id_sales_executives_id_fk" FOREIGN KEY ("asm_id") REFERENCES "public"."sales_executives"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_closures" ADD CONSTRAINT "sales_closures_group_id_sales_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."sales_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_closures" ADD CONSTRAINT "sales_closures_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_closures" ADD CONSTRAINT "sales_closures_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_closures" ADD CONSTRAINT "sales_closures_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_groups" ADD CONSTRAINT "sales_groups_asm_id_sales_executives_id_fk" FOREIGN KEY ("asm_id") REFERENCES "public"."sales_executives"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sc_ca_idx" ON "sales_closures" USING btree ("ca_id");--> statement-breakpoint
CREATE INDEX "sc_asm_idx" ON "sales_closures" USING btree ("asm_id");--> statement-breakpoint
CREATE INDEX "sc_date_idx" ON "sales_closures" USING btree ("closing_date");