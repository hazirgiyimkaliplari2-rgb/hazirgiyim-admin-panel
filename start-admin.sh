#!/bin/bash

# Railway production database URL'ini kullan
export DATABASE_URL="postgresql://postgres:mlwPULVjheuUhbAGixInHBeiiHjVhMDh@yamabiko.proxy.rlwy.net:28022/railway"
export DATABASE_PUBLIC_URL="postgresql://postgres:mlwPULVjheuUhbAGixInHBeiiHjVhMDh@yamabiko.proxy.rlwy.net:28022/railway"

# Admin panel'i aktif et
export DISABLE_ADMIN=false

# Development modunda başlat
echo "Starting Medusa Admin Panel..."
echo "Admin URL: http://localhost:9000/app"
echo "Login: admin@hazirgiyim.com / Admin123!"
echo ""

npx medusa develop