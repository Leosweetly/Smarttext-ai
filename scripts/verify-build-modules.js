#!/usr/bin/env node

/**
 * This script verifies that the required modules are properly included in the build.
 * It checks for the existence of critical files and their content.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying build modules...');

// Check for lib/supabase.js
const supabasePath = path.join(process.cwd(), 'lib/supabase.js');
if (fs.existsSync(supabasePath)) {
  console.log('✅ lib/supabase.js exists');
  
  // Verify content
  const supabaseContent = fs.readFileSync(supabasePath, 'utf8');
  if (supabaseContent.includes('getBusinessByPhoneNumberSupabase') && 
      supabaseContent.includes('logCallEventSupabase')) {
    console.log('✅ lib/supabase.js contains required functions');
  } else {
    console.error('❌ lib/supabase.js is missing required functions');
  }
} else {
  console.error('❌ lib/supabase.js does not exist');
}

// Check for lib/monitoring.js
const monitoringPath = path.join(process.cwd(), 'lib/monitoring.js');
if (fs.existsSync(monitoringPath)) {
  console.log('✅ lib/monitoring.js exists');
  
  // Verify content
  const monitoringContent = fs.readFileSync(monitoringPath, 'utf8');
  if (monitoringContent.includes('trackSmsEvent') && 
      monitoringContent.includes('trackOwnerAlert')) {
    console.log('✅ lib/monitoring.js contains required functions');
  } else {
    console.error('❌ lib/monitoring.js is missing required functions');
  }
} else {
  console.error('❌ lib/monitoring.js does not exist');
}

// Check for pages/api/missed-call.ts
const missedCallPath = path.join(process.cwd(), 'pages/api/missed-call.ts');
if (fs.existsSync(missedCallPath)) {
  console.log('✅ pages/api/missed-call.ts exists');
  
  // Verify imports
  const missedCallContent = fs.readFileSync(missedCallPath, 'utf8');
  if (missedCallContent.includes("import {") && 
      missedCallContent.includes("getBusinessByPhoneNumberSupabase") && 
      missedCallContent.includes("logCallEventSupabase") && 
      missedCallContent.includes("trackSmsEvent") && 
      missedCallContent.includes("trackOwnerAlert") && 
      missedCallContent.includes("} from '../../lib/api-compat.js'")) {
    console.log('✅ pages/api/missed-call.ts contains required imports');
  } else {
    console.error('❌ pages/api/missed-call.ts is missing required imports');
  }
} else {
  console.error('❌ pages/api/missed-call.ts does not exist');
}

// Check for pages/api/twilio/voice.ts
const voicePath = path.join(process.cwd(), 'pages/api/twilio/voice.ts');
if (fs.existsSync(voicePath)) {
  console.log('✅ pages/api/twilio/voice.ts exists');
  
  // Verify imports
  const voiceContent = fs.readFileSync(voicePath, 'utf8');
  if (voiceContent.includes("import {") && 
      voiceContent.includes("getBusinessByPhoneNumberSupabase") && 
      voiceContent.includes("trackSmsEvent") && 
      voiceContent.includes("} from '../../../lib/api-compat.js'")) {
    console.log('✅ pages/api/twilio/voice.ts contains required imports');
  } else {
    console.error('❌ pages/api/twilio/voice.ts is missing required imports');
  }
} else {
  console.error('❌ pages/api/twilio/voice.ts does not exist');
}

console.log('✅ Verification complete');
