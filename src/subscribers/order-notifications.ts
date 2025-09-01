import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import ResendNotificationService from "../modules/notification-resend/service"

// Order placed notification
export async function handleOrderPlaced({ 
  event, 
  container 
}: SubscriberArgs<{ id: string }>) {
  const resendService = container.resolve("resendNotificationModule") as ResendNotificationService
  const orderService = container.resolve("order")
  
  try {
    const order = await orderService.retrieveOrder(event.data.id)

    if (!order.email) {
      console.log("No customer email found for order:", order.id)
      return
    }

    // Send order confirmation email
    await resendService.send({
      to: order.email,
      subject: `Sipariş Onayı - #${order.display_id || order.id}`,
      template: "order.placed",
      data: {
        customer_name: order.shipping_address?.first_name || "Değerli Müşterimiz",
        order_id: order.display_id || order.id,
        total: formatPrice(order.total),
        items: order.items?.map(item => ({
          name: (item as any).variant?.product?.title || item.title,
          quantity: item.quantity,
          price: formatPrice(item.unit_price),
          total: formatPrice(item.subtotal)
        })),
        shipping_address: order.shipping_address
      }
    })

    console.log(`Order confirmation email sent to ${order.email}`)
  } catch (error) {
    console.error("Failed to send order confirmation email:", error)
  }
}

// Order shipped notification
export async function handleOrderShipped({ 
  event, 
  container 
}: SubscriberArgs<{ id: string, tracking_number?: string, carrier?: string }>) {
  const resendService = container.resolve("resendNotificationModule") as ResendNotificationService
  const orderService = container.resolve("order")
  
  try {
    const order = await orderService.retrieveOrder(event.data.id)

    if (!order.email) {
      return
    }

    const trackingNumber = event.data.tracking_number
    const carrier = event.data.carrier || "Yurtiçi Kargo"

    await resendService.send({
      to: order.email,
      subject: `Siparişiniz Kargoda - #${order.display_id || order.id}`,
      template: "order.shipped",
      data: {
        customer_name: order.shipping_address?.first_name || "Değerli Müşterimiz",
        order_id: order.display_id || order.id,
        tracking_number: trackingNumber,
        carrier: carrier,
        tracking_link: getTrackingLink(carrier, trackingNumber)
      }
    })

    console.log(`Shipping notification sent to ${order.email}`)
  } catch (error) {
    console.error("Failed to send shipping notification:", error)
  }
}

// Order canceled notification  
export async function handleOrderCanceled({ 
  event, 
  container 
}: SubscriberArgs<{ id: string, reason?: string }>) {
  const resendService = container.resolve("resendNotificationModule") as ResendNotificationService
  const orderService = container.resolve("order")
  
  try {
    const order = await orderService.retrieveOrder(event.data.id)

    if (!order.email) {
      return
    }

    await resendService.send({
      to: order.email,
      subject: `Sipariş İptal Edildi - #${order.display_id || order.id}`,
      template: "order.canceled",
      data: {
        customer_name: order.shipping_address?.first_name || "Değerli Müşterimiz",
        order_id: order.display_id || order.id,
        reason: event.data.reason
      }
    })

    console.log(`Cancellation notification sent to ${order.email}`)
  } catch (error) {
    console.error("Failed to send cancellation notification:", error)
  }
}

// Helper functions
function formatPrice(amount: number | string | any): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount)
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(numAmount / 100)
}

function getTrackingLink(carrier: string, trackingNumber?: string): string {
  if (!trackingNumber) return ""
  
  const links: Record<string, string> = {
    "yurtici": `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${trackingNumber}`,
    "aras": `https://www.araskargo.com.tr/tanimli_kargo_takip.aspx?kargo_takip_no=${trackingNumber}`,
    "mng": `https://www.mngkargo.com.tr/gonderi-takip?kargo_takip_no=${trackingNumber}`,
    "ptt": `https://gonderitakip.ptt.gov.tr/Track/Verify?q=${trackingNumber}`,
    "ups": `https://www.ups.com/track?tracknum=${trackingNumber}`,
    "dhl": `https://www.dhl.com/tr-tr/home/tracking.html?tracking-id=${trackingNumber}`
  }
  
  const carrierKey = carrier.toLowerCase().replace(/[^a-z]/g, '')
  return links[carrierKey] || ""
}

// Subscriber configurations
export const orderPlacedConfig: SubscriberConfig = {
  event: "order.placed",
  context: {
    subscriberId: "order-placed-notification"
  }
}

export const orderShippedConfig: SubscriberConfig = {
  event: ["order.fulfillment_created", "order.shipment_created"],
  context: {
    subscriberId: "order-shipped-notification"
  }
}

export const orderCanceledConfig: SubscriberConfig = {
  event: "order.canceled",
  context: {
    subscriberId: "order-canceled-notification"
  }
}

// Default export for Medusa to recognize the subscribers
export default [
  {
    handler: handleOrderPlaced,
    config: orderPlacedConfig
  },
  {
    handler: handleOrderShipped,
    config: orderShippedConfig
  },
  {
    handler: handleOrderCanceled,
    config: orderCanceledConfig
  }
]