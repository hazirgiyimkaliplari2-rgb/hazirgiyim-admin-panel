#!/bin/bash

echo "🚀 Railway Database Migration Script"
echo "===================================="
echo ""

# Check if DATABASE_URL is provided
if [ -z "$1" ]; then
    echo "⚠️  Usage: ./scripts/migrate-railway.sh <DATABASE_URL>"
    echo ""
    echo "Steps to get DATABASE_URL:"
    echo "1. Go to Railway Dashboard"
    echo "2. Click on PostgreSQL service"
    echo "3. Go to 'Connect' tab"
    echo "4. Copy the DATABASE_URL"
    echo "5. Run: ./scripts/migrate-railway.sh 'postgresql://...'"
    exit 1
fi

DATABASE_URL="$1"

echo "📦 Running Medusa migrations..."
echo "================================"

# Export DATABASE_URL for medusa
export DATABASE_URL="$DATABASE_URL"

# Check connection first
echo "🔍 Testing database connection..."
npx medusa exec -c "
const { dataSource } = require('@medusajs/medusa/dist/loaders/database');
dataSource.initialize()
  .then(() => {
    console.log('✅ Database connection successful!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
" || {
    echo "❌ Could not connect to database. Please check your DATABASE_URL"
    exit 1
}

# Run migrations
echo ""
echo "🏃 Running migrations..."
npx medusa migrations run

# Check if migrations were successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations completed successfully!"
    echo ""
    echo "📊 Your database now has all required tables:"
    echo "  - Users & Auth"
    echo "  - Products & Categories"
    echo "  - Orders & Carts"
    echo "  - Customers"
    echo "  - Inventory"
    echo "  - Translations (custom module)"
    echo "  - Reviews (custom module)"
    echo "  - Wishlist (custom module)"
    echo ""
    echo "🎉 Database is ready for use!"
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi