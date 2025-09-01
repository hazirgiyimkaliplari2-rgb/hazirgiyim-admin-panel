#!/bin/bash

# Railway Clean Deployment Script
# ================================

set -e

echo "🧹 Railway Clean Deployment Script"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check if logged in
echo -e "${BLUE}Step 1: Checking Railway login...${NC}"
railway whoami || {
    echo -e "${RED}Not logged in. Please run: railway login${NC}"
    exit 1
}
echo -e "${GREEN}✓ Logged in${NC}"
echo ""

# Step 2: Unlink any existing project
echo -e "${BLUE}Step 2: Unlinking any existing project...${NC}"
railway unlink 2>/dev/null || true
echo -e "${GREEN}✓ Unlinked${NC}"
echo ""

# Step 3: Create new project
echo -e "${BLUE}Step 3: Creating new Railway project...${NC}"
echo -e "${YELLOW}Enter project name (default: hazirgiyim-backend):${NC}"
read -r PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-hazirgiyim-backend}

railway init --name "$PROJECT_NAME"
echo -e "${GREEN}✓ Project created: $PROJECT_NAME${NC}"
echo ""

# Step 4: Add PostgreSQL
echo -e "${BLUE}Step 4: Adding PostgreSQL database...${NC}"
railway add --database postgres --service postgres-db
echo -e "${GREEN}✓ PostgreSQL added${NC}"
echo ""

# Step 5: Add backend service with GitHub repo
echo -e "${BLUE}Step 5: Adding backend service...${NC}"
REPO_URL="https://github.com/hazirgiyimkaliplari2-rgb/hazirgiyim-backend"

# Create environment variables
VARIABLES=(
    "NODE_ENV=production"
    "DISABLE_ADMIN=true"
    "JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')"
    "COOKIE_SECRET=$(openssl rand -base64 32 | tr -d '\n')"
    "STORE_CORS=*"
    "ADMIN_CORS=*"
    "AUTH_CORS=*"
)

# Build variables string
VAR_ARGS=""
for VAR in "${VARIABLES[@]}"; do
    VAR_ARGS="$VAR_ARGS --variables \"$VAR\""
done

# Add service
eval "railway add --service backend --repo $REPO_URL $VAR_ARGS"
echo -e "${GREEN}✓ Backend service added with environment variables${NC}"
echo ""

# Step 6: Deploy
echo -e "${BLUE}Step 6: Deploying...${NC}"
railway up --detach
echo -e "${GREEN}✓ Deployment started${NC}"
echo ""

# Step 7: Get project URL
echo -e "${BLUE}Step 7: Project Information${NC}"
echo "============================"
railway status
echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Open Railway dashboard to monitor deployment"
echo "2. Wait for PostgreSQL to initialize"
echo "3. Check deployment logs: railway logs"
echo "4. Your app will be available at the Railway-provided domain"
echo ""
echo "Useful commands:"
echo "  railway logs          - View deployment logs"
echo "  railway open          - Open dashboard"
echo "  railway variables     - View environment variables"
echo "  railway redeploy      - Trigger new deployment"