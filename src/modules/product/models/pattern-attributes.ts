import { model } from "@medusajs/framework/utils"

export const PatternAttributes = model.define("pattern_attributes", {
  id: model.id().primaryKey(),
  product_id: model.text().unique(),
  
  // Kalıp türü ve kategorisi
  pattern_type: model.enum([
    "etek", 
    "pantolon", 
    "gomlek", 
    "elbise", 
    "ceket", 
    "bluz",
    "mont",
    "yelek",
    "tulum",
    "sort",
    "kaban",
    "trencekot"
  ]),
  
  // Hedef kitle
  target_audience: model.enum(["kadin", "erkek", "cocuk", "bebek", "unisex"]),
  age_group: model.enum(["bebek", "cocuk", "genc", "yetiskin", "plus"]),
  
  // Kalıp bedenleri ve grading
  available_sizes: model.json().default({} as any), // ["36", "38", "40", "42", "44", "46"]
  size_system: model.enum(["TR", "EU", "US", "UK"]), // Beden sistemi
  has_grading: model.boolean().default(false), // Grading dahil mi?
  grading_increments: model.json(), // Her beden arası artış değerleri
  
  // Kalıp özellikleri
  difficulty_level: model.enum(["basit", "orta", "zor", "uzman"]),
  style_features: model.json().default({} as any), // ["kuplu", "pensli", "cepli", "yakalı"]
  
  // Teknik detaylar
  pattern_pieces_count: model.number(), // Kalıp parça sayısı
  seam_allowance_included: model.boolean().default(false),
  seam_allowance_cm: model.number().default(1),
  
  // Kumaş önerileri
  recommended_fabrics: model.json().default({} as any), // ["pamuklu", "viskon", "polyester", "likra"]
  fabric_requirements: model.json(), // { "140cm": "1.5m", "150cm": "1.4m" }
  notions_required: model.json().default({} as any), // ["fermuar", "düğme", "tela"]
  
  // Dosya bilgileri
  file_formats: model.json().default({} as any), // ["PDF", "DXF", "PLT", "A0", "A4"]
  digital_file_url: model.text(), // Dijital dosya linki
  file_size_mb: model.number(),
  
  // Talimatlar
  includes_instructions: model.boolean().default(true),
  instruction_language: model.json().default({} as any), // ["tr", "en"]
  includes_size_chart: model.boolean().default(true),
  includes_layout_guide: model.boolean().default(true), // Pastal planı
  
  // Video/görsel içerik
  tutorial_video_url: model.text(),
  preview_images: model.json().default({} as any), // Önizleme görselleri
  technical_drawing_url: model.text(), // Teknik çizim
  finished_product_images: model.json().default({} as any), // Bitmiş ürün örnekleri
  
  created_at: model.dateTime(),
  updated_at: model.dateTime(),
})