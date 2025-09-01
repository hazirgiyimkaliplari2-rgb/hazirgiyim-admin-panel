import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import ResendNotificationService from "../modules/notification-resend/service"
import ReviewModuleService from "../modules/review/service"

// Review approved notification
export async function handleReviewApproved({ 
  event, 
  container 
}: SubscriberArgs<{ id: string }>) {
  const resendService = container.resolve("resendNotificationModule") as ResendNotificationService
  const reviewService = container.resolve("review") as ReviewModuleService
  const productService = container.resolve("product")
  
  try {
    const review = await reviewService.retrieveReview(event.data.id)

    if (!review.customer_email) {
      console.log("No customer email found for review:", review.id)
      return
    }

    // Get product details
    const product = await productService.retrieveProduct(review.product_id)

    await resendService.send({
      to: review.customer_email,
      subject: "Yorumunuz Onaylandı! ✅",
      template: "review.approved",
      data: {
        customer_name: review.customer_name || "Değerli Müşterimiz",
        product_name: product.title,
        product_id: product.id,
        rating: review.rating,
        review_title: review.title
      }
    })

    console.log(`Review approval email sent to ${review.customer_email}`)
  } catch (error) {
    console.error("Failed to send review approval email:", error)
  }
}

// Review rejected notification
export async function handleReviewRejected({ 
  event, 
  container 
}: SubscriberArgs<{ id: string, reason?: string }>) {
  const resendService = container.resolve("resendNotificationModule") as ResendNotificationService
  const reviewService = container.resolve("review") as ReviewModuleService
  
  try {
    const review = await reviewService.retrieveReview(event.data.id)

    if (!review.customer_email) {
      return
    }

    await resendService.send({
      to: review.customer_email,
      subject: "Yorumunuz Hakkında",
      html: `
        <p>Merhaba ${review.customer_name || ''},</p>
        <p>Yazdığınız yorum içerik politikalarımıza uygun olmadığı için yayınlanamadı.</p>
        ${event.data.reason ? `<p>Neden: ${event.data.reason}</p>` : ''}
        <p>Yeni bir yorum yazarak tekrar deneyebilirsiniz.</p>
        <p>Anlayışınız için teşekkürler.</p>
      `
    })

    console.log(`Review rejection email sent to ${review.customer_email}`)
  } catch (error) {
    console.error("Failed to send review rejection email:", error)
  }
}

// Admin notification for new review (for moderation)
export async function handleNewReviewForModeration({ 
  event, 
  container 
}: SubscriberArgs<{ id: string }>) {
  const resendService = container.resolve("resendNotificationModule") as ResendNotificationService
  const reviewService = container.resolve("review") as ReviewModuleService
  const productService = container.resolve("product")
  
  // Get admin email from env
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.log("No admin email configured for review moderation")
    return
  }
  
  try {
    const review = await reviewService.retrieveReview(event.data.id)
    const product = await productService.retrieveProduct(review.product_id)

    await resendService.send({
      to: adminEmail,
      subject: `Yeni Yorum Onay Bekliyor - ${product.title}`,
      html: `
        <h2>Yeni Yorum Moderasyon Bekliyor</h2>
        <p><strong>Ürün:</strong> ${product.title}</p>
        <p><strong>Müşteri:</strong> ${review.customer_name} (${review.customer_email})</p>
        <p><strong>Puan:</strong> ${'⭐'.repeat(review.rating)}</p>
        <p><strong>Başlık:</strong> ${review.title}</p>
        <p><strong>Yorum:</strong></p>
        <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin-left: 0;">
          ${review.content}
        </blockquote>
        <p>
          <a href="${process.env.ADMIN_URL}/reviews" style="background: #000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Yorumu İncele
          </a>
        </p>
      `
    })

    console.log(`Moderation notification sent to admin`)
  } catch (error) {
    console.error("Failed to send moderation notification:", error)
  }
}

// Review response notification (when admin responds)
export async function handleReviewResponse({ 
  event, 
  container 
}: SubscriberArgs<{ id: string, response: string }>) {
  const resendService = container.resolve("resendNotificationModule") as ResendNotificationService
  const reviewService = container.resolve("review") as ReviewModuleService
  const productService = container.resolve("product")
  
  try {
    const review = await reviewService.retrieveReview(event.data.id)

    if (!review.customer_email) {
      return
    }

    const product = await productService.retrieveProduct(review.product_id)

    await resendService.send({
      to: review.customer_email,
      subject: `Yorumunuza Yanıt Verildi - ${product.title}`,
      html: `
        <p>Merhaba ${review.customer_name || ''},</p>
        <p>"${product.title}" ürünü için yazdığınız yoruma yanıt verildi:</p>
        
        <div style="background: #f8f8f8; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Sizin Yorumunuz:</strong></p>
          <p>${review.content}</p>
        </div>
        
        <div style="background: #f0f0f0; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Yanıtımız:</strong></p>
          <p>${event.data.response}</p>
        </div>
        
        <p>
          <a href="${process.env.STORE_URL}/products/${product.id}" style="background: #000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Ürünü Görüntüle
          </a>
        </p>
      `
    })

    console.log(`Review response notification sent to ${review.customer_email}`)
  } catch (error) {
    console.error("Failed to send review response notification:", error)
  }
}

// Subscriber configurations
export const reviewApprovedConfig: SubscriberConfig = {
  event: "review.approved",
  context: {
    subscriberId: "review-approved-notification"
  }
}

export const reviewRejectedConfig: SubscriberConfig = {
  event: "review.rejected",
  context: {
    subscriberId: "review-rejected-notification"
  }
}

export const newReviewConfig: SubscriberConfig = {
  event: "review.created",
  context: {
    subscriberId: "review-moderation-notification"
  }
}

export const reviewResponseConfig: SubscriberConfig = {
  event: "review.response_added",
  context: {
    subscriberId: "review-response-notification"
  }
}

// Default export for Medusa to recognize the subscribers
export default [
  {
    handler: handleReviewApproved,
    config: reviewApprovedConfig
  },
  {
    handler: handleReviewRejected,
    config: reviewRejectedConfig
  },
  {
    handler: handleNewReviewForModeration,
    config: newReviewConfig
  },
  {
    handler: handleReviewResponse,
    config: reviewResponseConfig
  }
]