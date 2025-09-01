import { model } from "@medusajs/framework/utils"

export const StorefrontTranslation = model.define("storefront_translation", {
  id: model.id().primaryKey(),
  key: model.text().searchable(), // Unique key for the content (e.g., "homepage.hero.title")
  locale: model.text().searchable(),
  value: model.text(),
  description: model.text().nullable(), // Admin description for context
  group: model.text().nullable(), // Group name (e.g., "homepage", "footer", "checkout")
  metadata: model.json().nullable(),
})
  .indexes([
    {
      name: "idx_storefront_translation_key_locale",
      on: ["key", "locale"],
      unique: true,
    },
    {
      name: "idx_storefront_translation_locale",
      on: ["locale"],
    },
    {
      name: "idx_storefront_translation_group",
      on: ["group"],
    },
  ])