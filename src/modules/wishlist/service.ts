import { MedusaService } from "@medusajs/framework/utils"
import { Wishlist, WishlistItem } from "./models/wishlist"

export default class WishlistModuleService extends MedusaService({
  Wishlist,
  WishlistItem
}) {
  async getOrCreateWishlist(customerId: string) {
    const wishlists = await this.listWishlists({
      customer_id: customerId
    } as any)
    
    if (wishlists.length > 0) {
      return wishlists[0]
    }
    
    return await this.createWishlists({
      customer_id: customerId
    })
  }
  
  async addItem(customerId: string, productId: string, variantId?: string) {
    const wishlist = await this.getOrCreateWishlist(customerId)
    
    // Check if item already exists
    const existingItems = await this.listWishlistItems({
      wishlist_id: wishlist.id,
      product_id: productId
    } as any)
    
    if (existingItems.length > 0) {
      return existingItems[0]
    }
    
    return await this.createWishlistItems({
      wishlist_id: wishlist.id,
      product_id: productId,
      variant_id: variantId
    })
  }
  
  async removeItem(customerId: string, productId: string) {
    const wishlist = await this.getOrCreateWishlist(customerId)
    
    const items = await this.listWishlistItems({
      wishlist_id: wishlist.id,
      product_id: productId
    } as any)
    
    if (items.length > 0) {
      await this.deleteWishlistItems(items[0].id)
    }
  }
  
  async getCustomerWishlistItems(customerId: string) {
    const wishlist = await this.getOrCreateWishlist(customerId)
    
    return await this.listWishlistItems({
      wishlist_id: wishlist.id,
      order: { created_at: "DESC" }
    } as any)
  }
  
  async clearWishlist(customerId: string) {
    const wishlist = await this.getOrCreateWishlist(customerId)
    
    const items = await this.listWishlistItems({
      wishlist_id: wishlist.id
    } as any)
    
    if (items.length > 0) {
      await this.deleteWishlistItems(items.map(item => item.id))
    }
  }
}