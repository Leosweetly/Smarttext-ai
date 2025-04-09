#!/bin/bash

# Run the Stripe webhook test script
# This script runs the test-stripe-webhook.js script with the specified event type

# Usage: ./scripts/run-test-stripe-webhook.sh [event-type]
# If no event type is provided, it will test all events

# Set environment variables
export API_BASE_URL=${API_BASE_URL:-"http://localhost:3001"}
export TEST_USER_ID=${TEST_USER_ID:-"rec2WN1vnfFJ1qcRx"}
export STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET:-"whsec_test"}

# Check if node-fetch is installed
if ! npm list node-fetch > /dev/null 2>&1; then
  echo "Installing node-fetch..."
  cd scripts && npm install node-fetch
fi

# Run the test script
echo "Running Stripe webhook tests..."
echo "API Base URL: $API_BASE_URL"
echo "Test User ID: $TEST_USER_ID"
echo ""

# Run the test script with the specified event type
node scripts/test-stripe-webhook.js $1
