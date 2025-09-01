import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv('production', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: {
      ssl: {
        rejectUnauthorized: false
      }
    },
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    workerMode: process.env.WORKER_MODE === "worker" ? "worker" : "shared",
  },
  modules: {
    translation: {
      resolve: "./src/modules/translation",
    },
    review: {
      resolve: "./src/modules/review",
    },
    wishlist: {
      resolve: "./src/modules/wishlist",
    },
    resendNotificationModule: {
      resolve: "./src/modules/notification-resend",
      options: {
        apiKey: process.env.RESEND_API_KEY!,
        from: process.env.RESEND_FROM!,
        fromName: process.env.RESEND_FROM_NAME
      }
    },
    // Add Stripe when ready
    // stripeProviderService: {
    //   resolve: "@medusajs/payment-stripe",
    //   options: {
    //     apiKey: process.env.STRIPE_API_KEY!,
    //     webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    //   }
    // },
  },
  // Performance optimizations for production
  admin: process.env.DISABLE_ADMIN === 'true' ? undefined : {
    backendUrl: process.env.RAILWAY_STATIC_URL || process.env.BACKEND_URL || "http://localhost:9000"
  }
})