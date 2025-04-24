/**
 * Monitoring Test Script
 * 
 * This script tests the monitoring system by simulating various events
 * and verifying that they are properly tracked in the database.
 * 
 * Usage:
 *   node scripts/test-monitoring.js [--test-type TYPE]
 * 
 * Options:
 *   --test-type TYPE  Type of test to run (sms, openai, owner-alert, all)
 */

import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase.js';
import { 
  trackSmsEvent, 
  trackOpenAIUsage, 
  trackOwnerAlert,
  updateDailyStats
} from '../lib/monitoring.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Parse command line arguments
const args = process.argv.slice(2);
let testType = 'all';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--test-type' && i + 1 < args.length) {
    testType = args[i + 1];
    i++; // Skip the next argument
  }
}

// Validate test type
const validTestTypes = ['sms', 'openai', 'owner-alert', 'all'];
if (!validTestTypes.includes(testType)) {
  console.error(`Invalid test type: ${testType}`);
  console.error(`Valid test types: ${validTestTypes.join(', ')}`);
  process.exit(1);
}

// Generate a unique test ID
const testId = uuidv4().substring(0, 8);
console.log(`🧪 Starting monitoring test with ID: ${testId}`);

// Create a test business ID
const testBusinessId = `test-business-${testId}`;

async function testSmsTracking() {
  console.log('\n📱 Testing SMS event tracking...');
  
  // Test successful SMS
  console.log('📤 Testing successful SMS tracking');
  const successResult = await trackSmsEvent({
    messageSid: `test-sms-success-${testId}`,
    from: '+15551234567',
    to: '+15559876543',
    businessId: testBusinessId,
    status: 'sent',
    errorCode: null,
    errorMessage: null,
    requestId: `test-${testId}`,
    bodyLength: 100,
    payload: { test: true, testId }
  });
  
  console.log('✅ Successful SMS tracking result:', successResult ? 'Success' : 'Failed');
  
  // Test failed SMS
  console.log('📤 Testing failed SMS tracking');
  const failureResult = await trackSmsEvent({
    messageSid: '',
    from: '+15551234567',
    to: '+15559876543',
    businessId: testBusinessId,
    status: 'failed',
    errorCode: '30007',
    errorMessage: 'Carrier rejected message',
    requestId: `test-${testId}`,
    bodyLength: 100,
    payload: { test: true, testId }
  });
  
  console.log('✅ Failed SMS tracking result:', failureResult ? 'Success' : 'Failed');
  
  // Verify data in database
  const { data, error } = await supabase
    .from('sms_events')
    .select('*')
    .eq('request_id', `test-${testId}`);
    
  if (error) {
    console.error('❌ Error verifying SMS events in database:', error);
    return false;
  }
  
  console.log(`✅ Found ${data.length} SMS events in database`);
  return data.length === 2;
}

async function testOpenAITracking() {
  console.log('\n🧠 Testing OpenAI usage tracking...');
  
  // Test OpenAI usage tracking
  console.log('📊 Testing OpenAI usage tracking');
  const usageResult = await trackOpenAIUsage({
    endpoint: 'test-endpoint',
    businessId: testBusinessId,
    tokensUsed: 1000,
    costEstimate: 0.02,
    model: 'gpt-4o',
    requestId: `test-${testId}`,
    metadata: { test: true, testId }
  });
  
  console.log('✅ OpenAI usage tracking result:', usageResult ? 'Success' : 'Failed');
  
  // Verify data in database
  const { data, error } = await supabase
    .from('api_usage')
    .select('*')
    .eq('request_id', `test-${testId}`);
    
  if (error) {
    console.error('❌ Error verifying OpenAI usage in database:', error);
    return false;
  }
  
  console.log(`✅ Found ${data.length} OpenAI usage records in database`);
  return data.length === 1;
}

async function testOwnerAlertTracking() {
  console.log('\n🔔 Testing owner alert tracking...');
  
  // Test successful owner alert
  console.log('📤 Testing successful owner alert tracking');
  const successResult = await trackOwnerAlert({
    businessId: testBusinessId,
    ownerPhone: '+15551234567',
    customerPhone: '+15559876543',
    alertType: 'test_alert',
    messageContent: 'Test alert message',
    detectionSource: 'test',
    messageSid: `test-alert-${testId}`,
    delivered: true,
    errorMessage: null
  });
  
  console.log('✅ Successful owner alert tracking result:', successResult ? 'Success' : 'Failed');
  
  // Test failed owner alert
  console.log('📤 Testing failed owner alert tracking');
  const failureResult = await trackOwnerAlert({
    businessId: testBusinessId,
    ownerPhone: '+15551234567',
    customerPhone: '+15559876543',
    alertType: 'test_alert',
    messageContent: 'Test alert message',
    detectionSource: 'test',
    messageSid: '',
    delivered: false,
    errorMessage: 'Test error message'
  });
  
  console.log('✅ Failed owner alert tracking result:', failureResult ? 'Success' : 'Failed');
  
  // Verify data in database
  const { data, error } = await supabase
    .from('owner_alerts')
    .select('*')
    .eq('business_id', testBusinessId);
    
  if (error) {
    console.error('❌ Error verifying owner alerts in database:', error);
    return false;
  }
  
  console.log(`✅ Found ${data.length} owner alerts in database`);
  return data.length === 2;
}

async function testDailyStats() {
  console.log('\n📊 Testing daily stats update...');
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Test daily stats update
  console.log(`📊 Updating daily stats for business ${testBusinessId} on ${today}`);
  const updateResult = await updateDailyStats(testBusinessId, today);
  
  console.log('✅ Daily stats update result:', updateResult ? 'Success' : 'Failed');
  
  // Verify data in database
  const { data, error } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('business_id', testBusinessId)
    .eq('date', today);
    
  if (error) {
    console.error('❌ Error verifying daily stats in database:', error);
    return false;
  }
  
  console.log(`✅ Found ${data.length} daily stats records in database`);
  return data.length === 1;
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  // Delete SMS events
  const { error: smsError } = await supabase
    .from('sms_events')
    .delete()
    .eq('request_id', `test-${testId}`);
    
  if (smsError) {
    console.error('❌ Error deleting SMS events:', smsError);
  } else {
    console.log('✅ Deleted SMS events');
  }
  
  // Delete OpenAI usage
  const { error: openaiError } = await supabase
    .from('api_usage')
    .delete()
    .eq('request_id', `test-${testId}`);
    
  if (openaiError) {
    console.error('❌ Error deleting OpenAI usage:', openaiError);
  } else {
    console.log('✅ Deleted OpenAI usage');
  }
  
  // Delete owner alerts
  const { error: alertError } = await supabase
    .from('owner_alerts')
    .delete()
    .eq('business_id', testBusinessId);
    
  if (alertError) {
    console.error('❌ Error deleting owner alerts:', alertError);
  } else {
    console.log('✅ Deleted owner alerts');
  }
  
  // Delete daily stats
  const { error: statsError } = await supabase
    .from('daily_stats')
    .delete()
    .eq('business_id', testBusinessId);
    
  if (statsError) {
    console.error('❌ Error deleting daily stats:', statsError);
  } else {
    console.log('✅ Deleted daily stats');
  }
}

async function main() {
  try {
    let results = [];
    
    // Run tests based on test type
    if (testType === 'sms' || testType === 'all') {
      results.push({ name: 'SMS Tracking', success: await testSmsTracking() });
    }
    
    if (testType === 'openai' || testType === 'all') {
      results.push({ name: 'OpenAI Tracking', success: await testOpenAITracking() });
    }
    
    if (testType === 'owner-alert' || testType === 'all') {
      results.push({ name: 'Owner Alert Tracking', success: await testOwnerAlertTracking() });
    }
    
    if (testType === 'all') {
      results.push({ name: 'Daily Stats', success: await testDailyStats() });
    }
    
    // Clean up test data
    await cleanupTestData();
    
    // Print summary
    console.log('\n📋 Test Summary:');
    for (const result of results) {
      console.log(`${result.success ? '✅' : '❌'} ${result.name}: ${result.success ? 'PASSED' : 'FAILED'}`);
    }
    
    const allPassed = results.every(r => r.success);
    console.log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed!'}`);
    
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  }
}

main();
