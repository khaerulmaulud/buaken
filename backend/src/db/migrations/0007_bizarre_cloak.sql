CREATE INDEX "menu_items_name_idx" ON "menu_items" USING btree ("name");--> statement-breakpoint
CREATE INDEX "merchants_city_idx" ON "merchants" USING btree ("city");--> statement-breakpoint
CREATE INDEX "merchants_is_open_idx" ON "merchants" USING btree ("is_open");