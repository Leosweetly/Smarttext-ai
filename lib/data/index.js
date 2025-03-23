// Re-export airtable client functionality
export {
  getTable,
  exploreTableSchema
} from './airtable-client';

// Re-export business data functionality
export {
  getBusinesses,
  getBusinessById,
  getBusinessesByType,
  getBusinessByPhoneNumber,
  updateBusiness,
  createBusiness,
  getBusinessWithLocations,
  getRestaurants,
  getAutoShops
} from './business';

// Re-export location data functionality
export {
  getLocations,
  getLocationById,
  getLocationsByBusinessId,
  getLocationByPhoneNumber,
  createLocation,
  updateLocation,
  deleteLocation,
  getLocationWithBusiness
} from './location';

// Re-export server actions
export {
  fetchBusinessesByType,
  fetchRestaurants,
  fetchAutoShops
} from './server-actions';
