# Stripe Backend Testing & Validation Guide

This document provides a comprehensive guide to testing and validating your Stripe integration backend for production readiness.

## 🧪 Testing Tools Overview

We've created a complete suite of testing and validation tools to ensure your Stripe integration is bulletproof:

### 1. **Comprehensive API Testing** (`scripts/test-stripe-checkout-comprehensive.js`)
- **Purpose**: Thoroughly tests the `/api/create-checkout-session` endpoint
- **Coverage**: 25+ test scenarios across 6 categories
- **Features**:
  - Valid request testing with various payload combinations
  - Invalid request handling (missing fields, malformed JSON, etc.)
  - HTTP method validation (GET, PUT, DELETE should return 405)
  - Stripe integration verification
  - Error handling validation
  - Performance benchmarking

### 2. **Production Readiness Validation** (`scripts/validate-production-readiness.js`)
- **Purpose**: Validates deployment readiness across all critical areas
- **Coverage**: 20+ validation checks across 5 categories
- **Features**:
  - Environment variable validation (Stripe keys, price IDs)
  - Security headers and input sanitization testing
  - API accessibility and response format validation
  - Performance benchmarking and concurrent request handling
  - Deployment configuration verification

### 3. **Easy Execution Scripts**
- **`scripts/run-stripe-checkout-tests.sh`**: One-command comprehensive testing
- **Built-in validation**: Checks for Node.js, test files, and running dev server

## 🚀 Quick Start

### Prerequisites
1. **Development server running**: `npm run dev` on `http://localhost:3000`
2. **Environment variables configured**: Stripe keys in `.env.local`
3. **Node.js installed**: For running test scripts

### Run Comprehensive Tests
```bash
# Make script executable (one-time setup)
chmod +x scripts/run-stripe-checkout-tests.sh

# Run all comprehensive tests
./scripts/run-stripe-checkout-tests.sh

# Or run directly with Node
node scripts/test-stripe-checkout-comprehensive.js
```

### Run Production Validation
```bash
# Validate production readiness
node scripts/validate-production-readiness.js
```

## 📊 Test Categories & Coverage

### **Phase 1: Valid Request Tests**
- ✅ Complete payload with all fields
- ✅ Minimal required fields only
- ✅ Optional fields inclusion
- ✅ Response format validation

### **Phase 2: Invalid Request Tests**
- ✅ Missing required fields (`priceId`, `customerEmail`)
- ✅ Invalid email format handling
- ✅ Malformed JSON rejection
- ✅ Empty request body handling

### **Phase 3: HTTP Method Validation**
- ✅ GET requests return 405
- ✅ PUT requests return 405
- ✅ DELETE requests return 405
- ✅ PATCH requests return 405
- ✅ Error responses are valid JSON

### **Phase 4: Stripe Integration**
- ✅ Valid Stripe price ID format acceptance
- ✅ Response contains session data
- ✅ Proper error handling for Stripe failures

### **Phase 5: Error Handling**
- ✅ Invalid Content-Type header handling
- ✅ Missing Content-Type header handling
- ✅ Large request body handling
- ✅ Network error resilience

### **Phase 6: Performance**
- ✅ Response time benchmarking (target: <2s average)
- ✅ Memory usage monitoring
- ✅ Concurrent request handling
- ✅ Load testing capabilities

## 🔒 Production Validation Categories

### **Environment Configuration**
- ✅ Stripe secret key validation (`sk_live_` or `sk_test_`)
- ✅ Stripe publishable key validation (`pk_live_` or `pk_test_`)
- ✅ Price IDs configuration (`price_` prefixed)
- ✅ Key consistency (live vs test environment)

### **Security Validation**
- ✅ API security headers verification
- ✅ Input validation and sanitization
- ✅ Error message sanitization
- ✅ Sensitive data leakage prevention

### **API Validation**
- ✅ Endpoint accessibility testing
- ✅ JSON response format validation
- ✅ HTTP method restriction enforcement
- ✅ Error response consistency

### **Performance Validation**
- ✅ Response time performance (target: <2s)
- ✅ Concurrent request handling
- ✅ Memory usage monitoring
- ✅ Load capacity testing

### **Deployment Configuration**
- ✅ Next.js configuration validation
- ✅ Vercel configuration checking
- ✅ Package.json scripts verification
- ✅ Environment file structure validation

## 📈 Understanding Test Results

### **Test Output Format**
```
🧪 Testing: [Test Name]
✅ PASS: [Test Name] - Test succeeded
❌ FAIL: [Test Name] - Test failed
   Reason: [Detailed failure reason]
```

### **Summary Report**
```
🎯 OVERALL RESULTS:
   ✅ Total Passed: X
   ❌ Total Failed: Y
   📈 Overall Pass Rate: Z%
```

### **Production Readiness Levels**
- **🎉 READY FOR PRODUCTION** (95%+ pass rate, no critical issues)
- **⚠️ MOSTLY READY** (85%+ pass rate, no critical issues)
- **🚨 NOT READY** (Critical issues present)
- **⚠️ NEEDS WORK** (Multiple issues require attention)

## 🛠️ Troubleshooting Common Issues

### **"Development server not running"**
```bash
# Start the development server
npm run dev

# Verify it's running
curl http://localhost:3000/api/create-checkout-session
```

### **"Environment variables not set"**
```bash
# Check your .env.local file contains:
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...
```

### **"API endpoint returns 404"**
- Verify the App Router file exists: `app/api/create-checkout-session/route.ts`
- Check for conflicting Pages Router files: `pages/api/create-checkout-session.ts`
- Restart the development server

### **"JSON parsing errors"**
- Ensure API returns proper `Content-Type: application/json` headers
- Verify `NextResponse.json()` is used instead of raw JSON strings
- Check for malformed JSON in API responses

## 🎯 Best Practices

### **Before Each Test Run**
1. ✅ Ensure development server is running
2. ✅ Verify environment variables are set
3. ✅ Check that no other processes are using port 3000
4. ✅ Clear any browser caches if testing frontend integration

### **Interpreting Results**
1. **Focus on critical failures first** (environment, security)
2. **Address performance issues** if average response time > 2s
3. **Fix HTTP method validation** if non-POST requests aren't rejected
4. **Resolve JSON format issues** before deployment

### **Production Deployment Checklist**
- [ ] All comprehensive tests pass (90%+ pass rate)
- [ ] Production validation shows "READY FOR PRODUCTION"
- [ ] No critical security issues
- [ ] Environment variables configured in Vercel
- [ ] Stripe webhooks configured (if applicable)
- [ ] Error monitoring set up

## 📚 Additional Resources

### **Related Files**
- `app/api/create-checkout-session/route.ts` - Main API endpoint
- `.env.local` - Environment variables
- `.env.example` - Environment variable template
- `scripts/qa-stripe-subscription-flow.js` - Legacy QA script

### **Stripe Documentation**
- [Stripe Checkout Sessions](https://stripe.com/docs/api/checkout/sessions)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

### **Next.js App Router**
- [App Router API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [NextResponse Documentation](https://nextjs.org/docs/app/api-reference/functions/next-response)

## 🎉 Success Criteria

Your Stripe integration is production-ready when:

✅ **Comprehensive tests show 90%+ pass rate**  
✅ **Production validation shows "READY FOR PRODUCTION"**  
✅ **No critical security issues**  
✅ **Average response time under 2 seconds**  
✅ **All HTTP methods properly validated**  
✅ **Environment variables correctly configured**  
✅ **Error handling returns proper JSON responses**  

---

**Need help?** Check the test output for specific recommendations, or review the individual test files for detailed implementation examples.
