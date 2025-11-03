#!/bin/bash

# Firebase Storage CORS Setup Script
# This script configures CORS for your Firebase Storage bucket

echo "🔧 Firebase Storage CORS Setup"
echo "================================"
echo ""

# Check if gsutil is installed
if ! command -v gsutil &> /dev/null; then
    echo "❌ Error: gsutil is not installed."
    echo ""
    echo "Please install Google Cloud SDK first:"
    echo "  macOS: brew install google-cloud-sdk"
    echo "  Or visit: https://cloud.google.com/sdk/docs/install"
    echo ""
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create .env.local with your Firebase configuration"
    exit 1
fi

# Extract storage bucket from .env.local
STORAGE_BUCKET=$(grep NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")

if [ -z "$STORAGE_BUCKET" ]; then
    echo "❌ Error: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET not found in .env.local"
    echo ""
    echo "Please add your storage bucket to .env.local:"
    echo "  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com"
    echo ""
    exit 1
fi

echo "📦 Storage Bucket: $STORAGE_BUCKET"
echo ""

# Authenticate if needed
echo "🔐 Checking authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "Please authenticate with Google Cloud:"
    gcloud auth login
fi

echo ""
echo "⏳ Applying CORS configuration..."

# Apply CORS configuration
if gsutil cors set cors.json gs://$STORAGE_BUCKET; then
    echo ""
    echo "✅ CORS configuration applied successfully!"
    echo ""
    echo "📋 Verifying CORS configuration:"
    gsutil cors get gs://$STORAGE_BUCKET
    echo ""
    echo "🎉 Done! Your Firebase Storage is now configured for CORS."
    echo "   Images should now display properly in the ShareModal."
    echo ""
    echo "💡 If images still don't load:"
    echo "   1. Clear your browser cache (Cmd+Shift+R)"
    echo "   2. Check browser console for errors"
    echo "   3. Verify Firebase Storage Rules allow public read"
    echo ""
else
    echo ""
    echo "❌ Failed to apply CORS configuration"
    echo ""
    echo "Please try manually:"
    echo "  gsutil cors set cors.json gs://$STORAGE_BUCKET"
    echo ""
    exit 1
fi

