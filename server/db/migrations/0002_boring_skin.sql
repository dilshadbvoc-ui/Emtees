CREATE TABLE "sales_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_name" varchar(255) NOT NULL,
	"phone" varchar(50),
	"address" text,
	"remarks" text,
	"status" varchar(50) DEFAULT 'New' NOT NULL,
	"ca_id" bigint,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_ca_id_sales_executives_id_fk" FOREIGN KEY ("ca_id") REFERENCES "public"."sales_executives"("id") ON DELETE set null ON UPDATE no action;