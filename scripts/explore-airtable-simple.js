// A simpler script to explore Airtable using existing functions
require('dotenv').config({ path: '.env.local' });
const { getRestaurants, getAutoShops } = require('../lib/airtable');

async function main() {
  try {
    console.log('Fetching restaurants...');
    const restaurants = await getRestaurants();
    console.log(`Found ${restaurants.length} restaurants`);
    
    if (restaurants.length > 0) {
      console.log('\nSample restaurant:');
      console.log(JSON.stringify(restaurants[0], null, 2));
    }
    
    console.log('\nFetching auto shops...');
    const autoShops = await getAutoShops();
    console.log(`Found ${autoShops.length} auto shops`);
    
    if (autoShops.length > 0) {
      console.log('\nSample auto shop:');
      console.log(JSON.stringify(autoShops[0], null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
