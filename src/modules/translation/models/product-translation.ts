import { model } from "@medusajs/framework/utils"

export const ProductTranslation = model.define("product_translation", {
  id: model.id().primaryKey(),
  product_id: model.text().searchable(),
  locale: model.text().searchable(),
  title: model.text().searchable(),
  subtitle: model.text().nullable(),
  description: model.text().nullable(),
  handle: model.text().nullable(),
  material: model.text().nullable(),
  metadata: model.json().nullable(),
  
  // SEO fields
  seo_title: model.text().nullable(),
  seo_description: model.text().nullable(),
  seo_keywords: model.text().nullable(),
  
  // Pattern-specific translations
  instruction_content: model.text().nullable(),
  skill_level_description: model.text().nullable(),
  fabric_requirement: model.text().nullable(),
})
  .indexes([
    {
      name: "idx_product_translation_product_locale",
      on: ["product_id", "locale"],
      unique: true,
    },
    {
      name: "idx_product_translation_locale",
      on: ["locale"],
    },
  ])