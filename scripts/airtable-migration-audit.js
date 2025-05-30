#!/usr/bin/env node

/**
 * Airtable Migration Audit Script
 * 
 * This script analyzes current Airtable usage patterns and creates baseline
 * snapshots for safe migration to Supabase-only architecture.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const AUDIT_CONFIG = {
  outputDir: path.join(process.cwd(), 'migration-audit'),
  timestamp: new Date().toISOString().replace(/[:.]/g, '-'),
  endpoints: [
    'pages/api/missed-call.ts',
    'pages/api/twilio/voice.ts'
  ]
};

/**
 * Create audit directory structure
 */
function createAuditStructure() {
  const auditDir = AUDIT_CONFIG.outputDir;
  
  if (!fs.existsSync(auditDir)) {
    fs.mkdirSync(auditDir, { recursive: true });
  }
  
  // Create subdirectories
  const subdirs = ['snapshots', 'logs', 'tests', 'reports'];
  subdirs.forEach(dir => {
    const dirPath = path.join(auditDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
  
  console.log(`✅ Created audit structure in: ${auditDir}`);
}

/**
 * Analyze current API endpoint usage
 */
function analyzeEndpointUsage() {
  const analysis = {
    timestamp: new Date().toISOString(),
    endpoints: {},
    airtableReferences: [],
    supabaseReferences: [],
    recommendations: []
  };
  
  AUDIT_CONFIG.endpoints.forEach(endpoint => {
    const filePath = path.join(process.cwd(), endpoint);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Analyze imports and function calls
      const airtableImports = content.match(/import.*api-compat/g) || [];
      const supabaseImports = content.match(/import.*supabase/g) || [];
      const functionCalls = content.match(/getBusinessByPhoneNumber|logCallEvent|trackSmsEvent|trackOwnerAlert/g) || [];
      
      analysis.endpoints[endpoint] = {
        hasAirtableCompat: airtableImports.length > 0,
        hasDirectSupabase: supabaseImports.length > 0,
        functionCalls: functionCalls,
        complexity: calculateComplexity(content),
        linesOfCode: content.split('\n').length
      };
      
      // Track references
      if (airtableImports.length > 0) {
        analysis.airtableReferences.push(endpoint);
      }
      if (supabaseImports.length > 0) {
        analysis.supabaseReferences.push(endpoint);
      }
    }
  });
  
  // Generate recommendations
  analysis.recommendations = generateMigrationRecommendations(analysis);
  
  return analysis;
}

/**
 * Calculate endpoint complexity for migration prioritization
 */
function calculateComplexity(content) {
  let complexity = 0;
  
  // Count function calls
  complexity += (content.match(/await\s+/g) || []).length;
  
  // Count error handling blocks
  complexity += (content.match(/try\s*{|catch\s*\(/g) || []).length;
  
  // Count conditional statements
  complexity += (content.match(/if\s*\(|else\s+if\s*\(/g) || []).length;
  
  // Count loops
  complexity += (content.match(/for\s*\(|while\s*\(/g) || []).length;
  
  return complexity;
}

/**
 * Generate migration recommendations based on analysis
 */
function generateMigrationRecommendations(analysis) {
  const recommendations = [];
  
  // Sort endpoints by complexity (simplest first)
  const endpointsByComplexity = Object.entries(analysis.endpoints)
    .sort(([,a], [,b]) => a.complexity - b.complexity);
  
  recommendations.push({
    type: 'migration_order',
    title: 'Recommended Migration Order',
    description: 'Migrate endpoints from simplest to most complex',
    order: endpointsByComplexity.map(([endpoint, data]) => ({
      endpoint,
      complexity: data.complexity,
      reason: data.complexity < 10 ? 'Low complexity' : 
              data.complexity < 20 ? 'Medium complexity' : 'High complexity'
    }))
  });
  
  // Identify which endpoint to start with
  const firstEndpoint = endpointsByComplexity[0];
  if (firstEndpoint) {
    recommendations.push({
      type: 'start_with',
      title: 'Start Migration With',
      endpoint: firstEndpoint[0],
      reason: `Lowest complexity (${firstEndpoint[1].complexity} points), ${firstEndpoint[1].linesOfCode} lines of code`,
      hasAirtableCompat: firstEndpoint[1].hasAirtableCompat,
      hasDirectSupabase: firstEndpoint[1].hasDirectSupabase
    });
  }
  
  return recommendations;
}

/**
 * Create test snapshots for current behavior
 */
function createTestSnapshots() {
  const snapshots = {
    timestamp: new Date().toISOString(),
    endpoints: {}
  };
  
  AUDIT_CONFIG.endpoints.forEach(endpoint => {
    const testFile = `scripts/test-${endpoint.replace(/[\/\.]/g, '-')}.js`;
    
    snapshots.endpoints[endpoint] = {
      testFile,
      description: `Baseline test for ${endpoint}`,
      created: new Date().toISOString()
    };
    
    // Create a basic test file for this endpoint
    const testContent = generateTestFile(endpoint);
    fs.writeFileSync(path.join(process.cwd(), testFile), testContent);
    
    console.log(`✅ Created test snapshot: ${testFile}`);
  });
  
  return snapshots;
}

/**
 * Generate test file content for an endpoint
 */
function generateTestFile(endpoint) {
  const endpointName = endpoint.split('/').pop().replace('.ts', '');
  
  return `#!/usr/bin/env node

/**
 * Baseline Test for ${endpoint}
 * Generated by airtable-migration-audit.js
 * 
 * This test captures current behavior before migration
 */

import fetch from 'node-fetch';

const TEST_CONFIG = {
  baseUrl: process.env.VERCEL_URL || 'http://localhost:3000',
  endpoint: '/${endpoint.replace('pages/', '').replace('.ts', '')}',
  testPhone: '+15551234567'
};

async function testCurrentBehavior() {
  console.log(\`🧪 Testing current behavior of \${TEST_CONFIG.endpoint}\`);
  
  try {
    // Test with valid phone number
    const response = await fetch(\`\${TEST_CONFIG.baseUrl}\${TEST_CONFIG.endpoint}\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: TEST_CONFIG.testPhone,
        From: '+15559876543',
        CallSid: 'test-call-sid-' + Date.now()
      })
    });
    
    const responseText = await response.text();
    
    console.log(\`📊 Response Status: \${response.status}\`);
    console.log(\`📊 Response Headers:\`, Object.fromEntries(response.headers));
    console.log(\`📊 Response Body: \${responseText.substring(0, 500)}...\`);
    
    // Save snapshot
    const snapshot = {
      timestamp: new Date().toISOString(),
      endpoint: TEST_CONFIG.endpoint,
      request: {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: { To: TEST_CONFIG.testPhone, From: '+15559876543' }
      },
      response: {
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body: responseText
      }
    };
    
    return snapshot;
    
  } catch (error) {
    console.error(\`❌ Test failed:\`, error);
    return {
      timestamp: new Date().toISOString(),
      endpoint: TEST_CONFIG.endpoint,
      error: error.message
    };
  }
}

// Run test if called directly
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  testCurrentBehavior()
    .then(result => {
      console.log(\`✅ Test completed for \${TEST_CONFIG.endpoint}\`);
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error(\`❌ Test suite failed:\`, error);
      process.exit(1);
    });
}

export { testCurrentBehavior };
`;
}

/**
 * Create enhanced logging configuration
 */
function createLoggingConfig() {
  const loggingConfig = {
    timestamp: new Date().toISOString(),
    logLevel: 'DEBUG',
    targets: [
      'lib/api-compat.js',
      'lib/supabase.js',
      'lib/migration-logger.js'
    ],
    patterns: {
      airtable_calls: /airtable/gi,
      supabase_calls: /supabase/gi,
      business_lookups: /getBusinessByPhoneNumber/gi,
      call_logging: /logCallEvent|logMissedCall/gi
    }
  };
  
  // Create logging enhancement script
  const loggingScript = `#!/usr/bin/env node

/**
 * Enhanced Logging for Airtable Migration
 * 
 * This script adds detailed logging to track all database operations
 * during the migration process.
 */

// Add this to the beginning of lib/api-compat.js:
const MIGRATION_LOGGING = {
  enabled: true,
  logLevel: 'DEBUG',
  logFile: 'migration-audit/logs/api-compat-\${new Date().toISOString().split('T')[0]}.log'
};

function logMigrationOperation(operation, data) {
  if (!MIGRATION_LOGGING.enabled) return;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    data,
    stack: new Error().stack.split('\\n').slice(2, 5)
  };
  
  console.log(\`[MIGRATION-LOG] \${operation}:\`, JSON.stringify(logEntry, null, 2));
}

// Export for use in other modules
export { logMigrationOperation };
`;
  
  fs.writeFileSync(
    path.join(AUDIT_CONFIG.outputDir, 'enhanced-logging.js'),
    loggingScript
  );
  
  return loggingConfig;
}

/**
 * Main audit function
 */
async function runAudit() {
  console.log('🔍 Starting Airtable Migration Audit...');
  console.log(`📅 Timestamp: ${AUDIT_CONFIG.timestamp}`);
  
  // Create directory structure
  createAuditStructure();
  
  // Analyze current usage
  console.log('\n📊 Analyzing current endpoint usage...');
  const analysis = analyzeEndpointUsage();
  
  // Create test snapshots
  console.log('\n📸 Creating test snapshots...');
  const snapshots = createTestSnapshots();
  
  // Create logging configuration
  console.log('\n📝 Setting up enhanced logging...');
  const loggingConfig = createLoggingConfig();
  
  // Generate comprehensive report
  const report = {
    audit: {
      timestamp: AUDIT_CONFIG.timestamp,
      version: '1.0.0',
      phase: 'Phase 1 - Pre-Migration Audit'
    },
    analysis,
    snapshots,
    loggingConfig,
    nextSteps: [
      'Review migration recommendations',
      'Run baseline tests to capture current behavior',
      'Add enhanced logging to api-compat.js',
      'Begin migration with recommended endpoint',
      'Test each step thoroughly before proceeding'
    ]
  };
  
  // Save report
  const reportPath = path.join(
    AUDIT_CONFIG.outputDir,
    'reports',
    `migration-audit-${AUDIT_CONFIG.timestamp}.json`
  );
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n✅ Audit completed successfully!`);
  console.log(`📄 Report saved to: ${reportPath}`);
  console.log(`\n🎯 RECOMMENDATION: Start migration with ${report.analysis.recommendations.find(r => r.type === 'start_with')?.endpoint || 'first endpoint'}`);
  
  return report;
}

// Run audit if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAudit()
    .then(report => {
      console.log('\n🎉 Migration audit phase complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    });
}

export { runAudit };
