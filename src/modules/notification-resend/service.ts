import { AbstractNotificationProviderService } from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"
import { Resend } from "resend"

type ResendOptions = {
  apiKey: string
  from: string
  fromName?: string
}

type EmailData = {
  to: string
  subject: string
  html?: string
  text?: string
  template?: string
  data?: Record<string, any>
}

export default class ResendNotificationService extends AbstractNotificationProviderService {
  protected resend: Resend
  protected logger_: Logger
  protected from: string
  protected fromName?: string

  constructor(container: Record<string, any>, options: ResendOptions) {
    super()
    
    this.logger_ = container.logger
    this.resend = new Resend(options.apiKey)
    this.from = options.from
    this.fromName = options.fromName
  }

  async send(notification: any): Promise<any> {
    try {
      const fromAddress = this.fromName 
        ? `${this.fromName} <${this.from}>` 
        : this.from

      // Generate HTML content based on template
      const htmlContent = this.generateEmailTemplate(notification)

      const result = await this.resend.emails.send({
        from: fromAddress,
        to: notification.to,
        subject: notification.subject,
        html: htmlContent,
        text: notification.text,
      })

      this.logger_.info(`Email sent successfully to ${notification.to}`)
      return result
    } catch (error) {
      this.logger_.error(`Failed to send email: ${error.message}`)
      throw error
    }
  }

  private generateEmailTemplate(notification: EmailData): string {
    const { template, data = {} } = notification

    // Default styles
    const styles = `
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #000; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        .order-details { background: #f8f8f8; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .item-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
      </style>
    `

    switch (template) {
      case "order.placed":
        return `
          <!DOCTYPE html>
          <html>
          <head>${styles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Siparişiniz Alındı!</h1>
              </div>
              <div class="content">
                <p>Merhaba ${data.customer_name},</p>
                <p>Siparişiniz başarıyla alındı. Ürününüzü en kısa sürede hazırlayıp kargoya vereceğiz.</p>
                
                <div class="order-details">
                  <h3>Sipariş Detayları</h3>
                  <p><strong>Sipariş No:</strong> #${data.order_id}</p>
                  <p><strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
                  <p><strong>Toplam:</strong> ${data.total}</p>
                </div>

                <a href="${process.env.STORE_URL}/account/orders/${data.order_id}" class="button">Siparişi Görüntüle</a>
                
                <p>Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.</p>
              </div>
              <div class="footer">
                <p>© 2025 Hazır Giyim. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
        `

      case "order.shipped":
        return `
          <!DOCTYPE html>
          <html>
          <head>${styles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📦 Siparişiniz Kargoda!</h1>
              </div>
              <div class="content">
                <p>Merhaba ${data.customer_name},</p>
                <p>Siparişiniz kargoya verildi ve yolda! Takip numaranız ile kargonuzun durumunu kontrol edebilirsiniz.</p>
                
                <div class="order-details">
                  <h3>Kargo Bilgileri</h3>
                  <p><strong>Sipariş No:</strong> #${data.order_id}</p>
                  <p><strong>Kargo Firması:</strong> ${data.carrier || 'Yurtiçi Kargo'}</p>
                  <p><strong>Takip No:</strong> ${data.tracking_number || 'Henüz atanmadı'}</p>
                </div>

                ${data.tracking_number ? `
                  <a href="${data.tracking_link}" class="button">Kargo Takibi</a>
                ` : ''}
                
                <p>Tahmini teslimat süresi 2-3 iş günüdür.</p>
              </div>
              <div class="footer">
                <p>© 2025 Hazır Giyim. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
        `

      case "customer.created":
        return `
          <!DOCTYPE html>
          <html>
          <head>${styles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎊 Hoş Geldiniz!</h1>
              </div>
              <div class="content">
                <p>Merhaba ${data.customer_name},</p>
                <p>Hazır Giyim ailesine hoş geldiniz! Hesabınız başarıyla oluşturuldu.</p>
                
                <p>Özel kalıp koleksiyonumuzu keşfetmeye hazır mısınız? Size özel ilk alışverişinizde geçerli <strong>%10 indirim</strong> kodunuz:</p>
                
                <div style="background: #f0f0f0; padding: 15px; border-radius: 4px; text-align: center; margin: 20px 0;">
                  <h2 style="margin: 0; color: #000;">HOSGELDIN10</h2>
                </div>

                <a href="${process.env.STORE_URL}/patterns" class="button">Kalıpları Keşfet</a>
                
                <h3>Neler Yapabilirsiniz?</h3>
                <ul>
                  <li>✂️ Binlerce dikiş kalıbına erişim</li>
                  <li>📏 Detaylı ölçü tabloları</li>
                  <li>🎥 Video anlatımlar</li>
                  <li>💬 Yorumlar ve değerlendirmeler</li>
                  <li>❤️ Favori listeniz</li>
                </ul>
              </div>
              <div class="footer">
                <p>© 2025 Hazır Giyim. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
        `

      case "password.reset":
        return `
          <!DOCTYPE html>
          <html>
          <head>${styles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Şifre Sıfırlama</h1>
              </div>
              <div class="content">
                <p>Merhaba,</p>
                <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.</p>
                
                <a href="${data.reset_link}" class="button">Şifremi Sıfırla</a>
                
                <p style="color: #666; font-size: 14px;">Bu link 1 saat içinde geçerliliğini yitirecektir.</p>
                
                <p style="color: #666; font-size: 14px;">Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
              </div>
              <div class="footer">
                <p>© 2025 Hazır Giyim. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
        `

      case "review.approved":
        return `
          <!DOCTYPE html>
          <html>
          <head>${styles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Yorumunuz Onaylandı!</h1>
              </div>
              <div class="content">
                <p>Merhaba ${data.customer_name},</p>
                <p>Değerli görüşlerinizi bizimle paylaştığınız için teşekkür ederiz! Yorumunuz onaylandı ve yayında.</p>
                
                <div class="order-details">
                  <h3>Yorum Detayları</h3>
                  <p><strong>Ürün:</strong> ${data.product_name}</p>
                  <p><strong>Puan:</strong> ${'⭐'.repeat(data.rating)}</p>
                  <p><strong>Başlık:</strong> ${data.review_title}</p>
                </div>

                <a href="${process.env.STORE_URL}/products/${data.product_id}" class="button">Yorumu Görüntüle</a>
                
                <p>Yorumunuz diğer müşterilere yardımcı olacak. Tekrar teşekkürler!</p>
              </div>
              <div class="footer">
                <p>© 2025 Hazır Giyim. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
        `

      case "order.canceled":
        return `
          <!DOCTYPE html>
          <html>
          <head>${styles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>❌ Sipariş İptal Edildi</h1>
              </div>
              <div class="content">
                <p>Merhaba ${data.customer_name},</p>
                <p>#${data.order_id} numaralı siparişiniz iptal edildi.</p>
                
                ${data.reason ? `<p><strong>İptal Nedeni:</strong> ${data.reason}</p>` : ''}
                
                <p>Ödemeniz alındıysa, 3-5 iş günü içinde kartınıza iade edilecektir.</p>
                
                <p>Herhangi bir sorunuz varsa bizimle iletişime geçebilirsiniz.</p>

                <a href="${process.env.STORE_URL}/contact" class="button">İletişim</a>
              </div>
              <div class="footer">
                <p>© 2025 Hazır Giyim. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
        `

      default:
        // Fallback to custom HTML if provided
        return notification.html || `
          <!DOCTYPE html>
          <html>
          <head>${styles}</head>
          <body>
            <div class="container">
              <div class="content">
                ${notification.html || notification.text || ''}
              </div>
              <div class="footer">
                <p>© 2025 Hazır Giyim. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
        `
    }
  }
}