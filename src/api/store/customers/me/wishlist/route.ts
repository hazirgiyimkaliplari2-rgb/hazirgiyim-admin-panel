import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import WishlistModuleService from "../../../../../modules/wishlist/service"
import { IProductModuleService } from "@medusajs/framework/types"

// GET /store/customers/me/wishlist - Get customer's wishlist
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    // For now, use a mock customer ID or session-based ID
    // In production, this should come from req.user after authentication
    const customerId = (req as any).user?.customer_id || (req as any).session?.customer_id || "guest"
    
    const wishlistService = req.scope.resolve("wishlist") as WishlistModuleService
    const productService = req.scope.resolve("product") as IProductModuleService
    
    const items = await wishlistService.getCustomerWishlistItems(customerId)
    
    // Fetch product details for each item
    const productIds = items.map(item => item.product_id)
    let products: any[] = []
    
    if (productIds.length > 0) {
      const productData = await productService.listProducts({
        id: productIds
      })
      products = productData
    }
    
    // Map items with product details
    const wishlistWithProducts = items.map(item => {
      const product = products.find(p => p.id === item.product_id)
      return {
        ...item,
        product
      }
    })
    
    res.json({
      items: wishlistWithProducts
    })
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch wishlist",
      message: error.message
    })
  }
}

// POST /store/customers/me/wishlist - Add item to wishlist
const addItemSchema = z.object({
  product_id: z.string(),
  variant_id: z.string().optional()
})

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const validatedData = addItemSchema.parse(req.body)
    const customerId = (req as any).user?.customer_id || (req as any).session?.customer_id || "guest"
    
    const wishlistService = req.scope.resolve("wishlist") as WishlistModuleService
    
    const item = await wishlistService.addItem(
      customerId,
      validatedData.product_id,
      validatedData.variant_id
    )
    
    res.status(201).json({
      item
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        errors: error.errors
      })
    }
    
    res.status(500).json({
      error: "Failed to add item to wishlist",
      message: error.message
    })
  }
}

// DELETE /store/customers/me/wishlist - Clear wishlist
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const customerId = (req as any).user?.customer_id || (req as any).session?.customer_id || "guest"
    const { product_id } = req.query
    
    const wishlistService = req.scope.resolve("wishlist") as WishlistModuleService
    
    if (product_id) {
      // Remove specific item
      await wishlistService.removeItem(customerId, product_id as string)
      res.json({
        message: "Item removed from wishlist"
      })
    } else {
      // Clear entire wishlist
      await wishlistService.clearWishlist(customerId)
      res.json({
        message: "Wishlist cleared"
      })
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to update wishlist",
      message: error.message
    })
  }
}