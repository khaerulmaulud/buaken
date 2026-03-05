CREATE TYPE "public"."chat_message_type" AS ENUM('text', 'image');--> statement-breakpoint
CREATE TYPE "public"."chat_room_type" AS ENUM('customer_merchant', 'customer_courier', 'merchant_courier');--> statement-breakpoint
CREATE TYPE "public"."chat_sender_role" AS ENUM('customer', 'merchant', 'courier', 'system');--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_role" "chat_sender_role" NOT NULL,
	"content" text NOT NULL,
	"message_type" "chat_message_type" DEFAULT 'text' NOT NULL,
	"image_url" varchar(500),
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"type" "chat_room_type" NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_room_id_idx" ON "chat_messages" USING btree ("room_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "chat_messages_sender_id_idx" ON "chat_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "chat_messages_is_read_idx" ON "chat_messages" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "chat_rooms_order_id_idx" ON "chat_rooms" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "chat_rooms_type_idx" ON "chat_rooms" USING btree ("type");--> statement-breakpoint
CREATE INDEX "chat_rooms_status_idx" ON "chat_rooms" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "chat_rooms_order_type_unique_idx" ON "chat_rooms" USING btree ("order_id","type");