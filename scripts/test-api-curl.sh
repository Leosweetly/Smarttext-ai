#!/bin/bash
# Test script for the update-business-info API endpoint using curl

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Test data
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
TEST_DATA='{
  "name": "Test Business '"$TIMESTAMP"'",
  "industry": "Technology",
  "size": "Small",
  "website": "https://example.com"
}'

# Function to test an endpoint
test_endpoint() {
  local name=$1
  local url=$2
  
  echo -e "${BLUE}🧪 Testing $name...${NC}"
  echo -e "${GRAY}URL: $url${NC}"
  echo -e "${GRAY}Request body: $TEST_DATA${NC}"
  
  # Send the request
  response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Origin: http://localhost:8080" \
    -d "$TEST_DATA" \
    "$url")
  
  # Check if the response is valid JSON
  if jq -e . >/dev/null 2>&1 <<<"$response"; then
    echo -e "${GRAY}Response body: $(echo $response | jq .)${NC}"
    
    # Check if the response contains an error
    if echo "$response" | jq -e '.error' >/dev/null 2>&1; then
      error=$(echo "$response" | jq -r '.error')
      echo -e "${RED}❌ $name test failed! Error: $error${NC}"
      return 1
    else
      echo -e "${GREEN}✅ $name test passed!${NC}"
      
      # If we got a record ID, store it for future tests
      if echo "$response" | jq -e '.id' >/dev/null 2>&1; then
        record_id=$(echo "$response" | jq -r '.id')
        echo -e "${BLUE}📝 Record created with ID: $record_id${NC}"
        
        # Test updating the record
        test_update_record "$name" "$url" "$record_id"
      fi
      
      return 0
    fi
  else
    echo -e "${RED}❌ $name test failed! Invalid JSON response:${NC}"
    echo -e "${GRAY}$response${NC}"
    return 1
  fi
}

# Function to test updating a record
test_update_record() {
  local name=$1
  local url=$2
  local record_id=$3
  
  echo -e "${BLUE}🔄 Testing update for record $record_id...${NC}"
  
  # Update data
  local update_data='{
    "name": "Test Business '"$TIMESTAMP"' (Updated)",
    "industry": "Technology",
    "size": "Small",
    "website": "https://example.com",
    "recordId": "'"$record_id"'"
  }'
  
  echo -e "${GRAY}Update request body: $update_data${NC}"
  
  # Send the request
  response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$update_data" \
    "$url")
  
  # Check if the response is valid JSON
  if jq -e . >/dev/null 2>&1 <<<"$response"; then
    echo -e "${GRAY}Update response body: $(echo $response | jq .)${NC}"
    
    # Check if the response contains an error
    if echo "$response" | jq -e '.error' >/dev/null 2>&1; then
      error=$(echo "$response" | jq -r '.error')
      echo -e "${RED}❌ Record update test failed! Error: $error${NC}"
      return 1
    else
      echo -e "${GREEN}✅ Record update test passed!${NC}"
      return 0
    fi
  else
    echo -e "${RED}❌ Record update test failed! Invalid JSON response:${NC}"
    echo -e "${GRAY}$response${NC}"
    return 1
  fi
}

# Test local endpoints
echo -e "${BLUE}🧪 Testing update-business-info API endpoints...${NC}"

# Test local v1 endpoint
test_endpoint "Local API (v1)" "http://localhost:3000/api/update-business-info"

# Test local v2 endpoint
test_endpoint "Local API (v2)" "http://localhost:3000/api/update-business-info-v2"

echo -e "${BLUE}✅ Tests completed!${NC}"
