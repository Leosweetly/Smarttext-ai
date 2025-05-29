# Online Ordering URL Feature

This document describes the implementation of the optional online ordering URL feature for businesses in SmartText AI.

## Overview

The online ordering URL feature allows businesses to include a link to their online ordering system in the auto-reply SMS sent when a customer's call is missed. This feature is optional - if a business has an `online_ordering_url` in Supabase, it will be included in the outgoing auto-reply. If they don't have an ordering link, nothing changes.

## Implementation Details

### 1. Database Schema Update

A new column `online_ordering_url` has been added to the `businesses` table in Supabase. This column stores the URL to the business's online ordering system.

The SQL script to add this column is located at `scripts/add-online-ordering-url.sql`:

```sql
-- Add online_ordering_url column to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS online_ordering_url TEXT;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_online_ordering_url ON businesses(online_ordering_url);

-- Comment on the column to document its purpose
COMMENT ON COLUMN businesses.online_ordering_url IS 'URL for online ordering system, displayed in missed call auto-replies';
```

### 2. Supabase Integration Update

The `getBusinessByPhoneNumberSupabase` function in `lib/supabase.js` has been updated to include the `online_ordering_url` field in the select statement:

```javascript
const { data, error } = await client
  .from('businesses')
  .select('*, custom_auto_reply, online_ordering_url')
  .or(`public_phone.eq.${phoneNumber},twilio_phone.eq.${phoneNumber}`);
```

### 3. Auto-Reply Message Update

The auto-reply message construction in `pages/api/missed-call.ts` has been updated to conditionally include the online ordering URL if it exists:

```javascript
// Add online ordering URL if available
if (business.online_ordering_url) {
  console.log(`[missed-call] Appending online ordering link for business ${business.name}`);
  body += `\n\nOrder online here: ${business.online_ordering_url}`;
}
```

This code is added after the message body is determined (whether custom, AI-generated, or default) but before the SMS is sent.

## Testing

A test script has been created to verify the online ordering URL functionality. The script is located at `scripts/test-online-ordering-url.js`.

The test script:
1. Creates a test business with an online ordering URL
2. Simulates a missed call
3. Verifies that the online ordering URL is included in the auto-reply message

To run the test:

```bash
node scripts/test-online-ordering-url.js
```

## Example

When a customer calls a business with an online ordering URL and the call is missed, they will receive an SMS like:

```
Hi! Thanks for calling Joe's Pizza. We missed you but will ring back ASAP.

Order online here: https://order.joespizza.com
```

## Deployment Steps

1. Run the SQL script to add the `online_ordering_url` column to the `businesses` table:
   ```bash
   psql -U your_user -d your_database -f scripts/add-online-ordering-url.sql
   ```
   
   Or execute the SQL commands directly in the Supabase SQL editor.

2. Deploy the updated code to production.

3. Test the feature by running the test script:
   ```bash
   node scripts/test-online-ordering-url.js
   ```

## Troubleshooting

If the online ordering URL is not appearing in the auto-reply message:

1. Check that the business has an `online_ordering_url` set in the database.
2. Look for the log message `[missed-call] Appending online ordering link for business ${business.name}` in the server logs.
3. Verify that the `getBusinessByPhoneNumberSupabase` function is correctly selecting the `online_ordering_url` field.
4. Run the test script to verify the functionality.
