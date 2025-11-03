#!/bin/bash

# Script to verify Firebase Storage CORS configuration

echo "🔍 Verifying Firebase Storage CORS Configuration"
echo "================================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    exit 1
fi

# Extract storage bucket from .env.local
STORAGE_BUCKET=$(grep NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")

if [ -z "$STORAGE_BUCKET" ]; then
    echo "❌ Error: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET not found in .env.local"
    exit 1
fi

echo "📦 Storage Bucket: $STORAGE_BUCKET"
echo ""

# Check if gsutil is installed
if ! command -v gsutil &> /dev/null; then
    echo "⚠️  Warning: gsutil is not installed. Cannot verify CORS automatically."
    echo ""
    echo "To verify CORS manually:"
    echo "1. Go to: https://console.cloud.google.com/storage/browser/$STORAGE_BUCKET"
    echo "2. Click on your bucket → Configuration tab"
    echo "3. Check if CORS configuration exists"
    echo ""
    exit 0
fi

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "⚠️  Warning: Not authenticated with Google Cloud"
    echo "Run: gcloud auth login"
    echo ""
    exit 1
fi

echo "🔍 Checking CORS configuration..."
echo ""

CORS_CONFIG=$(gsutil cors get gs://$STORAGE_BUCKET 2>&1)

if [ $? -eq 0 ] && [ -n "$CORS_CONFIG" ] && [ "$CORS_CONFIG" != "[]" ]; then
    echo "✅ CORS is configured!"
    echo ""
    echo "Current CORS configuration:"
    echo "$CORS_CONFIG"
    echo ""
    echo "✅ Your Firebase Storage should allow images to be downloaded."
else
    echo "❌ CORS is NOT configured!"
    echo ""
    echo "To configure CORS, run:"
    echo "  ./setup-storage-cors.sh"
    echo ""
    echo "Or see: FIREBASE_STORAGE_CORS_SETUP.md"
    echo ""
    exit 1
fi

