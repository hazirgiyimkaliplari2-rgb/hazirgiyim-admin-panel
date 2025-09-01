import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,
    http: {
      storeCors: process.env.STORE_CORS || '*',
      adminCors: process.env.ADMIN_CORS || '*',
      authCors: process.env.AUTH_CORS || '*',
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  admin: {
    // Enable admin panel for this deployment
    disable: false,
    path: "/"  // Admin panel at root path
  },
  modules: {
    // Core modules with clean v2 configuration
    [Modules.AUTH]: {
      resolve: "@medusajs/auth",
      options: {
        providers: [
          {
            resolve: "@medusajs/auth-emailpass",
            id: "emailpass",
            options: {}
          }
        ]
      }
    },
    [Modules.CACHE]: {
      resolve: "@medusajs/cache-inmemory"
    },
    [Modules.EVENT_BUS]: {
      resolve: "@medusajs/event-bus-local"
    },
    [Modules.WORKFLOW_ENGINE]: {
      resolve: "@medusajs/workflow-engine-inmemory"
    },
    [Modules.FILE]: {
      resolve: "@medusajs/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-local",
            id: "local",
            options: {
              backend_url: process.env.RAILWAY_STATIC_URL || process.env.BACKEND_URL || "http://localhost:9000"
            }
          }
        ]
      }
    },
    [Modules.NOTIFICATION]: {
      resolve: "@medusajs/notification",
      options: {
        providers: []
      }
    },
    [Modules.STOCK_LOCATION]: true,
    [Modules.INVENTORY]: true,
    [Modules.PRODUCT]: true,
    [Modules.PRICING]: true,
    [Modules.PROMOTION]: true,
    [Modules.CUSTOMER]: true,
    [Modules.SALES_CHANNEL]: true,
    [Modules.CART]: true,
    [Modules.ORDER]: true,
    [Modules.STORE]: true,
    [Modules.USER]: {
      resolve: "@medusajs/user",
      options: {
        jwt_secret: process.env.JWT_SECRET || "supersecret"
      }
    },
    [Modules.REGION]: true,
    [Modules.FULFILLMENT]: {
      resolve: "@medusajs/fulfillment",
      options: {
        providers: [
          {
            resolve: "@medusajs/fulfillment-manual",
            id: "manual",
            options: {}
          }
        ]
      }
    },
    // Disable problematic modules
    [Modules.TAX]: false,
    [Modules.PAYMENT]: false,
    [Modules.CURRENCY]: false,
    // Custom modules
    translation: {
      resolve: "./src/modules/translation",
    },
    review: {
      resolve: "./src/modules/review",
    },
    wishlist: {
      resolve: "./src/modules/wishlist",
    },
    // Disable Resend module if API key is not provided
    ...(process.env.RESEND_API_KEY ? {
      resendNotificationModule: {
        resolve: "./src/modules/notification-resend",
        options: {
          apiKey: process.env.RESEND_API_KEY,
          from: process.env.RESEND_FROM || "noreply@example.com",
          fromName: process.env.RESEND_FROM_NAME || "Hazır Giyim"
        }
      }
    } : {})
  }
})
