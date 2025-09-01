import { model } from "@medusajs/framework/utils"

export const CategoryTranslation = model.define("category_translation", {
  id: model.id().primaryKey(),
  category_id: model.text().searchable(),
  locale: model.text().searchable(),
  name: model.text().searchable(),
  description: model.text().nullable(),
  handle: model.text().nullable(),
  metadata: model.json().nullable(),
  
  // SEO fields
  seo_title: model.text().nullable(),
  seo_description: model.text().nullable(),
  seo_keywords: model.text().nullable(),
})
  .indexes([
    {
      name: "idx_category_translation_category_locale",
      on: ["category_id", "locale"],
      unique: true,
    },
    {
      name: "idx_category_translation_locale",
      on: ["locale"],
    },
  ])