import { 
  getRecords, 
  getRecord, 
  createRecord, 
  updateRecord, 
  deleteRecord,
  isConnectedToAirtable
} from './airtable-oauth-client';

/**
 * Business data access functions using OAuth authentication
 * These functions provide a layer of abstraction over the Airtable API
 */

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const BUSINESSES_TABLE = 'Businesses';

/**
 * Get all businesses
 * 
 * @returns {Promise<Array>} Array of business objects
 */
export async function getBusinesses() {
  try {
    const records = await getRecords(BASE_ID, BUSINESSES_TABLE, { view: 'Grid view' });
    
    return records.map(record => formatBusinessRecord(record));
  } catch (error) {
    console.error("Error fetching businesses:", error);
    throw error;
  }
}

/**
 * Get a business by ID
 * 
 * @param {string} id - The business ID
 * @returns {Promise<Object|null>} The business object or null if not found
 */
export async function getBusinessById(id) {
  try {
    const record = await getRecord(BASE_ID, BUSINESSES_TABLE, id);
    
    if (!record) return null;
    
    return formatBusinessRecord(record);
  } catch (error) {
    console.error("Error fetching business by ID:", error);
    throw error;
  }
}

/**
 * Get businesses filtered by type
 * 
 * @param {string} businessType - The business type to filter by
 * @returns {Promise<Array>} Array of business objects
 */
export async function getBusinessesByType(businessType) {
  try {
    const records = await getRecords(BASE_ID, BUSINESSES_TABLE, {
      view: 'Grid view',
      filterByFormula: `{Business Type} = '${businessType}'`
    });
    
    return records.map(record => formatBusinessRecord(record));
  } catch (error) {
    console.error(`Error fetching businesses by type ${businessType}:`, error);
    throw error;
  }
}

/**
 * Get a business by phone number
 * 
 * @param {string} phoneNumber - The phone number to search for
 * @returns {Promise<Object|null>} The business object or null if not found
 */
export async function getBusinessByPhoneNumber(phoneNumber) {
  try {
    const records = await getRecords(BASE_ID, BUSINESSES_TABLE, {
      view: 'Grid view',
      filterByFormula: `{Phone Number} = '${phoneNumber}'`
    });
    
    if (records.length === 0) {
      return null;
    }
    
    return formatBusinessRecord(records[0]);
  } catch (error) {
    console.error("Error finding business by phone number:", error);
    throw error;
  }
}

/**
 * Update a business in Airtable
 * 
 * @param {string} id - The business ID
 * @param {Object} data - The data to update
 * @returns {Promise<Object>} The updated business object
 */
export async function updateBusiness(id, data) {
  try {
    // Prepare the data for Airtable
    const fields = {};
    
    if (data.name) fields["Name"] = data.name;
    if (data.businessType) fields["Business Type"] = data.businessType;
    if (data.phoneNumber) fields["Phone Number"] = data.phoneNumber;
    if (data.address) fields["Address"] = data.address;
    if (data.orderingLink) fields["Online Ordering Link"] = data.orderingLink;
    if (data.quoteLink) fields["Quote Link"] = data.quoteLink;
    if (data.bookingLink) fields["Booking Link"] = data.bookingLink;
    if (data.services) fields["Services"] = data.services;
    if (data.subscriptionTier) fields["Subscription Tier"] = data.subscriptionTier;
    if (data.trialEndsAt) fields["Trial Ends At"] = data.trialEndsAt;
    
    // Handle JSON fields
    if (data.hours) fields["Hours JSON"] = JSON.stringify(data.hours);
    if (data.faqs) fields["FAQs JSON"] = JSON.stringify(data.faqs);
    if (data.customSettings) fields["Custom Settings"] = JSON.stringify(data.customSettings);
    
    // Update the record
    await updateRecord(BASE_ID, BUSINESSES_TABLE, id, fields);
    
    // Return the updated business
    return getBusinessById(id);
  } catch (error) {
    console.error("Error updating business:", error);
    throw error;
  }
}

/**
 * Create a new business in Airtable
 * 
 * @param {Object} data - The business data
 * @returns {Promise<Object>} The created business object
 */
export async function createBusiness(data) {
  try {
    // Prepare the data for Airtable
    const fields = {
      "Name": data.name || "New Business",
      "Business Type": data.businessType || "other",
      "Phone Number": data.phoneNumber || "",
      "Address": data.address || "",
      "Subscription Tier": data.subscriptionTier || "basic",
    };
    
    // Optional fields
    if (data.orderingLink) fields["Online Ordering Link"] = data.orderingLink;
    if (data.quoteLink) fields["Quote Link"] = data.quoteLink;
    if (data.bookingLink) fields["Booking Link"] = data.bookingLink;
    if (data.services) fields["Services"] = data.services;
    if (data.trialEndsAt) fields["Trial Ends At"] = data.trialEndsAt;
    
    // Handle JSON fields
    if (data.hours) fields["Hours JSON"] = JSON.stringify(data.hours);
    if (data.faqs) fields["FAQs JSON"] = JSON.stringify(data.faqs);
    if (data.customSettings) fields["Custom Settings"] = JSON.stringify(data.customSettings);
    
    // Create the record
    const createdRecord = await createRecord(BASE_ID, BUSINESSES_TABLE, fields);
    
    // Return the created business
    return getBusinessById(createdRecord.id);
  } catch (error) {
    console.error("Error creating business:", error);
    throw error;
  }
}

/**
 * Format a business record from Airtable
 * 
 * @param {Object} record - The Airtable record
 * @returns {Object} The formatted business object
 */
function formatBusinessRecord(record) {
  let hoursData = record.fields["Hours JSON"] || "{}";
  let faqsData = record.fields["FAQs JSON"] || "[]";
  let customSettings = record.fields["Custom Settings"] || "{}";

  try {
    hoursData = JSON.parse(hoursData);
  } catch (error) {
    console.error("❌ Invalid JSON in Hours JSON field:", hoursData);
    hoursData = {};
  }

  try {
    faqsData = JSON.parse(faqsData);
  } catch (error) {
    console.error("❌ Invalid JSON in FAQs JSON field:", faqsData);
    faqsData = [];
  }

  try {
    customSettings = JSON.parse(customSettings);
  } catch (error) {
    console.error("❌ Invalid JSON in Custom Settings field:", customSettings);
    customSettings = {};
  }

  return {
    id: record.id,
    name: record.fields["Name"],
    businessType: record.fields["Business Type"] || "other",
    phoneNumber: record.fields["Phone Number"],
    address: record.fields["Address"],
    hours: hoursData,
    faqs: faqsData,
    subscriptionTier: record.fields["Subscription Tier"] || "basic",
    trialEndsAt: record.fields["Trial Ends At"],
    orderingLink: record.fields["Online Ordering Link"],
    quoteLink: record.fields["Quote Link"],
    bookingLink: record.fields["Booking Link"],
    services: record.fields["Services"],
    customSettings: customSettings,
  };
}

// For backward compatibility
export async function getRestaurants() {
  return getBusinessesByType('restaurant');
}

export async function getAutoShops() {
  return getBusinessesByType('auto shop');
}

// Export the isConnectedToAirtable function for convenience
export { isConnectedToAirtable };
