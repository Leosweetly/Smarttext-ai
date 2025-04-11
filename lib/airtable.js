import Airtable from "airtable";

// Correct env variable names
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Initialize Airtable base if credentials are available
let base;
try {
  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    console.warn("Airtable credentials not found in environment variables");
  } else {
    base = new Airtable({ apiKey: AIRTABLE_PAT }).base(AIRTABLE_BASE_ID);
  }
} catch (error) {
  console.error("Error initializing Airtable:", error);
}

// Export the Airtable client for other modules to use
export const getAirtableClient = () => base;

// Helper function to safely get a table
const getTable = (tableName) => {
  if (!base) {
    throw new Error("Airtable base not initialized. Check your environment variables.");
  }
  return base(tableName);
};

// Helper function to explore a table's schema
export async function exploreTableSchema(tableName) {
  try {
    const table = getTable(tableName);
    const records = await table.select({ maxRecords: 1 }).firstPage();
    
    if (records.length === 0) {
      return { fields: [], recordCount: 0 };
    }
    
    const record = records[0];
    const fields = Object.keys(record.fields).map(fieldName => ({
      name: fieldName,
      type: Array.isArray(record.get(fieldName)) 
        ? 'Array' 
        : typeof record.get(fieldName),
      sample: record.get(fieldName)
    }));
    
    const allRecords = await table.select().all();
    
    return {
      fields,
      recordCount: allRecords.length
    };
  } catch (error) {
    console.error(`Error exploring table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Get all businesses from the Businesses table
 * @returns {Promise<Array>} Array of business objects
 */
export async function getBusinesses() {
  try {
    const businessesTable = getTable("Businesses");
    const records = await businessesTable.select({ view: "Grid view" }).firstPage();
    
    return records.map((record) => {
      let hoursData = record.get("Hours JSON") || "{}"; // Default to empty JSON object
      let faqsData = record.get("FAQs JSON") || "[]"; // Default to empty JSON array

      try {
        hoursData = JSON.parse(hoursData); // Try parsing the JSON
      } catch (error) {
        console.error("❌ Invalid JSON in Hours JSON field:", hoursData);
        hoursData = {}; // Fallback to empty object if parsing fails
      }

      try {
        faqsData = JSON.parse(faqsData); // Try parsing the JSON
      } catch (error) {
        console.error("❌ Invalid JSON in FAQs JSON field:", faqsData);
        faqsData = []; // Fallback to empty array if parsing fails
      }

      // Parse custom settings if available
      let customSettings = record.get("Custom Settings") || "{}";
      try {
        customSettings = JSON.parse(customSettings);
      } catch (error) {
        console.error("❌ Invalid JSON in Custom Settings field:", customSettings);
        customSettings = {};
      }

      return {
        id: record.id,
        name: record.get("Name"),
        businessType: record.get("Business Type") || "other",
        phoneNumber: record.get("Phone Number"),
        address: record.get("Address"),
        hours: hoursData,
        faqs: faqsData,
        subscriptionTier: record.get("Subscription Tier") || "basic",
        trialEndsAt: record.get("Trial Ends At"),
        // Links and additional fields
        orderingLink: record.get("Online Ordering Link"),
        quoteLink: record.get("Quote Link"),
        bookingLink: record.get("Booking Link"),
        services: record.get("Services"),
        customSettings: customSettings,
      };
    });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    throw error;
  }
}

/**
 * Get a business by ID
 * @param {string} id - The business ID
 * @returns {Promise<Object|null>} The business object or null if not found
 */
export async function getBusinessById(id) {
  try {
    const businessesTable = getTable("Businesses");
    const record = await businessesTable.find(id);
    
    if (!record) return null;
    
    let hoursData = record.get("Hours JSON") || "{}";
    let faqsData = record.get("FAQs JSON") || "[]";

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

    // Parse custom settings if available
    let customSettings = record.get("Custom Settings") || "{}";
    try {
      customSettings = JSON.parse(customSettings);
    } catch (error) {
      console.error("❌ Invalid JSON in Custom Settings field:", customSettings);
      customSettings = {};
    }

    return {
      id: record.id,
      name: record.get("Name"),
      businessType: record.get("Business Type") || "other",
      phoneNumber: record.get("Phone Number"),
      address: record.get("Address"),
      hours: hoursData,
      faqs: faqsData,
      subscriptionTier: record.get("Subscription Tier") || "basic",
      trialEndsAt: record.get("Trial Ends At"),
      // Links and additional fields
      orderingLink: record.get("Online Ordering Link"),
      quoteLink: record.get("Quote Link"),
      bookingLink: record.get("Booking Link"),
      services: record.get("Services"),
      customSettings: customSettings,
    };
  } catch (error) {
    console.error("Error fetching business by ID:", error);
    throw error;
  }
}

/**
 * Get businesses filtered by type
 * @param {string} businessType - The business type to filter by
 * @returns {Promise<Array>} Array of business objects
 */
export async function getBusinessesByType(businessType) {
  'use server'; // Required for Next.js 15 server components
  try {
    const businessesTable = getTable("Businesses");
    const records = await businessesTable.select({
      view: "Grid view",
      filterByFormula: `{Business Type} = '${businessType}'`
    }).firstPage();
    
    return records.map((record) => {
      let hoursData = record.get("Hours JSON") || "{}";
      let faqsData = record.get("FAQs JSON") || "[]";

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

      // Parse custom settings if available
      let customSettings = record.get("Custom Settings") || "{}";
      try {
        customSettings = JSON.parse(customSettings);
      } catch (error) {
        console.error("❌ Invalid JSON in Custom Settings field:", customSettings);
        customSettings = {};
      }

      return {
        id: record.id,
        name: record.get("Name"),
        businessType: record.get("Business Type"),
        phoneNumber: record.get("Phone Number"),
        address: record.get("Address"),
        hours: hoursData,
        faqs: faqsData,
        subscriptionTier: record.get("Subscription Tier") || "basic",
        trialEndsAt: record.get("Trial Ends At"),
        // Links and additional fields
        orderingLink: record.get("Online Ordering Link"),
        quoteLink: record.get("Quote Link"),
        bookingLink: record.get("Booking Link"),
        services: record.get("Services"),
        customSettings: customSettings,
      };
    });
  } catch (error) {
    console.error(`Error fetching businesses by type ${businessType}:`, error);
    throw error;
  }
}

/**
 * Get a business by phone number
 * @param {string} phoneNumber - The phone number to search for
 * @returns {Promise<Object|null>} The business object or null if not found
 */
export async function getBusinessByPhoneNumber(phoneNumber) {
  try {
    const businessesTable = getTable("Businesses");
    const records = await businessesTable.select({
      view: "Grid view",
      filterByFormula: `{Twilio Number} = '${phoneNumber}'`
    }).firstPage();
    
    if (records.length === 0) {
      return null;
    }
    
    const record = records[0];
    
    let hoursData = record.get("Hours JSON") || "{}";
    let faqsData = record.get("FAQs JSON") || "[]";

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

    // Parse custom settings if available
    let customSettings = record.get("Custom Settings") || "{}";
    try {
      customSettings = JSON.parse(customSettings);
    } catch (error) {
      console.error("❌ Invalid JSON in Custom Settings field:", customSettings);
      customSettings = {};
    }

    return {
      id: record.id,
      name: record.get("Name"),
      businessType: record.get("Business Type") || "other",
      phoneNumber: record.get("Phone Number"),
      address: record.get("Address"),
      hours: hoursData,
      faqs: faqsData,
      subscriptionTier: record.get("Subscription Tier") || "basic",
      trialEndsAt: record.get("Trial Ends At"),
      // Links and additional fields
      orderingLink: record.get("Online Ordering Link"),
      quoteLink: record.get("Quote Link"),
      bookingLink: record.get("Booking Link"),
      services: record.get("Services"),
      customSettings: customSettings,
    };
  } catch (error) {
    console.error("Error finding business by phone number:", error);
    throw error;
  }
}

/**
 * Update a business in Airtable
 * @param {string} id - The business ID
 * @param {Object} data - The data to update
 * @returns {Promise<Object>} The updated business object
 */
export async function updateBusiness(id, data) {
  try {
    const businessesTable = getTable("Businesses");
    
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
    if (data.faqs) fields["FAQs JSON"] = formatFAQsForAirtable(data.faqs);
    if (data.customSettings) fields["Custom Settings"] = JSON.stringify(data.customSettings);
    
    // Update the record
    const updatedRecord = await businessesTable.update(id, fields);
    
    // Return the updated business
    return getBusinessById(id);
  } catch (error) {
    console.error("Error updating business:", error);
    throw error;
  }
}

/**
 * Create a new business in Airtable
 * @param {Object} data - The business data
 * @returns {Promise<Object>} The created business object
 */
export async function createBusiness(data) {
  try {
    const businessesTable = getTable("Businesses");
    
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
    if (data.faqs) fields["FAQs JSON"] = formatFAQsForAirtable(data.faqs);
    if (data.customSettings) fields["Custom Settings"] = JSON.stringify(data.customSettings);
    
    // Create the record
    const createdRecord = await businessesTable.create(fields);
    
    // Return the created business
    return getBusinessById(createdRecord.id);
  } catch (error) {
    console.error("Error creating business:", error);
    throw error;
  }
}

// For backward compatibility
export async function getRestaurants() {
  'use server'; // Add use server directive
  return getBusinessesByType('restaurant');
}

export async function getAutoShops() {
  'use server'; // Add use server directive
  return getBusinessesByType('auto shop');
}
/**
 * Format FAQs for Airtable storage
 * Converts array of { question, answer } to JSON string
 * @param {Array} faqs - List of FAQ objects
 * @returns {string} - JSON stringified FAQs
 */
export function formatFAQsForAirtable(faqs) {
  if (!Array.isArray(faqs)) return '[]';
  return JSON.stringify(
    faqs.map(({ question, answer }) => ({
      q: question,
      a: answer,
    }))
  );
}

/**
 * Log a missed call to Airtable
 * @param {Object} missedCallData - The missed call data
 * @param {string} missedCallData.callerNumber - The caller's phone number
 * @param {string} missedCallData.businessNumber - The business phone number
 * @param {string} missedCallData.businessId - The business ID
 * @param {string} missedCallData.callStatus - The call status
 * @param {boolean} missedCallData.ownerNotified - Whether the owner was notified
 * @returns {Promise<Object|null>} The created record or null if error
 */
export async function logMissedCall(missedCallData) {
  try {
    const table = getTable("Missed Calls");
    
    const fields = {
      "Caller Number": missedCallData.callerNumber,
      "Business Number": missedCallData.businessNumber,
      "Business": [missedCallData.businessId], // Linked record
      "Call Status": missedCallData.callStatus,
      "Owner Notified": missedCallData.ownerNotified,
      "Timestamp": new Date().toISOString()
    };
    
    const createdRecord = await table.create(fields);
    console.log(`✅ Logged missed call to Airtable, record ID: ${createdRecord.id}`);
    return createdRecord;
  } catch (error) {
    console.error("❌ Error logging missed call to Airtable:", error);
    return null; // Return null instead of throwing to prevent interrupting the SMS flow
  }
}

/**
 * Log a call to the Call Logs table in Airtable for analytics
 * @param {Object} callData - The call data
 * @param {string} callData.businessName - The business name
 * @param {string} callData.callerNumber - The caller's phone number
 * @param {string} callData.ownerNumber - The business owner's phone number (if available)
 * @param {string} callData.callStatus - The call status
 * @param {string} callData.notes - Additional notes about the call
 * @returns {Promise<Object|null>} The created record or null if error
 */
export async function logCallToCallLogs(callData) {
  try {
    const table = getTable("Call Logs");
    
    const fields = {
      "Business Name": callData.businessName,
      "Caller Number": callData.callerNumber,
      "Owner Number": callData.ownerNumber || "",
      "Timestamp": new Date().toISOString(),
      "Call Status": callData.callStatus,
      "Notes": callData.notes || ""
    };
    
    const createdRecord = await table.create(fields);
    console.log(`✅ Logged call to Call Logs table in Airtable, record ID: ${createdRecord.id}`);
    return createdRecord;
  } catch (error) {
    console.error("❌ Error logging call to Call Logs table in Airtable:", error);
    return null; // Return null instead of throwing to prevent interrupting the flow
  }
}

/**
 * Update a business's subscription information in Airtable
 * @param {string} businessId - The business ID
 * @param {Object} subscriptionData - The subscription data to update
 * @param {string} [subscriptionData.stripeCustomerId] - Stripe customer ID
 * @param {string} [subscriptionData.stripeSubscriptionId] - Stripe subscription ID
 * @param {string} [subscriptionData.subscriptionTier] - Subscription tier (basic, pro, enterprise)
 * @param {string} [subscriptionData.subscriptionStatus] - Subscription status
 * @param {string} [subscriptionData.trialEndsAt] - Trial end date (ISO string)
 * @param {boolean} [subscriptionData.cancelAtPeriodEnd] - Whether the subscription is set to cancel at the end of the period
 * @param {string} [subscriptionData.subscriptionUpdatedAt] - Timestamp when subscription was last updated
 * @returns {Promise<Object>} The updated business object
 */
export async function updateBusinessSubscription(businessId, subscriptionData) {
  try {
    const businessesTable = getTable("Businesses");
    
    // Prepare the data for Airtable
    const fields = {};
    
    if (subscriptionData.stripeCustomerId) fields["Stripe Customer ID"] = subscriptionData.stripeCustomerId;
    if (subscriptionData.stripeSubscriptionId) fields["Stripe Subscription ID"] = subscriptionData.stripeSubscriptionId;
    if (subscriptionData.subscriptionTier) fields["Subscription Tier"] = subscriptionData.subscriptionTier;
    if (subscriptionData.subscriptionStatus) fields["Subscription Status"] = subscriptionData.subscriptionStatus;
    if (subscriptionData.trialEndsAt) fields["Trial Ends At"] = subscriptionData.trialEndsAt;
    if (subscriptionData.cancelAtPeriodEnd !== undefined) fields["Cancel At Period End"] = subscriptionData.cancelAtPeriodEnd;
    if (subscriptionData.subscriptionUpdatedAt) fields["Subscription Updated At"] = subscriptionData.subscriptionUpdatedAt;
    
    // If any subscription data is being updated, automatically set the updated timestamp
    // unless it was explicitly provided
    if (!subscriptionData.subscriptionUpdatedAt && 
        (subscriptionData.subscriptionTier || 
         subscriptionData.subscriptionStatus || 
         subscriptionData.stripeSubscriptionId || 
         subscriptionData.cancelAtPeriodEnd !== undefined)) {
      fields["Subscription Updated At"] = new Date().toISOString();
    }
    
    // Update the record
    await businessesTable.update(businessId, fields);
    
    // Log the subscription update
    console.log(`Updated subscription for business ${businessId}:`, subscriptionData);
    
    // Return the updated business
    return getBusinessById(businessId);
  } catch (error) {
    console.error("Error updating business subscription:", error);
    throw error;
  }
}
