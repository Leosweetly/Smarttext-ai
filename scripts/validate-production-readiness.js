/**
 * Production Readiness Validation Script
 * 
 * This script validates that the Stripe integration is ready for production deployment:
 * 1. Environment variable validation
 * 2. Security headers verification
 * 3. API endpoint accessibility
 * 4. Error handling validation
 * 5. Performance benchmarking
 * 6. Deployment configuration checks
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Configuration
const LOCAL_URL = 'http://localhost:3000';
const PRODUCTION_URL = 'https://smarttext-ai.vercel.app';
const ENDPOINT = '/api/create-checkout-session';

// Validation results tracking
const validationResults = {
  environment: { passed: 0, failed: 0, checks: [] },
  security: { passed: 0, failed: 0, checks: [] },
  api: { passed: 0, failed: 0, checks: [] },
  performance: { passed: 0, failed: 0, checks: [] },
  deployment: { passed: 0, failed: 0, checks: [] }
};

/**
 * Validation helper function
 */
function runValidation(category, checkName, validationFunction) {
  return new Promise(async (resolve) => {
    try {
      console.log(`\n🔍 Validating: ${checkName}`);
      const result = await validationFunction();
      
      if (result.success) {
        console.log(`✅ PASS: ${checkName}`);
        validationResults[category].passed++;
      } else {
        console.log(`❌ FAIL: ${checkName}`);
        console.log(`   Issue: ${result.issue}`);
        if (result.recommendation) {
          console.log(`   Recommendation: ${result.recommendation}`);
        }
        validationResults[category].failed++;
      }
      
      validationResults[category].checks.push({
        name: checkName,
        success: result.success,
        issue: result.issue,
        recommendation: result.recommendation,
        details: result.details
      });
      
      resolve(result);
    } catch (error) {
      console.log(`❌ ERROR: ${checkName} - ${error.message}`);
      validationResults[category].failed++;
      validationResults[category].checks.push({
        name: checkName,
        success: false,
        issue: error.message,
        recommendation: 'Check the error details and fix the underlying issue',
        details: null
      });
      resolve({ success: false, issue: error.message });
    }
  });
}

/**
 * Phase 1: Environment Variable Validation
 */
async function validateEnvironment() {
  console.log('\n=== Phase 1: Environment Variable Validation ===');

  // Check for required environment variables
  await runValidation('environment', 'Stripe Secret Key Configuration', async () => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      return {
        success: false,
        issue: 'STRIPE_SECRET_KEY environment variable is not set',
        recommendation: 'Set STRIPE_SECRET_KEY in your .env.local file'
      };
    }

    if (!stripeSecretKey.startsWith('sk_')) {
      return {
        success: false,
        issue: 'STRIPE_SECRET_KEY does not appear to be a valid Stripe secret key',
        recommendation: 'Ensure STRIPE_SECRET_KEY starts with sk_ and is a valid Stripe secret key'
      };
    }

    const isLiveKey = stripeSecretKey.startsWith('sk_live_');
    const isTestKey = stripeSecretKey.startsWith('sk_test_');

    return {
      success: true,
      issue: null,
      details: {
        keyType: isLiveKey ? 'live' : isTestKey ? 'test' : 'unknown',
        keyLength: stripeSecretKey.length
      }
    };
  });

  // Check for Stripe publishable key
  await runValidation('environment', 'Stripe Publishable Key Configuration', async () => {
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!stripePublishableKey) {
      return {
        success: false,
        issue: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable is not set',
        recommendation: 'Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env.local file'
      };
    }

    if (!stripePublishableKey.startsWith('pk_')) {
      return {
        success: false,
        issue: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY does not appear to be a valid Stripe publishable key',
        recommendation: 'Ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY starts with pk_ and is a valid Stripe publishable key'
      };
    }

    const isLiveKey = stripePublishableKey.startsWith('pk_live_');
    const isTestKey = stripePublishableKey.startsWith('pk_test_');

    return {
      success: true,
      issue: null,
      details: {
        keyType: isLiveKey ? 'live' : isTestKey ? 'test' : 'unknown',
        keyLength: stripePublishableKey.length
      }
    };
  });

  // Check for Stripe price IDs
  await runValidation('environment', 'Stripe Price IDs Configuration', async () => {
    const priceIds = [
      'STRIPE_PRICE_BASIC',
      'STRIPE_PRICE_PRO', 
      'STRIPE_PRICE_ENTERPRISE'
    ];

    const missingPriceIds = [];
    const validPriceIds = [];

    for (const priceId of priceIds) {
      const value = process.env[priceId];
      if (!value) {
        missingPriceIds.push(priceId);
      } else if (value.startsWith('price_')) {
        validPriceIds.push(priceId);
      } else {
        missingPriceIds.push(`${priceId} (invalid format)`);
      }
    }

    if (missingPriceIds.length > 0) {
      return {
        success: false,
        issue: `Missing or invalid price IDs: ${missingPriceIds.join(', ')}`,
        recommendation: 'Set all Stripe price IDs in your .env.local file with valid price_ prefixed values'
      };
    }

    return {
      success: true,
      issue: null,
      details: {
        validPriceIds: validPriceIds.length,
        totalPriceIds: priceIds.length
      }
    };
  });

  // Check environment consistency
  await runValidation('environment', 'Environment Key Consistency', async () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!secretKey || !publishableKey) {
      return {
        success: false,
        issue: 'Cannot validate consistency - missing keys',
        recommendation: 'Ensure both secret and publishable keys are set'
      };
    }

    const secretIsLive = secretKey.startsWith('sk_live_');
    const publishableIsLive = publishableKey.startsWith('pk_live_');

    if (secretIsLive !== publishableIsLive) {
      return {
        success: false,
        issue: 'Stripe keys are inconsistent - mixing live and test keys',
        recommendation: 'Use either both live keys or both test keys, not a mix'
      };
    }

    return {
      success: true,
      issue: null,
      details: {
        environment: secretIsLive ? 'live' : 'test',
        consistent: true
      }
    };
  });
}

/**
 * Phase 2: Security Validation
 */
async function validateSecurity() {
  console.log('\n=== Phase 2: Security Validation ===');

  // Test API endpoint security headers
  await runValidation('security', 'API Security Headers', async () => {
    try {
      const response = await fetch(`${LOCAL_URL}${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          priceId: 'price_test',
          customerEmail: 'test@example.com'
        })
      });

      const headers = response.headers;
      const securityHeaders = {
        'content-type': headers.get('content-type'),
        'x-content-type-options': headers.get('x-content-type-options'),
        'x-frame-options': headers.get('x-frame-options'),
        'x-xss-protection': headers.get('x-xss-protection')
      };

      const hasContentType = securityHeaders['content-type']?.includes('application/json');
      
      if (!hasContentType) {
        return {
          success: false,
          issue: 'API does not return proper JSON content-type header',
          recommendation: 'Ensure API returns Content-Type: application/json header'
        };
      }

      return {
        success: true,
        issue: null,
        details: securityHeaders
      };
    } catch (error) {
      return {
        success: false,
        issue: `Failed to test security headers: ${error.message}`,
        recommendation: 'Ensure the development server is running and accessible'
      };
    }
  });

  // Test input validation
  await runValidation('security', 'Input Validation', async () => {
    try {
      // Test with malicious input
      const maliciousInputs = [
        { priceId: '<script>alert("xss")</script>', customerEmail: 'test@example.com' },
        { priceId: 'price_test', customerEmail: '<script>alert("xss")</script>' },
        { priceId: '../../etc/passwd', customerEmail: 'test@example.com' },
        { priceId: 'price_test', customerEmail: 'test@example.com', metadata: { evil: '<script>' } }
      ];

      for (const input of maliciousInputs) {
        const response = await fetch(`${LOCAL_URL}${ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(input)
        });

        // Should either reject with 400 or handle safely
        if (response.status === 200) {
          const data = await response.json();
          // Check if malicious input was reflected in response
          const responseText = JSON.stringify(data);
          if (responseText.includes('<script>') || responseText.includes('../../')) {
            return {
              success: false,
              issue: 'API reflects malicious input without sanitization',
              recommendation: 'Implement proper input validation and sanitization'
            };
          }
        }
      }

      return {
        success: true,
        issue: null,
        details: {
          testedInputs: maliciousInputs.length,
          allHandledSafely: true
        }
      };
    } catch (error) {
      return {
        success: false,
        issue: `Failed to test input validation: ${error.message}`,
        recommendation: 'Ensure the development server is running and accessible'
      };
    }
  });

  // Test error message sanitization
  await runValidation('security', 'Error Message Sanitization', async () => {
    try {
      const response = await fetch(`${LOCAL_URL}${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Empty body to trigger validation error
      });

      if (response.status === 200) {
        return {
          success: false,
          issue: 'API accepts empty request body when it should validate required fields',
          recommendation: 'Implement proper request validation'
        };
      }

      const errorData = await response.json();
      const errorText = JSON.stringify(errorData);

      // Check for sensitive information leakage
      const sensitivePatterns = [
        /sk_[a-zA-Z0-9_]+/, // Stripe secret keys
        /password/i,
        /secret/i,
        /token/i,
        /api[_-]?key/i
      ];

      for (const pattern of sensitivePatterns) {
        if (pattern.test(errorText)) {
          return {
            success: false,
            issue: 'Error messages may contain sensitive information',
            recommendation: 'Sanitize error messages to avoid leaking sensitive data'
          };
        }
      }

      return {
        success: true,
        issue: null,
        details: {
          errorStatus: response.status,
          errorSanitized: true
        }
      };
    } catch (error) {
      return {
        success: false,
        issue: `Failed to test error sanitization: ${error.message}`,
        recommendation: 'Ensure the development server is running and accessible'
      };
    }
  });
}

/**
 * Phase 3: API Validation
 */
async function validateAPI() {
  console.log('\n=== Phase 3: API Validation ===');

  // Test API endpoint accessibility
  await runValidation('api', 'API Endpoint Accessibility', async () => {
    try {
      const response = await fetch(`${LOCAL_URL}${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          priceId: 'price_test',
          customerEmail: 'test@example.com'
        })
      });

      if (response.status === 404) {
        return {
          success: false,
          issue: 'API endpoint returns 404 - route not found',
          recommendation: 'Ensure the App Router route is properly configured at app/api/create-checkout-session/route.ts'
        };
      }

      if (response.status >= 500) {
        return {
          success: false,
          issue: `API endpoint returns server error: ${response.status}`,
          recommendation: 'Check server logs for internal errors'
        };
      }

      return {
        success: true,
        issue: null,
        details: {
          status: response.status,
          accessible: true
        }
      };
    } catch (error) {
      return {
        success: false,
        issue: `Failed to access API endpoint: ${error.message}`,
        recommendation: 'Ensure the development server is running on http://localhost:3000'
      };
    }
  });

  // Test JSON response format
  await runValidation('api', 'JSON Response Format', async () => {
    try {
      const response = await fetch(`${LOCAL_URL}${ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          priceId: 'price_test',
          customerEmail: 'test@example.com'
        })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {
          success: false,
          issue: 'API does not return JSON content-type header',
          recommendation: 'Ensure API returns proper Content-Type: application/json header'
        };
      }

      const data = await response.json();
      if (typeof data !== 'object' || data === null) {
        return {
          success: false,
          issue: 'API does not return valid JSON object',
          recommendation: 'Ensure API returns a valid JSON object response'
        };
      }

      return {
        success: true,
        issue: null,
        details: {
          contentType,
          validJSON: true,
          responseKeys: Object.keys(data)
        }
      };
    } catch (error) {
      return {
        success: false,
        issue: `Failed to validate JSON response: ${error.message}`,
        recommendation: 'Check API implementation for JSON parsing issues'
      };
    }
  });

  // Test HTTP method validation
  await runValidation('api', 'HTTP Method Validation', async () => {
    try {
      const invalidMethods = ['GET', 'PUT', 'DELETE', 'PATCH'];
      const results = [];

      for (const method of invalidMethods) {
        const response = await fetch(`${LOCAL_URL}${ENDPOINT}`, {
          method,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        results.push({
          method,
          status: response.status,
          shouldBe405: response.status === 405
        });
      }

      const allCorrect = results.every(r => r.shouldBe405);
      
      if (!allCorrect) {
        const incorrect = results.filter(r => !r.shouldBe405);
        return {
          success: false,
          issue: `Invalid HTTP methods not properly rejected: ${incorrect.map(r => `${r.method}:${r.status}`).join(', ')}`,
          recommendation: 'Ensure API returns 405 Method Not Allowed for non-POST requests'
        };
      }

      return {
        success: true,
        issue: null,
        details: {
          testedMethods: invalidMethods.length,
          allRejected: true
        }
      };
    } catch (error) {
      return {
        success: false,
        issue: `Failed to test HTTP methods: ${error.message}`,
        recommendation: 'Check API implementation for method handling'
      };
    }
  });
}

/**
 * Phase 4: Performance Validation
 */
async function validatePerformance() {
  console.log('\n=== Phase 4: Performance Validation ===');

  // Test response time
  await runValidation('performance', 'Response Time Performance', async () => {
    try {
      const testData = {
        priceId: 'price_test',
        customerEmail: 'test@example.com'
      };

      const responseTimes = [];
      const numTests = 5;

      for (let i = 0; i < numTests; i++) {
        const startTime = Date.now();
        
        const response = await fetch(`${LOCAL_URL}${ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testData)
        });

        await response.json(); // Ensure full response is received
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      // Consider acceptable if average is under 2 seconds
      if (avgResponseTime > 2000) {
        return {
          success: false,
          issue: `Average response time too high: ${avgResponseTime.toFixed(0)}ms`,
          recommendation: 'Optimize API performance or check for network issues'
        };
      }

      return {
        success: true,
        issue: null,
        details: {
          avgResponseTime: Math.round(avgResponseTime),
          maxResponseTime,
          numTests,
          allResponseTimes: responseTimes
        }
      };
    } catch (error) {
      return {
        success: false,
        issue: `Failed to test performance: ${error.message}`,
        recommendation: 'Ensure the development server is running and accessible'
      };
    }
  });

  // Test concurrent request handling
  await runValidation('performance', 'Concurrent Request Handling', async () => {
    try {
      const testData = {
        priceId: 'price_test',
        customerEmail: 'test@example.com'
      };

      const numConcurrentRequests = 3;
      const requests = [];

      for (let i = 0; i < numConcurrentRequests; i++) {
        requests.push(
          fetch(`${LOCAL_URL}${ENDPOINT}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
          })
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const allSuccessful = responses.every(r => r.status < 500);
      const totalTime = endTime - startTime;

      if (!allSuccessful) {
        return {
          success: false,
          issue: 'Some concurrent requests failed with server errors',
          recommendation: 'Check server capacity and error handling for concurrent requests'
        };
      }

      return {
        success: true,
        issue: null,
        details: {
          numRequests: numConcurrentRequests,
          totalTime,
          allSuccessful,
          avgTimePerRequest: Math.round(totalTime / numConcurrentRequests)
        }
      };
    } catch (error) {
      return {
        success: false,
        issue: `Failed to test concurrent requests: ${error.message}`,
        recommendation: 'Check server stability and error handling'
      };
    }
  });
}

/**
 * Phase 5: Deployment Configuration Validation
 */
async function validateDeployment() {
  console.log('\n=== Phase 5: Deployment Configuration Validation ===');

  // Check Next.js configuration
  await runValidation('deployment', 'Next.js Configuration', async () => {
    try {
      const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
      
      if (!fs.existsSync(nextConfigPath)) {
        return {
          success: false,
          issue: 'next.config.mjs file not found',
          recommendation: 'Create a next.config.mjs file for production configuration'
        };
      }

      const configContent = fs.readFileSync(nextConfigPath, 'utf8');
      
      // Check for common production configurations
      const hasExperimentalAppDir = configContent.includes('experimental') && configContent.includes('appDir');
      const hasOutputConfig = configContent.includes('output');

      return {
        success: true,
        issue: null,
        details: {
          configExists: true,
          hasExperimentalAppDir,
          hasOutputConfig,
          configLength: configContent.length
        }
      };
    } catch (error) {
      return {
        success: false,
        issue: `Failed to validate Next.js config: ${error.message}`,
        recommendation: 'Check Next.js configuration file for syntax errors'
      };
    }
  });

  // Check Vercel configuration
  await runValidation('deployment', 'Vercel Configuration', async () => {
    try {
      const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
      
      if (!fs.existsSync(vercelConfigPath)) {
        return {
          success: true, // Not required, but good to have
          issue: null,
          details: {
            configExists: false,
            note: 'vercel.json is optional but recommended for custom configuration'
          }
        };
      }

      const configContent = fs.readFileSync(vercelConfigPath, 'utf8');
      const config = JSON.parse(configContent);

      return {
        success: true,
        issue: null,
        details: {
          configExists: true,
          hasBuilds: !!config.builds,
          hasRoutes: !!config.routes,
          hasEnv: !!config.env,
          configKeys: Object.keys(config)
        }
      };
    } catch (error) {
      return {
        success: false,
        issue: `Failed to validate Vercel config: ${error.message}`,
        recommendation: 'Check vercel.json file for syntax errors'
      };
    }
  });

  // Check package.json scripts
  await runValidation('deployment', 'Package.json Build Scripts', async () => {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      
      if (!fs.existsSync(packageJsonPath)) {
        return {
          success: false,
          issue: 'package.json file not found',
          recommendation: 'Ensure package.json exists in the project root'
        };
      }

      const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageContent);

      const scripts = packageJson.scripts || {};
      const requiredScripts = ['build', 'start', 'dev'];
      const missingScripts = requiredScripts.filter(script => !scripts[script]);

      if (missingScripts.length > 0) {
        return {
          success: false,
          issue: `Missing required scripts: ${missingScripts.join(', ')}`,
          recommendation: 'Add missing scripts to package.json for proper deployment'
        };
      }

      return {
        success: true,
        issue: null,
        details: {
          hasAllRequiredScripts: true,
          availableScripts: Object.keys(scripts),
          nextVersion: packageJson.dependencies?.next || 'not found'
        }
      };
    } catch (error) {
      return {
        success: false,
        issue: `Failed to validate package.json: ${error.message}`,
        recommendation: 'Check package.json file for syntax errors'
      };
    }
  });

  // Check environment file structure
  await runValidation('deployment', 'Environment File Structure', async () => {
    try {
      const envFiles = [
        '.env.local',
        '.env.example',
        '.env.production'
      ];

      const fileStatus = {};
      
      for (const file of envFiles) {
        const filePath = path.join(process.cwd(), file);
        fileStatus[file] = {
          exists: fs.existsSync(filePath),
          size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
        };
      }

      const hasLocal = fileStatus['.env.local'].exists;
      const hasExample = fileStatus['.env.example'].exists;

      if (!hasLocal) {
        return {
          success: false,
          issue: '.env.local file not found',
          recommendation: 'Create .env.local file with required environment variables'
        };
      }

      return {
        success: true,
        issue: null,
        details: {
          fileStatus,
          hasRequiredFiles: hasLocal,
          hasExampleFile: hasExample
        }
      };
    } catch (error) {
      return {
        success: false,
        issue: `Failed to validate environment files: ${error.message}`,
        recommendation: 'Check file system permissions and environment file structure'
      };
    }
  });
}

/**
 * Print comprehensive validation results
 */
function printValidationResults() {
  console.log('\n' + '='.repeat(70));
  console.log('🏁 PRODUCTION READINESS VALIDATION RESULTS');
  console.log('='.repeat(70));

  const categories = [
    { key: 'environment', name: 'Environment Configuration' },
    { key: 'security', name: 'Security Validation' },
    { key: 'api', name: 'API Validation' },
    { key: 'performance', name: 'Performance Validation' },
    { key: 'deployment', name: 'Deployment Configuration' }
  ];

  let totalPassed = 0;
  let totalFailed = 0;
  let criticalIssues = [];

  categories.forEach(category => {
    const results = validationResults[category.key];
    const total = results.passed + results.failed;
    const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : '0.0';
    
    console.log(`\n📊 ${category.name}:`);
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   📈 Pass Rate: ${passRate}%`);
    
    if (results.failed > 0) {
      console.log(`   🔍 Issues Found:`);
      results.checks.filter(c => !c.success).forEach(check => {
        console.log(`      • ${check.name}: ${check.issue}`);
        if (check.recommendation) {
          console.log(`        → ${check.recommendation}`);
        }
        
        // Mark critical issues
        if (category.key === 'environment' || category.key === 'security') {
          criticalIssues.push(`${category.name}: ${check.name}`);
        }
      });
    }

    totalPassed += results.passed;
    totalFailed += results.failed;
  });

  const overallTotal = totalPassed + totalFailed;
  const overallPassRate = overallTotal > 0 ? ((totalPassed / overallTotal) * 100).toFixed(1) : '0.0';

  console.log('\n' + '='.repeat(70));
  console.log('🎯 OVERALL PRODUCTION READINESS:');
  console.log(`   ✅ Total Passed: ${totalPassed}`);
  console.log(`   ❌ Total Failed: ${totalFailed}`);
  console.log(`   📈 Overall Pass Rate: ${overallPassRate}%`);
  
  if (criticalIssues.length > 0) {
    console.log(`   🚨 Critical Issues: ${criticalIssues.length}`);
    criticalIssues.forEach(issue => {
      console.log(`      • ${issue}`);
    });
  }

  console.log('\n🚀 DEPLOYMENT RECOMMENDATION:');
  
  if (overallPassRate >= 95 && criticalIssues.length === 0) {
    console.log('   🎉 READY FOR PRODUCTION: All validations passed!');
    console.log('   ✅ Your Stripe integration is production-ready');
    console.log('   ✅ Deploy with confidence');
  } else if (overallPassRate >= 85 && criticalIssues.length === 0) {
    console.log('   ⚠️  MOSTLY READY: Minor issues to address');
    console.log('   ✅ Core functionality is solid');
    console.log('   📝 Address minor issues before production deployment');
  } else if (criticalIssues.length > 0) {
    console.log('   🚨 NOT READY: Critical issues must be resolved');
    console.log('   ❌ Fix critical issues before deploying to production');
    console.log('   🔧 Focus on environment and security configurations');
  } else {
    console.log('   ⚠️  NEEDS WORK: Multiple issues require attention');
    console.log('   📝 Address failed validations before production deployment');
  }

  console.log('='.repeat(70));

  return {
    totalPassed,
    totalFailed,
    overallPassRate: parseFloat(overallPassRate),
    criticalIssues: criticalIssues.length,
    readyForProduction: overallPassRate >= 95 && criticalIssues.length === 0,
    categoryResults: validationResults
  };
}

/**
 * Main validation execution function
 */
async function runProductionValidation() {
  console.log('🚀 Starting Production Readiness Validation');
  console.log(`📍 Validating Stripe integration for production deployment`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);

  try {
    // Run all validation phases
    await validateEnvironment();
    await validateSecurity();
    await validateAPI();
    await validatePerformance();
    await validateDeployment();

    // Print comprehensive results
    const results = printValidationResults();

    console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
    
    return results;
  } catch (error) {
    console.error('❌ Validation execution failed:', error);
    return null;
  }
}

// Export for use in other scripts
export { runProductionValidation, validationResults };

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runProductionValidation().catch(console.error);
}
