#!/usr/bin/env node

import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/create-checkout-session';

async function quickValidation() {
  console.log('🚀 Quick Production Validation');
  console.log('==============================\n');
  
  let totalTests = 0;
  let passedTests = 0;
  
  try {
    // Test 1: Environment Variables
    console.log('📊 Environment Configuration:');
    const envTests = [
      { name: 'STRIPE_SECRET_KEY', value: process.env.STRIPE_SECRET_KEY, check: (v) => v && v.startsWith('sk_') },
      { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, check: (v) => v && v.startsWith('pk_') },
      { name: 'STRIPE_PRICE_PRO', value: process.env.STRIPE_PRICE_PRO, check: (v) => v && v.startsWith('price_') },
      { name: 'STRIPE_SUCCESS_URL', value: process.env.STRIPE_SUCCESS_URL, check: (v) => v && v.includes('http') },
      { name: 'STRIPE_CANCEL_URL', value: process.env.STRIPE_CANCEL_URL, check: (v) => v && v.includes('http') }
    ];
    
    envTests.forEach(test => {
      totalTests++;
      if (test.check(test.value)) {
        console.log(`   ✅ ${test.name}: Configured`);
        passedTests++;
      } else {
        console.log(`   ❌ ${test.name}: Missing or invalid`);
      }
    });
    
    // Test 2: Security Validation
    console.log('\n📊 Security Validation:');
    
    // Empty body validation
    totalTests++;
    const emptyResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (emptyResponse.status === 400) {
      console.log('   ✅ Empty request validation: PASS');
      passedTests++;
    } else {
      console.log('   ❌ Empty request validation: FAIL');
    }
    
    // Security headers
    totalTests++;
    const validResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerEmail: 'test@example.com' })
    });
    
    const hasSecurityHeaders = validResponse.headers.get('x-content-type-options') === 'nosniff' &&
                              validResponse.headers.get('x-frame-options') === 'DENY' &&
                              validResponse.headers.get('x-xss-protection') === '1; mode=block';
    
    if (hasSecurityHeaders) {
      console.log('   ✅ Security headers: PASS');
      passedTests++;
    } else {
      console.log('   ❌ Security headers: FAIL');
    }
    
    // Input sanitization
    totalTests++;
    const maliciousResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerEmail: '<script>alert("xss")</script>' })
    });
    
    if (maliciousResponse.status === 400) {
      console.log('   ✅ Input sanitization: PASS');
      passedTests++;
    } else {
      console.log('   ❌ Input sanitization: FAIL');
    }
    
    // Test 3: API Validation
    console.log('\n📊 API Validation:');
    
    // Method validation
    totalTests++;
    const getResponse = await fetch(API_URL, { method: 'GET' });
    if (getResponse.status === 405) {
      console.log('   ✅ HTTP method validation: PASS');
      passedTests++;
    } else {
      console.log('   ❌ HTTP method validation: FAIL');
    }
    
    // JSON response format
    totalTests++;
    if (validResponse.headers.get('content-type')?.includes('application/json')) {
      console.log('   ✅ JSON response format: PASS');
      passedTests++;
    } else {
      console.log('   ❌ JSON response format: FAIL');
    }
    
    // API accessibility
    totalTests++;
    if (validResponse.status === 200) {
      console.log('   ✅ API accessibility: PASS');
      passedTests++;
    } else {
      console.log('   ❌ API accessibility: FAIL');
    }
    
    // Test 4: Performance (basic)
    console.log('\n📊 Performance Validation:');
    
    totalTests++;
    const startTime = Date.now();
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerEmail: 'perf@test.com' })
    });
    const responseTime = Date.now() - startTime;
    
    if (responseTime < 2000) {
      console.log(`   ✅ Response time: PASS (${responseTime}ms)`);
      passedTests++;
    } else {
      console.log(`   ❌ Response time: FAIL (${responseTime}ms)`);
    }
    
    // Results
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log('\n==============================');
    console.log('🎯 VALIDATION RESULTS:');
    console.log(`   ✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`   📈 Pass Rate: ${passRate}%`);
    
    if (passRate >= 95) {
      console.log('   🎉 READY FOR PRODUCTION!');
    } else if (passRate >= 85) {
      console.log('   ⚠️  MOSTLY READY - Minor issues to address');
    } else {
      console.log('   🚨 NOT READY - Critical issues need fixing');
    }
    
    console.log('==============================');
    
  } catch (error) {
    console.error('❌ Validation error:', error.message);
  }
}

quickValidation();
