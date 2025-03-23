/**
 * SmartText Programmatic Marketing Tool
 * 
 * This module provides functionality for tracking lead sources,
 * analyzing marketing performance, and automating follow-up campaigns.
 */

import { getTable } from '../data/airtable-client';

/**
 * Source types for tracking where leads come from
 */
export const SOURCE_TYPES = {
  GOOGLE: 'google',
  YELP: 'yelp',
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
  WEBSITE: 'website',
  DIRECT: 'direct',
  REFERRAL: 'referral',
  OTHER: 'other',
};

/**
 * Track a lead source for a missed call
 * @param {string} phoneNumber - The caller's phone number
 * @param {string} source - The source of the lead (use SOURCE_TYPES)
 * @param {string} [campaign] - Optional campaign identifier
 * @param {Object} [metadata] - Additional metadata about the lead source
 * @returns {Promise<Object>} - The created or updated lead record
 */
export async function trackLeadSource(phoneNumber, source, campaign = null, metadata = {}) {
  try {
    // Normalize the phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    
    // Get the Leads table
    const leadsTable = getTable('Leads');
    
    // Check if the lead already exists
    const existingLeads = await leadsTable.select({
      filterByFormula: `{Phone Number} = '${normalizedPhone}'`,
      maxRecords: 1,
    }).firstPage();
    
    const timestamp = new Date().toISOString();
    const sourceData = {
      source,
      campaign,
      timestamp,
      ...metadata,
    };
    
    // If the lead exists, update it
    if (existingLeads && existingLeads.length > 0) {
      const existingLead = existingLeads[0];
      const currentSources = JSON.parse(existingLead.get('Source History') || '[]');
      
      // Add the new source to the history
      currentSources.push(sourceData);
      
      // Update the lead record
      const updatedLead = await leadsTable.update(existingLead.id, {
        'Last Source': source,
        'Last Campaign': campaign,
        'Last Contact': timestamp,
        'Source History': JSON.stringify(currentSources),
      });
      
      return {
        id: updatedLead.id,
        phoneNumber: normalizedPhone,
        source,
        campaign,
        isNewLead: false,
      };
    }
    
    // If the lead doesn't exist, create a new one
    const newLead = await leadsTable.create({
      'Phone Number': normalizedPhone,
      'First Source': source,
      'Last Source': source,
      'Last Campaign': campaign,
      'First Contact': timestamp,
      'Last Contact': timestamp,
      'Source History': JSON.stringify([sourceData]),
      'Status': 'new',
    });
    
    return {
      id: newLead.id,
      phoneNumber: normalizedPhone,
      source,
      campaign,
      isNewLead: true,
    };
  } catch (error) {
    console.error('Error tracking lead source:', error);
    throw error;
  }
}

/**
 * Get source attribution data for a business
 * @param {string} businessId - The business ID
 * @param {Object} options - Query options
 * @param {number} [options.days=30] - Number of days to include in the report
 * @param {boolean} [options.includeCampaigns=false] - Whether to break down by campaigns
 * @returns {Promise<Object>} - The attribution report
 */
export async function getSourceAttribution(businessId, options = {}) {
  const { days = 30, includeCampaigns = false } = options;
  
  try {
    // Get the Leads table
    const leadsTable = getTable('Leads');
    
    // Calculate the date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Query leads for this business in the date range
    const leads = await leadsTable.select({
      filterByFormula: `AND({Business ID} = '${businessId}', IS_AFTER({First Contact}, '${startDate.toISOString()}'))`,
    }).all();
    
    // Initialize the report
    const report = {
      totalLeads: leads.length,
      bySource: {},
      byCampaign: {},
      conversionRate: 0,
      leadValue: 0,
    };
    
    // Process each lead
    leads.forEach(lead => {
      const source = lead.get('First Source') || 'unknown';
      const campaign = lead.get('Last Campaign') || 'none';
      const status = lead.get('Status') || 'new';
      const converted = status === 'converted';
      
      // Count by source
      if (!report.bySource[source]) {
        report.bySource[source] = {
          count: 0,
          converted: 0,
          conversionRate: 0,
        };
      }
      
      report.bySource[source].count++;
      
      if (converted) {
        report.bySource[source].converted++;
      }
      
      // Count by campaign if requested
      if (includeCampaigns && campaign !== 'none') {
        if (!report.byCampaign[campaign]) {
          report.byCampaign[campaign] = {
            count: 0,
            converted: 0,
            conversionRate: 0,
            source: source,
          };
        }
        
        report.byCampaign[campaign].count++;
        
        if (converted) {
          report.byCampaign[campaign].converted++;
        }
      }
    });
    
    // Calculate conversion rates
    let totalConverted = 0;
    
    Object.keys(report.bySource).forEach(source => {
      const sourceData = report.bySource[source];
      sourceData.conversionRate = sourceData.count > 0 
        ? (sourceData.converted / sourceData.count) * 100 
        : 0;
      
      totalConverted += sourceData.converted;
    });
    
    if (includeCampaigns) {
      Object.keys(report.byCampaign).forEach(campaign => {
        const campaignData = report.byCampaign[campaign];
        campaignData.conversionRate = campaignData.count > 0 
          ? (campaignData.converted / campaignData.count) * 100 
          : 0;
      });
    }
    
    // Calculate overall conversion rate
    report.conversionRate = report.totalLeads > 0 
      ? (totalConverted / report.totalLeads) * 100 
      : 0;
    
    return report;
  } catch (error) {
    console.error('Error getting source attribution:', error);
    throw error;
  }
}

/**
 * Create a follow-up SMS campaign for leads from a specific source
 * @param {string} businessId - The business ID
 * @param {string} source - The source to target
 * @param {string} message - The message to send
 * @param {Object} options - Campaign options
 * @param {number} [options.days=30] - How far back to look for leads
 * @param {string} [options.status] - Filter by lead status
 * @returns {Promise<Object>} - The campaign results
 */
export async function createSourceCampaign(businessId, source, message, options = {}) {
  const { days = 30, status = 'new' } = options;
  
  try {
    // Get the Leads table
    const leadsTable = getTable('Leads');
    
    // Calculate the date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Build the filter formula
    let filterFormula = `AND({Business ID} = '${businessId}', {Last Source} = '${source}', IS_AFTER({First Contact}, '${startDate.toISOString()}'))`;
    
    if (status) {
      filterFormula = `AND(${filterFormula}, {Status} = '${status}')`;
    }
    
    // Query leads for this campaign
    const leads = await leadsTable.select({
      filterByFormula: filterFormula,
    }).all();
    
    // Create a new campaign record
    const campaignsTable = getTable('Campaigns');
    const campaignName = `${source.toUpperCase()} Follow-up ${new Date().toLocaleDateString()}`;
    
    const campaign = await campaignsTable.create({
      'Name': campaignName,
      'Business ID': businessId,
      'Source': source,
      'Message': message,
      'Status': 'scheduled',
      'Created At': new Date().toISOString(),
      'Lead Count': leads.length,
    });
    
    // Return the campaign details
    return {
      id: campaign.id,
      name: campaignName,
      source,
      leadCount: leads.length,
      message,
    };
  } catch (error) {
    console.error('Error creating source campaign:', error);
    throw error;
  }
}

/**
 * Suggest campaigns based on lead source patterns
 * @param {string} businessId - The business ID
 * @returns {Promise<Array>} - Array of campaign suggestions
 */
export async function suggestCampaigns(businessId) {
  try {
    // Get attribution data
    const attribution = await getSourceAttribution(businessId, { days: 90 });
    const suggestions = [];
    
    // Find sources with low conversion rates but high volume
    Object.entries(attribution.bySource).forEach(([source, data]) => {
      if (data.count >= 10 && data.conversionRate < 20) {
        suggestions.push({
          type: 'follow-up',
          source,
          leadCount: data.count,
          conversionRate: data.conversionRate,
          message: `We noticed you recently called ${businessId}. Would you like to schedule an appointment or have any questions I can answer?`,
          reason: `You have ${data.count} leads from ${source} with only a ${data.conversionRate.toFixed(1)}% conversion rate.`,
        });
      }
    });
    
    // Find sources with no activity in the last 30 days but good historical performance
    // This would require additional historical data analysis
    
    return suggestions;
  } catch (error) {
    console.error('Error suggesting campaigns:', error);
    throw error;
  }
}

/**
 * Helper function to normalize phone numbers
 * @param {string} phoneNumber - The phone number to normalize
 * @returns {string} - The normalized phone number
 */
function normalizePhoneNumber(phoneNumber) {
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Ensure it has the country code
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }
  
  // Return as-is if it doesn't match expected formats
  return phoneNumber;
}
