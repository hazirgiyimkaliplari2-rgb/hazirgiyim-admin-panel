import { MedusaService } from "@medusajs/framework/utils"
import { ProductTranslation } from "./models/product-translation"
import { CategoryTranslation } from "./models/category-translation"
import { StorefrontTranslation } from "./models/storefront-translation"

class TranslationModuleService extends MedusaService({
  ProductTranslation,
  CategoryTranslation,
  StorefrontTranslation,
}) {
  async getProductTranslation(productId: string, locale: string) {
    const translations = await this.listProductTranslations({
      product_id: productId,
      locale: locale,
    })
    
    return translations[0] || null
  }

  async upsertProductTranslation(data: {
    product_id: string
    locale: string
    title?: string
    subtitle?: string
    description?: string
    handle?: string
    material?: string
    metadata?: Record<string, any>
    seo_title?: string
    seo_description?: string
    seo_keywords?: string
    instruction_content?: string
    skill_level_description?: string
    fabric_requirement?: string
  }) {
    const existing = await this.getProductTranslation(data.product_id, data.locale)
    
    if (existing) {
      return await this.updateProductTranslations({ id: existing.id, ...data })
    } else {
      return await this.createProductTranslations(data)
    }
  }

  async getCategoryTranslation(categoryId: string, locale: string) {
    const translations = await this.listCategoryTranslations({
      category_id: categoryId,
      locale: locale,
    })
    
    return translations[0] || null
  }

  async upsertCategoryTranslation(data: {
    category_id: string
    locale: string
    name?: string
    description?: string
    handle?: string
    metadata?: Record<string, any>
    seo_title?: string
    seo_description?: string
    seo_keywords?: string
  }) {
    const existing = await this.getCategoryTranslation(data.category_id, data.locale)
    
    if (existing) {
      return await this.updateCategoryTranslations({ id: existing.id, ...data })
    } else {
      return await this.createCategoryTranslations(data)
    }
  }

  async getStorefrontTranslation(key: string, locale: string) {
    const translations = await this.listStorefrontTranslations({
      key,
      locale,
    })
    
    return translations[0] || null
  }

  async upsertStorefrontTranslation(data: {
    key: string
    locale: string
    value: string
    description?: string
    group?: string
    metadata?: Record<string, any>
  }) {
    const existing = await this.getStorefrontTranslation(data.key, data.locale)
    
    if (existing) {
      return await this.updateStorefrontTranslations({ id: existing.id, ...data })
    } else {
      return await this.createStorefrontTranslations(data)
    }
  }

  async getStorefrontTranslationsByLocale(locale: string) {
    return await this.listStorefrontTranslations({ locale })
  }

  async getStorefrontTranslationsByGroup(group: string, locale?: string) {
    const filters: any = { group }
    if (locale) filters.locale = locale
    
    return await this.listStorefrontTranslations(filters)
  }

  async getAvailableLocales(): Promise<string[]> {
    // Get unique locales from all translations
    const productLocales = await this.listProductTranslations({}, {
      select: ["locale"],
      take: null,
    })
    
    const categoryLocales = await this.listCategoryTranslations({}, {
      select: ["locale"],
      take: null,
    })
    
    const storefrontLocales = await this.listStorefrontTranslations({}, {
      select: ["locale"],
      take: null,
    })
    
    const locales = new Set<string>()
    productLocales.forEach(t => locales.add(t.locale))
    categoryLocales.forEach(t => locales.add(t.locale))
    storefrontLocales.forEach(t => locales.add(t.locale))
    
    // Always include default locales
    locales.add("tr")
    locales.add("en")
    locales.add("de")
    
    return Array.from(locales).sort()
  }

  async deleteProductTranslationsByProductId(productId: string) {
    const translations = await this.listProductTranslations({
      product_id: productId,
    })
    
    if (translations.length > 0) {
      await this.deleteProductTranslations(translations.map(t => t.id))
    }
  }

  async deleteCategoryTranslationsByCategoryId(categoryId: string) {
    const translations = await this.listCategoryTranslations({
      category_id: categoryId,
    })
    
    if (translations.length > 0) {
      await this.deleteCategoryTranslations(translations.map(t => t.id))
    }
  }
}

export default TranslationModuleService