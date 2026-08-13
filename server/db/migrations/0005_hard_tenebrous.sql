ALTER TABLE "sales_executives" ADD COLUMN "designation" varchar(50) DEFAULT 'Sales User' NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_salaries" ADD COLUMN "demo_conversion_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "teacher_salaries" ADD COLUMN "demo_bonus_amount" numeric(10, 2) DEFAULT '0';