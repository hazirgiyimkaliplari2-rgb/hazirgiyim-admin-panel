import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/products/search
 * Filtreleme parametreleri ile ürün arama
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Parse query parameters
    const {
      q, // Search query
      category, // Category filter (comma-separated)
      pattern_type, // Pattern type filter
      target_audience, // Target audience filter
      size, // Size filter (comma-separated)
      difficulty, // Difficulty filter
      fabric, // Fabric filter (comma-separated)
      min_price, // Minimum price
      max_price, // Maximum price
      sort = "created_at", // Sort field
      order = "DESC", // Sort order
      limit = 20,
      offset = 0,
    } = req.query as any

    // Build filters object
    const filters: any = {
      status: "published",
    }

    // Category filter
    if (category) {
      const categories = category.split(",")
      // Get category IDs from handles
      const { data: categoryData } = await query.graph({
        entity: "product_category",
        fields: ["id", "handle"],
        filters: {
          handle: categories,
        },
      })
      
      if (categoryData.length > 0) {
        filters.category_id = categoryData.map((c: any) => c.id)
      }
    }

    // Search query
    if (q) {
      filters.$or = [
        { title: { $ilike: `%${q}%` } },
        { description: { $ilike: `%${q}%` } },
      ]
    }

    // Get all products first (we'll filter metadata client-side for now)
    const { data: allProducts } = await query.graph({
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
        "created_at",
        "updated_at",
        "categories.id",
        "categories.name",
        "categories.handle",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.prices.id",
        "variants.prices.amount",
        "variants.prices.currency_code",
        "images.id",
        "images.url",
        "collection.id",
        "collection.title",
        "tags.id",
        "tags.value",
      ],
      filters,
    })

    // Apply metadata filters
    let filteredProducts = allProducts

    // Pattern type filter
    if (pattern_type) {
      const types = pattern_type.split(",")
      filteredProducts = filteredProducts.filter((p: any) => 
        p.metadata?.pattern_type && types.includes(p.metadata.pattern_type)
      )
    }

    // Target audience filter
    if (target_audience) {
      const audiences = target_audience.split(",")
      filteredProducts = filteredProducts.filter((p: any) =>
        p.metadata?.target_audience && audiences.includes(p.metadata.target_audience)
      )
    }

    // Size filter
    if (size) {
      const sizes = size.split(",")
      filteredProducts = filteredProducts.filter((p: any) => {
        if (!p.metadata?.available_sizes) return false
        
        const availableSizes = Array.isArray(p.metadata.available_sizes)
          ? p.metadata.available_sizes
          : JSON.parse(p.metadata.available_sizes || "[]")
        
        return sizes.some(s => availableSizes.includes(s))
      })
    }

    // Difficulty filter
    if (difficulty) {
      const difficulties = difficulty.split(",")
      filteredProducts = filteredProducts.filter((p: any) =>
        p.metadata?.difficulty_level && difficulties.includes(p.metadata.difficulty_level)
      )
    }

    // Fabric filter
    if (fabric) {
      const fabrics = fabric.split(",")
      filteredProducts = filteredProducts.filter((p: any) => {
        if (!p.metadata?.recommended_fabrics) return false
        
        const recommendedFabrics = Array.isArray(p.metadata.recommended_fabrics)
          ? p.metadata.recommended_fabrics
          : JSON.parse(p.metadata.recommended_fabrics || "[]")
        
        return fabrics.some(f => recommendedFabrics.includes(f))
      })
    }

    // Price filter
    if (min_price || max_price) {
      filteredProducts = filteredProducts.filter((p: any) => {
        if (!p.variants || p.variants.length === 0) return false
        
        // Get the minimum price from all variants
        let productPrice = Infinity
        p.variants.forEach((variant: any) => {
          if (variant.prices && variant.prices.length > 0) {
            variant.prices.forEach((price: any) => {
              if (price.currency_code === "try" && price.amount) {
                const amount = price.amount / 100 // Convert from cents
                productPrice = Math.min(productPrice, amount)
              }
            })
          }
        })
        
        if (productPrice === Infinity) return false
        
        if (min_price && productPrice < parseFloat(min_price)) return false
        if (max_price && productPrice > parseFloat(max_price)) return false
        
        return true
      })
    }

    // Sort products
    filteredProducts.sort((a: any, b: any) => {
      let compareValue = 0
      
      switch (sort) {
        case "price":
          // Get minimum price for each product
          const getMinPrice = (product: any) => {
            let minPrice = Infinity
            product.variants?.forEach((v: any) => {
              v.prices?.forEach((p: any) => {
                if (p.currency_code === "try") {
                  minPrice = Math.min(minPrice, p.amount)
                }
              })
            })
            return minPrice === Infinity ? 0 : minPrice
          }
          
          compareValue = getMinPrice(a) - getMinPrice(b)
          break
          
        case "title":
          compareValue = a.title.localeCompare(b.title, "tr")
          break
          
        case "created_at":
        default:
          compareValue = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      
      return order === "ASC" ? compareValue : -compareValue
    })

    // Apply pagination
    const paginatedProducts = filteredProducts.slice(
      parseInt(offset as string),
      parseInt(offset as string) + parseInt(limit as string)
    )

    // Build response
    const response = {
      products: paginatedProducts.map((product: any) => ({
        ...product,
        // Add computed price range
        price_range: (() => {
          const prices: number[] = []
          product.variants?.forEach((v: any) => {
            v.prices?.forEach((p: any) => {
              if (p.currency_code === "try") {
                prices.push(p.amount / 100)
              }
            })
          })
          
          if (prices.length === 0) return null
          
          return {
            min: Math.min(...prices),
            max: Math.max(...prices),
            currency: "TRY",
          }
        })(),
      })),
      count: paginatedProducts.length,
      total: filteredProducts.length,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      filters: {
        category,
        pattern_type,
        target_audience,
        size,
        difficulty,
        fabric,
        min_price,
        max_price,
        q,
      },
    }

    res.json(response)
  } catch (error) {
    console.error("Product search error:", error)
    res.status(500).json({
      error: "Failed to search products",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
}