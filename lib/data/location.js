import { getTable } from './airtable-client';
import { getBusinessById } from './business';

/**
 * Get all locations from the Locations table
 * @returns {Promise<Array>} Array of location objects
 */
export async function getLocations() {
  try {
    const locationsTable = getTable("Locations");
    const records = await locationsTable.select({ view: "Grid view" }).firstPage();
    
    return records.map((record) => {
      let hoursData = record.get("Hours JSON") || "{}"; // Default to empty JSON object
      
      try {
        hoursData = JSON.parse(hoursData); // Try parsing the JSON
      } catch (error) {
        console.error("❌ Invalid JSON in Hours JSON field:", hoursData);
        hoursData = {}; // Fallback to empty object if parsing fails
      }

      // Parse custom settings if available
      let customSettings = record.get("Custom Settings") || "{}";
      try {
        customSettings = JSON.parse(customSettings);
      } catch (error) {
        console.error("❌ Invalid JSON in Custom Settings field:", customSettings);
        customSettings = {};
      }

      // Parse auto-reply templates if available
      let autoReplyTemplates = record.get("Auto Reply Templates") || "{}";
      try {
        autoReplyTemplates = JSON.parse(autoReplyTemplates);
      } catch (error) {
        console.error("❌ Invalid JSON in Auto Reply Templates field:", autoReplyTemplates);
        autoReplyTemplates = {};
      }

      return {
        id: record.id,
        businessId: record.get("Business ID"),
        name: record.get("Name"),
        phoneNumber: record.get("Phone Number"),
        address: record.get("Address"),
        hours: hoursData,
        managerName: record.get("Manager Name"),
        managerEmail: record.get("Manager Email"),
        managerPhone: record.get("Manager Phone"),
        customSettings: customSettings,
        autoReplyTemplates: autoReplyTemplates,
        createdAt: record.get("Created At"),
        updatedAt: record.get("Updated At"),
      };
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    throw error;
  }
}

/**
 * Get a location by ID
 * @param {string} id - The location ID
 * @returns {Promise<Object|null>} The location object or null if not found
 */
export async function getLocationById(id) {
  try {
    const locationsTable = getTable("Locations");
    const record = await locationsTable.find(id);
    
    if (!record) return null;
    
    let hoursData = record.get("Hours JSON") || "{}";
    
    try {
      hoursData = JSON.parse(hoursData);
    } catch (error) {
      console.error("❌ Invalid JSON in Hours JSON field:", hoursData);
      hoursData = {};
    }

    // Parse custom settings if available
    let customSettings = record.get("Custom Settings") || "{}";
    try {
      customSettings = JSON.parse(customSettings);
    } catch (error) {
      console.error("❌ Invalid JSON in Custom Settings field:", customSettings);
      customSettings = {};
    }

    // Parse auto-reply templates if available
    let autoReplyTemplates = record.get("Auto Reply Templates") || "{}";
    try {
      autoReplyTemplates = JSON.parse(autoReplyTemplates);
    } catch (error) {
      console.error("❌ Invalid JSON in Auto Reply Templates field:", autoReplyTemplates);
      autoReplyTemplates = {};
    }

    return {
      id: record.id,
      businessId: record.get("Business ID"),
      name: record.get("Name"),
      phoneNumber: record.get("Phone Number"),
      address: record.get("Address"),
      hours: hoursData,
      managerName: record.get("Manager Name"),
      managerEmail: record.get("Manager Email"),
      managerPhone: record.get("Manager Phone"),
      customSettings: customSettings,
      autoReplyTemplates: autoReplyTemplates,
      createdAt: record.get("Created At"),
      updatedAt: record.get("Updated At"),
    };
  } catch (error) {
    console.error("Error fetching location by ID:", error);
    throw error;
  }
}

/**
 * Get locations for a specific business
 * @param {string} businessId - The business ID
 * @returns {Promise<Array>} Array of location objects
 */
export async function getLocationsByBusinessId(businessId) {
  try {
    const locationsTable = getTable("Locations");
    const records = await locationsTable.select({
      view: "Grid view",
      filterByFormula: `{Business ID} = '${businessId}'`
    }).firstPage();
    
    return records.map((record) => {
      let hoursData = record.get("Hours JSON") || "{}";
      
      try {
        hoursData = JSON.parse(hoursData);
      } catch (error) {
        console.error("❌ Invalid JSON in Hours JSON field:", hoursData);
        hoursData = {};
      }

      // Parse custom settings if available
      let customSettings = record.get("Custom Settings") || "{}";
      try {
        customSettings = JSON.parse(customSettings);
      } catch (error) {
        console.error("❌ Invalid JSON in Custom Settings field:", customSettings);
        customSettings = {};
      }

      // Parse auto-reply templates if available
      let autoReplyTemplates = record.get("Auto Reply Templates") || "{}";
      try {
        autoReplyTemplates = JSON.parse(autoReplyTemplates);
      } catch (error) {
        console.error("❌ Invalid JSON in Auto Reply Templates field:", autoReplyTemplates);
        autoReplyTemplates = {};
      }

      return {
        id: record.id,
        businessId: record.get("Business ID"),
        name: record.get("Name"),
        phoneNumber: record.get("Phone Number"),
        address: record.get("Address"),
        hours: hoursData,
        managerName: record.get("Manager Name"),
        managerEmail: record.get("Manager Email"),
        managerPhone: record.get("Manager Phone"),
        customSettings: customSettings,
        autoReplyTemplates: autoReplyTemplates,
        createdAt: record.get("Created At"),
        updatedAt: record.get("Updated At"),
      };
    });
  } catch (error) {
    console.error(`Error fetching locations for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Get a location by phone number
 * @param {string} phoneNumber - The phone number to search for
 * @returns {Promise<Object|null>} The location object or null if not found
 */
export async function getLocationByPhoneNumber(phoneNumber) {
  try {
    const locationsTable = getTable("Locations");
    const records = await locationsTable.select({
      view: "Grid view",
      filterByFormula: `{Phone Number} = '${phoneNumber}'`
    }).firstPage();
    
    if (records.length === 0) {
      return null;
    }
    
    const record = records[0];
    
    let hoursData = record.get("Hours JSON") || "{}";
    
    try {
      hoursData = JSON.parse(hoursData);
    } catch (error) {
      console.error("❌ Invalid JSON in Hours JSON field:", hoursData);
      hoursData = {};
    }

    // Parse custom settings if available
    let customSettings = record.get("Custom Settings") || "{}";
    try {
      customSettings = JSON.parse(customSettings);
    } catch (error) {
      console.error("❌ Invalid JSON in Custom Settings field:", customSettings);
      customSettings = {};
    }

    // Parse auto-reply templates if available
    let autoReplyTemplates = record.get("Auto Reply Templates") || "{}";
    try {
      autoReplyTemplates = JSON.parse(autoReplyTemplates);
    } catch (error) {
      console.error("❌ Invalid JSON in Auto Reply Templates field:", autoReplyTemplates);
      autoReplyTemplates = {};
    }

    return {
      id: record.id,
      businessId: record.get("Business ID"),
      name: record.get("Name"),
      phoneNumber: record.get("Phone Number"),
      address: record.get("Address"),
      hours: hoursData,
      managerName: record.get("Manager Name"),
      managerEmail: record.get("Manager Email"),
      managerPhone: record.get("Manager Phone"),
      customSettings: customSettings,
      autoReplyTemplates: autoReplyTemplates,
      createdAt: record.get("Created At"),
      updatedAt: record.get("Updated At"),
    };
  } catch (error) {
    console.error("Error finding location by phone number:", error);
    throw error;
  }
}

/**
 * Create a new location in Airtable
 * @param {Object} data - The location data
 * @returns {Promise<Object>} The created location object
 */
export async function createLocation(data) {
  try {
    const locationsTable = getTable("Locations");
    
    // Verify that the business exists
    if (data.businessId) {
      const business = await getBusinessById(data.businessId);
      if (!business) {
        throw new Error(`Business with ID ${data.businessId} not found`);
      }
    }
    
    // Prepare the data for Airtable
    const fields = {
      "Business ID": data.businessId,
      "Name": data.name || "New Location",
      "Phone Number": data.phoneNumber || "",
      "Address": data.address || "",
      "Manager Name": data.managerName || "",
      "Manager Email": data.managerEmail || "",
      "Manager Phone": data.managerPhone || "",
      "Created At": new Date().toISOString(),
      "Updated At": new Date().toISOString(),
    };
    
    // Handle JSON fields
    if (data.hours) fields["Hours JSON"] = JSON.stringify(data.hours);
    if (data.customSettings) fields["Custom Settings"] = JSON.stringify(data.customSettings);
    if (data.autoReplyTemplates) fields["Auto Reply Templates"] = JSON.stringify(data.autoReplyTemplates);
    
    // Create the record
    const createdRecord = await locationsTable.create(fields);
    
    // Return the created location
    return getLocationById(createdRecord.id);
  } catch (error) {
    console.error("Error creating location:", error);
    throw error;
  }
}

/**
 * Update a location in Airtable
 * @param {string} id - The location ID
 * @param {Object} data - The data to update
 * @returns {Promise<Object>} The updated location object
 */
export async function updateLocation(id, data) {
  try {
    const locationsTable = getTable("Locations");
    
    // Prepare the data for Airtable
    const fields = {
      "Updated At": new Date().toISOString(),
    };
    
    if (data.businessId) fields["Business ID"] = data.businessId;
    if (data.name) fields["Name"] = data.name;
    if (data.phoneNumber) fields["Phone Number"] = data.phoneNumber;
    if (data.address) fields["Address"] = data.address;
    if (data.managerName) fields["Manager Name"] = data.managerName;
    if (data.managerEmail) fields["Manager Email"] = data.managerEmail;
    if (data.managerPhone) fields["Manager Phone"] = data.managerPhone;
    
    // Handle JSON fields
    if (data.hours) fields["Hours JSON"] = JSON.stringify(data.hours);
    if (data.customSettings) fields["Custom Settings"] = JSON.stringify(data.customSettings);
    if (data.autoReplyTemplates) fields["Auto Reply Templates"] = JSON.stringify(data.autoReplyTemplates);
    
    // Update the record
    const updatedRecord = await locationsTable.update(id, fields);
    
    // Return the updated location
    return getLocationById(id);
  } catch (error) {
    console.error("Error updating location:", error);
    throw error;
  }
}

/**
 * Delete a location from Airtable
 * @param {string} id - The location ID
 * @returns {Promise<boolean>} True if successful
 */
export async function deleteLocation(id) {
  try {
    const locationsTable = getTable("Locations");
    await locationsTable.destroy(id);
    return true;
  } catch (error) {
    console.error("Error deleting location:", error);
    throw error;
  }
}

/**
 * Get a location with its parent business data
 * @param {string} id - The location ID
 * @returns {Promise<Object|null>} The location object with business data or null if not found
 */
export async function getLocationWithBusiness(id) {
  try {
    const location = await getLocationById(id);
    
    if (!location) return null;
    
    const business = await getBusinessById(location.businessId);
    
    return {
      ...location,
      business: business || null,
    };
  } catch (error) {
    console.error("Error fetching location with business:", error);
    throw error;
  }
}
