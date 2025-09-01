import { MedusaService } from "@medusajs/framework/utils"
import { Review } from "./models/review"

export default class ReviewModuleService extends MedusaService({
  Review
}) {
  // Custom methods can be added here
  
  async getProductReviews(productId: string) {
    return await this.listReviews({
      product_id: productId,
      order: { created_at: "DESC" }
    } as any)
  }
  
  async getReviewStats(productId: string) {
    const reviews = await this.getProductReviews(productId)
    
    const stats = {
      average: 0,
      total: reviews.length,
      distribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      }
    }
    
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
      stats.average = sum / reviews.length
      
      reviews.forEach(review => {
        stats.distribution[review.rating]++
      })
    }
    
    return stats
  }
  
  async incrementHelpful(reviewId: string) {
    const review = await this.retrieveReview(reviewId)
    return await this.updateReviews({ 
      id: reviewId,
      helpful_count: (review.helpful_count || 0) + 1
    })
  }
}