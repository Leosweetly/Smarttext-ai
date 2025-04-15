#!/usr/bin/env node

/**
 * Custom build script for Vercel deployment
 * This script runs before the Next.js build to ensure that test files are not included
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check API directory contents before build
const apiDir = path.join(process.cwd(), 'pages/api');
console.log('🔍 Checking API directory contents before build:');
if (fs.existsSync(apiDir)) {
  const apiFiles = fs.readdirSync(apiDir);
  console.log('📁 API directory files:', apiFiles);
  
  // Specifically check for airtable-sync.ts
  const airtableSyncPath = path.join(apiDir, 'airtable-sync.ts');
  if (fs.existsSync(airtableSyncPath)) {
    console.log('✅ airtable-sync.ts exists before build');
    
    // Make a backup copy of the file to ensure it's not lost during the build process
    const backupPath = path.join(process.cwd(), 'airtable-sync.ts.backup');
    try {
      fs.copyFileSync(airtableSyncPath, backupPath);
      console.log('✅ Created backup of airtable-sync.ts');
    } catch (error) {
      console.error('❌ Error creating backup of airtable-sync.ts:', error.message);
    }
  } else {
    console.log('❌ airtable-sync.ts does not exist before build');
  }
} else {
  console.log('❌ API directory does not exist');
}

// Files to check and remove if they exist
const filesToRemove = [
  'api/test.js',
  'pages/api/test.ts',
  'pages/api/auth/[...auth0].ts'
];

// Directories to check and remove if they exist
const dirsToRemove = [
  'pages/api/auth'
];

console.log('🔍 Running custom Vercel build script...');

// Check and remove files
filesToRemove.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  Removing ${filePath}...`);
    try {
      fs.unlinkSync(fullPath);
      console.log(`✅ Successfully removed ${filePath}`);
    } catch (error) {
      console.error(`❌ Error removing ${filePath}:`, error.message);
    }
  } else {
    console.log(`✅ ${filePath} does not exist, skipping`);
  }
});

// Check and remove directories
dirsToRemove.forEach(dirPath => {
  const fullPath = path.join(process.cwd(), dirPath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  Removing directory ${dirPath}...`);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Successfully removed directory ${dirPath}`);
    } catch (error) {
      console.error(`❌ Error removing directory ${dirPath}:`, error.message);
    }
  } else {
    console.log(`✅ Directory ${dirPath} does not exist, skipping`);
  }
});

// We're using .vercelignore instead of .nowignore
console.log('✅ Using .vercelignore file instead of .nowignore');

// Check lib directory exists before build
const libDir = path.join(process.cwd(), 'lib');
console.log('🔍 Checking lib directory contents before build:');
if (fs.existsSync(libDir)) {
  const libFiles = fs.readdirSync(libDir);
  console.log('📁 lib directory files:', libFiles);
  
  // Specifically check for supabase.js and monitoring.js
  const supabasePath = path.join(libDir, 'supabase.js');
  const monitoringPath = path.join(libDir, 'monitoring.js');
  
  if (fs.existsSync(supabasePath)) {
    console.log('✅ supabase.js exists before build');
  } else {
    console.log('❌ supabase.js does not exist before build');
    
    // Create a minimal implementation of supabase.js
    console.log('🔧 Creating minimal supabase.js implementation...');
    const supabaseContent = `import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get a business by phone number from Supabase
 * @param {string} phoneNumber - The phone number to search for
 * @returns {Promise<Object|null>} The business object or null if not found
 */
export async function getBusinessByPhoneNumberSupabase(phoneNumber) {
  try {
    console.log(\`🔍 Looking up business in Supabase by phone number: \${phoneNumber}\`);
    
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .or(\`public_phone.eq.\${phoneNumber},twilio_phone.eq.\${phoneNumber}\`);
      
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
        console.log(\`ℹ️ Note: Found \${data.length} businesses with this phone number, using the most recent one\`);
      } else {
        business = data[0];
      }
      
      console.log(\`✅ Found business in Supabase: \${business.name} (\${business.id})\`);
      return business;
    } else {
      console.log(\`ℹ️ No business found in Supabase with phone number \${phoneNumber}\`);
      return null;
    }
  } catch (error) {
    console.error('Error in getBusinessByPhoneNumberSupabase:', error);
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
    const { data, error } = await supabase
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
}`;
    
    try {
      fs.writeFileSync(supabasePath, supabaseContent);
      console.log('✅ Created minimal supabase.js implementation');
    } catch (error) {
      console.error('❌ Error creating supabase.js:', error.message);
    }
  }
  
  if (fs.existsSync(monitoringPath)) {
    console.log('✅ monitoring.js exists before build');
  } else {
    console.log('❌ monitoring.js does not exist before build');
    
    // Create a minimal implementation of monitoring.js
    console.log('🔧 Creating minimal monitoring.js implementation...');
    const monitoringContent = `/**
 * Monitoring Module - Minimal Implementation
 * 
 * This module provides functions for monitoring and tracking various events
 * in the SmartText application, including SMS events and owner alerts.
 */

import { supabase } from './supabase';

/**
 * Track an SMS event
 * @param {Object} eventData - SMS event data
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
    console.log('📊 Tracking SMS event:', { messageSid, from, to, businessId, status });
    
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
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Exception in trackSmsEvent:', error);
    return null;
  }
}

/**
 * Track an owner alert
 * @param {Object} alertData - Alert data
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
    console.log('📊 Tracking owner alert:', { businessId, ownerPhone, customerPhone, alertType });
    
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
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Exception in trackOwnerAlert:', error);
    return null;
  }
}`;
    
    try {
      fs.writeFileSync(monitoringPath, monitoringContent);
      console.log('✅ Created minimal monitoring.js implementation');
    } catch (error) {
      console.error('❌ Error creating monitoring.js:', error.message);
    }
  }
} else {
  console.log('❌ lib directory does not exist');
  
  // Create lib directory and minimal implementations
  console.log('🔧 Creating lib directory and minimal implementations...');
  try {
    fs.mkdirSync(libDir, { recursive: true });
    console.log('✅ Created lib directory');
    
    // Create minimal supabase.js
    const supabasePath = path.join(libDir, 'supabase.js');
    const supabaseContent = `import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get a business by phone number from Supabase
 * @param {string} phoneNumber - The phone number to search for
 * @returns {Promise<Object|null>} The business object or null if not found
 */
export async function getBusinessByPhoneNumberSupabase(phoneNumber) {
  try {
    console.log(\`🔍 Looking up business in Supabase by phone number: \${phoneNumber}\`);
    
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .or(\`public_phone.eq.\${phoneNumber},twilio_phone.eq.\${phoneNumber}\`);
      
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
        console.log(\`ℹ️ Note: Found \${data.length} businesses with this phone number, using the most recent one\`);
      } else {
        business = data[0];
      }
      
      console.log(\`✅ Found business in Supabase: \${business.name} (\${business.id})\`);
      return business;
    } else {
      console.log(\`ℹ️ No business found in Supabase with phone number \${phoneNumber}\`);
      return null;
    }
  } catch (error) {
    console.error('Error in getBusinessByPhoneNumberSupabase:', error);
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
    const { data, error } = await supabase
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
}`;
    
    fs.writeFileSync(supabasePath, supabaseContent);
    console.log('✅ Created minimal supabase.js implementation');
    
    // Create minimal monitoring.js
    const monitoringPath = path.join(libDir, 'monitoring.js');
    const monitoringContent = `/**
 * Monitoring Module - Minimal Implementation
 * 
 * This module provides functions for monitoring and tracking various events
 * in the SmartText application, including SMS events and owner alerts.
 */

import { supabase } from './supabase';

/**
 * Track an SMS event
 * @param {Object} eventData - SMS event data
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
    console.log('📊 Tracking SMS event:', { messageSid, from, to, businessId, status });
    
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
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Exception in trackSmsEvent:', error);
    return null;
  }
}

/**
 * Track an owner alert
 * @param {Object} alertData - Alert data
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
    console.log('📊 Tracking owner alert:', { businessId, ownerPhone, customerPhone, alertType });
    
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
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Exception in trackOwnerAlert:', error);
    return null;
  }
}`;
    
    fs.writeFileSync(monitoringPath, monitoringContent);
    console.log('✅ Created minimal monitoring.js implementation');
  } catch (error) {
    console.error('❌ Error creating lib directory and files:', error.message);
  }
}

console.log('✅ Custom build script completed');

// Check API directory contents after build
console.log('🔍 Checking API directory contents after build:');
if (fs.existsSync(apiDir)) {
  const apiFiles = fs.readdirSync(apiDir);
  console.log('📁 API directory files after build:', apiFiles);
  
  // Specifically check for airtable-sync.ts
  const airtableSyncPath = path.join(apiDir, 'airtable-sync.ts');
  const backupPath = path.join(process.cwd(), 'airtable-sync.ts.backup');
  
  if (fs.existsSync(airtableSyncPath)) {
    console.log('✅ airtable-sync.ts exists after build');
  } else {
    console.log('❌ airtable-sync.ts does not exist after build');
    
    // If the file doesn't exist but we have a backup, restore it
    if (fs.existsSync(backupPath)) {
      try {
        // Ensure the api directory exists
        if (!fs.existsSync(apiDir)) {
          fs.mkdirSync(apiDir, { recursive: true });
        }
        
        // Restore the file from backup
        fs.copyFileSync(backupPath, airtableSyncPath);
        console.log('✅ Restored airtable-sync.ts from backup');
      } catch (error) {
        console.error('❌ Error restoring airtable-sync.ts from backup:', error.message);
      }
    }
  }
  
  // Clean up the backup file
  if (fs.existsSync(backupPath)) {
    try {
      fs.unlinkSync(backupPath);
      console.log('✅ Removed backup file');
    } catch (error) {
      console.error('❌ Error removing backup file:', error.message);
    }
  }
} else {
  console.log('❌ API directory does not exist after build');
  
  // If the API directory doesn't exist, create it and restore the file from backup if available
  const backupPath = path.join(process.cwd(), 'airtable-sync.ts.backup');
  if (fs.existsSync(backupPath)) {
    try {
      // Create the API directory
      fs.mkdirSync(apiDir, { recursive: true });
      console.log('✅ Created API directory');
      
      // Restore the file from backup
      const airtableSyncPath = path.join(apiDir, 'airtable-sync.ts');
      fs.copyFileSync(backupPath, airtableSyncPath);
      console.log('✅ Restored airtable-sync.ts from backup');
      
      // Clean up the backup file
      fs.unlinkSync(backupPath);
      console.log('✅ Removed backup file');
    } catch (error) {
      console.error('❌ Error restoring API directory and files:', error.message);
    }
  }
}

// Check lib directory after build
console.log('🔍 Checking lib directory contents after build:');
if (fs.existsSync(libDir)) {
  const libFiles = fs.readdirSync(libDir);
  console.log('📁 lib directory files after build:', libFiles);
  
  // Specifically check for supabase.js and monitoring.js
  const supabasePath = path.join(libDir, 'supabase.js');
  const monitoringPath = path.join(libDir, 'monitoring.js');
  
  if (fs.existsSync(supabasePath)) {
    console.log('✅ supabase.js exists after build');
  } else {
    console.log('❌ supabase.js does not exist after build');
    
    // Create a minimal implementation of supabase.js
    console.log('🔧 Creating minimal supabase.js implementation after build...');
    const supabaseContent = `import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get a business by phone number from Supabase
 * @param {string} phoneNumber - The phone number to search for
 * @returns {Promise<Object|null>} The business object or null if not found
 */
export async function getBusinessByPhoneNumberSupabase(phoneNumber) {
  try {
    console.log(\`🔍 Looking up business in Supabase by phone number: \${phoneNumber}\`);
    
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .or(\`public_phone.eq.\${phoneNumber},twilio_phone.eq.\${phoneNumber}\`);
      
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
        console.log(\`ℹ️ Note: Found \${data.length} businesses with this phone number, using the most recent one\`);
      } else {
        business = data[0];
      }
      
      console.log(\`✅ Found business in Supabase: \${business.name} (\${business.id})\`);
      return business;
    } else {
      console.log(\`ℹ️ No business found in Supabase with phone number \${phoneNumber}\`);
      return null;
    }
  } catch (error) {
    console.error('Error in getBusinessByPhoneNumberSupabase:', error);
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
    const { data, error } = await supabase
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
}`;
    
    try {
      fs.writeFileSync(supabasePath, supabaseContent);
      console.log('✅ Created minimal supabase.js implementation after build');
    } catch (error) {
      console.error('❌ Error creating supabase.js after build:', error.message);
    }
  }
  
  if (fs.existsSync(monitoringPath)) {
    console.log('✅ monitoring.js exists after build');
  } else {
    console.log('❌ monitoring.js does not exist after build');
    
    // Create a minimal implementation of monitoring.js
    console.log('🔧 Creating minimal monitoring.js implementation after build...');
    const monitoringContent = `/**
 * Monitoring Module - Minimal Implementation
 * 
 * This module provides functions for monitoring and tracking various events
 * in the SmartText application, including SMS events and owner alerts.
 */

import { supabase } from './supabase';

/**
 * Track an SMS event
 * @param {Object} eventData - SMS event data
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
    console.log('📊 Tracking SMS event:', { messageSid, from, to, businessId, status });
    
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
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Exception in trackSmsEvent:', error);
    return null;
  }
}

/**
 * Track an owner alert
 * @param {Object} alertData - Alert data
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
    console.log('📊 Tracking owner alert:', { businessId, ownerPhone, customerPhone, alertType });
    
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
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Exception in trackOwnerAlert:', error);
    return null;
  }
}`;
    
    try {
      fs.writeFileSync(monitoringPath, monitoringContent);
      console.log('✅ Created minimal monitoring.js implementation after build');
    } catch (error) {
      console.error('❌ Error creating monitoring.js after build:', error.message);
    }
  }
} else {
  console.log('❌ lib directory does not exist after build');
  
  // Create lib directory and minimal implementations
  console.log('🔧 Creating lib directory and minimal implementations after build...');
  try {
    fs.mkdirSync(libDir, { recursive: true });
    console.log('✅ Created lib directory after build');
    
    // Create minimal supabase.js
    const supabasePath = path.join(libDir, 'supabase.js');
    const supabaseContent = `import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get a business by phone number from Supabase
 * @param {string} phoneNumber - The phone number to search for
 * @returns {Promise<Object|null>} The business object or null if not found
 */
export async function getBusinessByPhoneNumberSupabase(phoneNumber) {
  try {
    console.log(\`🔍 Looking up business in Supabase by phone number: \${phoneNumber}\`);
    
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .or(\`public_phone.eq.\${phoneNumber},twilio_phone.eq.\${phoneNumber}\`);
      
    if (error) {
      console.error('Error fetching business from Supabase:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      // If multiple businesses are found, return the most recently created one
      let business;
      if (data.length > 1) {
        // Sort by created_at in
