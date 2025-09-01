import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/products/filters
 * Ürünler için mevcut filtreleri ve sayılarını döner
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Get all products with metadata
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title", 
        "status",
        "metadata",
        "categories.id",
        "categories.name",
        "categories.handle",
        "variants.prices.amount",
        "variants.prices.currency_code",
      ],
      filters: {
        status: "published",
      },
    })

    // Initialize filter aggregations
    const filters = {
      categories: new Map<string, { label: string; count: number }>(),
      sizes: new Map<string, { label: string; count: number }>(),
      difficulty: new Map<string, { label: string; count: number }>(),
      fabric: new Map<string, { label: string; count: number }>(),
      pattern_type: new Map<string, { label: string; count: number }>(),
      target_audience: new Map<string, { label: string; count: number }>(),
      price: {
        min: Infinity,
        max: 0,
      },
    }

    // Process each product
    products.forEach((product: any) => {
      // Categories
      if (product.categories) {
        product.categories.forEach((category: any) => {
          const current = filters.categories.get(category.handle) || { label: category.name, count: 0 }
          current.count++
          filters.categories.set(category.handle, current)
        })
      }

      // Pattern metadata
      if (product.metadata) {
        // Sizes
        if (product.metadata.available_sizes) {
          const sizes = Array.isArray(product.metadata.available_sizes) 
            ? product.metadata.available_sizes 
            : JSON.parse(product.metadata.available_sizes || "[]")
          
          sizes.forEach((size: string) => {
            const current = filters.sizes.get(size) || { label: `${size} Beden`, count: 0 }
            current.count++
            filters.sizes.set(size, current)
          })
        }

        // Difficulty level
        if (product.metadata.difficulty_level) {
          const difficulty = product.metadata.difficulty_level
          const labels: Record<string, string> = {
            basit: "Başlangıç",
            orta: "Orta",
            zor: "İleri",
            uzman: "Uzman",
          }
          const current = filters.difficulty.get(difficulty) || { 
            label: labels[difficulty] || difficulty, 
            count: 0 
          }
          current.count++
          filters.difficulty.set(difficulty, current)
        }

        // Fabric types
        if (product.metadata.recommended_fabrics) {
          const fabrics = Array.isArray(product.metadata.recommended_fabrics)
            ? product.metadata.recommended_fabrics
            : JSON.parse(product.metadata.recommended_fabrics || "[]")
          
          fabrics.forEach((fabric: string) => {
            const labels: Record<string, string> = {
              pamuklu: "Pamuklu",
              viskon: "Viskon",
              polyester: "Polyester",
              likra: "Likralı",
              keten: "Keten",
              denim: "Denim",
              orme: "Örme",
              saten: "Saten",
              ipek: "İpek",
              yun: "Yün",
            }
            const current = filters.fabric.get(fabric) || { 
              label: labels[fabric] || fabric,
              count: 0 
            }
            current.count++
            filters.fabric.set(fabric, current)
          })
        }

        // Pattern type
        if (product.metadata.pattern_type) {
          const patternType = product.metadata.pattern_type
          const labels: Record<string, string> = {
            elbise: "Elbise",
            etek: "Etek",
            pantolon: "Pantolon",
            gomlek: "Gömlek",
            ceket: "Ceket",
            bluz: "Bluz",
            mont: "Mont",
            yelek: "Yelek",
            tulum: "Tulum",
            sort: "Şort",
            kaban: "Kaban",
            trencekot: "Trençkot",
          }
          const current = filters.pattern_type.get(patternType) || {
            label: labels[patternType] || patternType,
            count: 0
          }
          current.count++
          filters.pattern_type.set(patternType, current)
        }

        // Target audience
        if (product.metadata.target_audience) {
          const audience = product.metadata.target_audience
          const labels: Record<string, string> = {
            kadin: "Kadın",
            erkek: "Erkek",
            cocuk: "Çocuk",
            bebek: "Bebek",
            unisex: "Unisex",
          }
          const current = filters.target_audience.get(audience) || {
            label: labels[audience] || audience,
            count: 0
          }
          current.count++
          filters.target_audience.set(audience, current)
        }
      }

      // Price range
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant: any) => {
          if (variant.prices && variant.prices.length > 0) {
            variant.prices.forEach((price: any) => {
              if (price.currency_code === "try" && price.amount) {
                const amount = price.amount / 100 // Convert from cents
                filters.price.min = Math.min(filters.price.min, amount)
                filters.price.max = Math.max(filters.price.max, amount)
              }
            })
          }
        })
      }
    })

    // Convert Maps to arrays for response
    const response = {
      filters: [
        {
          id: "category",
          name: "Kategori",
          type: "checkbox",
          options: Array.from(filters.categories.entries()).map(([value, data]) => ({
            value,
            label: data.label,
            count: data.count,
          })).sort((a, b) => b.count - a.count),
        },
        {
          id: "pattern_type",
          name: "Kalıp Türü",
          type: "checkbox",
          options: Array.from(filters.pattern_type.entries()).map(([value, data]) => ({
            value,
            label: data.label,
            count: data.count,
          })).sort((a, b) => b.count - a.count),
        },
        {
          id: "target_audience",
          name: "Hedef Kitle",
          type: "checkbox",
          options: Array.from(filters.target_audience.entries()).map(([value, data]) => ({
            value,
            label: data.label,
            count: data.count,
          })).sort((a, b) => b.count - a.count),
        },
        {
          id: "size",
          name: "Beden Aralığı",
          type: "checkbox",
          options: Array.from(filters.sizes.entries()).map(([value, data]) => ({
            value,
            label: data.label,
            count: data.count,
          })).sort((a, b) => {
            // Sort sizes numerically
            const aNum = parseInt(a.value) || 999
            const bNum = parseInt(b.value) || 999
            return aNum - bNum
          }),
        },
        {
          id: "difficulty",
          name: "Zorluk Seviyesi",
          type: "checkbox",
          options: Array.from(filters.difficulty.entries()).map(([value, data]) => ({
            value,
            label: data.label,
            count: data.count,
          })),
        },
        {
          id: "fabric",
          name: "Kumaş Tipi",
          type: "checkbox",
          options: Array.from(filters.fabric.entries()).map(([value, data]) => ({
            value,
            label: data.label,
            count: data.count,
          })).sort((a, b) => b.count - a.count),
        },
        {
          id: "price",
          name: "Fiyat Aralığı",
          type: "range",
          min: filters.price.min === Infinity ? 0 : Math.floor(filters.price.min),
          max: filters.price.max === 0 ? 1000 : Math.ceil(filters.price.max),
        },
      ],
      totalProducts: products.length,
    }

    res.json(response)
  } catch (error) {
    console.error("Failed to get product filters:", error)
    res.status(500).json({ 
      error: "Failed to retrieve filters",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
}