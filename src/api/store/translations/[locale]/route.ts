import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { TRANSLATION_MODULE } from "../../../../modules/translation"
import TranslationModuleService from "../../../../modules/translation/service"

/**
 * GET /store/translations/:locale
 * Storefront için tüm çevirileri locale'e göre getir
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { locale } = req.params

  if (!locale) {
    return res.status(400).json({ error: "Locale is required" })
  }

  const translationService = req.scope.resolve(
    TRANSLATION_MODULE
  ) as TranslationModuleService

  try {
    // Get all storefront translations for the locale
    const storefrontTranslations = await translationService.getStorefrontTranslationsByLocale(locale)
    
    // Convert to key-value object for easy access in frontend
    const translations: Record<string, string> = {}
    storefrontTranslations.forEach(t => {
      translations[t.key] = t.value
    })

    // Group translations by their group
    const groupedTranslations: Record<string, Record<string, string>> = {}
    storefrontTranslations.forEach(t => {
      const group = t.group || "general"
      if (!groupedTranslations[group]) {
        groupedTranslations[group] = {}
      }
      groupedTranslations[group][t.key] = t.value
    })

    res.json({
      locale,
      translations,
      grouped: groupedTranslations,
      count: storefrontTranslations.length,
    })
  } catch (error) {
    console.error("Failed to fetch translations:", error)
    res.status(500).json({ error: "Failed to fetch translations" })
  }
}