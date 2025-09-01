import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { TRANSLATION_MODULE } from "../../../modules/translation"
import TranslationModuleService from "../../../modules/translation/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const locale = req.headers["x-locale"] as string || 
                  req.query.locale as string || 
                  "tr"

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const translationService = req.scope.resolve(
    TRANSLATION_MODULE
  ) as TranslationModuleService

  // Get products using standard query
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "subtitle",
      "description",
      "handle",
      "status",
      "thumbnail",
      "metadata",
      "variants.*",
      "images.*",
      "categories.*",
      "collection.*",
      "tags.*",
      "type.*",
    ],
    filters: req.query,
  })

  // Apply translations to each product
  const translatedProducts = await Promise.all(
    products.map(async (product: any) => {
      const translation = await translationService.getProductTranslation(
        product.id,
        locale
      )

      if (translation) {
        return {
          ...product,
          title: translation.title || product.title,
          subtitle: translation.subtitle || product.subtitle,
          description: translation.description || product.description,
          handle: translation.handle || product.handle,
          material: translation.material || product.material,
          metadata: {
            ...product.metadata,
            ...(translation.metadata || {}),
          },
          seo_title: translation.seo_title,
          seo_description: translation.seo_description,
          seo_keywords: translation.seo_keywords,
          locale,
        }
      }

      return { ...product, locale }
    })
  )

  res.json({ 
    products: translatedProducts,
    locale,
    count: translatedProducts.length,
  })
}