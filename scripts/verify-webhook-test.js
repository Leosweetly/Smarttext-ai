#!/usr/bin/env node

/**
 * Verify Webhook Test Results
 * 
 * This script verifies that webhook tests were successful by checking:
 * 1. Airtable logs to confirm the webhook was processed
 * 2. Twilio logs to confirm SMS messages were sent
 * 
 * Usage:
 *   - After SMS test: node scripts/verify-webhook-test.js sms +16193721633
 *   - After call test: node scripts/verify-webhook-test.js call +16193721633
 * 
 * Where +16193721633 is the phone number used in the test.
 */

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import chalk from 'chalk';
import twilio from 'twilio';
import { fileURLToPath } from 'url';
import { getTable } from '../lib/data/airtable-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Constants for test business
const TEST_BUSINESS_PHONE = '+16193721633';
const TEST_BUSINESS_NAME = 'Test Business';
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || '+18186518560';

// Get test type and phone number from command line args
const testType = process.argv[2]; // 'sms' or 'call'
const phoneNumber = process.argv[3] || TEST_BUSINESS_PHONE;

if (!testType) {
  console.log(chalk.red('❌ Missing required arguments'));
  console.log(chalk.yellow('Usage: node scripts/verify-webhook-test.js [sms|call] [phone_number]'));
  process.exit(1);
}

if (testType !== 'sms' && testType !== 'call') {
  console.log(chalk.red('❌ Invalid test type. Must be "sms" or "call"'));
  process.exit(1);
}

/**
 * Verify that the test business exists in Airtable
 */
async function verifyTestBusiness() {
  console.log(chalk.blue('🔍 Verifying test business in Airtable...'));
  
  try {
    // Get the Businesses table
    const table = getTable('Businesses');
    
    // Check if the business already exists
    const records = await table.select({
      filterByFormula: `{Phone Number} = "${phoneNumber}"`,
      maxRecords: 1
    }).firstPage();
    
    if (records.length > 0) {
      const business = records[0];
      const isTestRecord = business.get('Test Record') === true;
      
      console.log(chalk.green(`🧩 Found ${isTestRecord ? 'test' : ''} record in Airtable (${business.get('Business Name')}) ✅`));
      return business;
    }
    
    console.log(chalk.yellow(`⚠️ Business with phone number ${phoneNumber} not found in Airtable`));
    return null;
  } catch (error) {
    console.log(chalk.red('❌ Error verifying test business:'), error.message);
    return null;
  }
}

async function verifyAirtableLogs() {
  console.log(chalk.blue('🔍 Checking Airtable logs...'));
  
  try {
    let table;
    if (testType === 'call') {
      // Check Missed Calls table
      table = getTable('Missed Calls');
      const records = await table.select({
        filterByFormula: `{Caller Number} = "${TWILIO_PHONE}"`,
        maxRecords: 1,
        sort: [{ field: 'Created Time', direction: 'desc' }]
      }).firstPage();
      
      if (records.length > 0) {
        console.log(chalk.green('✅ Found missed call record in Airtable!'));
        console.log(chalk.cyan('Record ID:'), records[0].id);
        console.log(chalk.cyan('Created:'), records[0].get('Created Time'));
        console.log(chalk.cyan('Business:'), records[0].get('Business'));
        return true;
      } else {
        console.log(chalk.red('❌ No missed call record found in Airtable'));
        return false;
      }
    } else {
      // Check Messages table if it exists
      try {
        table = getTable('Messages');
        const records = await table.select({
          filterByFormula: `{From} = "${TWILIO_PHONE}"`,
          maxRecords: 1,
          sort: [{ field: 'Created Time', direction: 'desc' }]
        }).firstPage();
        
        if (records.length > 0) {
          console.log(chalk.green('✅ Found message record in Airtable!'));
          console.log(chalk.cyan('Record ID:'), records[0].id);
          console.log(chalk.cyan('Created:'), records[0].get('Created Time'));
          console.log(chalk.cyan('Message:'), records[0].get('Body'));
          return true;
        } else {
          console.log(chalk.yellow('⚠️ No message record found in Messages table'));
          // Fall back to checking Call Logs table
          return await checkCallLogsTable();
        }
      } catch (error) {
        console.log(chalk.yellow('⚠️ Messages table not found, checking Call Logs table'));
        return await checkCallLogsTable();
      }
    }
  } catch (error) {
    console.log(chalk.red('❌ Error checking Airtable logs:'), error.message);
    return false;
  }
  
  async function checkCallLogsTable() {
    try {
      const callLogsTable = getTable('Call Logs');
      const records = await callLogsTable.select({
        filterByFormula: `{Caller Number} = "${TWILIO_PHONE}"`,
        maxRecords: 1,
        sort: [{ field: 'Created Time', direction: 'desc' }]
      }).firstPage();
      
      if (records.length > 0) {
        console.log(chalk.green('✅ Found record in Call Logs table!'));
        console.log(chalk.cyan('Record ID:'), records[0].id);
        console.log(chalk.cyan('Created:'), records[0].get('Created Time'));
        return true;
      } else {
        console.log(chalk.red('❌ No record found in Call Logs table'));
        return false;
      }
    } catch (error) {
      console.log(chalk.red('❌ Error checking Call Logs table:'), error.message);
      return false;
    }
  }
}

async function verifyTwilioLogs() {
  console.log(chalk.blue('🔍 Checking Twilio logs...'));
  
  try {
    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // Get recent messages
    const messages = await client.messages.list({
      to: TWILIO_PHONE,
      limit: 5
    });
    
    if (messages.length > 0) {
      console.log(chalk.green('✅ Found Twilio message logs!'));
      console.log(chalk.cyan('Most recent message:'));
      console.log(chalk.cyan('SID:'), messages[0].sid);
      console.log(chalk.cyan('Status:'), messages[0].status);
      console.log(chalk.cyan('Direction:'), messages[0].direction);
      console.log(chalk.cyan('From:'), messages[0].from);
      console.log(chalk.cyan('To:'), messages[0].to);
      console.log(chalk.cyan('Body:'), messages[0].body);
      console.log(chalk.cyan('Date Sent:'), messages[0].dateSent);
      return true;
    } else {
      console.log(chalk.red('❌ No Twilio message logs found'));
      return false;
    }
  } catch (error) {
    console.log(chalk.red('❌ Error checking Twilio logs:'), error.message);
    return false;
  }
}

async function main() {
  console.log(chalk.blue(`🔍 Verifying ${testType} webhook test results for ${phoneNumber}`));
  console.log(chalk.gray('-----------------------------------'));
  
  // First verify the test business exists
  await verifyTestBusiness();
  console.log(chalk.gray('-----------------------------------'));
  
  const airtableResult = await verifyAirtableLogs();
  console.log(chalk.gray('-----------------------------------'));
  
  const twilioResult = await verifyTwilioLogs();
  console.log(chalk.gray('-----------------------------------'));
  
  if (airtableResult && twilioResult) {
    console.log(chalk.green('✅ Verification successful! Both Airtable and Twilio logs found.'));
  } else if (airtableResult) {
    console.log(chalk.yellow('⚠️ Partial verification: Airtable logs found, but no Twilio logs.'));
  } else if (twilioResult) {
    console.log(chalk.yellow('⚠️ Partial verification: Twilio logs found, but no Airtable logs.'));
  } else {
    console.log(chalk.red('❌ Verification failed: No logs found in either system.'));
    process.exit(1);
  }
}

main().catch(error => {
  console.error(chalk.red('❌ Unhandled error:'), error);
  process.exit(1);
});
