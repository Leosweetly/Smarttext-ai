// Simple script to test if the Airtable API key is valid
require('dotenv').config({ path: '.env.local' });
const Airtable = require('airtable');

console.log('Testing Airtable API key...');
console.log('API Key:', process.env.AIRTABLE_API_KEY);
console.log('Base ID:', process.env.AIRTABLE_BASE_ID);

// Initialize Airtable with API key
try {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
  
  // Try to access the base metadata
  console.log('\nTrying to access base metadata...');
  fetch(`https://api.airtable.com/v0/meta/bases/${process.env.AIRTABLE_BASE_ID}`, {
    headers: {
      'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to fetch base metadata: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Successfully accessed base metadata!');
    console.log('Base name:', data.name);
  })
  .catch(error => {
    console.error('Error accessing base metadata:', error);
  });
  
  // Try to list records from a table
  console.log('\nTrying to list records from the Businesses table...');
  base('Businesses').select({ maxRecords: 1 }).firstPage()
    .then(records => {
      console.log(`Successfully retrieved ${records.length} records from the Businesses table!`);
      if (records.length > 0) {
        console.log('First record:', records[0].get('Name'));
      }
    })
    .catch(error => {
      console.error('Error listing records:', error);
    });
} catch (error) {
  console.error('Error initializing Airtable:', error);
}
