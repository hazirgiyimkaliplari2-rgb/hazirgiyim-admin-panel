import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// GET /store/products/:handle/metadata
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { handle } = req.params
  
  try {
    const productService = req.scope.resolve("product")
    
    // Get product with metadata
    const [product] = await productService.listProducts(
      { handle },
      {
        relations: ["variants", "images", "options", "categories"],
        take: 1
      }
    )
    
    if (!product) {
      return res.status(404).json({
        error: "Product not found"
      })
    }
    
    // Pattern attributes - gerçek veritabanından
    const patternAttributes = {
      // Temel özellikler
      difficulty: product.metadata?.difficulty || "intermediate",
      size_range: product.metadata?.size_range || "36-52",
      fabric_types: product.metadata?.fabric_types || "cotton,viscose,polyester",
      pattern_pieces: product.metadata?.pattern_pieces || "8-12 parça",
      estimated_time: product.metadata?.estimated_time || "3-4 saat",
      fabric_meterage: product.metadata?.fabric_meterage || "38 beden için 2.5 metre (150cm en)",
      
      // Hedef kitle
      target_audience: product.metadata?.target_audience || "Butik ve atölye sahipleri",
      
      // Teslimat formatı
      delivery_formats: product.metadata?.delivery_formats || "digital-pdf",
      pattern_contents: product.metadata?.pattern_contents || "pattern,size_chart,instructions",
      
      // Kumaş önerisi
      fabric_suggestion: product.metadata?.fabric_suggestion || "Pamuklu, viskon veya polyester kumaşlar",
      
      // Talimatlar dahil mi
      includes_instructions: product.metadata?.includes_instructions !== false,
      
      // Beden tablosu
      size_chart: product.metadata?.size_chart || {
        "36": { bust: 84, waist: 66, hips: 92, length: 110 },
        "38": { bust: 88, waist: 70, hips: 96, length: 112 },
        "40": { bust: 92, waist: 74, hips: 100, length: 114 },
        "42": { bust: 96, waist: 78, hips: 104, length: 116 },
        "44": { bust: 100, waist: 82, hips: 108, length: 118 },
        "46": { bust: 104, waist: 86, hips: 112, length: 120 },
        "48": { bust: 108, waist: 90, hips: 116, length: 122 },
        "50": { bust: 112, waist: 94, hips: 120, length: 124 },
        "52": { bust: 116, waist: 98, hips: 124, length: 126 }
      },
      
      // Ek özellikler
      skill_requirements: product.metadata?.skill_requirements || [
        "Temel dikiş bilgisi",
        "Kalıp okuma becerisi",
        "Ölçü alma deneyimi"
      ],
      
      included_sizes: product.metadata?.included_sizes || ["36", "38", "40", "42", "44", "46", "48", "50", "52"],
      
      pattern_type: product.metadata?.pattern_type || "printed",
      
      video_tutorial: product.metadata?.video_tutorial || false,
      
      support_available: product.metadata?.support_available !== false
    }
    
    // Combine all metadata
    const enrichedMetadata = {
      ...product.metadata,
      pattern_attributes: patternAttributes,
      
      // Kategori bilgileri
      category: product.categories?.[0]?.handle || product.metadata?.category || "women",
      category_name: product.categories?.[0]?.name || "Kadın Giyim",
      
      // Ürün kodu
      product_code: product.metadata?.product_code || `SK${Date.now()}`,
      
      // Etiketler
      tagline: product.metadata?.tagline || "Yeni Sezon",
      subtitle: product.metadata?.subtitle || "Profesyonel Kalıp Serisi"
    }
    
    res.json({
      handle: product.handle,
      title: product.title,
      metadata: enrichedMetadata,
      variants: product.variants,
      images: product.images
    })
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch product metadata",
      message: error.message
    })
  }
}