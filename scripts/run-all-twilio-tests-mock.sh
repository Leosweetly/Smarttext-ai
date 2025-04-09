#!/bin/bash

# Run all Twilio webhook tests using the mock implementation
# Usage: ./scripts/run-all-twilio-tests-mock.sh

echo "==================================================="
echo "  RUNNING ALL TWILIO WEBHOOK TESTS (MOCK MODE)"
echo "==================================================="

# Initialize counters
total_tests=5
passed_tests=0

# Function to run a test and check if it passed
run_test() {
  test_num=$1
  test_name=$2
  
  echo -e "\n\n==================================================="
  echo "  RUNNING TEST $test_num: $test_name"
  echo "==================================================="
  
  # Run the test
  node scripts/test-new-message-mock.js $test_num
  
  # Check if the test passed
  if [ $? -eq 0 ]; then
    echo -e "\n✅ TEST $test_num PASSED"
    ((passed_tests++))
  else
    echo -e "\n❌ TEST $test_num FAILED"
  fi
}

# Run all tests
run_test 1 "FAQ Match"
run_test 2 "OpenAI Fallback"
run_test 3 "Bad FAQ Data"
run_test 4 "No Airtable Match"
run_test 5 "Auto-Reply Disabled"

# Print summary
echo -e "\n\n==================================================="
echo "                 TEST SUMMARY"
echo "==================================================="
echo "Tests passed: $passed_tests/$total_tests"
echo "All Twilio tests completed"
echo "==================================================="

# Exit with success if all tests passed
if [ $passed_tests -eq $total_tests ]; then
  exit 0
else
  exit 1
fi
