#!/usr/bin/env node

/**
 * Test script specifically for production checkout endpoint
 */

const https = require('https');

function makeRequest(hostname, path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
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

async function testProduction() {
  console.log('🌐 Testing production deployment...');
  console.log('🔗 URL: https://smarttext-connect.vercel.app/api/create-checkout-session');
  
  const testData = {
    customerEmail: 'test@example.com'
  };
  
  try {
    console.log('📤 Sending request...');
    const response = await makeRequest('smarttext-connect.vercel.app', '/api/create-checkout-session', testData);
    
    console.log(`📥 Status: ${response.statusCode}`);
    
    if (response.statusCode === 404) {
      console.log('❌ 404 ERROR: Endpoint not found in production!');
      console.log('🔍 This confirms the routing issue - the App Router endpoint is not deployed properly');
      
      // Test if there's a pages router version
      console.log('\n🧪 Testing if Pages Router version exists...');
      const pagesResponse = await makeRequest('smarttext-connect.vercel.app', '/pages/api/create-checkout-session', testData);
      console.log(`📥 Pages Router Status: ${pagesResponse.statusCode}`);
      
    } else if (response.statusCode === 200) {
      console.log('✅ SUCCESS: Production endpoint is working!');
      if (response.data && response.data.url) {
        console.log('🔗 Checkout URL generated successfully');
      }
    } else {
      console.log(`⚠️  Unexpected status: ${response.statusCode}`);
      console.log('📄 Response:', JSON.stringify(response.data, null, 2));
    }
    
    return response;
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Production Checkout Endpoint Test');
  console.log('=' .repeat(50));
  
  await testProduction();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Test completed');
}

main().catch(console.error);
