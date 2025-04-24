/**
 * Monitoring Module
 * 
 * This module provides functions for monitoring and tracking various events
 * in the SmartText application, including SMS events, OpenAI API usage,
 * and owner alerts.
 */

import { supabase } from './supabase';
import * as Sentry from './sentry';

/**
 * Track an SMS event
 * @param {Object} eventData - SMS event data
 * @param {string|null} eventData.messageSid - Twilio message SID (can be null or empty if not available)
 * @param {string} eventData.from - Sender phone number
 * @param {string} eventData.to - Recipient phone number
 * @param {string|null} eventData.businessId - Business ID (can be null if unknown)
 * @param {string} eventData.status - Message status (sent, delivered, failed, etc.)
 * @param {string|null} eventData.errorCode - Error code (if applicable)
 * @param {string|null} eventData.errorMessage - Error message (if applicable)
 * @param {string} eventData.requestId - Request ID for tracking
 * @param {number} eventData.bodyLength - Length of the message body
 * @param {Object} eventData.payload - Additional payload data
 * @returns {Promise<Object|null>} - The created event record or null if error
 */
export async function trackSmsEvent({
  messageSid,
  from,
  to,
  businessId,
  status,
  errorCode,
  errorMessage,
  requestId,
  bodyLength,
  payload = {}
}) {
  try {
    const { data, error } = await supabase
      .from('sms_events')
      .insert({
        message_sid: messageSid,
        from_number: from,
        to_number: to,
        business_id: businessId,
        status,
        error_code: errorCode,
        error_message: errorMessage,
        request_id: requestId,
        body_length: bodyLength,
        payload
      })
      .select();

    if (error) {
      console.error('Error tracking SMS event:', error);
      Sentry.captureException(error, { 
        extra: { 
          context: 'trackSmsEvent', 
          messageSid, 
          from, 
          to, 
          businessId, 
          status 
        } 
      });
      return null;
    }

    // If this was a failure, log it to Sentry as well
    if (status === 'failed' || status === 'undelivered') {
      Sentry.captureMessage(
        `SMS delivery failure: ${errorMessage || 'Unknown error'}`,
        'error',
        {
          messageSid,
          from,
          to,
          businessId,
          errorCode,
          requestId
        }
      );
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Exception in trackSmsEvent:', error);
    Sentry.captureException(error, { 
      extra: { 
        context: 'trackSmsEvent exception', 
        messageSid, 
        from, 
        to, 
        businessId, 
        status 
      } 
    });
    return null;
  }
}

/**
 * Track OpenAI API usage
 * @param {Object} usageData - Usage data
 * @param {string} usageData.endpoint - API endpoint or function name
 * @param {string|null} usageData.businessId - Business ID (can be null if unknown)
 * @param {number} usageData.tokensUsed - Number of tokens used
 * @param {number} usageData.costEstimate - Estimated cost in USD
 * @param {string} usageData.model - OpenAI model used
 * @param {string} usageData.requestId - Request ID for tracking
 * @param {Object} usageData.metadata - Additional metadata
 * @returns {Promise<Object|null>} - The created usage record or null if error
 */
export async function trackOpenAIUsage({
  endpoint,
  businessId,
  tokensUsed,
  costEstimate,
  model,
  requestId,
  metadata = {}
}) {
  try {
    const { data, error } = await supabase
      .from('api_usage')
      .insert({
        service: 'openai',
        endpoint,
        business_id: businessId,
        tokens_used: tokensUsed,
        cost_estimate: costEstimate,
        model,
        request_id: requestId,
        metadata
      })
      .select();

    if (error) {
      console.error('Error tracking OpenAI usage:', error);
      Sentry.captureException(error, { 
        extra: { 
          context: 'trackOpenAIUsage', 
          endpoint, 
          businessId, 
          tokensUsed, 
          model 
        } 
      });
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Exception in trackOpenAIUsage:', error);
    Sentry.captureException(error, { 
      extra: { 
        context: 'trackOpenAIUsage exception', 
        endpoint, 
        businessId, 
        tokensUsed, 
        model 
      } 
    });
    return null;
  }
}

/**
 * Check if a business has exceeded its daily OpenAI usage limit
 * @param {string|null} businessId - Business ID (can be null if unknown)
 * @param {number} tokenLimit - Token limit (default: 100000)
 * @returns {Promise<boolean>} - True if limit exceeded, false otherwise
 */
export async function checkOpenAIUsageLimit(businessId, tokenLimit = 100000) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data, error } = await supabase
      .from('api_usage')
      .select('tokens_used')
      .eq('service', 'openai')
      .eq('business_id', businessId)
      .eq('reset_date', today);

    if (error) {
      console.error('Error checking OpenAI usage limit:', error);
      // Default to allowing the request if we can't check the limit
      return false;
    }

    // Sum up all tokens used today
    const totalTokens = data.reduce((sum, record) => sum + (record.tokens_used || 0), 0);
    
    // Log if we're approaching the limit
    if (totalTokens > tokenLimit * 0.8) {
      console.warn(`Business ${businessId} is approaching OpenAI usage limit: ${totalTokens}/${tokenLimit} tokens`);
      
      // Log to Sentry if we're at 90%
      if (totalTokens > tokenLimit * 0.9) {
        Sentry.captureMessage(
          `Business ${businessId} is at 90% of OpenAI usage limit: ${totalTokens}/${tokenLimit} tokens`,
          'warning',
          { businessId, totalTokens, tokenLimit }
        );
      }
    }

    return totalTokens >= tokenLimit;
  } catch (error) {
    console.error('Exception in checkOpenAIUsageLimit:', error);
    Sentry.captureException(error, { 
      extra: { 
        context: 'checkOpenAIUsageLimit exception', 
        businessId, 
        tokenLimit 
      } 
    });
    // Default to allowing the request if we can't check the limit
    return false;
  }
}

/**
 * Track an owner alert
 * @param {Object} alertData - Alert data
 * @param {string|null} alertData.businessId - Business ID (can be null if unknown)
 * @param {string} alertData.ownerPhone - Owner's phone number
 * @param {string} alertData.customerPhone - Customer's phone number
 * @param {string} alertData.alertType - Type of alert (missed_call, urgent_message, etc.)
 * @param {string} alertData.messageContent - Content of the alert message
 * @param {string} alertData.detectionSource - How the alert was triggered
 * @param {string} alertData.messageSid - Twilio message SID if available
 * @param {boolean} alertData.delivered - Whether the alert was delivered
 * @param {string|null} alertData.errorMessage - Error message if delivery failed (can be null if successful)
 * @returns {Promise<Object|null>} - The created alert record or null if error
 */
export async function trackOwnerAlert({
  businessId,
  ownerPhone,
  customerPhone,
  alertType,
  messageContent,
  detectionSource,
  messageSid,
  delivered = true,
  errorMessage = null
}) {
  try {
    const { data, error } = await supabase
      .from('owner_alerts')
      .insert({
        business_id: businessId,
        owner_phone: ownerPhone,
        customer_phone: customerPhone,
        alert_type: alertType,
        message_content: messageContent,
        detection_source: detectionSource,
        message_sid: messageSid,
        delivered,
        error_message: errorMessage
      })
      .select();

    if (error) {
      console.error('Error tracking owner alert:', error);
      Sentry.captureException(error, { 
        extra: { 
          context: 'trackOwnerAlert', 
          businessId, 
          ownerPhone, 
          customerPhone, 
          alertType 
        } 
      });
      return null;
    }

    // If delivery failed, log to Sentry
    if (!delivered) {
      Sentry.captureMessage(
        `Failed to deliver owner alert: ${errorMessage || 'Unknown error'}`,
        'error',
        {
          businessId,
          ownerPhone,
          customerPhone,
          alertType,
          detectionSource
        }
      );
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Exception in trackOwnerAlert:', error);
    Sentry.captureException(error, { 
      extra: { 
        context: 'trackOwnerAlert exception', 
        businessId, 
        ownerPhone, 
        customerPhone, 
        alertType 
      } 
    });
    return null;
  }
}

/**
 * Update daily stats for a business
 * @param {string} businessId - Business ID
 * @param {string} date - Date in YYYY-MM-DD format (defaults to today)
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function updateDailyStats(businessId, date = null) {
  try {
    // Default to today if no date provided
    const statsDate = date || new Date().toISOString().split('T')[0];

    // Call the Supabase function to update stats
    const { error } = await supabase.rpc('update_daily_stats', {
      business_id_param: businessId,
      date_param: statsDate
    });

    if (error) {
      console.error('Error updating daily stats:', error);
      Sentry.captureException(error, { 
        extra: { 
          context: 'updateDailyStats', 
          businessId, 
          date: statsDate 
        } 
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in updateDailyStats:', error);
    Sentry.captureException(error, { 
      extra: { 
        context: 'updateDailyStats exception', 
        businessId, 
        date 
      } 
    });
    return false;
  }
}

/**
 * Reset daily OpenAI usage counters for all businesses
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function resetDailyOpenAIUsage() {
  try {
    const { error } = await supabase.rpc('reset_daily_openai_usage');

    if (error) {
      console.error('Error resetting daily OpenAI usage:', error);
      Sentry.captureException(error, { 
        extra: { 
          context: 'resetDailyOpenAIUsage'
        } 
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in resetDailyOpenAIUsage:', error);
    Sentry.captureException(error, { 
      extra: { 
        context: 'resetDailyOpenAIUsage exception'
      } 
    });
    return false;
  }
}

/**
 * Get SMS failure rate for a business
 * @param {string} businessId - Business ID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format (defaults to today)
 * @returns {Promise<Object|null>} - Failure rate data or null if error
 */
export async function getSmsFailureRate(businessId, startDate, endDate = null) {
  try {
    // Default to today if no end date provided
    const queryEndDate = endDate || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('sms_failure_rates')
      .select('*')
      .eq('business_id', businessId)
      .gte('date', startDate)
      .lte('date', queryEndDate);

    if (error) {
      console.error('Error getting SMS failure rate:', error);
      Sentry.captureException(error, { 
        extra: { 
          context: 'getSmsFailureRate', 
          businessId, 
          startDate, 
          endDate: queryEndDate 
        } 
      });
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception in getSmsFailureRate:', error);
    Sentry.captureException(error, { 
      extra: { 
        context: 'getSmsFailureRate exception', 
        businessId, 
        startDate, 
        endDate 
      } 
    });
    return null;
  }
}

/**
 * Get OpenAI usage for a business
 * @param {string} businessId - Business ID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format (defaults to today)
 * @returns {Promise<Object|null>} - Usage data or null if error
 */
export async function getOpenAIUsage(businessId, startDate, endDate = null) {
  try {
    // Default to today if no end date provided
    const queryEndDate = endDate || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('openai_daily_usage')
      .select('*')
      .eq('business_id', businessId)
      .gte('date', startDate)
      .lte('date', queryEndDate);

    if (error) {
      console.error('Error getting OpenAI usage:', error);
      Sentry.captureException(error, { 
        extra: { 
          context: 'getOpenAIUsage', 
          businessId, 
          startDate, 
          endDate: queryEndDate 
        } 
      });
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception in getOpenAIUsage:', error);
    Sentry.captureException(error, { 
      extra: { 
        context: 'getOpenAIUsage exception', 
        businessId, 
        startDate, 
        endDate 
      } 
    });
    return null;
  }
}

/**
 * Get daily stats for a business
 * @param {string} businessId - Business ID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format (defaults to today)
 * @returns {Promise<Object|null>} - Stats data or null if error
 */
export async function getDailyStats(businessId, startDate, endDate = null) {
  try {
    // Default to today if no end date provided
    const queryEndDate = endDate || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('business_id', businessId)
      .gte('date', startDate)
      .lte('date', queryEndDate)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error getting daily stats:', error);
      Sentry.captureException(error, { 
        extra: { 
          context: 'getDailyStats', 
          businessId, 
          startDate, 
          endDate: queryEndDate 
        } 
      });
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception in getDailyStats:', error);
    Sentry.captureException(error, { 
      extra: { 
        context: 'getDailyStats exception', 
        businessId, 
        startDate, 
        endDate 
      } 
    });
    return null;
  }
}
