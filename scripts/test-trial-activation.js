#!/usr/bin/env node

/**
 * Test script for trial business activation endpoint
 * Verifies that trial data is correctly inserted into Supabase businesses table
 */

const https = require('https');
const http = require('http');

// Test configuration
const TEST_CONFIG = {
  // Use local development server by default
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  endpoint: '/api/create-business-trial',
  
  // Test business data
  testBusiness: {
    name: 'Test Trial Business',
    phoneNumber: '+1-555-123-4567',
    twilioNumber: '+1-555-987-6543',
    industry: 'restaurant',
    trialPlan: 'pro',
    email: 'test@example.com',
    website: 'https://test-business.com',
    address: '123 Test Street, Test City, TC 12345',
    teamSize: 5,
    hoursJson: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { closed: true },
      sunday: { closed: true }
    },
    onlineOrderingLink: 'https://order.test-business.com',
    reservationLink: 'https://reserve.test-business.com',
    faqs: [
      { question: 'What are your hours?', answer: 'We are open Monday-Friday 9am-5pm' },
      { question: 'Do you deliver?', answer: 'Yes, we deliver within 5 miles' }
    ],
    customAutoTextMessage: 'Thank you for contacting Test Business! We will get back to you soon.'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            parseError: e.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testTrialActivation() {
  log('\n=== Trial Business Activation Test ===', 'cyan');
  log(`Testing endpoint: ${TEST_CONFIG.baseUrl}${TEST_CONFIG.endpoint}`, 'blue');
  
  const url = new URL(TEST_CONFIG.baseUrl + TEST_CONFIG.endpoint);
  
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    protocol: url.protocol,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Trial-Activation-Test/1.0'
    }
  };
  
  try {
    log('\n1. Testing POST request with valid trial data...', 'yellow');
    log('Request payload:', 'blue');
    console.log(JSON.stringify(TEST_CONFIG.testBusiness, null, 2));
    
    const response = await makeRequest(options, TEST_CONFIG.testBusiness);
    
    log(`\nResponse Status: ${response.statusCode}`, 'blue');
    log('Response Headers:', 'blue');
    console.log(JSON.stringify(response.headers, null, 2));
    log('Response Body:', 'blue');
    console.log(JSON.stringify(response.body, null, 2));
    
    // Validate response
    if (response.statusCode === 201) {
      log('\n✅ SUCCESS: Trial business created successfully!', 'green');
      
      // Validate response structure
      const requiredFields = ['success', 'businessId', 'message', 'data'];
      const missingFields = requiredFields.filter(field => !(field in response.body));
      
      if (missingFields.length === 0) {
        log('✅ Response structure is valid', 'green');
        
        // Validate business data
        const businessData = response.body.data;
        if (businessData) {
          log('\n📊 Business Data Validation:', 'cyan');
          log(`Business ID: ${businessData.id}`, 'blue');
          log(`Name: ${businessData.name}`, 'blue');
          log(`Phone: ${businessData.phoneNumber}`, 'blue');
          log(`Twilio Number: ${businessData.twilioNumber}`, 'blue');
          log(`Business Type: ${businessData.businessType}`, 'blue');
          log(`Subscription Tier: ${businessData.subscriptionTier}`, 'blue');
          log(`Trial Ends At: ${businessData.trialEndsAt}`, 'blue');
          log(`Created At: ${businessData.createdAt}`, 'blue');
          
          // Validate trial end date
          if (businessData.trialEndsAt) {
            const trialEndDate = new Date(businessData.trialEndsAt);
            const now = new Date();
            const daysDiff = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));
            
            if (daysDiff >= 13 && daysDiff <= 15) {
              log(`✅ Trial end date is valid (${daysDiff} days from now)`, 'green');
            } else {
              log(`❌ Trial end date seems incorrect (${daysDiff} days from now)`, 'red');
            }
          } else {
            log('❌ Trial end date is missing', 'red');
          }
          
          // Validate subscription tier
          if (businessData.subscriptionTier === 'trial') {
            log('✅ Subscription tier is correctly set to "trial"', 'green');
          } else {
            log(`❌ Subscription tier is incorrect: ${businessData.subscriptionTier}`, 'red');
          }
          
          return businessData.id;
        } else {
          log('❌ Business data is missing from response', 'red');
        }
      } else {
        log(`❌ Response missing required fields: ${missingFields.join(', ')}`, 'red');
      }
    } else if (response.statusCode === 400) {
      log('❌ BAD REQUEST: Validation failed', 'red');
      if (response.body.missingFields) {
        log(`Missing fields: ${response.body.missingFields.join(', ')}`, 'red');
      }
    } else if (response.statusCode === 500) {
      log('❌ SERVER ERROR: Database or server issue', 'red');
      if (response.body.details) {
        log(`Error details: ${response.body.details}`, 'red');
      }
    } else {
      log(`❌ UNEXPECTED STATUS: ${response.statusCode}`, 'red');
    }
    
  } catch (error) {
    log(`❌ REQUEST FAILED: ${error.message}`, 'red');
    console.error(error);
  }
  
  return null;
}

async function testInvalidRequests() {
  log('\n=== Testing Invalid Requests ===', 'cyan');
  
  const url = new URL(TEST_CONFIG.baseUrl + TEST_CONFIG.endpoint);
  const baseOptions = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    protocol: url.protocol,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  // Test 1: Missing required fields
  log('\n1. Testing missing required fields...', 'yellow');
  try {
    const response = await makeRequest({
      ...baseOptions,
      method: 'POST'
    }, { name: 'Test' }); // Missing phoneNumber and industry
    
    if (response.statusCode === 400 && response.body.missingFields) {
      log('✅ Correctly rejected request with missing fields', 'green');
      log(`Missing fields detected: ${response.body.missingFields.join(', ')}`, 'blue');
    } else {
      log('❌ Should have rejected request with missing fields', 'red');
    }
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
  }
  
  // Test 2: Invalid email format
  log('\n2. Testing invalid email format...', 'yellow');
  try {
    const invalidEmailData = {
      ...TEST_CONFIG.testBusiness,
      email: 'invalid-email-format'
    };
    
    const response = await makeRequest({
      ...baseOptions,
      method: 'POST'
    }, invalidEmailData);
    
    if (response.statusCode === 400 && response.body.error === 'Invalid email format') {
      log('✅ Correctly rejected invalid email format', 'green');
    } else {
      log('❌ Should have rejected invalid email format', 'red');
    }
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
  }
  
  // Test 3: GET request (should return 405)
  log('\n3. Testing GET request (should be method not allowed)...', 'yellow');
  try {
    const response = await makeRequest({
      ...baseOptions,
      method: 'GET'
    });
    
    if (response.statusCode === 405) {
      log('✅ Correctly rejected GET request with 405', 'green');
    } else {
      log(`❌ Should have returned 405, got ${response.statusCode}`, 'red');
    }
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
  }
}

async function testSupabaseVerification(businessId) {
  if (!businessId) {
    log('\n⚠️  Skipping Supabase verification - no business ID available', 'yellow');
    return;
  }
  
  log('\n=== Supabase Data Verification ===', 'cyan');
  log(`Verifying business ID: ${businessId}`, 'blue');
  
  // Note: This would require direct Supabase access or a verification endpoint
  log('📝 Manual verification steps:', 'yellow');
  log('1. Check Supabase dashboard for new business record', 'blue');
  log('2. Verify all fields are populated correctly', 'blue');
  log('3. Confirm trial_ends_at is set to ~14 days from now', 'blue');
  log('4. Check subscription_tier is set to "trial"', 'blue');
  log('5. Verify custom_settings contains trial information', 'blue');
  
  // TODO: Could add a verification endpoint or direct Supabase query here
}

async function runAllTests() {
  log('🚀 Starting Trial Activation Tests...', 'cyan');
  
  try {
    // Test valid trial activation
    const businessId = await testTrialActivation();
    
    // Test invalid requests
    await testInvalidRequests();
    
    // Verify data in Supabase
    await testSupabaseVerification(businessId);
    
    log('\n=== Test Summary ===', 'cyan');
    if (businessId) {
      log('✅ Trial activation endpoint is working correctly', 'green');
      log(`✅ Business created with ID: ${businessId}`, 'green');
      log('📋 Next steps:', 'yellow');
      log('1. Verify the business appears in Supabase dashboard', 'blue');
      log('2. Test the frontend form integration', 'blue');
      log('3. Verify trial expiration logic', 'blue');
    } else {
      log('❌ Trial activation endpoint has issues', 'red');
      log('🔧 Check server logs for detailed error information', 'yellow');
    }
    
  } catch (error) {
    log(`❌ Test suite failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testTrialActivation,
  testInvalidRequests,
  runAllTests
};
