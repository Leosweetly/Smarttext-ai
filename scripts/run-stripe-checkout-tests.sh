#!/bin/bash

# Stripe Checkout API Comprehensive Testing Script
# This script runs the comprehensive test suite for the /api/create-checkout-session endpoint

echo "🚀 Starting Stripe Checkout API Comprehensive Tests"
echo "=================================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    exit 1
fi

# Check if the test script exists
if [ ! -f "scripts/test-stripe-checkout-comprehensive.js" ]; then
    echo "❌ Error: Test script not found at scripts/test-stripe-checkout-comprehensive.js"
    exit 1
fi

# Check if Next.js development server is running
echo "🔍 Checking if Next.js development server is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Next.js development server is running on http://localhost:3000"
else
    echo "⚠️  Next.js development server is not running on http://localhost:3000"
    echo "   Please start the development server with: npm run dev"
    echo "   Then run this test script again."
    exit 1
fi

# Run the comprehensive tests
echo ""
echo "🧪 Running comprehensive test suite..."
echo "   This will test all aspects of the /api/create-checkout-session endpoint"
echo ""

node scripts/test-stripe-checkout-comprehensive.js

# Check the exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Test execution completed successfully!"
    echo "   Check the results above for detailed analysis."
else
    echo ""
    echo "❌ Test execution failed!"
    echo "   Please check the error messages above."
    exit 1
fi
