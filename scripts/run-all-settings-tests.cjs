/**
 * Run all settings fallback tests
 * 
 * This script runs all the tests related to the settings fallback implementation.
 */

const { spawn } = require('child_process');
const path = require('path');

// List of test scripts to run
const testScripts = [
  'test-friendly-list.js',
  'test-settings-fallback.cjs',
  'test-new-message-settings.cjs'
];

// Function to run a script and return a promise
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`Running: ${scriptPath}`);
    console.log(`${'='.repeat(80)}\n`);
    
    const child = spawn('node', [scriptPath], { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script ${scriptPath} exited with code ${code}`));
      }
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
}

// Run all tests sequentially
async function runAllTests() {
  console.log('Starting all settings fallback tests...\n');
  
  let passCount = 0;
  let failCount = 0;
  
  for (const script of testScripts) {
    const scriptPath = path.join(__dirname, script);
    
    try {
      await runScript(scriptPath);
      console.log(`\n✅ ${script} completed successfully`);
      passCount++;
    } catch (error) {
      console.error(`\n❌ ${script} failed:`, error.message);
      failCount++;
    }
  }
  
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`Test Summary: ${passCount} passed, ${failCount} failed`);
  console.log(`${'='.repeat(80)}\n`);
  
  if (failCount === 0) {
    console.log('🎉 All tests passed! The settings fallback implementation is working correctly.');
  } else {
    console.log('😢 Some tests failed. Please check the output above for details.');
  }
}

// Run the tests
runAllTests()
  .then(() => {
    console.log('All tests completed.');
  })
  .catch((err) => {
    console.error('Error running tests:', err);
    process.exit(1);
  });
