/**
 * Business data module
 * 
 * This file provides functions for working with business data.
 * It's a backend-only module that doesn't depend on any frontend components.
 */

import { getTable } from './airtable-client.js';
import { getLocationsByBusinessId } from './location';

/**
 * Get all businesses
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
        forwardingNumber: record.get("Forwarding Phone Number") || record.get("Phone Number"), // Use forwarding number if available, otherwise use main phone
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
        hasMultipleLocations: record.get("Has Multiple Locations") || false,
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
      forwardingNumber: record.get("Forwarding Phone Number") || record.get("Phone Number"), // Use forwarding number if available, otherwise use main phone
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
      hasMultipleLocations: record.get("Has Multiple Locations") || false,
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
        forwardingNumber: record.get("Forwarding Phone Number") || record.get("Phone Number"), // Use forwarding number if available, otherwise use main phone
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
        hasMultipleLocations: record.get("Has Multiple Locations") || false,
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
      filterByFormula: `{Phone Number} = '${phoneNumber}'`
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
      forwardingNumber: record.get("Forwarding Phone Number") || record.get("Phone Number"), // Use forwarding number if available, otherwise use main phone
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
      hasMultipleLocations: record.get("Has Multiple Locations") || false,
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
    if (data.forwardingNumber) fields["Forwarding Phone Number"] = data.forwardingNumber;
    if (data.address) fields["Address"] = data.address;
    if (data.orderingLink) fields["Online Ordering Link"] = data.orderingLink;
    if (data.quoteLink) fields["Quote Link"] = data.quoteLink;
    if (data.bookingLink) fields["Booking Link"] = data.bookingLink;
    if (data.services) fields["Services"] = data.services;
    if (data.subscriptionTier) fields["Subscription Tier"] = data.subscriptionTier;
    if (data.trialEndsAt) fields["Trial Ends At"] = data.trialEndsAt;
    if (data.hasMultipleLocations !== undefined) fields["Has Multiple Locations"] = data.hasMultipleLocations;
    
    // Handle JSON fields
    if (data.hours) fields["Hours JSON"] = JSON.stringify(data.hours);
    if (data.faqs) fields["FAQs JSON"] = JSON.stringify(data.faqs);
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
      "Forwarding Phone Number": data.forwardingNumber || data.phoneNumber || "", // Use forwarding number if provided, otherwise use main phone
      "Address": data.address || "",
      "Subscription Tier": data.subscriptionTier || "basic",
      "Has Multiple Locations": data.hasMultipleLocations || false,
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
    const createdRecord = await businessesTable.create(fields);
    
    // Return the created business
    return getBusinessById(createdRecord.id);
  } catch (error) {
    console.error("Error creating business:", error);
    throw error;
  }
}

/**
 * Get a business with all its locations
 * @param {string} id - The business ID
 * @returns {Promise<Object>} The business object with locations array
 */
export async function getBusinessWithLocations(id) {
  try {
    const business = await getBusinessById(id);
    
    if (!business) {
      throw new Error(`Business with ID ${id} not found`);
    }
    
    // Only fetch locations if the business has multiple locations
    if (business.hasMultipleLocations) {
      const locations = await getLocationsByBusinessId(id);
      return {
        ...business,
        locations: locations || [],
      };
    }
    
    return {
      ...business,
      locations: [],
    };
  } catch (error) {
    console.error(`Error fetching business with locations for ID ${id}:`, error);
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
