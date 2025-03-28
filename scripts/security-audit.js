#!/usr/bin/env node

/**
 * This script performs a security audit of the SmartText AI application.
 * It checks for common security issues and provides recommendations.
 * 
 * Usage: node scripts/security-audit.js
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { execSync } = require('child_process');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const REQUIRED_ENV_VARS = [
  'AUTH0_SECRET',
  'AUTH0_BASE_URL',
  'AUTH0_ISSUER_BASE_URL',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
  'AIRTABLE_PAT',
  'TWILIO_SID',
  'TWILIO_AUTH_TOKEN',
  'ZAPIER_WEBHOOK_SECRET',
  'SENTRY_DSN'
];

// Results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  total: 0
};

/**
 * Log a message with color
 * @param {string} message - The message to log
 * @param {string} type - The type of message (info, success, warning, error)
 */
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m%s\x1b[0m',    // Cyan
    success: '\x1b[32m%s\x1b[0m',  // Green
    warning: '\x1b[33m%s\x1b[0m',  // Yellow
    error: '\x1b[31m%s\x1b[0m'     // Red
  };
  
  console.log(colors[type], message);
}

/**
 * Check if a file exists
 * @param {string} filePath - The path to the file
 * @returns {boolean} Whether the file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Check if a directory exists
 * @param {string} dirPath - The path to the directory
 * @returns {boolean} Whether the directory exists
 */
function directoryExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Check if a file contains a pattern
 * @param {string} filePath - The path to the file
 * @param {RegExp} pattern - The pattern to search for
 * @returns {boolean} Whether the file contains the pattern
 */
function fileContainsPattern(filePath, pattern) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return pattern.test(content);
  } catch (error) {
    return false;
  }
}

/**
 * Find files matching a pattern
 * @param {string} dir - The directory to search in
 * @param {RegExp} pattern - The pattern to match file names against
 * @param {boolean} recursive - Whether to search recursively
 * @returns {string[]} The matching file paths
 */
function findFiles(dir, pattern, recursive = true) {
  let results = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && recursive) {
        results = results.concat(findFiles(itemPath, pattern, recursive));
      } else if (stat.isFile() && pattern.test(item)) {
        results.push(itemPath);
      }
    }
  } catch (error) {
    log(`Error searching directory ${dir}: ${error.message}`, 'error');
  }
  
  return results;
}

/**
 * Run a security check
 * @param {string} name - The name of the check
 * @param {Function} checkFn - The check function
 */
function runCheck(name, checkFn) {
  results.total++;
  
  log(`\n🔍 Running check: ${name}`);
  
  try {
    const result = checkFn();
    
    if (result === true) {
      log(`✅ Passed: ${name}`, 'success');
      results.passed++;
    } else if (result === false) {
      log(`❌ Failed: ${name}`, 'error');
      results.failed++;
    } else if (typeof result === 'string') {
      log(`⚠️ Warning: ${name} - ${result}`, 'warning');
      results.warnings++;
    }
  } catch (error) {
    log(`❌ Error running check ${name}: ${error.message}`, 'error');
    results.failed++;
  }
}

/**
 * Check for required environment variables
 */
function checkRequiredEnvVars() {
  const missing = REQUIRED_ENV_VARS.filter(envVar => !process.env[envVar]);
  
  if (missing.length === 0) {
    return true;
  }
  
  log(`Missing required environment variables: ${missing.join(', ')}`, 'error');
  return false;
}

/**
 * Check for sensitive information in code
 */
function checkSensitiveInfoInCode() {
  const patterns = [
    /password\s*=\s*['"][^'"]+['"]/i,
    /apiKey\s*=\s*['"][^'"]+['"]/i,
    /secret\s*=\s*['"][^'"]+['"]/i,
    /token\s*=\s*['"][^'"]+['"]/i,
    /auth\s*=\s*['"][^'"]+['"]/i
  ];
  
  const excludeDirs = [
    'node_modules',
    '.git',
    '.next',
    'build',
    'dist'
  ];
  
  const jsFiles = [];
  
  // Find all JS/TS files
  const findJsFiles = (dir) => {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      if (excludeDirs.includes(item)) continue;
      
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        findJsFiles(itemPath);
      } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(item)) {
        jsFiles.push(itemPath);
      }
    }
  };
  
  try {
    findJsFiles(ROOT_DIR);
    
    const issues = [];
    
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(ROOT_DIR, file);
      
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          const matches = content.match(pattern);
          if (matches) {
            issues.push(`${relativePath}: ${matches[0]}`);
          }
        }
      }
    }
    
    if (issues.length === 0) {
      return true;
    }
    
    log(`Found potential sensitive information in code:`, 'error');
    issues.forEach(issue => log(`  - ${issue}`, 'error'));
    return false;
  } catch (error) {
    log(`Error checking for sensitive information: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Check for proper CORS configuration
 */
function checkCorsConfiguration() {
  const nextConfigPath = path.join(ROOT_DIR, 'next.config.mjs');
  
  if (!fileExists(nextConfigPath)) {
    return 'Could not find next.config.mjs';
  }
  
  const content = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Check if CORS is configured
  if (!content.includes('headers:') || !content.includes('Access-Control-Allow-Origin')) {
    return 'CORS headers not found in next.config.mjs';
  }
  
  // Check if CORS is properly restricted
  if (content.includes('Access-Control-Allow-Origin: *')) {
    return 'CORS allows all origins (*)';
  }
  
  return true;
}

/**
 * Check for proper authentication in API routes
 */
function checkApiAuthentication() {
  const apiDir = path.join(ROOT_DIR, 'app/api');
  
  if (!directoryExists(apiDir)) {
    return 'Could not find API directory';
  }
  
  const apiFiles = findFiles(apiDir, /route\.(js|ts)$/);
  const unauthenticatedRoutes = [];
  
  for (const file of apiFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(ROOT_DIR, file);
    
    // Skip webhook routes and public routes
    if (
      file.includes('/api/webhooks/') ||
      file.includes('/api/auth/callback/') ||
      file.includes('/api/auth/login/') ||
      file.includes('/api/auth/logout/')
    ) {
      continue;
    }
    
    // Check if the route has authentication
    const hasAuth = (
      content.includes('getSession') ||
      content.includes('withApiAuthRequired') ||
      content.includes('Authorization') ||
      content.includes('auth0.getAccessToken') ||
      content.includes('req.headers.authorization')
    );
    
    if (!hasAuth) {
      unauthenticatedRoutes.push(relativePath);
    }
  }
  
  if (unauthenticatedRoutes.length === 0) {
    return true;
  }
  
  log(`Found API routes without authentication:`, 'warning');
  unauthenticatedRoutes.forEach(route => log(`  - ${route}`, 'warning'));
  return `${unauthenticatedRoutes.length} API routes without authentication`;
}

/**
 * Check for proper error handling
 */
function checkErrorHandling() {
  const apiDir = path.join(ROOT_DIR, 'app/api');
  
  if (!directoryExists(apiDir)) {
    return 'Could not find API directory';
  }
  
  const apiFiles = findFiles(apiDir, /route\.(js|ts)$/);
  const routesWithoutErrorHandling = [];
  
  for (const file of apiFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(ROOT_DIR, file);
    
    // Check if the route has try/catch blocks
    const hasTryCatch = content.includes('try {') && content.includes('catch');
    
    // Check if the route uses error handling utilities
    const hasErrorUtils = (
      content.includes('handleApiError') ||
      content.includes('handleTwilioError') ||
      content.includes('handleAirtableError') ||
      content.includes('handleAuth0Error')
    );
    
    if (!hasTryCatch && !hasErrorUtils) {
      routesWithoutErrorHandling.push(relativePath);
    }
  }
  
  if (routesWithoutErrorHandling.length === 0) {
    return true;
  }
  
  log(`Found API routes without proper error handling:`, 'warning');
  routesWithoutErrorHandling.forEach(route => log(`  - ${route}`, 'warning'));
  return `${routesWithoutErrorHandling.length} API routes without proper error handling`;
}

/**
 * Check for proper input validation
 */
function checkInputValidation() {
  const apiDir = path.join(ROOT_DIR, 'app/api');
  
  if (!directoryExists(apiDir)) {
    return 'Could not find API directory';
  }
  
  const apiFiles = findFiles(apiDir, /route\.(js|ts)$/);
  const routesWithoutInputValidation = [];
  
  for (const file of apiFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(ROOT_DIR, file);
    
    // Skip routes that don't handle POST/PUT/PATCH requests
    if (
      !content.includes('POST') &&
      !content.includes('PUT') &&
      !content.includes('PATCH')
    ) {
      continue;
    }
    
    // Check if the route validates input
    const hasValidation = (
      content.includes('if (!') ||
      content.includes('validate') ||
      content.includes('schema') ||
      content.includes('required')
    );
    
    if (!hasValidation) {
      routesWithoutInputValidation.push(relativePath);
    }
  }
  
  if (routesWithoutInputValidation.length === 0) {
    return true;
  }
  
  log(`Found API routes without input validation:`, 'warning');
  routesWithoutInputValidation.forEach(route => log(`  - ${route}`, 'warning'));
  return `${routesWithoutInputValidation.length} API routes without input validation`;
}

/**
 * Check for proper CSP configuration
 */
function checkCspConfiguration() {
  const nextConfigPath = path.join(ROOT_DIR, 'next.config.mjs');
  
  if (!fileExists(nextConfigPath)) {
    return 'Could not find next.config.mjs';
  }
  
  const content = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Check if CSP is configured
  if (!content.includes('Content-Security-Policy')) {
    return 'Content Security Policy not found in next.config.mjs';
  }
  
  return true;
}

/**
 * Check for proper rate limiting
 */
function checkRateLimiting() {
  const apiDir = path.join(ROOT_DIR, 'app/api');
  
  if (!directoryExists(apiDir)) {
    return 'Could not find API directory';
  }
  
  // Check if rate limiting middleware is used
  const hasRateLimiting = findFiles(ROOT_DIR, /rate-limit\.(js|ts)$/).length > 0;
  
  if (!hasRateLimiting) {
    return 'Rate limiting middleware not found';
  }
  
  return true;
}

/**
 * Check for proper dependency security
 */
function checkDependencySecurity() {
  try {
    log('Running npm audit...', 'info');
    const auditOutput = execSync('npm audit --json', { cwd: ROOT_DIR }).toString();
    const auditResult = JSON.parse(auditOutput);
    
    if (auditResult.metadata.vulnerabilities.high > 0 || auditResult.metadata.vulnerabilities.critical > 0) {
      log(`Found ${auditResult.metadata.vulnerabilities.high} high and ${auditResult.metadata.vulnerabilities.critical} critical vulnerabilities`, 'error');
      return false;
    }
    
    if (auditResult.metadata.vulnerabilities.moderate > 0) {
      log(`Found ${auditResult.metadata.vulnerabilities.moderate} moderate vulnerabilities`, 'warning');
      return `${auditResult.metadata.vulnerabilities.moderate} moderate vulnerabilities found`;
    }
    
    return true;
  } catch (error) {
    log(`Error running npm audit: ${error.message}`, 'error');
    return 'Could not run npm audit';
  }
}

/**
 * Check for proper Sentry configuration
 */
function checkSentryConfiguration() {
  const sentryConfigPath = path.join(ROOT_DIR, 'lib/utils/sentry.js');
  
  if (!fileExists(sentryConfigPath)) {
    return 'Could not find Sentry configuration file';
  }
  
  const content = fs.readFileSync(sentryConfigPath, 'utf8');
  
  // Check if Sentry is properly configured
  if (!content.includes('Sentry.init')) {
    return 'Sentry initialization not found';
  }
  
  // Check if SENTRY_DSN is used
  if (!content.includes('process.env.SENTRY_DSN')) {
    return 'SENTRY_DSN environment variable not used';
  }
  
  return true;
}

/**
 * Check for proper Auth0 configuration
 */
function checkAuth0Configuration() {
  const auth0ConfigPath = path.join(ROOT_DIR, 'lib/auth/auth0.js');
  
  if (!fileExists(auth0ConfigPath)) {
    return 'Could not find Auth0 configuration file';
  }
  
  const content = fs.readFileSync(auth0ConfigPath, 'utf8');
  
  // Check if Auth0 is properly configured
  if (!content.includes('initAuth0')) {
    return 'Auth0 initialization not found';
  }
  
  // Check if required environment variables are used
  const requiredVars = [
    'AUTH0_SECRET',
    'AUTH0_BASE_URL',
    'AUTH0_ISSUER_BASE_URL',
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET'
  ];
  
  const missingVars = requiredVars.filter(v => !content.includes(`process.env.${v}`));
  
  if (missingVars.length > 0) {
    return `Missing Auth0 environment variables: ${missingVars.join(', ')}`;
  }
  
  return true;
}

/**
 * Main function
 */
async function main() {
  log('\n🔒 SmartText AI Security Audit');
  log('============================');
  
  // Run security checks
  runCheck('Required Environment Variables', checkRequiredEnvVars);
  runCheck('Sensitive Information in Code', checkSensitiveInfoInCode);
  runCheck('CORS Configuration', checkCorsConfiguration);
  runCheck('API Authentication', checkApiAuthentication);
  runCheck('Error Handling', checkErrorHandling);
  runCheck('Input Validation', checkInputValidation);
  runCheck('Content Security Policy', checkCspConfiguration);
  runCheck('Rate Limiting', checkRateLimiting);
  runCheck('Dependency Security', checkDependencySecurity);
  runCheck('Sentry Configuration', checkSentryConfiguration);
  runCheck('Auth0 Configuration', checkAuth0Configuration);
  
  // Print results
  log('\n📊 Security Audit Results:', 'info');
  log(`   Total checks: ${results.total}`, 'info');
  log(`   Passed: ${results.passed}`, 'success');
  log(`   Warnings: ${results.warnings}`, 'warning');
  log(`   Failed: ${results.failed}`, 'error');
  
  // Print recommendations
  if (results.warnings > 0 || results.failed > 0) {
    log('\n📝 Recommendations:', 'info');
    
    if (results.failed > 0) {
      log('   1. Fix all failed checks before deploying to production', 'error');
    }
    
    if (results.warnings > 0) {
      log('   2. Review all warnings and address them if possible', 'warning');
    }
    
    log('   3. Run this security audit regularly to ensure ongoing security', 'info');
    log('   4. Consider using a third-party security scanning tool for additional checks', 'info');
    log('   5. Implement a security incident response plan', 'info');
  } else {
    log('\n✅ All security checks passed!', 'success');
  }
}

// Run the main function
main().catch(error => {
  log(`❌ Unhandled error: ${error.message}`, 'error');
  process.exit(1);
});
