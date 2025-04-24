# Migrating from Airtable to Supabase

This document outlines the process of migrating data and functionality from Airtable to Supabase for the SmartText application.

## Overview

The migration follows a phased approach to minimize disruption:

1. **Phase 0: Setup** - Create Supabase project and schema
2. **Phase 1: Shadow-write** - Write to both Airtable and Supabase
3. **Phase 2: Dual-read** - Read from Supabase first, fall back to Airtable
4. **Phase 3: Cut over reads** - Use Supabase as primary data source
4. **Phase 4: Retire Airtable** - Remove Airtable dependencies
5. **Phase 5 (Optional)**: Build admin UI for non-technical users

## Migration Status

- [x] Phase 0: Supabase project created and schema defined
- [x] Phase 1: Shadow-write implemented for call events
- [x] Phase 2: Dual-read capability implemented for business lookups
- [x] Phase 3: Cut over reads in production
- [ ] Phase 4: Retire Airtable
- [ ] Phase 5: Build admin UI (optional)

## Schema

The following tables have been created in Supabase:

### businesses

Stores business information, replacing the BUSINESSES table in Airtable.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Business name |
| business_type | text | Type of business |
| public_phone | text | Customer-facing phone number |
| twilio_phone | text | Twilio phone number |
| forwarding_number | text | Number to forward calls to |
| address | text | Business address |
| subscription_tier | text | Subscription tier (basic, pro, enterprise) |
| trial_ends_at | timestamptz | Trial end date |
| created_at | timestamptz | Record creation timestamp |
| updated_at | timestamptz | Record update timestamp |
| custom_settings | jsonb | Custom settings as JSON |
| hours_json | jsonb | Business hours as JSON |
| faqs_json | jsonb | FAQs as JSON |

### call_events

Stores call event logs, replacing the MISSED_CALLS table in Airtable.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| call_sid | text | Twilio Call SID |
| from_number | text | Caller's phone number |
| to_number | text | Recipient's phone number |
| business_id | uuid | Reference to businesses table |
| event_type | text | Type of event (voice.missed, voice.completed, etc.) |
| call_status | text | Call status (no-answer, completed, etc.) |
| owner_notified | boolean | Whether the owner was notified |
| ts | timestamptz | Event timestamp |
| payload | jsonb | Full webhook payload as JSON |

### rate_limits

Stores rate limiting information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| phone | text | Phone number |
| key | text | Rate limit key |
| expires_at | timestamptz | Expiration timestamp |

## Implementation Details

### Supabase Client

The Supabase client is initialized in `lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

### Business Lookup

The business lookup is now implemented using Supabase exclusively:

```javascript
// Look up the business by phone number from Supabase
const business = await getBusinessByPhoneNumberSupabase(To);
```

This has been implemented in both the missed call handler (`pages/api/missed-call.ts`) and the voice webhook handler (`pages/api/twilio/voice.ts`).

### Call Event Logging

Call events are now logged to Supabase:

```javascript
// Log the call event to Supabase
try {
  await logCallEventSupabase({
    callSid: CallSid,
    from: From,
    to: To,
    businessId: business.id,
    eventType: 'voice.missed',
    callStatus: CallStatus,
    ownerNotified: notificationSent,
    payload: req.body
  });
  console.log(`✅ Successfully logged call event to Supabase`);
} catch (supabaseError) {
  // Just log the error but don't interrupt the flow
  console.error(`❌ Failed to log call event to Supabase:`, supabaseError);
}
```

We still log to the Airtable Calls table for backward compatibility, but this will be removed in Phase 4.

## Environment Variables

The following environment variables are used for the Supabase integration:

```
# Supabase integration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
USE_SUPABASE_BUSINESS_LOOKUP=true
```

## Testing

Several test scripts have been created to verify the Supabase integration:

- `scripts/create-supabase-schema.sql` - SQL script to create the Supabase schema
- `scripts/test-supabase-integration.js` - Tests CRUD operations on Supabase
- `scripts/test-supabase-lookup.js` - Tests business lookup by phone number
- `scripts/add-test-business-to-supabase.js` - Adds a test business to Supabase
- `scripts/test-missed-call-supabase.js` - Tests the missed call flow with Supabase

## Next Steps

1. **Phase 4: Retire Airtable**
   - Remove remaining Airtable write operations
   - Remove Airtable imports and dependencies
   - Update environment variables
   - Remove Airtable-specific code

2. **Phase 5: Admin UI (Optional)**
   - Build a simple admin UI for non-technical users
   - Consider using Supabase Auth for authentication
   - Use Supabase's Row Level Security for fine-grained access control

## Benefits of Supabase

- **Performance**: Sub-20ms query times vs 200-500ms for Airtable
- **Cost**: Cheaper row inserts, no per-call billing
- **Data Model**: Full SQL, constraints, triggers, Row Level Security
- **Realtime**: Built-in WebSocket changefeeds
- **Auth**: JWT-based auth with Row Level Security

## Conclusion

The migration to Supabase offers significant performance and cost benefits for high-volume operations like call logging and business lookups. The phased approach minimizes risk and allows for easy rollback if issues arise.
