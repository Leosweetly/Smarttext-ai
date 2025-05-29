# Settings Fallback Implementation

This document describes the implementation of code-level defaults and dynamic rendering for business settings in the SmartText AI system.

## Overview

The implementation adds fallback mechanisms for three key settings:
- `twilioNumber` (falls back to `business.twilio_phone`)
- `ownerPhone` (falls back to `business.owner_phone`)
- `autoReplyOptions` (falls back to a default list based on `business.business_type`)

## Implementation Details

### 1. Normalized Settings Interface

A TypeScript interface was added to define the structure of normalized settings:

```typescript
interface NormalizedSettings {
  twilioNumber: string;
  ownerPhone: string | undefined;
  autoReplyOptions: string[];
}
```

### 2. Utility Functions

Three utility functions were implemented:

#### normalizeBusinessSettings

This function handles the normalization of business settings with appropriate fallbacks:

```typescript
function normalizeBusinessSettings(
  business: Business, 
  debug: boolean = false
): NormalizedSettings {
  // Implementation details...
}
```

The function:
- Extracts settings from `business.custom_settings` or defaults to an empty object
- Provides fallbacks for each setting:
  - `twilioNumber` falls back to `business.twilio_phone`
  - `ownerPhone` falls back to `business.owner_phone`
  - `autoReplyOptions` falls back to type-specific defaults or a generic default

#### makeFriendlyList

This function formats an array of strings into a human-readable list:

```typescript
function makeFriendlyList(items: string[]): string {
  // Implementation details...
}
```

Examples:
- `[]` → `""`
- `["hours & address"]` → `"hours & address"`
- `["hours & address", "menu details"]` → `"hours & address or menu details"`
- `["hours & address", "menu details", "online ordering link"]` → `"hours & address, menu details, or online ordering link"`

#### formatSettingsForLog

This function formats normalized settings for structured logging:

```typescript
function formatSettingsForLog(settings: NormalizedSettings): Record<string, any> {
  // Implementation details...
}
```

### 3. Debug Mode

A debug flag was added to enable detailed logging of fallback behavior:

```typescript
const enableDebug = 
  process.env.DEBUG_SETTINGS === 'true' || 
  req.query.debugSettings === 'true' ||
  isTestMode(req, {});
```

When debug mode is enabled, the system logs:
- Which fallback path was taken for each setting
- The source of autoReplyOptions (custom, type-specific, or generic)

### 4. Settings Normalization Step

A new step (3.5) was added to the handler function to normalize settings right after fetching the business record:

```typescript
// ----------------------------------
// 3.5. Normalize business settings
// ----------------------------------
console.time('[step 3.5] normalizeSettings');

// Use our extracted function with debug flag
const normalizedSettings = normalizeBusinessSettings(business, enableDebug);
const { twilioNumber, ownerPhone, autoReplyOptions } = normalizedSettings;

console.log('[step 3.5] Normalized settings:', formatSettingsForLog(normalizedSettings));
console.timeEnd('[step 3.5] normalizeSettings');
```

### 5. Updated Code Sections

The following sections were updated to use the normalized settings:

- Owner alert sending in step 8 (uses `ownerPhone` and `twilioNumber`)
- OpenAI prompt construction in step 9 (uses `autoReplyOptions`)
- SMS sending in step 10 (uses `twilioNumber`)
- The `sendOwnerAlert` helper function (uses both `ownerPhone` and `twilioNumber`)

### 6. Testing

Two test scripts were created to verify the implementation:

- `scripts/test-settings-fallback.js`: Tests the fallback behavior for different business configurations
- `scripts/test-friendly-list.js`: Tests the `makeFriendlyList` function with various input arrays

## Business Type Defaults

Default auto-reply options were implemented for the following business types:

- **restaurant**: `["hours & address", "menu details", "online ordering link"]`
- **autoshop**: `["hours & address", "service quotes", "schedule an appointment"]`
- **retail**: `["hours & address", "product availability", "current promotions"]`
- **salon**: `["hours & address", "service list", "schedule an appointment"]`
- **medical**: `["hours & address", "appointment scheduling", "insurance questions"]`

For unknown business types, a generic default is used: `["hours & address", "online ordering link"]`

## Benefits

This implementation provides several benefits:

1. **Reduced manual configuration**: Businesses no longer need to manually configure these settings in Supabase
2. **Consistent defaults**: Type-specific defaults ensure appropriate options for each business type
3. **Improved code organization**: Utility functions make the code more maintainable
4. **Better debugging**: Debug mode helps troubleshoot issues with settings
5. **Enhanced user experience**: The friendly list formatting makes auto-reply options more readable

## Future Enhancements

Potential future enhancements could include:

1. Moving the default options by business type to a configuration file or database table
2. Adding more business types with appropriate defaults
3. Implementing more sophisticated fallback logic based on business characteristics
4. Adding a UI for businesses to customize their auto-reply options
