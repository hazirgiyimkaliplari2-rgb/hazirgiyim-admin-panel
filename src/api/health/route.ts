import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import os from "os"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const memoryUsage = process.memoryUsage()
  const loadAvg = os.loadavg()
  
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    node: {
      version: process.version,
      pid: process.pid
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      loadAverage: {
        "1m": loadAvg[0],
        "5m": loadAvg[1],
        "15m": loadAvg[2]
      }
    },
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external
    }
  }
  
  res.status(200).json(health)
}