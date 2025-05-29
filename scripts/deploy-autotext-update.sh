#!/bin/bash

# Deployment script for the enhanced auto-text functionality
# This script tests, builds, and deploys the auto-text update

# Set error handling
set -e

echo "🚀 Starting deployment of enhanced auto-text functionality..."

# Step 1: Run tests to verify the changes
echo "🧪 Running tests..."
echo "Testing missed call auto-text..."
node scripts/test-malibu-autotext.js
echo "✅ Missed call auto-text test completed"

echo "Testing custom auto-text message..."
node scripts/test-custom-autotext.js "Hey there! This is a test of the custom auto-text message feature."
echo "✅ Custom auto-text message test completed"

# Step 2: Build the project
echo "🔨 Building the project..."
npm run build
echo "✅ Build completed"

# Step 3: Deploy to Vercel
echo "📤 Deploying to Vercel..."
npx vercel --prod
echo "✅ Deployment completed"

echo "🎉 Enhanced auto-text functionality has been successfully deployed!"
echo ""
echo "To verify the deployment:"
echo "1. Run 'node scripts/test-malibu-autotext.js' on the production environment"
echo "2. Check that the auto-text message follows the new format"
echo "3. Test the FAQ response system with 'node scripts/test-malibu-autotext.js faq'"
echo ""
echo "For more information, see MALIBU_AUTOTEXT_TESTING.md"
