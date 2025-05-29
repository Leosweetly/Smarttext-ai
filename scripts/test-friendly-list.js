/**
 * Test script for the makeFriendlyList function
 * 
 * This script tests the formatting of lists with different numbers of items
 */

// Copy of the makeFriendlyList function from new-message.ts
function makeFriendlyList(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} or ${items[1]}`;
  
  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1).join(", ");
  return `${otherItems}, or ${lastItem}`;
}

// Test cases
const testCases = [
  { items: [], expected: "" },
  { items: ["hours & address"], expected: "hours & address" },
  { items: ["hours & address", "menu details"], expected: "hours & address or menu details" },
  { items: ["hours & address", "menu details", "online ordering link"], expected: "hours & address, menu details, or online ordering link" },
  { items: ["hours & address", "menu details", "online ordering link", "reservations"], expected: "hours & address, menu details, online ordering link, or reservations" },
  { items: ["option 1", "option 2", "option 3", "option 4", "option 5"], expected: "option 1, option 2, option 3, option 4, or option 5" }
];

// Run the tests
console.log('=== makeFriendlyList Function Test ===\n');

let passCount = 0;
let failCount = 0;

testCases.forEach((testCase, index) => {
  const result = makeFriendlyList(testCase.items);
  const passed = result === testCase.expected;
  
  console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Input: [${testCase.items.map(i => `"${i}"`).join(', ')}]`);
  console.log(`Expected: "${testCase.expected}"`);
  console.log(`Actual:   "${result}"`);
  console.log('');
  
  if (passed) {
    passCount++;
  } else {
    failCount++;
  }
});

console.log(`Results: ${passCount} passed, ${failCount} failed`);
if (failCount === 0) {
  console.log('All tests passed! 🎉');
} else {
  console.log('Some tests failed. 😢');
}
