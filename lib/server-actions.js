'use server';

import { getTable } from './airtable-utils';

/**
 * Get businesses filtered by type - Server Action
 * @param {string} businessType - The business type to filter by
 * @returns {Promise<Array>} Array of business objects
 */
export async function fetchBusinessesByType(businessType) {
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
 * Get restaurants - Server Action
 * @returns {Promise<Array>} Array of restaurant objects
 */
export async function fetchRestaurants() {
  return fetchBusinessesByType('restaurant');
}

/**
 * Get auto shops - Server Action
 * @returns {Promise<Array>} Array of auto shop objects
 */
export async function fetchAutoShops() {
  return fetchBusinessesByType('auto shop');
}
