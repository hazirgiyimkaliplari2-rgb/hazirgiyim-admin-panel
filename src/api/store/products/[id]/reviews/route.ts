import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import ReviewModuleService from "../../../../../modules/review/service"

// GET /store/products/:id/reviews - Get all reviews for a product
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  
  try {
    const reviewService = req.scope.resolve("reviewModuleService") as ReviewModuleService
    
    // Only get approved reviews for store
    const reviews = await reviewService.getProductReviews(id)
    const stats = await reviewService.getReviewStats(id)
    
    res.json({
      reviews,
      stats
    })
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch reviews",
      message: error.message
    })
  }
}

// POST /store/products/:id/reviews - Create a new review
const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(1000),
  customer_name: z.string().min(1).max(50),
  customer_email: z.string().email(),
  verified_purchase: z.boolean().optional(),
  images: z.array(z.string()).optional()
})

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  
  try {
    // Validate request body
    const validatedData = createReviewSchema.parse(req.body)
    
    const reviewService = req.scope.resolve("reviewModuleService") as ReviewModuleService
    
    // Check if customer already reviewed this product
    const existingReviews = await reviewService.listReviews({
      product_id: id,
      customer_email: validatedData.customer_email
    } as any)
    
    if (existingReviews.length > 0) {
      return res.status(400).json({
        error: "You have already reviewed this product"
      })
    }
    
    // Create the review (starts as pending for moderation)
    const review = await reviewService.createReviews({
      product_id: id,
      customer_id: (req as any).user?.customer_id || null,
      rating: validatedData.rating,
      title: validatedData.title,
      content: validatedData.content,
      customer_name: validatedData.customer_name,
      customer_email: validatedData.customer_email,
      verified_purchase: validatedData.verified_purchase || false,
      status: "pending", // New reviews start as pending
      images: validatedData.images || {} as any
    })
    
    res.status(201).json({
      review
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        errors: error.errors
      })
    }
    
    res.status(500).json({
      error: "Failed to create review",
      message: error.message
    })
  }
}