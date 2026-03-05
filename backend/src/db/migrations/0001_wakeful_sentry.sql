ALTER TABLE "reviews" DROP CONSTRAINT "reviews_order_id_unique";--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "menu_item_id" uuid;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "merchant_reply" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "replied_at" timestamp;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_menu_item_id_unique" UNIQUE("order_id","menu_item_id");