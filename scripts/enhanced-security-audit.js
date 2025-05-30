#!/usr/bin/env node

/**
 * Enhanced Security Audit Script for SmartText AI
 * 
 * Integrates with the new security infrastructure to provide comprehensive
 * dependency security analysis, vulnerability assessment, and automated fixes.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import our security infrastructure
const { logSecurityEvent } = require('../lib/security');
const { logAuditEvent } = require('../lib/audit');

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const isProduction = process.env.NODE_ENV === 'production';
const enableVerbose = process.argv.includes('--verbose') || !isProduction;

// Results tracking
const auditResults = {
  vulnerabilities: {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    info: 0,
    total: 0
  },
  dependencies: {
    total: 0,
    outdated: 0,
    vulnerable: 0
  },
  fixes: {
    applied: 0,
    available: 0,
    manual: 0
  },
  checks: {
    passed: 0,
    failed: 0,
    warnings: 0,
    total: 0
  }
};

/**
 * Enhanced logging with security event integration
 */
function log(message, level = 'info', metadata = {}) {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m%s\x1b[0m',    // Cyan
    success: '\x1b[32m%s\x1b[0m',  // Green
    warning: '\x1b[33m%s\x1b[0m',  // Yellow
    error: '\x1b[31m%s\x1b[0m',    // Red
    critical: '\x1b[41m%s\x1b[0m'  // Red background
  };
  
  console.log(colors[level] || colors.info, `[${timestamp}] ${message}`);
  
  // Log security events for audit trail
  if (level === 'error' || level === 'critical') {
    logSecurityEvent('security_audit', level, message, metadata).catch(console.error);
  }
}

function logVerbose(message, level = 'info') {
  if (enableVerbose) {
    log(message, level);
  }
}

/**
 * Run npm audit and parse results
 */
async function runNpmAudit() {
  log('🔍 Running npm audit...', 'info');
  
  try {
    const auditOutput = execSync('npm audit --json', { 
      cwd: ROOT_DIR,
      encoding: 'utf8'
    });
    
    const auditData = JSON.parse(auditOutput);
    
    // Update results
    auditResults.vulnerabilities = {
      critical: auditData.metadata.vulnerabilities.critical || 0,
      high: auditData.metadata.vulnerabilities.high || 0,
      moderate: auditData.metadata.vulnerabilities.moderate || 0,
      low: auditData.metadata.vulnerabilities.low || 0,
      info: auditData.metadata.vulnerabilities.info || 0,
      total: auditData.metadata.vulnerabilities.total || 0
    };
    
    auditResults.dependencies.total = auditData.metadata.dependencies.total || 0;
    
    // Log detailed vulnerability information
    if (auditResults.vulnerabilities.total > 0) {
      log(`Found ${auditResults.vulnerabilities.total} vulnerabilities:`, 'warning');
      log(`  Critical: ${auditResults.vulnerabilities.critical}`, 'critical');
      log(`  High: ${auditResults.vulnerabilities.high}`, 'error');
      log(`  Moderate: ${auditResults.vulnerabilities.moderate}`, 'warning');
      log(`  Low: ${auditResults.vulnerabilities.low}`, 'info');
      
      // Log each vulnerability
      Object.entries(auditData.vulnerabilities || {}).forEach(([name, vuln]) => {
        logVerbose(`  ${name}: ${vuln.severity} - ${vuln.via[0]?.title || 'Unknown'}`, vuln.severity);
        
        // Log security event for tracking
        logSecurityEvent('dependency_vulnerability', vuln.severity, 
          `Vulnerability found in ${name}`, {
            package: name,
            severity: vuln.severity,
            title: vuln.via[0]?.title,
            url: vuln.via[0]?.url,
            cwe: vuln.via[0]?.cwe,
            range: vuln.range
          }).catch(console.error);
      });
    } else {
      log('✅ No vulnerabilities found!', 'success');
    }
    
    return auditData;
    
  } catch (error) {
    // npm audit returns non-zero exit code when vulnerabilities are found
    if (error.stdout) {
      try {
        const auditData = JSON.parse(error.stdout);
        return await runNpmAudit(); // Recursive call to handle the data
      } catch (parseError) {
        log(`Failed to parse npm audit output: ${parseError.message}`, 'error');
        throw parseError;
      }
    } else {
      log(`npm audit failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

/**
 * Check for outdated packages
 */
async function checkOutdatedPackages() {
  log('📦 Checking for outdated packages...', 'info');
  
  try {
    const outdatedOutput = execSync('npm outdated --json', { 
      cwd: ROOT_DIR,
      encoding: 'utf8'
    });
    
    const outdatedData = JSON.parse(outdatedOutput || '{}');
    const outdatedCount = Object.keys(outdatedData).length;
    
    auditResults.dependencies.outdated = outdatedCount;
    
    if (outdatedCount > 0) {
      log(`Found ${outdatedCount} outdated packages:`, 'warning');
      Object.entries(outdatedData).forEach(([name, info]) => {
        logVerbose(`  ${name}: ${info.current} → ${info.latest}`, 'warning');
      });
    } else {
      log('✅ All packages are up to date!', 'success');
    }
    
    return outdatedData;
    
  } catch (error) {
    // npm outdated returns non-zero exit code when outdated packages exist
    if (error.stdout) {
      try {
        const outdatedData = JSON.parse(error.stdout || '{}');
        const outdatedCount = Object.keys(outdatedData).length;
        auditResults.dependencies.outdated = outdatedCount;
        
        if (outdatedCount > 0) {
          log(`Found ${outdatedCount} outdated packages`, 'warning');
        }
        
        return outdatedData;
      } catch (parseError) {
        logVerbose(`Could not parse outdated packages: ${parseError.message}`, 'warning');
        return {};
      }
    } else {
      logVerbose(`Could not check outdated packages: ${error.message}`, 'warning');
      return {};
    }
  }
}

/**
 * Apply automatic security fixes
 */
async function applySecurityFixes(dryRun = false) {
  log(`${dryRun ? '🧪 Simulating' : '🔧 Applying'} security fixes...`, 'info');
  
  try {
    const command = dryRun ? 'npm audit fix --dry-run --json' : 'npm audit fix --json';
    const fixOutput = execSync(command, { 
      cwd: ROOT_DIR,
      encoding: 'utf8'
    });
    
    const fixData = JSON.parse(fixOutput);
    
    if (fixData.added || fixData.removed || fixData.updated) {
      const changes = {
        added: fixData.added || 0,
        removed: fixData.removed || 0,
        updated: fixData.updated || 0
      };
      
      auditResults.fixes.applied = changes.updated;
      
      log(`${dryRun ? 'Would apply' : 'Applied'} fixes:`, 'success');
      log(`  Updated: ${changes.updated} packages`, 'success');
      log(`  Added: ${changes.added} packages`, 'info');
      log(`  Removed: ${changes.removed} packages`, 'info');
      
      if (!dryRun) {
        // Log audit event for applied fixes
        await logAuditEvent('security_fixes_applied', 'Automatic security fixes applied', {
          severity: 'medium',
          success: true,
          metadata: changes
        });
      }
    } else {
      log('No automatic fixes available', 'info');
    }
    
    return fixData;
    
  } catch (error) {
    if (error.stdout) {
      try {
        const fixData = JSON.parse(error.stdout);
        return fixData;
      } catch (parseError) {
        log(`Could not parse fix output: ${parseError.message}`, 'warning');
      }
    }
    
    log(`Security fixes failed: ${error.message}`, 'error');
    return null;
  }
}

/**
 * Check for breaking change fixes
 */
async function checkBreakingChangeFixes() {
  log('⚠️ Checking for fixes requiring breaking changes...', 'info');
  
  try {
    const forceFixOutput = execSync('npm audit fix --force --dry-run --json', { 
      cwd: ROOT_DIR,
      encoding: 'utf8'
    });
    
    const forceFixData = JSON.parse(forceFixOutput);
    
    if (forceFixData.updated && forceFixData.updated > 0) {
      auditResults.fixes.available = forceFixData.updated;
      
      log(`${forceFixData.updated} packages can be fixed with breaking changes`, 'warning');
      log('Run "npm audit fix --force" to apply (may break functionality)', 'warning');
      
      return forceFixData;
    } else {
      log('No breaking change fixes available', 'info');
      return null;
    }
    
  } catch (error) {
    if (error.stdout) {
      try {
        const forceFixData = JSON.parse(error.stdout);
        if (forceFixData.updated && forceFixData.updated > 0) {
          auditResults.fixes.available = forceFixData.updated;
          log(`${forceFixData.updated} packages can be fixed with breaking changes`, 'warning');
        }
        return forceFixData;
      } catch (parseError) {
        logVerbose(`Could not parse force fix output: ${parseError.message}`, 'warning');
      }
    }
    
    logVerbose(`Could not check breaking change fixes: ${error.message}`, 'warning');
    return null;
  }
}

/**
 * Analyze package.json for security best practices
 */
async function analyzePackageJson() {
  log('📋 Analyzing package.json for security best practices...', 'info');
  
  try {
    const packagePath = path.join(ROOT_DIR, 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const issues = [];
    
    // Check for exact versions vs ranges
    const dependencies = { ...packageData.dependencies, ...packageData.devDependencies };
    const rangePackages = Object.entries(dependencies).filter(([name, version]) => 
      version.startsWith('^') || version.startsWith('~')
    );
    
    if (rangePackages.length > 0) {
      issues.push(`${rangePackages.length} packages use version ranges (^/~) which may introduce vulnerabilities`);
      logVerbose('Packages with version ranges:', 'warning');
      rangePackages.forEach(([name, version]) => {
        logVerbose(`  ${name}: ${version}`, 'warning');
      });
    }
    
    // Check for scripts that might be security risks
    const scripts = packageData.scripts || {};
    const riskyScripts = Object.entries(scripts).filter(([name, script]) => 
      script.includes('curl') || script.includes('wget') || script.includes('eval')
    );
    
    if (riskyScripts.length > 0) {
      issues.push(`${riskyScripts.length} scripts contain potentially risky commands`);
      riskyScripts.forEach(([name, script]) => {
        logVerbose(`  ${name}: ${script}`, 'warning');
      });
    }
    
    if (issues.length === 0) {
      log('✅ Package.json follows security best practices', 'success');
      auditResults.checks.passed++;
    } else {
      log(`⚠️ Found ${issues.length} package.json security issues:`, 'warning');
      issues.forEach(issue => log(`  - ${issue}`, 'warning'));
      auditResults.checks.warnings++;
    }
    
    auditResults.checks.total++;
    
    return { issues, packageData };
    
  } catch (error) {
    log(`Failed to analyze package.json: ${error.message}`, 'error');
    auditResults.checks.failed++;
    auditResults.checks.total++;
    return null;
  }
}

/**
 * Generate security recommendations
 */
function generateRecommendations() {
  log('📝 Generating security recommendations...', 'info');
  
  const recommendations = [];
  
  // Vulnerability recommendations
  if (auditResults.vulnerabilities.critical > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      action: 'Fix critical vulnerabilities immediately',
      command: 'npm audit fix --force',
      risk: 'High security risk - immediate action required'
    });
  }
  
  if (auditResults.vulnerabilities.high > 0) {
    recommendations.push({
      priority: 'HIGH',
      action: 'Fix high severity vulnerabilities',
      command: 'npm audit fix',
      risk: 'Significant security risk'
    });
  }
  
  if (auditResults.vulnerabilities.moderate > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      action: 'Review and fix moderate vulnerabilities',
      command: 'npm audit fix',
      risk: 'Moderate security risk'
    });
  }
  
  // Outdated package recommendations
  if (auditResults.dependencies.outdated > 5) {
    recommendations.push({
      priority: 'MEDIUM',
      action: 'Update outdated packages',
      command: 'npm update',
      risk: 'Outdated packages may contain vulnerabilities'
    });
  }
  
  // General recommendations
  recommendations.push({
    priority: 'LOW',
    action: 'Run security audit regularly',
    command: 'node scripts/enhanced-security-audit.js',
    risk: 'Continuous monitoring prevents security issues'
  });
  
  recommendations.push({
    priority: 'LOW',
    action: 'Consider using npm ci in production',
    command: 'npm ci',
    risk: 'Ensures reproducible builds'
  });
  
  return recommendations;
}

/**
 * Generate comprehensive security report
 */
async function generateSecurityReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: auditResults,
    recommendations: generateRecommendations(),
    environment: {
      nodeVersion: process.version,
      npmVersion: execSync('npm --version', { encoding: 'utf8' }).trim(),
      platform: process.platform,
      arch: process.arch
    }
  };
  
  // Save report to file
  const reportPath = path.join(ROOT_DIR, 'security-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`📊 Security report saved to: ${reportPath}`, 'success');
  
  // Log audit event
  await logAuditEvent('security_audit_completed', 'Comprehensive security audit completed', {
    severity: auditResults.vulnerabilities.critical > 0 ? 'high' : 
             auditResults.vulnerabilities.high > 0 ? 'medium' : 'low',
    success: true,
    metadata: auditResults
  });
  
  return report;
}

/**
 * Main audit function
 */
async function runEnhancedSecurityAudit() {
  log('🔒 Starting Enhanced Security Audit for SmartText AI', 'info');
  log('=' .repeat(60), 'info');
  
  try {
    // Run all audit checks
    const auditData = await runNpmAudit();
    const outdatedData = await checkOutdatedPackages();
    const packageAnalysis = await analyzePackageJson();
    
    // Apply automatic fixes if requested
    if (process.argv.includes('--fix')) {
      await applySecurityFixes(false);
    } else if (process.argv.includes('--dry-run')) {
      await applySecurityFixes(true);
    }
    
    // Check for breaking change fixes
    await checkBreakingChangeFixes();
    
    // Generate final report
    const report = await generateSecurityReport();
    
    // Print summary
    log('\n📊 Security Audit Summary', 'info');
    log('=' .repeat(30), 'info');
    log(`Total Dependencies: ${auditResults.dependencies.total}`, 'info');
    log(`Vulnerabilities: ${auditResults.vulnerabilities.total}`, 
        auditResults.vulnerabilities.total > 0 ? 'warning' : 'success');
    log(`  Critical: ${auditResults.vulnerabilities.critical}`, 
        auditResults.vulnerabilities.critical > 0 ? 'critical' : 'success');
    log(`  High: ${auditResults.vulnerabilities.high}`, 
        auditResults.vulnerabilities.high > 0 ? 'error' : 'success');
    log(`  Moderate: ${auditResults.vulnerabilities.moderate}`, 
        auditResults.vulnerabilities.moderate > 0 ? 'warning' : 'success');
    log(`  Low: ${auditResults.vulnerabilities.low}`, 
        auditResults.vulnerabilities.low > 0 ? 'info' : 'success');
    log(`Outdated Packages: ${auditResults.dependencies.outdated}`, 
        auditResults.dependencies.outdated > 0 ? 'warning' : 'success');
    
    // Print recommendations
    const recommendations = report.recommendations;
    if (recommendations.length > 0) {
      log('\n📝 Recommendations', 'info');
      log('=' .repeat(20), 'info');
      recommendations.forEach((rec, index) => {
        log(`${index + 1}. [${rec.priority}] ${rec.action}`, 
            rec.priority === 'CRITICAL' ? 'critical' : 
            rec.priority === 'HIGH' ? 'error' : 
            rec.priority === 'MEDIUM' ? 'warning' : 'info');
        log(`   Command: ${rec.command}`, 'info');
        log(`   Risk: ${rec.risk}`, 'info');
      });
    }
    
    // Exit with appropriate code
    const hasHighRiskVulns = auditResults.vulnerabilities.critical > 0 || 
                            auditResults.vulnerabilities.high > 0;
    
    if (hasHighRiskVulns) {
      log('\n⚠️ High-risk vulnerabilities found! Please address immediately.', 'error');
      process.exit(1);
    } else if (auditResults.vulnerabilities.total > 0) {
      log('\n⚠️ Some vulnerabilities found. Review and fix when possible.', 'warning');
      process.exit(0);
    } else {
      log('\n✅ Security audit completed successfully!', 'success');
      process.exit(0);
    }
    
  } catch (error) {
    log(`❌ Security audit failed: ${error.message}`, 'error');
    
    await logAuditEvent('security_audit_failed', 'Security audit failed', {
      severity: 'high',
      success: false,
      metadata: { error: error.message }
    });
    
    process.exit(1);
  }
}

// Run the audit if this script is executed directly
if (require.main === module) {
  runEnhancedSecurityAudit();
}

module.exports = {
  runEnhancedSecurityAudit,
  runNpmAudit,
  checkOutdatedPackages,
  applySecurityFixes,
  generateSecurityReport
};
