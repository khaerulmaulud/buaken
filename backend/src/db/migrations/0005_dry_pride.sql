CREATE TYPE "public"."complaint_category" AS ENUM('order_not_received', 'wrong_order', 'merchant_fraud', 'courier_issue', 'payment_problem', 'quality_issue', 'other');--> statement-breakpoint
CREATE TYPE "public"."complaint_status" AS ENUM('pending', 'in_review', 'resolved', 'closed');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'admin';--> statement-breakpoint
CREATE TABLE "complaints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"category" "complaint_category" NOT NULL,
	"subject" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"order_id" uuid,
	"status" "complaint_status" DEFAULT 'pending' NOT NULL,
	"assigned_admin_id" uuid,
	"admin_notes" text,
	"resolution" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_assigned_admin_id_users_id_fk" FOREIGN KEY ("assigned_admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;