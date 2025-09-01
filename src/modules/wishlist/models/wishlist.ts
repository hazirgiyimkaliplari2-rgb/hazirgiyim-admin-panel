import { model } from "@medusajs/framework/utils"

export const Wishlist = model.define("wishlist", {
  id: model.id().primaryKey(),
  customer_id: model.text().unique()
})

export const WishlistItem = model.define("wishlist_item", {
  id: model.id().primaryKey(),
  wishlist_id: model.text(),
  product_id: model.text(),
  variant_id: model.text().nullable(),
  metadata: model.json().nullable()
})