#!/bin/bash

# Script to run the QA tests for Stripe subscription flow

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Starting QA for Stripe Subscription Flow ===${NC}"

# Check if the server is already running
if ! nc -z localhost 3001 > /dev/null 2>&1; then
  echo -e "${YELLOW}Starting local development server on port 3001...${NC}"
  echo -e "${YELLOW}This will run in the background. Press Ctrl+C after tests complete to stop it.${NC}"
  npm run dev -- -p 3001 &
  SERVER_PID=$!
  
  # Wait for the server to start
  echo -e "${YELLOW}Waiting for server to start...${NC}"
  while ! nc -z localhost 3001 > /dev/null 2>&1; do
    sleep 1
  done
  echo -e "${GREEN}Server started successfully!${NC}"
else
  echo -e "${GREEN}Server already running on port 3001${NC}"
  SERVER_PID=""
fi

# Run the QA script
echo -e "${YELLOW}Running QA tests...${NC}"
echo -e "${YELLOW}This will test the complete Stripe subscription flow:${NC}"
echo -e "${YELLOW}1. Verify checkout flow selects Pro plan for trial signups${NC}"
echo -e "${YELLOW}2. Confirm Airtable logs after checkout${NC}"
echo -e "${YELLOW}3. Simulate Stripe webhook events${NC}"
echo -e "${YELLOW}4. Add Subscription Updated At field${NC}"

node scripts/qa-stripe-subscription-flow.js

# Check if the test was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}=== QA Tests Completed Successfully! ===${NC}"
else
  echo -e "${RED}=== QA Tests Failed! ===${NC}"
fi

# If we started the server, ask if the user wants to stop it
if [ -n "$SERVER_PID" ]; then
  echo -e "${YELLOW}Local development server is still running (PID: $SERVER_PID)${NC}"
  echo -e "${YELLOW}Press Ctrl+C to stop the server when you're done${NC}"
  
  # Keep the script running so the user can see the output
  # and stop the server with Ctrl+C
  wait $SERVER_PID
fi

echo -e "${GREEN}=== QA Testing Complete ===${NC}"
