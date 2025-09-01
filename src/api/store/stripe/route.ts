import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import Stripe from "stripe"

// Only initialize Stripe if API key is provided
const stripeApiKey = process.env.STRIPE_API_KEY
const stripe = stripeApiKey ? new Stripe(stripeApiKey, {
  apiVersion: "2025-07-30.basil" as any
}) : null

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  // Check if Stripe is configured
  if (!stripe) {
    return res.status(503).json({
      error: "Payment service not configured"
    })
  }

  const { cart_id, amount, currency, customer_email } = req.body as any

  if (!cart_id || !amount) {
    return res.status(400).json({
      error: "Missing required parameters"
    })
  }

  try {
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Stripe expects amount in cents
      currency: currency || "try",
      metadata: {
        cart_id,
        integration: "medusa"
      },
      receipt_email: customer_email,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    })
  } catch (error: any) {
    console.error("Stripe payment intent error:", error)
    res.status(500).json({
      error: error.message || "Failed to create payment intent"
    })
  }
}