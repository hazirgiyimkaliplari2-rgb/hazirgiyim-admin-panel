#!/bin/bash
# Environment variables for Railway

export JWT_SECRET="$(openssl rand -base64 32 | tr -d '\n')"
export COOKIE_SECRET="$(openssl rand -base64 32 | tr -d '\n')"

echo "Generated secrets:"
echo "JWT_SECRET=$JWT_SECRET"
echo "COOKIE_SECRET=$COOKIE_SECRET"
echo ""
echo "Copy these to Railway dashboard Variables section"
