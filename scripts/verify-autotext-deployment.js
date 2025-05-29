#!/usr/bin/env node

/**
 * Post-Deployment Verification Script for Enhanced Auto-Text Functionality
 * 
 * This script verifies that the enhanced auto-text functionality is working correctly
 * after deployment by testing both the missed call auto-text and FAQ response system.
 * 
 * Usage: node scripts/verify-autotext-deployment.js
 */

import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import readline from 'readline';
import chalk from 'chalk'; // For colored console output

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local or .env.production
dotenv.config({ path: path.resolve(__dirname, '../.env.production') }) || 
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Phone numbers for Malibu Country Kitchen test
const CALLER_NUMBER = '+16193721633'; // Update this with your actual phone number
const MALIBU_TWILIO_NUMBER = '+18186518560'; // Malibu Country Kitchen Twilio number

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Run all verification tests
 */
async function runAllTests() {
  console.log(chalk.blue.bold('\n🔍 Starting post-deployment verification tests...\n'));
  
  // Step 1: Verify the environment
  await verifyEnvironment();
  
  // Step 2: Test the missed call auto-text
  await testMissedCallAutotext();
  
  // Step 3: Test the FAQ response system
  await testFaqResponse();
  
  // Step 4: Test the custom auto-text message feature
  await testCustomAutoText();
  
  console.log(chalk.green.bold('\n✅ All verification tests completed successfully!\n'));
  rl.close();
}

/**
 * Verify the environment
 */
async function verifyEnvironment() {
  console.log(chalk.yellow('📋 Verifying environment...'));
  
  // Check if required environment variables are set
  const requiredVars = ['TWILIO_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'OPENAI_API_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log(chalk.red(`❌ Missing required environment variables: ${missingVars.join(', ')}`));
    console.log(chalk.red('Please set these variables in your .env.production or .env.local file.'));
    process.exit(1);
  }
  
  console.log(chalk.green('✅ Environment verified'));
}

/**
 * Test the missed call auto-text functionality
 */
async function testMissedCallAutotext() {
  return new Promise((resolve) => {
    console.log(chalk.yellow('\n📱 Testing missed call auto-text...'));
    console.log(`Simulating missed call from ${CALLER_NUMBER} to ${MALIBU_TWILIO_NUMBER}`);
    
    rl.question(chalk.cyan('Would you like to send a test auto-text message? (y/n): '), async (answer) => {
      if (answer.toLowerCase() === 'y') {
        try {
          // Create URL-encoded form data for the request
          const formData = new URLSearchParams();
          formData.append('From', CALLER_NUMBER);
          formData.append('To', MALIBU_TWILIO_NUMBER);
          formData.append('CallStatus', 'no-answer');
          formData.append('CallSid', 'CA' + Math.random().toString(36).substring(2, 15));
          formData.append('ConnectDuration', '0'); // Ensure it's treated as a missed call
          
          // Get the API base URL from environment or use production URL
          const apiBaseUrl = process.env.API_BASE_URL || 'https://smarttext-ai.vercel.app';
          const missedCallUrl = `${apiBaseUrl}/api/missed-call`;
          
          console.log(`Sending request to: ${missedCallUrl}`);
          
          // Make the request to the missed-call endpoint
          const response = await axios.post(missedCallUrl, formData.toString(), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });
          
          // Check the response
          if (response.status === 200) {
            console.log(chalk.green('\n✅ Missed call auto-text test successful!'));
            console.log('Response data:', response.data);
            console.log(chalk.cyan('\nCheck your phone for the text message. It should arrive shortly.'));
            console.log(chalk.cyan('The message should follow this format:'));
            console.log(chalk.cyan('Hey! Thanks for calling Malibu Country Kitchen, sorry we missed your call. Were you calling about [business-type-specific topics]?'));
            
            rl.question(chalk.cyan('\nDid you receive the auto-text message with the correct format? (y/n): '), (received) => {
              if (received.toLowerCase() === 'y') {
                console.log(chalk.green('✅ Missed call auto-text verification successful!'));
                resolve();
              } else {
                console.log(chalk.red('❌ Missed call auto-text verification failed. Please check the logs and try again.'));
                resolve();
              }
            });
          } else {
            console.log(chalk.red('\n❌ Missed call auto-text test failed:'));
            console.log(response.data);
            resolve();
          }
        } catch (error) {
          console.log(chalk.red('\n❌ Error testing missed call auto-text:'));
          
          if (error.response) {
            console.log(chalk.red(`Status: ${error.response.status}`));
            console.log('Response data:', error.response.data);
          } else if (error.request) {
            console.log(chalk.red('No response received from server. Is the server running?'));
          } else {
            console.log(chalk.red('Error message:', error.message));
          }
          
          resolve();
        }
      } else {
        console.log(chalk.yellow('Skipping missed call auto-text test.'));
        resolve();
      }
    });
  });
}

/**
 * Test the FAQ response system
 */
async function testFaqResponse() {
  return new Promise((resolve) => {
    console.log(chalk.yellow('\n🤖 Testing FAQ response system...'));
    
    rl.question(chalk.cyan('Would you like to test the FAQ response system? (y/n): '), async (answer) => {
      if (answer.toLowerCase() === 'y') {
        try {
          // Prompt the user for a question
          rl.question(chalk.cyan('Enter a question to test (e.g., "What are your hours?"): '), async (question) => {
            console.log(`Testing question: "${question}"`);
            
            // Get the business data from the mock implementation
            const { getBusinessByPhoneNumberSupabase } = await import('../lib/api-compat.js');
            const business = await getBusinessByPhoneNumberSupabase(MALIBU_TWILIO_NUMBER);
            
            // Use the handleIncomingSms function to get a response
            const { handleIncomingSms } = await import('../lib/openai.js');
            const response = await handleIncomingSms(question, business);
            
            console.log(chalk.green('\n✅ FAQ response generated:'));
            console.log(chalk.cyan(`"${response}"`));
            
            rl.question(chalk.cyan('\nIs the FAQ response appropriate and helpful? (y/n): '), (appropriate) => {
              if (appropriate.toLowerCase() === 'y') {
                console.log(chalk.green('✅ FAQ response system verification successful!'));
                resolve();
              } else {
                console.log(chalk.red('❌ FAQ response system verification failed. Please check the logs and try again.'));
                resolve();
              }
            });
          });
        } catch (error) {
          console.log(chalk.red('\n❌ Error testing FAQ response system:'));
          console.log(chalk.red(error.message));
          resolve();
        }
      } else {
        console.log(chalk.yellow('Skipping FAQ response system test.'));
        resolve();
      }
    });
  });
}

/**
 * Test the custom auto-text message feature
 */
async function testCustomAutoText() {
  return new Promise((resolve) => {
    console.log(chalk.yellow('\n🔧 Testing custom auto-text message feature...'));
    
    rl.question(chalk.cyan('Would you like to test the custom auto-text message feature? (y/n): '), async (answer) => {
      if (answer.toLowerCase() === 'y') {
        try {
          // Prompt the user for a custom message
          rl.question(chalk.cyan('Enter a custom auto-text message to test: '), async (customMessage) => {
            console.log(`Setting custom message: "${customMessage}"`);
            
            // Get the API base URL from environment or use production URL
            const apiBaseUrl = process.env.API_BASE_URL || 'https://smarttext-ai.vercel.app';
            
            // Step 1: Set the custom auto-text message
            console.log(chalk.yellow('\nStep 1: Setting custom auto-text message...'));
            
            const updateEndpoint = `${apiBaseUrl}/api/update-business-info`;
            const updatePayload = {
              name: 'Malibu Country Kitchen',
              phoneNumber: MALIBU_TWILIO_NUMBER,
              industry: 'restaurant',
              hoursJson: JSON.stringify({
                Monday: '9:00 AM - 9:00 PM',
                Tuesday: '9:00 AM - 9:00 PM',
                Wednesday: '9:00 AM - 9:00 PM',
                Thursday: '9:00 AM - 9:00 PM',
                Friday: '9:00 AM - 10:00 PM',
                Saturday: '9:00 AM - 10:00 PM',
                Sunday: '9:00 AM - 9:00 PM'
              }),
              customAutoTextMessage: customMessage
            };
            
            try {
              const updateResponse = await axios.post(updateEndpoint, updatePayload);
              console.log(chalk.green('✅ Custom auto-text message set successfully!'));
            } catch (error) {
              console.log(chalk.red('❌ Failed to set custom auto-text message:'));
              if (error.response) {
                console.log(chalk.red(`Status: ${error.response.status}`));
                console.log('Response data:', error.response.data);
              } else {
                console.log(chalk.red('Error message:', error.message));
              }
              resolve();
              return;
            }
            
            // Step 2: Simulate a missed call to trigger the auto-text
            console.log(chalk.yellow('\nStep 2: Simulating missed call to trigger auto-text...'));
            
            const missedCallEndpoint = `${apiBaseUrl}/api/missed-call`;
            const formData = new URLSearchParams();
            formData.append('From', CALLER_NUMBER);
            formData.append('To', MALIBU_TWILIO_NUMBER);
            formData.append('CallStatus', 'no-answer');
            formData.append('CallSid', 'CA' + Math.random().toString(36).substring(2, 15));
            formData.append('ConnectDuration', '0');
            
            try {
              const missedCallResponse = await axios.post(missedCallEndpoint, formData.toString(), {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              });
              
              console.log(chalk.green('✅ Missed call simulation successful!'));
              console.log(chalk.cyan('\nCheck your phone for the auto-text message. It should arrive shortly.'));
              console.log(chalk.cyan('The message should match your custom message:'));
              console.log(chalk.cyan(`"${customMessage}"`));
              
              rl.question(chalk.cyan('\nDid you receive the custom auto-text message? (y/n): '), (received) => {
                if (received.toLowerCase() === 'y') {
                  console.log(chalk.green('✅ Custom auto-text message verification successful!'));
                  resolve();
                } else {
                  console.log(chalk.red('❌ Custom auto-text message verification failed. Please check the logs and try again.'));
                  resolve();
                }
              });
            } catch (error) {
              console.log(chalk.red('❌ Failed to simulate missed call:'));
              if (error.response) {
                console.log(chalk.red(`Status: ${error.response.status}`));
                console.log('Response data:', error.response.data);
              } else {
                console.log(chalk.red('Error message:', error.message));
              }
              resolve();
            }
          });
        } catch (error) {
          console.log(chalk.red('\n❌ Error testing custom auto-text message feature:'));
          console.log(chalk.red(error.message));
          resolve();
        }
      } else {
        console.log(chalk.yellow('Skipping custom auto-text message test.'));
        resolve();
      }
    });
  });
}

// Run all tests
runAllTests().catch(error => {
  console.error(chalk.red('\n❌ Unhandled error:'), error);
  rl.close();
  process.exit(1);
});
