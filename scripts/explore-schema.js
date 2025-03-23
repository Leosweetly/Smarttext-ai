// Script to explore Airtable schema using the new function
require('dotenv').config({ path: '.env.local' });
const { exploreTableSchema } = require('../lib/airtable');

async function main() {
  try {
    console.log('Exploring Restaurants table schema...');
    const restaurantsSchema = await exploreTableSchema('Restaurants');
    console.log(`Found ${restaurantsSchema.recordCount} restaurants with the following fields:`);
    restaurantsSchema.fields.forEach(field => {
      console.log(`- ${field.name} (${field.type}): ${JSON.stringify(field.sample).substring(0, 50)}${JSON.stringify(field.sample).length > 50 ? '...' : ''}`);
    });
    
    console.log('\nExploring AutoShops table schema...');
    const autoShopsSchema = await exploreTableSchema('AutoShops');
    console.log(`Found ${autoShopsSchema.recordCount} auto shops with the following fields:`);
    autoShopsSchema.fields.forEach(field => {
      console.log(`- ${field.name} (${field.type}): ${JSON.stringify(field.sample).substring(0, 50)}${JSON.stringify(field.sample).length > 50 ? '...' : ''}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
