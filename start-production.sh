#!/bin/bash

# Production environment variables
export DATABASE_URL="postgresql://postgres:mlwPULVjheuUhbAGixInHBeiiHjVhMDh@yamabiko.proxy.rlwy.net:28022/railway"
export DATABASE_PUBLIC_URL="postgresql://postgres:mlwPULVjheuUhbAGixInHBeiiHjVhMDh@yamabiko.proxy.rlwy.net:28022/railway"
export JWT_SECRET="7U/GHYUboEFqlicugpQ0pLhLkzpk+LVncghPxK1Loog="
export COOKIE_SECRET="Snyo90LRQdWI25egm6bXNOybfEGMnVhDDSnddd4De2mM="
export NODE_ENV="production"
export PORT="${PORT:-9000}"

echo "Starting Admin Panel in Production Mode..."
echo "Admin URL: http://localhost:$PORT/"
echo ""

npm run build && npm run start:prod