import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import Stripe from "stripe"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  // Check if Stripe is configured
  const stripeApiKey = process.env.STRIPE_API_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  
  if (!stripeApiKey || !webhookSecret) {
    return res.status(503).json({
      error: "Webhook service not configured"
    })
  }
  
  const stripe = new Stripe(stripeApiKey, {
    apiVersion: "2025-07-30.basil" as any
  })
  
  const sig = req.headers["stripe-signature"] as string

  let event: Stripe.Event

  try {
    const body = await (req as any).text()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log(`PaymentIntent ${paymentIntent.id} was successful!`)
      // Handle successful payment
      break
    
    case "payment_intent.payment_failed":
      const failedPayment = event.data.object as Stripe.PaymentIntent
      console.log(`PaymentIntent ${failedPayment.id} failed.`)
      // Handle failed payment
      break
    
    case "charge.succeeded":
      const charge = event.data.object as Stripe.Charge
      console.log(`Charge ${charge.id} was successful!`)
      // Handle successful charge
      break
    
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session
      console.log(`Checkout session ${session.id} completed!`)
      // Handle completed checkout session
      break
    
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true })
}