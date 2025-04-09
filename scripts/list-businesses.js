import { getBusinesses } from '../lib/airtable.js';

async function main() {
  try {
    console.log('Fetching businesses from Airtable...');
    const businesses = await getBusinesses();
    
    console.log(`\nFound ${businesses.length} businesses:`);
    businesses.forEach(business => {
      console.log(`ID: ${business.id}, Name: ${business.name}, Type: ${business.businessType}`);
    });
    
    // Print the first business ID for easy copying
    if (businesses.length > 0) {
      console.log(`\nFirst business ID for testing: ${businesses[0].id}`);
    }
  } catch (error) {
    console.error('Error fetching businesses:', error);
  }
}

main();
