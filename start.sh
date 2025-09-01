#!/bin/bash

# Railway startup script
echo "🚀 Starting Medusa Backend..."
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Database URL exists: $([ -z "$DATABASE_URL" ] && echo "NO ❌" || echo "YES ✅")"

# Check database connection
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set!"
  echo "Please ensure PostgreSQL is added and DATABASE_URL is set in Variables"
  echo "Waiting 30 seconds before retry..."
  sleep 30
  
  # Try one more time
  if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL still not set. Exiting."
    exit 1
  fi
fi

# Simple startup without complex checks
echo "📦 Starting application..."
echo "If this is first run, migrations will be attempted..."

# Try to run migrations but don't fail if they error
npx medusa migrations run 2>&1 | tee migration.log || true

# Start the application
echo "🎯 Starting application on port ${PORT:-9000}..."
exec npm run start:prod