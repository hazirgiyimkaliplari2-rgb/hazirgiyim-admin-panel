import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import ReviewModuleService from "../../../../../modules/review/service"

// POST /store/reviews/:id/helpful - Mark a review as helpful
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  
  try {
    const reviewService = req.scope.resolve("review") as ReviewModuleService
    
    const review = await reviewService.incrementHelpful(id)
    
    res.json({
      review
    })
  } catch (error) {
    res.status(500).json({
      error: "Failed to update review",
      message: error.message
    })
  }
}