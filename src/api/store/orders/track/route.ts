import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService } from "@medusajs/framework/types"
import { z } from "zod"

// GET /store/orders/track - Track an order
const trackOrderSchema = z.object({
  order_number: z.string().min(1),
  email: z.string().email()
})

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    // Validate query parameters
    const validatedData = trackOrderSchema.parse(req.query)
    
    const orderService = req.scope.resolve("order") as IOrderModuleService
    
    // Find order by display ID and email
    const orders = await orderService.listOrders({
      display_id: validatedData.order_number,
      email: validatedData.email
    } as any)
    
    if (orders.length === 0) {
      return res.status(404).json({
        error: "Order not found",
        message: "No order found with the provided order number and email"
      })
    }
    
    const order = orders[0]
    
    // Format tracking information
    const trackingInfo = {
      orderNumber: order.display_id,
      orderDate: order.created_at,
      estimatedDelivery: calculateEstimatedDelivery(order.created_at as Date),
      currentStatus: mapOrderStatus(order.status),
      trackingNumber: order.metadata?.tracking_number || null,
      carrier: order.metadata?.carrier || null,
      statuses: getOrderStatuses(order),
      shippingAddress: order.shipping_address,
      items: order.items?.map(item => ({
        id: item.id,
        title: item.title,
        variant: item.variant_title,
        quantity: item.quantity,
        price: item.unit_price,
        currency: order.currency_code,
        thumbnail: item.thumbnail
      })) || [],
      totalAmount: order.total,
      currency: order.currency_code
    }
    
    res.json(trackingInfo)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        errors: error.errors
      })
    }
    
    res.status(500).json({
      error: "Failed to track order",
      message: error.message
    })
  }
}

// Helper functions
function calculateEstimatedDelivery(orderDate: Date | string): string {
  const delivery = new Date(orderDate)
  delivery.setDate(delivery.getDate() + 5) // Add 5 business days
  return delivery.toISOString().split('T')[0]
}

function mapOrderStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'pending': 'pending',
    'confirmed': 'processing',
    'shipped': 'shipped',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'requires_action': 'pending'
  }
  return statusMap[status] || 'pending'
}

function getOrderStatuses(order: any): any[] {
  const statuses: any[] = []
  const createdDate = new Date(order.created_at)
  
  statuses.push({
    status: 'pending',
    date: createdDate.toISOString(),
    description: 'Siparişiniz alındı',
    completed: true
  })
  
  if (['confirmed', 'shipped', 'delivered'].includes(order.status)) {
    const confirmedDate = new Date(createdDate)
    confirmedDate.setHours(confirmedDate.getHours() + 2)
    statuses.push({
      status: 'processing',
      date: confirmedDate.toISOString(),
      description: 'Siparişiniz hazırlanıyor',
      completed: true
    })
  }
  
  if (['shipped', 'delivered'].includes(order.status)) {
    const shippedDate = new Date(createdDate)
    shippedDate.setDate(shippedDate.getDate() + 1)
    statuses.push({
      status: 'shipped',
      date: shippedDate.toISOString(),
      description: 'Siparişiniz kargoya verildi',
      completed: true
    })
  }
  
  if (order.status === 'delivered') {
    const deliveredDate = new Date(order.updated_at)
    statuses.push({
      status: 'delivered',
      date: deliveredDate.toISOString(),
      description: 'Siparişiniz teslim edildi',
      completed: true
    })
  } else {
    statuses.push({
      status: 'delivered',
      date: '',
      description: 'Teslim edilecek',
      completed: false
    })
  }
  
  return statuses
}