import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import ResendNotificationService from "../modules/notification-resend/service"

// Customer created (welcome email)
export async function handleCustomerCreated({ 
  event, 
  container 
}: SubscriberArgs<{ id: string }>) {
  const resendService = container.resolve("resendNotificationModule") as ResendNotificationService
  const customerService = container.resolve("customer")
  
  try {
    const customer = await customerService.retrieveCustomer(event.data.id)

    if (!customer.email) {
      console.log("No email found for customer:", customer.id)
      return
    }

    // Send welcome email
    await resendService.send({
      to: customer.email,
      subject: "Hazır Giyim'e Hoş Geldiniz! 🎊",
      template: "customer.created",
      data: {
        customer_name: customer.first_name || "Değerli Müşterimiz",
        customer_email: customer.email
      }
    })

    console.log(`Welcome email sent to ${customer.email}`)
  } catch (error) {
    console.error("Failed to send welcome email:", error)
  }
}

// Password reset request
export async function handlePasswordReset({ 
  event, 
  container 
}: SubscriberArgs<{ email: string, token: string }>) {
  const resendService = container.resolve("resendNotificationModule") as ResendNotificationService
  
  try {
    const resetLink = `${process.env.STORE_URL}/reset-password?token=${event.data.token}`

    await resendService.send({
      to: event.data.email,
      subject: "Şifre Sıfırlama Talebi",
      template: "password.reset",
      data: {
        reset_link: resetLink
      }
    })

    console.log(`Password reset email sent to ${event.data.email}`)
  } catch (error) {
    console.error("Failed to send password reset email:", error)
  }
}

// Customer updated (email change notification)
export async function handleCustomerUpdated({ 
  event, 
  container 
}: SubscriberArgs<{ id: string, email?: string, old_email?: string }>) {
  const resendService = container.resolve("resendNotificationModule") as ResendNotificationService
  const customerService = container.resolve("customer")
  
  try {
    // Only send if email was changed
    if (!event.data.old_email || event.data.email === event.data.old_email) {
      return
    }

    const customer = await customerService.retrieveCustomer(event.data.id)

    // Notify old email about the change
    if (event.data.old_email) {
      await resendService.send({
        to: event.data.old_email,
        subject: "Email Adresiniz Değiştirildi",
        html: `
          <p>Merhaba,</p>
          <p>Hesabınızdaki email adresi değiştirildi.</p>
          <p>Yeni email: ${customer.email}</p>
          <p>Eğer bu değişikliği siz yapmadıysanız, lütfen hemen bizimle iletişime geçin.</p>
        `
      })
    }

    // Notify new email
    if (customer.email) {
      await resendService.send({
        to: customer.email,
        subject: "Email Adresiniz Güncellendi",
        html: `
          <p>Merhaba ${customer.first_name || ''},</p>
          <p>Email adresiniz başarıyla güncellendi.</p>
          <p>Artık bu email adresi ile giriş yapabilirsiniz.</p>
        `
      })
    }

    console.log(`Email change notification sent`)
  } catch (error) {
    console.error("Failed to send email change notification:", error)
  }
}

// Subscriber configurations
export const customerCreatedConfig: SubscriberConfig = {
  event: "customer.created",
  context: {
    subscriberId: "customer-welcome-email"
  }
}

export const passwordResetConfig: SubscriberConfig = {
  event: "auth.password_reset_requested",
  context: {
    subscriberId: "password-reset-email"
  }
}

export const customerUpdatedConfig: SubscriberConfig = {
  event: "customer.updated",
  context: {
    subscriberId: "customer-updated-email"
  }
}

// Default export for Medusa to recognize the subscribers
export default [
  {
    handler: handleCustomerCreated,
    config: customerCreatedConfig
  },
  {
    handler: handlePasswordReset,
    config: passwordResetConfig
  },
  {
    handler: handleCustomerUpdated,
    config: customerUpdatedConfig
  }
]