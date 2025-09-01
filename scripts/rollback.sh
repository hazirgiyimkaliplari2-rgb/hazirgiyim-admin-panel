#!/bin/bash

# Rollback script - Bir önceki versiyona geri dön
# Kullanım: ./scripts/rollback.sh

echo "⚠️  Hazirgiyim Backend - Emergency Rollback"
echo "==========================================="

# Renklendirme
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Confirmation
echo -e "${RED}DİKKAT: Bu işlem son deployment'ı geri alacak!${NC}"
read -p "Rollback yapmak istediğine emin misin? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Rollback iptal edildi${NC}"
  exit 0
fi

# Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Step 1: Current state backup
echo -e "\n${YELLOW}1️⃣ Mevcut durum yedekleniyor...${NC}"
git stash push -m "rollback_backup_$TIMESTAMP"

# Step 2: Previous commit
echo -e "\n${YELLOW}2️⃣ Önceki commit'e dönülüyor...${NC}"
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "Current commit: $CURRENT_COMMIT"

git reset --hard HEAD~1 || {
  echo -e "${RED}❌ Git reset başarısız!${NC}"
  git stash pop
  exit 1
}

ROLLBACK_COMMIT=$(git rev-parse HEAD)
echo "Rolled back to: $ROLLBACK_COMMIT"

# Step 3: Dependencies restore
echo -e "\n${YELLOW}3️⃣ Dependencies geri yükleniyor...${NC}"
npm ci --production=false || {
  echo -e "${RED}❌ npm ci başarısız!${NC}"
  exit 1
}

# Step 4: Build
echo -e "\n${YELLOW}4️⃣ Build yapılıyor...${NC}"
npm run build || {
  echo -e "${RED}❌ Build başarısız!${NC}"
  exit 1
}

# Step 5: Database considerations
echo -e "\n${YELLOW}5️⃣ Database durumu kontrol ediliyor...${NC}"
echo -e "${YELLOW}⚠️ UYARI: Database migration'ları otomatik geri alınmıyor!${NC}"
echo "Eğer database değişikliği yapıldıysa manuel müdahale gerekebilir."
read -p "Devam etmek istiyor musun? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Rollback durduruluyor. Manuel müdahale gerekiyor."
  exit 1
fi

# Step 6: Server restart
echo -e "\n${YELLOW}6️⃣ Server yeniden başlatılıyor...${NC}"

# PM2 kullanılıyorsa
if command -v pm2 &> /dev/null; then
  pm2 restart medusa || {
    echo -e "${RED}❌ PM2 restart başarısız!${NC}"
    exit 1
  }
# Systemd kullanılıyorsa
elif systemctl is-active --quiet medusa; then
  sudo systemctl restart medusa
else
  echo -e "${GREEN}✓ Platform otomatik restart yapacak${NC}"
fi

# Step 7: Health check
echo -e "\n${YELLOW}7️⃣ Health check yapılıyor...${NC}"
sleep 5

BACKEND_URL=${BACKEND_URL:-"http://localhost:9000"}

if curl -f -s "${BACKEND_URL}/health" > /dev/null; then
  echo -e "${GREEN}✅ Health check başarılı!${NC}"
else
  echo -e "${RED}⚠️ Health check başarısız!${NC}"
fi

# Step 8: Log
echo -e "\n${YELLOW}📝 Rollback log kaydediliyor...${NC}"
mkdir -p logs/rollbacks
cat << EOF > "logs/rollbacks/rollback_${TIMESTAMP}.log"
Rollback Date: $(date)
From Commit: $CURRENT_COMMIT
To Commit: $ROLLBACK_COMMIT
Rolled Back By: $(whoami)
Reason: Manual rollback
Status: SUCCESS
EOF

echo -e "\n${GREEN}==========================================${NC}"
echo -e "${GREEN}✅ ROLLBACK TAMAMLANDI!${NC}"
echo -e "${GREEN}==========================================${NC}"

echo -e "\n${YELLOW}📌 Notlar:${NC}"
echo "• Önceki commit: $ROLLBACK_COMMIT"
echo "• Yedeklenen değişiklikler: git stash list ile görüntülenebilir"
echo "• Database migration'ları kontrol edilmeli"

# Notification
if [ ! -z "$NOTIFICATION_WEBHOOK" ]; then
  curl -X POST $NOTIFICATION_WEBHOOK \
    -H "Content-Type: application/json" \
    -d "{
      \"content\": \"⚠️ **Rollback Yapıldı**\n\`\`\`From: $CURRENT_COMMIT\nTo: $ROLLBACK_COMMIT\`\`\`\"
    }" 2>/dev/null
fi