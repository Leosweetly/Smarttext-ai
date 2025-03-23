#!/usr/bin/env node

/**
 * Business Import Script
 * 
 * This script imports businesses from a CSV file into Airtable and
 * configures their Twilio phone numbers for missed call handling.
 * 
 * Usage: node scripts/import-businesses.js path/to/businesses.csv
 * 
 * CSV Format:
 * name,businessType,phoneNumber,address,subscriptionTier,hours,orderingLink,quoteLink,bookingLink
 * 
 * Example CSV:
 * "Joe's Pizza","restaurant","+18186518560","123 Main St, Anytown, CA 12345","basic","Monday-Friday: 9 AM - 9 PM, Saturday-Sunday: 10 AM - 10 PM","https://joespizza.com/order",,
 * "Quick Fix Auto","auto shop","+18186518561","456 Oak St, Anytown, CA 12345","pro","Monday-Friday: 8 AM - 6 PM, Saturday: 9 AM - 3 PM",,"https://quickfixauto.com/quote",
 * "Glamour Salon","salon","+18186518562","789 Elm St, Anytown, CA 12345","enterprise","Tuesday-Saturday: 9 AM - 7 PM",,,"https://glamoursalon.com/book"
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// We need to use dynamic import since the modules use ES modules
async function importModules() {
  // Create a temporary file that re-exports the functions we need
  const tempFile = path.resolve(__dirname, '../temp-import-businesses.js');
  
  fs.writeFileSync(tempFile, `
    import { createBusiness } from './lib/data/business.js';
    import { configureTwilioNumber } from './lib/twilio/phone-manager.js';
    
    export async function createBusinessRecord(data) {
      return await createBusiness(data);
    }
    
    export async function configureTwilioNumberForBusiness(phoneNumber, options) {
      return await configureTwilioNumber(phoneNumber, options);
    }
  `);
  
  // Use dynamic import to load the ES module
  const { createBusinessRecord, configureTwilioNumberForBusiness } = await import('../temp-import-businesses.js');
  
  // Clean up the temporary file
  fs.unlinkSync(tempFile);
  
  return { createBusinessRecord, configureTwilioNumberForBusiness };
}

/**
 * Parse hours string into a structured object
 * @param {string} hoursString - Hours string in format "Day1-Day2: Time1 - Time2, Day3: Time3 - Time4"
 * @returns {Object} - Structured hours object
 */
function parseHours(hoursString) {
  if (!hoursString) return {};
  
  const hours = {};
  const dayRanges = hoursString.split(',').map(range => range.trim());
  
  for (const range of dayRanges) {
    const [daysStr, timeStr] = range.split(':').map(part => part.trim());
    
    if (!daysStr || !timeStr) continue;
    
    let days = [];
    if (daysStr.includes('-')) {
      // Handle day ranges like "Monday-Friday"
      const [startDay, endDay] = daysStr.split('-').map(day => day.trim());
      const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const startIndex = allDays.indexOf(startDay);
      const endIndex = allDays.indexOf(endDay);
      
      if (startIndex !== -1 && endIndex !== -1) {
        days = allDays.slice(startIndex, endIndex + 1);
      }
    } else {
      // Handle single days
      days = [daysStr];
    }
    
    // Add the time to each day
    for (const day of days) {
      hours[day] = timeStr;
    }
  }
  
  return hours;
}

/**
 * Import businesses from CSV file
 * @param {string} csvFilePath - Path to the CSV file
 * @returns {Promise<Array>} - Array of imported businesses
 */
async function importBusinessesFromCsv(csvFilePath) {
  try {
    // Read and parse the CSV file
    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    // Import the modules
    const { createBusinessRecord, configureTwilioNumberForBusiness } = await importModules();
    
    const results = {
      success: [],
      failed: []
    };
    
    // Process each record
    for (const record of records) {
      try {
        console.log(`Processing business: ${record.name}`);
        
        // Parse hours if provided
        const hours = record.hours ? parseHours(record.hours) : {};
        
        // Prepare business data
        const businessData = {
          name: record.name,
          businessType: record.businessType || 'other',
          phoneNumber: record.phoneNumber,
          address: record.address || '',
          subscriptionTier: record.subscriptionTier || 'basic',
          hours: hours,
          orderingLink: record.orderingLink || '',
          quoteLink: record.quoteLink || '',
          bookingLink: record.bookingLink || '',
          hasMultipleLocations: record.hasMultipleLocations === 'true'
        };
        
        // Create the business in Airtable
        const createdBusiness = await createBusinessRecord(businessData);
        console.log(`✅ Created business: ${createdBusiness.name} (ID: ${createdBusiness.id})`);
        
        // Configure Twilio number if provided
        if (record.phoneNumber) {
          try {
            const twilioConfig = await configureTwilioNumberForBusiness(record.phoneNumber, {
              voiceUrl: process.env.DEFAULT_TWIML_BIN_URL,
              statusCallback: `${process.env.API_BASE_URL || 'https://smarttext-webhook-kyle-davis-projects-30fc1531.vercel.app'}/api/missed-call`
            });
            
            console.log(`✅ Configured Twilio number: ${record.phoneNumber}`);
            
            results.success.push({
              business: createdBusiness,
              twilioConfig
            });
          } catch (twilioError) {
            console.error(`❌ Error configuring Twilio number for ${record.name}:`, twilioError.message);
            
            // Still count as success since the business was created
            results.success.push({
              business: createdBusiness,
              twilioError: twilioError.message
            });
          }
        } else {
          results.success.push({
            business: createdBusiness,
            twilioConfig: null
          });
        }
      } catch (error) {
        console.error(`❌ Error processing business ${record.name}:`, error.message);
        results.failed.push({
          record,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error importing businesses:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Check if CSV file path is provided
    const csvFilePath = process.argv[2];
    
    if (!csvFilePath) {
      console.error('❌ Error: CSV file path is required');
      console.log('Usage: node scripts/import-businesses.js path/to/businesses.csv');
      process.exit(1);
    }
    
    // Check if the file exists
    if (!fs.existsSync(csvFilePath)) {
      console.error(`❌ Error: File not found: ${csvFilePath}`);
      process.exit(1);
    }
    
    console.log(`Importing businesses from ${csvFilePath}...`);
    
    // Import businesses
    const results = await importBusinessesFromCsv(csvFilePath);
    
    // Print summary
    console.log('\n=== Import Summary ===');
    console.log(`✅ Successfully imported: ${results.success.length} businesses`);
    console.log(`❌ Failed to import: ${results.failed.length} businesses`);
    
    if (results.success.length > 0) {
      console.log('\nSuccessfully imported businesses:');
      results.success.forEach((result, index) => {
        console.log(`${index + 1}. ${result.business.name} (${result.business.phoneNumber})`);
        if (result.twilioConfig) {
          console.log(`   Twilio configured: Yes`);
        } else if (result.twilioError) {
          console.log(`   Twilio configured: No (Error: ${result.twilioError})`);
        } else {
          console.log(`   Twilio configured: No (No phone number provided)`);
        }
      });
    }
    
    if (results.failed.length > 0) {
      console.log('\nFailed to import businesses:');
      results.failed.forEach((result, index) => {
        console.log(`${index + 1}. ${result.record.name} (Error: ${result.error})`);
      });
    }
    
    console.log('\nDone!');
  } catch (error) {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  }
}

// Execute the main function
main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
