#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/create-checkout-session';

async function testValidationFixes() {
  console.log('🧪 Testing Validation Fixes...\n');
  
  try {
    // Test 1: Empty request body should return 400
    console.log('1. Testing empty request body (should return 400)...');
    const emptyResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    console.log(`   Status: ${emptyResponse.status}`);
    const emptyResult = await emptyResponse.json();
    console.log(`   Response:`, emptyResult);
    
    if (emptyResponse.status === 400) {
      console.log('   ✅ PASS: Empty body correctly rejected\n');
    } else {
      console.log('   ❌ FAIL: Empty body should return 400\n');
    }
    
    // Test 2: Valid request should work
    console.log('2. Testing valid request (should return 200)...');
    const validResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerEmail: 'test@example.com' })
    });
    
    console.log(`   Status: ${validResponse.status}`);
    const validResult = await validResponse.json();
    console.log(`   Response keys:`, Object.keys(validResult));
    
    if (validResponse.status === 200 && validResult.url) {
      console.log('   ✅ PASS: Valid request works correctly\n');
    } else {
      console.log('   ❌ FAIL: Valid request should return 200 with URL\n');
    }
    
    // Test 3: Security headers
    console.log('3. Testing security headers...');
    const headers = validResponse.headers;
    const securityHeaders = {
      'x-content-type-options': headers.get('x-content-type-options'),
      'x-frame-options': headers.get('x-frame-options'),
      'x-xss-protection': headers.get('x-xss-protection'),
      'content-type': headers.get('content-type')
    };
    
    console.log('   Security headers:', securityHeaders);
    
    const hasSecurityHeaders = securityHeaders['x-content-type-options'] === 'nosniff' &&
                              securityHeaders['x-frame-options'] === 'DENY' &&
                              securityHeaders['x-xss-protection'] === '1; mode=block';
    
    if (hasSecurityHeaders) {
      console.log('   ✅ PASS: Security headers present\n');
    } else {
      console.log('   ❌ FAIL: Missing security headers\n');
    }
    
    // Test 4: Malicious input sanitization
    console.log('4. Testing malicious input sanitization...');
    const maliciousResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        customerEmail: '<script>alert("xss")</script>@example.com',
        extraField: 'javascript:alert(1)'
      })
    });
    
    console.log(`   Status: ${maliciousResponse.status}`);
    const maliciousResult = await maliciousResponse.json();
    console.log(`   Response:`, maliciousResult);
    
    if (maliciousResponse.status === 400) {
      console.log('   ✅ PASS: Malicious input correctly rejected\n');
    } else {
      console.log('   ❌ FAIL: Malicious input should be rejected\n');
    }
    
    console.log('🎯 Validation fixes test completed!');
    
  } catch (error) {
    console.error('❌ Error testing validation fixes:', error.message);
  }
}

testValidationFixes();
