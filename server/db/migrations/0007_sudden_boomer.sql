CREATE TABLE "lead_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"month" varchar(50) NOT NULL,
	"ca_id" bigint,
	"asm_id" bigint,
	"course" varchar(255) NOT NULL,
	"no_of_leads" integer DEFAULT 0 NOT NULL,
	"amount_spent" numeric(10, 2) DEFAULT '0' NOT NULL,
	"daily_budget" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_campaigns" ADD CONSTRAINT "lead_campaigns_ca_id_sales_executives_id_fk" FOREIGN KEY ("ca_id") REFERENCES "public"."sales_executives"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_campaigns" ADD CONSTRAINT "lead_campaigns_asm_id_sales_executives_id_fk" FOREIGN KEY ("asm_id") REFERENCES "public"."sales_executives"("id") ON DELETE set null ON UPDATE no action;