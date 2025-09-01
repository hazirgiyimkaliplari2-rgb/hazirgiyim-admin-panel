#!/bin/bash

# Hızlı deployment script'i
# Kullanım: ./scripts/quick-deploy.sh

echo "🚀 Hazirgiyim Backend - Quick Deployment"
echo "========================================="

# Renklendirme
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Environment kontrolü
if [ -z "$1" ]; then
  ENV="production"
else
  ENV=$1
fi

echo -e "${YELLOW}📍 Deployment environment: $ENV${NC}"

# Confirmation
read -p "Deploy etmek istediğine emin misin? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}❌ Deploy iptal edildi${NC}"
  exit 1
fi

# Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
echo "🕐 Deploy zamanı: $TIMESTAMP"

# Step 1: Git operations
echo -e "\n${YELLOW}1️⃣ Git güncellemeleri alınıyor...${NC}"
git fetch origin
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${RED}⚠️ Uyarı: main branch'te değilsin!${NC}"
  read -p "Devam etmek istiyor musun? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

git pull origin $CURRENT_BRANCH || {
  echo -e "${RED}❌ Git pull başarısız!${NC}"
  exit 1
}

# Step 2: Dependencies
echo -e "\n${YELLOW}2️⃣ Dependencies yükleniyor...${NC}"
npm ci --production=false || {
  echo -e "${RED}❌ npm ci başarısız!${NC}"
  exit 1
}

# Step 3: Build
echo -e "\n${YELLOW}3️⃣ Production build yapılıyor...${NC}"
npm run build || {
  echo -e "${RED}❌ Build başarısız!${NC}"
  exit 1
}

# Step 4: Database migrations
echo -e "\n${YELLOW}4️⃣ Database migration'ları çalıştırılıyor...${NC}"
npx medusa migrations run || {
  echo -e "${RED}⚠️ Migration başarısız! Rollback gerekebilir${NC}"
  read -p "Devam etmek istiyor musun? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
}

# Step 5: Admin build
echo -e "\n${YELLOW}5️⃣ Admin panel build ediliyor...${NC}"
npx medusa admin build || {
  echo -e "${YELLOW}⚠️ Admin build başarısız (kritik değil)${NC}"
}

# Step 6: Server restart
echo -e "\n${YELLOW}6️⃣ Server yeniden başlatılıyor...${NC}"

# PM2 kullanılıyorsa
if command -v pm2 &> /dev/null; then
  pm2 reload medusa --update-env || {
    echo -e "${YELLOW}PM2 reload başarısız, restart deneniyor...${NC}"
    pm2 restart medusa
  }
# Systemd kullanılıyorsa
elif systemctl is-active --quiet medusa; then
  sudo systemctl restart medusa
# Railway/Render otomatik restart yapar
else
  echo -e "${GREEN}✓ Platform otomatik restart yapacak${NC}"
fi

# Step 7: Health check
echo -e "\n${YELLOW}7️⃣ Health check yapılıyor...${NC}"
sleep 5

# Backend URL'i environment'tan al veya default kullan
BACKEND_URL=${BACKEND_URL:-"http://localhost:9000"}

if curl -f -s "${BACKEND_URL}/health" > /dev/null; then
  echo -e "${GREEN}✅ Health check başarılı!${NC}"
else
  echo -e "${RED}⚠️ Health check başarısız! Backend yanıt vermiyor${NC}"
fi

# Step 8: Version bilgisi
echo -e "\n${YELLOW}📦 Version bilgileri:${NC}"
PACKAGE_VERSION=$(node -p "require('./package.json').version")
GIT_COMMIT=$(git rev-parse --short HEAD)
echo "Package version: $PACKAGE_VERSION"
echo "Git commit: $GIT_COMMIT"

# Step 9: Deployment log
echo -e "\n${YELLOW}📝 Deployment log kaydediliyor...${NC}"
mkdir -p logs/deployments
cat << EOF > "logs/deployments/deploy_${TIMESTAMP}.log"
Deployment Date: $(date)
Environment: $ENV
Package Version: $PACKAGE_VERSION
Git Branch: $CURRENT_BRANCH
Git Commit: $GIT_COMMIT
Deployed By: $(whoami)
Status: SUCCESS
EOF

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ DEPLOYMENT BAŞARILI!${NC}"
echo -e "${GREEN}=========================================${NC}"

# Opsiyonel: Slack/Discord notification
if [ ! -z "$NOTIFICATION_WEBHOOK" ]; then
  curl -X POST $NOTIFICATION_WEBHOOK \
    -H "Content-Type: application/json" \
    -d "{
      \"content\": \"✅ **Deployment Başarılı**\n\`\`\`Version: $PACKAGE_VERSION\nCommit: $GIT_COMMIT\nEnvironment: $ENV\`\`\`\"
    }" 2>/dev/null
fi

echo -e "\n💡 ${YELLOW}İpucu: Sorun yaşarsan ${NC}${GREEN}./scripts/rollback.sh${NC}${YELLOW} ile geri alabilirsin${NC}"