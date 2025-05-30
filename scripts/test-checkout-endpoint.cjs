#!/usr/bin/env node

/**
 * Test script to verify the create-checkout-session endpoint
 */

const https = require('https');
const http = require('http');

// Test configuration
const TEST_CONFIG = {
  // Test locally first
  local: {
    host: 'localhost',
    port: 3000,
    protocol: 'http:'
  },
  // Then test production if needed
  production: {
    host: 'smarttext-connect.vercel.app',
    port: 443,
    protocol: 'https:'
  }
};

function makeRequest(config, path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: config.host,
      port: config.port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const client = config.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
            parseError: e.message
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.write(postData);
    req.end();
  });
}

async function testEndpoint(environment) {
  const config = TEST_CONFIG[environment];
  console.log(`\n🧪 Testing ${environment} environment: ${config.protocol}//${config.host}:${config.port}`);
  
  // Test data
  const testData = {
    customerEmail: 'test@example.com'
  };
  
  try {
    console.log('📤 Sending POST request to /api/create-checkout-session');
    console.log('📦 Request data:', JSON.stringify(testData, null, 2));
    
    const response = await makeRequest(config, '/api/create-checkout-session', testData);
    
    console.log(`📥 Response status: ${response.statusCode}`);
    console.log('📋 Response headers:', JSON.stringify(response.headers, null, 2));
    
    if (response.parseError) {
      console.log('❌ JSON parse error:', response.parseError);
      console.log('📄 Raw response:', response.data);
    } else {
      console.log('📄 Response data:', JSON.stringify(response.data, null, 2));
    }
    
    // Analyze the response
    if (response.statusCode === 200) {
      if (response.data && response.data.url) {
        console.log('✅ SUCCESS: Endpoint returned a valid checkout URL');
        console.log('🔗 Checkout URL:', response.data.url);
      } else {
        console.log('⚠️  WARNING: 200 status but no URL in response');
      }
    } else if (response.statusCode === 404) {
      console.log('❌ ERROR: 404 - Endpoint not found (this is the issue!)');
    } else if (response.statusCode === 500) {
      console.log('❌ ERROR: 500 - Internal server error');
      if (response.data && response.data.message) {
        console.log('💬 Error message:', response.data.message);
      }
    } else {
      console.log(`❌ ERROR: Unexpected status code ${response.statusCode}`);
    }
    
    return response;
    
  } catch (error) {
    console.log('❌ REQUEST FAILED:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Tip: Make sure the development server is running with `npm run dev`');
    }
    
    return null;
  }
}

async function main() {
  console.log('🚀 Testing create-checkout-session endpoint');
  console.log('=' .repeat(50));
  
  // Test local first
  const localResult = await testEndpoint('local');
  
  // If local fails with connection refused, suggest starting the server
  if (!localResult) {
    console.log('\n💡 Local server not running. Testing production instead...');
    await testEndpoint('production');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Test completed');
}

// Run the test
main().catch(console.error);
