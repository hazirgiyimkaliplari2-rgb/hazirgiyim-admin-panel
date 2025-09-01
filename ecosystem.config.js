module.exports = {
  apps: [
    {
      name: "medusa-backend",
      script: "npm",
      args: "run start:prod",
      instances: process.env.PM2_INSTANCES || 1,
      exec_mode: process.env.PM2_EXEC_MODE || "fork",
      env: {
        NODE_ENV: "production",
        PORT: 9000
      },
      env_production: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 9000
      },
      // Monitoring
      max_memory_restart: "1G",
      min_uptime: "10s",
      max_restarts: 10,
      
      // Logging
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_file: "./logs/pm2-combined.log",
      time: true,
      
      // Advanced features
      watch: false,
      ignore_watch: ["node_modules", ".git", "logs", ".medusa/admin"],
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Auto-restart
      cron_restart: "0 4 * * *", // Restart daily at 4 AM
      
      // Health check
      health_check: {
        interval: 30000,
        url: "http://localhost:9000/health",
        max_consecutive_failures: 3
      }
    }
  ],
  
  deploy: {
    production: {
      user: "deploy",
      host: "your-server.com",
      ref: "origin/main",
      repo: "git@github.com:hazirgiyimkaliplari2-rgb/hazirgiyim-backend.git",
      path: "/var/www/medusa",
      "post-deploy": "npm install && npm run build:prod && pm2 reload ecosystem.config.js --env production",
      "pre-deploy-local": "echo 'Starting deployment...'",
      "post-deploy": "pm2 save && pm2 startup",
      env: {
        NODE_ENV: "production"
      }
    }
  }
}