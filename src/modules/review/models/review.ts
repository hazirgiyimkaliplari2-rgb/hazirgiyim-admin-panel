import { model } from "@medusajs/framework/utils"

export const Review = model.define("review", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  customer_id: model.text().nullable(),
  customer_name: model.text(),
  customer_email: model.text(),
  rating: model.number(),
  title: model.text(),
  content: model.text(),
  helpful_count: model.number().default(0),
  not_helpful_count: model.number().default(0),
  verified_purchase: model.boolean().default(false),
  status: model.enum(["pending", "approved", "rejected"]).default("pending"),
  moderated_by: model.text().nullable(),
  moderated_at: model.dateTime().nullable(),
  images: model.json().nullable(),
  metadata: model.json().nullable(),
  response: model.text().nullable(), // Mağaza yanıtı
  response_by: model.text().nullable(),
  response_at: model.dateTime().nullable()
})