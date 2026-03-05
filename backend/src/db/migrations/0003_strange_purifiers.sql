ALTER TABLE "reviews" DROP CONSTRAINT "reviews_order_id_menu_item_id_unique";--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "order_id" DROP NOT NULL;