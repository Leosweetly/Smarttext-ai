import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client lazily to handle missing environment variables
let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  
  try {
    if (!process.env.SUPABASE_URL) {
      console.warn('SUPABASE_URL environment variable is not set');
      return null;
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
      return null;
    }
    
    supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    return supabaseClient;
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    return null;
  }
}

// Export for compatibility with existing code
export const supabase = {
  from: (table) => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized. Check environment variables.');
    }
    return client.from(table);
  }
};

/**
 * Get a business by phone number from Supabase
 * @param {string} phoneNumber - The phone number to search for
 * @returns {Promise<Object|null>} The business object or null if not found
 */
export async function getBusinessByPhoneNumberSupabase(phoneNumber) {
  try {
    console.log(`🔍 Looking up business in Supabase by phone number: ${phoneNumber}`);
    
    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase client not initialized. Returning mock data.');
      return {
        id: 'mock-business-id',
        name: 'Mock Business',
        business_type: 'other',
        subscription_tier: 'basic',
        customSettings: {
          autoReplyEnabled: true,
          autoReplyMessage: "Thanks for calling! We'll get back to you as soon as possible."
        }
      };
    }
    
    const { data, error } = await client
      .from('businesses')
      .select('*')
      .or(`public_phone.eq.${phoneNumber},twilio_phone.eq.${phoneNumber}`);
      
    if (error) {
      console.error('Error fetching business from Supabase:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      // If multiple businesses are found, return the most recently created one
      let business;
      if (data.length > 1) {
        // Sort by created_at in descending order (newest first)
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        business = data[0];
        console.log(`ℹ️ Note: Found ${data.length} businesses with this phone number, using the most recent one`);
      } else {
        business = data[0];
      }
      
      console.log(`✅ Found business in Supabase: ${business.name} (${business.id})`);
      return business;
    } else {
      console.log(`ℹ️ No business found in Supabase with phone number ${phoneNumber}`);
      return null;
    }
  } catch (error) {
    console.error('Error in getBusinessByPhoneNumberSupabase:', error);
    return null;
  }
}

/**
 * Get a business by ID from Supabase
 * @param {string} id - The business ID
 * @returns {Promise<Object|null>} The business object or null if not found
 */
export async function getBusinessByIdSupabase(id) {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase client not initialized. Returning null.');
      return null;
    }
    
    const { data, error } = await client
      .from('businesses')
      .select('*')
      .eq('id', id)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching business by ID from Supabase:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getBusinessByIdSupabase:', error);
    return null;
  }
}

/**
 * Get all businesses from Supabase
 * @returns {Promise<Array>} Array of business objects
 */
export async function getBusinessesSupabase() {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase client not initialized. Returning empty array.');
      return [];
    }
    
    const { data, error } = await client
      .from('businesses')
      .select('*');
      
    if (error) {
      console.error('Error fetching businesses from Supabase:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getBusinessesSupabase:', error);
    return [];
  }
}

/**
 * Get businesses filtered by type from Supabase
 * @param {string} businessType - The business type to filter by
 * @returns {Promise<Array>} Array of business objects
 */
export async function getBusinessesByTypeSupabase(businessType) {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase client not initialized. Returning empty array.');
      return [];
    }
    
    const { data, error } = await client
      .from('businesses')
      .select('*')
      .eq('business_type', businessType);
      
    if (error) {
      console.error(`Error fetching businesses by type ${businessType} from Supabase:`, error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getBusinessesByTypeSupabase:', error);
    return [];
  }
}

/**
 * Create a business in Supabase
 * @param {Object} businessData - The business data
 * @returns {Promise<Object|null>} The created business object or null if error
 */
export async function createBusinessSupabase(businessData) {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase client not initialized. Returning null.');
      return null;
    }
    
    const { data, error } = await client
      .from('businesses')
      .insert({
        name: businessData.name,
        business_type: businessData.businessType || 'other',
        public_phone: businessData.publicPhone || businessData.phoneNumber,
        twilio_phone: businessData.twilioPhone,
        forwarding_number: businessData.forwardingNumber,
        address: businessData.address,
        subscription_tier: businessData.subscriptionTier || 'basic',
        trial_ends_at: businessData.trialEndsAt,
        custom_settings: businessData.customSettings || {},
        hours_json: businessData.hours || {},
        faqs_json: businessData.faqs || []
      })
      .select();
      
    if (error) {
      console.error('Error creating business in Supabase:', error);
      return null;
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Error in createBusinessSupabase:', error);
    return null;
  }
}

/**
 * Update a business in Supabase
 * @param {string} id - The business ID
 * @param {Object} businessData - The data to update
 * @returns {Promise<Object|null>} The updated business object or null if error
 */
export async function updateBusinessSupabase(id, businessData) {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase client not initialized. Returning null.');
      return null;
    }
    
    // Prepare the data for Supabase
    const updateData = {};
    
    if (businessData.name) updateData.name = businessData.name;
    if (businessData.businessType) updateData.business_type = businessData.businessType;
    if (businessData.publicPhone || businessData.phoneNumber) updateData.public_phone = businessData.publicPhone || businessData.phoneNumber;
    if (businessData.twilioPhone) updateData.twilio_phone = businessData.twilioPhone;
    if (businessData.forwardingNumber) updateData.forwarding_number = businessData.forwardingNumber;
    if (businessData.address) updateData.address = businessData.address;
    if (businessData.subscriptionTier) updateData.subscription_tier = businessData.subscriptionTier;
    if (businessData.trialEndsAt) updateData.trial_ends_at = businessData.trialEndsAt;
    if (businessData.hours) updateData.hours_json = businessData.hours;
    if (businessData.faqs) updateData.faqs_json = businessData.faqs;
    if (businessData.customSettings) updateData.custom_settings = businessData.customSettings;
    
    // Update the record
    const { data, error } = await client
      .from('businesses')
      .update(updateData)
      .eq('id', id)
      .select();
      
    if (error) {
      console.error('Error updating business in Supabase:', error);
      return null;
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Error in updateBusinessSupabase:', error);
    return null;
  }
}

/**
 * Log a call event to Supabase
 * @param {Object} eventData - The call event data
 * @returns {Promise<Object|null>} The created event object or null if error
 */
export async function logCallEventSupabase(eventData) {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase client not initialized. Returning null.');
      return null;
    }
    
    const { data, error } = await client
      .from('call_events')
      .insert({
        call_sid: eventData.callSid,
        from_number: eventData.from,
        to_number: eventData.to,
        business_id: eventData.businessId,
        event_type: eventData.eventType,
        call_status: eventData.callStatus,
        owner_notified: eventData.ownerNotified,
        payload: eventData.payload || {}
      })
      .select();
      
    if (error) {
      console.error('Error logging call event to Supabase:', error);
      return null;
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Error in logCallEventSupabase:', error);
    return null;
  }
}

/**
 * Check if a rate limit exists in Supabase
 * @param {string} phone - The phone number
 * @param {string} key - The rate limit key
 * @returns {Promise<boolean>} True if rate limited, false otherwise
 */
export async function checkRateLimitSupabase(phone, key) {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase client not initialized. Returning false.');
      return false;
    }
    
    const { data, error } = await client
      .from('rate_limits')
      .select('*')
      .eq('phone', phone)
      .eq('key', key)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
      
    if (error) {
      console.error('Error checking rate limit in Supabase:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error in checkRateLimitSupabase:', error);
    return false;
  }
}

/**
 * Set a rate limit in Supabase
 * @param {string} phone - The phone number
 * @param {string} key - The rate limit key
 * @param {number} expiresInSeconds - Seconds until expiration
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function setRateLimitSupabase(phone, key, expiresInSeconds = 3600) {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase client not initialized. Returning false.');
      return false;
    }
    
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);
    
    const { error } = await client
      .from('rate_limits')
      .upsert({
        phone,
        key,
        expires_at: expiresAt.toISOString()
      });
      
    if (error) {
      console.error('Error setting rate limit in Supabase:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in setRateLimitSupabase:', error);
    return false;
  }
}
