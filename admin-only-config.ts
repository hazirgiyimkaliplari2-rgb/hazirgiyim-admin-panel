import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:mlwPULVjheuUhbAGixInHBeiiHjVhMDh@yamabiko.proxy.rlwy.net:28022/railway",
    http: {
      storeCors: '*',
      adminCors: '*',
      authCors: '*',
      jwtSecret: process.env.JWT_SECRET || "7U/GHYUboEFqlicugpQ0pLhLkzpk+LVncghPxK1Loog=",
      cookieSecret: process.env.COOKIE_SECRET || "Snyo90LRQdWI25egm6bXNOybfEGMnVhDDSnddd4De2mM=",
    }
  },
  admin: {
    disable: false,
    path: "/",
    backendUrl: "https://hazirgiyim-backend-production.up.railway.app"
  }
})