#!/bin/bash

echo "🚀 Railway Setup Script"
echo "======================"

# PostgreSQL ekleme
echo "📦 PostgreSQL eklemek için:"
echo "railway add komutunu çalıştır ve PostgreSQL seç"
echo ""

# Environment variables
echo "🔐 Environment Variables eklenecek:"
echo "=================================="

railway variables set DATABASE_TYPE="postgres"
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set COOKIE_SECRET="$(openssl rand -base64 32)"
railway variables set STORE_CORS="*"
railway variables set ADMIN_CORS="*" 
railway variables set AUTH_CORS="*"
railway variables set NODE_ENV="production"
railway variables set DISABLE_ADMIN="true"
railway variables set PORT="9000"

echo ""
echo "✅ Variables set edildi!"
echo ""
echo "📝 Şimdi yapılacaklar:"
echo "1. railway add -> Database -> PostgreSQL seç"
echo "2. railway up -> Deploy et"
echo "3. railway open -> Dashboard'u aç"

