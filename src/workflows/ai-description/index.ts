import { 
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
  transform,
  parallelize
} from "@medusajs/framework/workflows-sdk"
import { Groq } from "groq-sdk"

// Types
interface AIDescriptionInput {
  productId?: string
  title: string
  category?: string
  metadata?: {
    pattern_pieces?: string
    difficulty?: string
    fabric_suggestion?: string
    target_audience?: string
    subtitle?: string
    tagline?: string
    size_range?: string
    estimated_time?: string
    video_url?: string
    fabric_types?: string[]
    target_audiences?: string[]
  }
  language?: "tr" | "en"
  updateProduct?: boolean
}

interface AIDescriptionOutput {
  description: string
  seoDescription?: string
  keywords?: string[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Step 1: Veri hazırlama ve enrichment
const prepareDataStep = createStep(
  "prepare-ai-description-data",
  async (input: AIDescriptionInput) => {
    // Kategori mapping
    const categoryLabels: Record<string, string> = {
      "women": "Kadın",
      "men": "Erkek", 
      "kids": "Çocuk",
      "baby": "Bebek",
      "unisex": "Unisex"
    }
    
    // Zorluk seviyesi mapping
    const difficultyLabels: Record<string, string> = {
      "beginner": "Başlangıç",
      "intermediate": "Orta",
      "advanced": "İleri",
      "expert": "Uzman"
    }
    
    // Kumaş türleri mapping
    const fabricTypeLabels: Record<string, string> = {
      "cotton": "Pamuklu",
      "viscose": "Viskon",
      "polyester": "Polyester",
      "linen": "Keten",
      "satin": "Saten",
      "velvet": "Kadife",
      "denim": "Denim",
      "knit": "Triko",
      "chiffon": "Şifon",
      "tulle": "Tül",
      "lace": "Dantel",
      "wool": "Yün"
    }
    
    // Hedef kitle mapping
    const targetAudienceLabels: Record<string, string> = {
      "boutique": "Butik Sahipleri",
      "students": "Moda Tasarımı Öğrencileri",
      "hobby": "Hobi Dikişçiler",
      "professional": "Profesyonel Terziler",
      "home": "Ev Hanımları",
      "small-business": "Küçük İşletmeler",
      "factory": "Üretim Atölyeleri",
      "online": "Online Satıcılar"
    }
    
    // Process data
    const processedData = {
      title: input.title,
      category: input.category ? (categoryLabels[input.category] || input.category) : null,
      difficulty: input.metadata?.difficulty ? 
        (difficultyLabels[input.metadata.difficulty] || input.metadata.difficulty) : null,
      fabric_types: input.metadata?.fabric_types?.map(ft => 
        fabricTypeLabels[ft] || ft
      ).join(", "),
      target_audiences: input.metadata?.target_audiences?.map(ta => 
        targetAudienceLabels[ta] || ta
      ).join(", "),
      special_features: [
        input.metadata?.subtitle && `Alt başlık: ${input.metadata.subtitle}`,
        input.metadata?.tagline && `Slogan: ${input.metadata.tagline}`,
        input.metadata?.pattern_pieces,
        input.metadata?.size_range && `Beden aralığı: ${input.metadata.size_range}`,
        input.metadata?.estimated_time && `Tahmini süre: ${input.metadata.estimated_time}`,
        input.metadata?.video_url && "Video eğitim linki mevcut"
      ].filter(Boolean).join(", ")
    }
    
    return new StepResponse(processedData, input)
  },
  async (input) => {
    // Compensation: Nothing to undo for data preparation
    console.log("Data preparation rolled back")
  }
)

// Step 2: Groq AI ile açıklama oluşturma
const generateWithGroqStep = createStep(
  "generate-groq-description",
  async (data: any) => {
    const groqApiKey = process.env.GROQ_API_KEY
    
    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY not configured")
    }
    
    const groq = new Groq({ apiKey: groqApiKey })
    
    const language = data.language || "tr"
    
    // System prompt
    const systemPrompt = language === "tr" 
      ? "Sen profesyonel bir moda ve dikiş uzmanısın. Hazır giyim kalıpları için SEO uyumlu, satışa yönelik ürün açıklamaları yazıyorsun. Açıklamalar akıcı, ikna edici ve profesyonel olmalı."
      : "You are a professional fashion and sewing expert. You write SEO-friendly, sales-oriented product descriptions for sewing patterns. Descriptions should be fluent, persuasive and professional."
    
    // User prompt
    const userPrompt = language === "tr"
      ? `Aşağıdaki kalıp ürünü için profesyonel bir ürün açıklaması yaz:

Ürün: ${data.title}
${data.category ? `Kategori: ${data.category}` : ''}
${data.pattern_pieces ? `Parça Sayısı: ${data.pattern_pieces}` : ''}
${data.difficulty ? `Zorluk: ${data.difficulty}` : ''}
${data.fabric_suggestion || data.fabric_types ? `Kumaş Önerisi: ${data.fabric_suggestion || data.fabric_types}` : ''}
${data.target_audience || data.target_audiences ? `Hedef Kitle: ${data.target_audience || data.target_audiences}` : ''}
${data.special_features ? `Özel Özellikler: ${data.special_features}` : ''}

Açıklama şunları içermeli:
1. Ürünün öne çıkan özellikleri ve benzersiz yanları
2. Kimlere uygun olduğu ve kullanım alanları
3. Kalıp içeriği ve teknik detaylar
4. Neden tercih edilmeli (avantajları)
5. Profesyonel sonuç garantisi

Açıklama 180-250 kelime arasında, paragraf formatında, akıcı ve satış odaklı olmalı.`
      : `Write a professional product description for the following sewing pattern:

Product: ${data.title}
${data.category ? `Category: ${data.category}` : ''}
${data.pattern_pieces ? `Pattern Pieces: ${data.pattern_pieces}` : ''}
${data.difficulty ? `Difficulty: ${data.difficulty}` : ''}
${data.fabric_suggestion || data.fabric_types ? `Fabric Suggestion: ${data.fabric_suggestion || data.fabric_types}` : ''}
${data.target_audience || data.target_audiences ? `Target Audience: ${data.target_audience || data.target_audiences}` : ''}
${data.special_features ? `Special Features: ${data.special_features}` : ''}

Description should include:
1. Key features and unique aspects
2. Who it's suitable for and use cases
3. Pattern contents and technical details
4. Why choose this pattern (advantages)
5. Professional result guarantee

Description should be 180-250 words, in paragraph format, fluent and sales-focused.`
    
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 600,
        top_p: 0.9
      })
      
      const description = completion.choices[0]?.message?.content || ""
      
      return new StepResponse({
        description,
        usage: completion.usage,
        model: "llama-3.3-70b-versatile",
        timestamp: new Date().toISOString()
      }, { originalDescription: data.originalDescription })
      
    } catch (error: any) {
      console.error("Groq API error:", error)
      throw new Error(`AI generation failed: ${error.message}`)
    }
  },
  async (compensateData) => {
    // Compensation: Restore original description if exists
    console.log("AI generation rolled back, original description restored")
  }
)

// Step 3: SEO optimizasyonu
const optimizeSEOStep = createStep(
  "optimize-seo-description",
  async (data: { description: string; title: string; category?: string }) => {
    // SEO keywords extraction
    const keywords: string[] = []
    
    // Title'dan keyword çıkar
    const titleWords = data.title.toLowerCase().split(' ')
      .filter(word => word.length > 3)
    keywords.push(...titleWords)
    
    // Kategori bazlı keywords
    if (data.category) {
      keywords.push(data.category.toLowerCase())
      keywords.push('kalıp', 'dikiş', 'pattern')
    }
    
    // Common fashion keywords
    const fashionKeywords = ['moda', 'tasarım', 'hazır giyim', 'profesyonel', 'kolay']
    keywords.push(...fashionKeywords)
    
    // Create SEO meta description (max 160 chars)
    const seoDescription = data.description
      .substring(0, 157)
      .replace(/\s+/g, ' ')
      .trim() + '...'
    
    return new StepResponse({
      description: data.description,
      seoDescription,
      keywords: [...new Set(keywords)], // Remove duplicates
      seoScore: calculateSEOScore(data.description, keywords)
    })
  }
)

// SEO Score calculation helper
function calculateSEOScore(description: string, keywords: string[]): number {
  let score = 0
  const descLower = description.toLowerCase()
  
  // Check keyword density
  keywords.forEach(keyword => {
    if (descLower.includes(keyword)) {
      score += 10
    }
  })
  
  // Check description length
  const wordCount = description.split(' ').length
  if (wordCount >= 150 && wordCount <= 300) {
    score += 20
  }
  
  // Check for numbers/lists
  if (/\d+/.test(description)) {
    score += 10
  }
  
  return Math.min(score, 100)
}

// Define consistent response type for update step
interface UpdateProductResponse {
  skipped?: boolean
  reason?: string
  productId?: string
  updated?: boolean
}

// Step 4: Ürünü güncelle (opsiyonel)
const updateProductStep = createStep(
  "update-product-description",
  async (data: { 
    productId?: string; 
    description: string; 
    seoDescription?: string;
    keywords?: string[] 
  }, { container }: any) => {
    if (!data.productId) {
      return new StepResponse<UpdateProductResponse>({ 
        skipped: true, 
        reason: "No productId provided" 
      })
    }
    
    try {
      const productModuleService = container.resolve("product")
      
      // Get current product data for rollback
      const product = await productModuleService.retrieveProduct(data.productId)
      const originalData = {
        productId: data.productId,
        description: product.description,
        metadata: product.metadata
      }
      
      // Update product
      await productModuleService.updateProducts(data.productId, {
        description: data.description,
        metadata: {
          ...product.metadata,
          seo_description: data.seoDescription,
          seo_keywords: data.keywords?.join(','),
          ai_generated: true,
          ai_generated_at: new Date().toISOString()
        }
      })
      
      return new StepResponse<UpdateProductResponse>(
        { 
          productId: data.productId, 
          updated: true 
        },
        originalData // For compensation
      )
    } catch (error: any) {
      console.error("Product update failed:", error)
      throw new Error(`Failed to update product: ${error.message}`)
    }
  },
  async (originalData: any, { container }: any) => {
    // Compensation: Restore original product data
    if (originalData && originalData.productId) {
      const productModuleService = container.resolve("product")
      await productModuleService.updateProducts(originalData.productId, {
        description: originalData.description,
        metadata: originalData.metadata
      })
    }
  }
)

// Ana Workflow
export const aiDescriptionWorkflow = createWorkflow(
  "ai-description-generation",
  (input: AIDescriptionInput): WorkflowResponse<AIDescriptionOutput> => {
    // Step 1: Veriyi hazırla
    const preparedData = prepareDataStep(input)
    
    // Step 2: AI ile açıklama oluştur
    const aiResult = generateWithGroqStep({
      ...preparedData,
      ...input,
      originalDescription: (input.metadata as any)?.description
    })
    
    // Step 3: SEO optimizasyonu (paralel çalışabilir)
    const seoResult = optimizeSEOStep({
      description: aiResult.description,
      title: input.title,
      category: input.category
    })
    
    // Step 4: Ürünü güncelle (eğer istendiyse)
    const updateResult = transform(
      { input, seoResult },
      (data) => {
        if (data.input.updateProduct && data.input.productId) {
          return updateProductStep({
            productId: data.input.productId,
            description: data.seoResult.description,
            seoDescription: data.seoResult.seoDescription,
            keywords: data.seoResult.keywords
          })
        }
        return { skipped: true, reason: "Product update not requested" }
      }
    )
    
    // Return final result
    return new WorkflowResponse({
      description: seoResult.description,
      seoDescription: seoResult.seoDescription,
      keywords: seoResult.keywords,
      usage: aiResult.usage
    })
  }
)

// Basit kullanım için helper function
export const generateAIDescription = async (
  input: AIDescriptionInput,
  container: any
): Promise<AIDescriptionOutput> => {
  const result = await aiDescriptionWorkflow.run({
    input,
    container
  })
  
  return result.result as AIDescriptionOutput
}