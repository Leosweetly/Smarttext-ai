# Trial Activation Implementation

This document outlines the implementation of the trial business activation system and fixes for the checkout session endpoint.

## 🎯 Issues Addressed

### 1. Missing Trial Activation Endpoint ✅ FIXED
**Problem**: No dedicated endpoint for trial business creation with proper user authentication and trial-specific logic.

**Solution**: Created `app/api/create-business-trial/route.ts` with:
- ✅ Supabase Auth integration (user_id extraction from JWT)
- ✅ Trial-specific field mapping (trial_ends_at, subscription_tier, trial_plan)
- ✅ Comprehensive validation and error handling
- ✅ Detailed logging for debugging
- ✅ Security headers and input sanitization

### 2. Checkout Session Endpoint Verification ✅ VERIFIED
**Problem**: Potential 404 or JSON parsing errors from `/api/create-checkout-session`

**Solution**: Verified existing implementation is robust:
- ✅ Proper NextResponse.json() usage
- ✅ Comprehensive error handling
- ✅ Method validation (GET returns 405)
- ✅ Input validation and sanitization

## 📁 Files Created/Modified

### New Files
1. **`app/api/create-business-trial/route.ts`** - Main trial activation endpoint
2. **`scripts/update-supabase-schema-for-trials.sql`** - Database schema updates
3. **`scripts/test-trial-activation.js`** - Comprehensive test suite for trial endpoint
4. **`scripts/test-checkout-session.js`** - Test suite for checkout session endpoint
5. **`TRIAL_ACTIVATION_IMPLEMENTATION.md`** - This documentation

### Schema Updates Required
The following SQL script needs to be run on your Supabase database:

```sql
-- Add missing fields to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS online_ordering_link TEXT,
ADD COLUMN IF NOT EXISTS reservation_link TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses(email);
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_tier ON businesses(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_businesses_trial_ends_at ON businesses(trial_ends_at);

-- Update RLS policies to allow users to access their own businesses
CREATE POLICY "Users can view their own businesses" 
ON businesses FOR SELECT 
USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own businesses" 
ON businesses FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own businesses" 
ON businesses FOR UPDATE 
USING (auth.uid() = user_id OR auth.role() = 'service_role');
```

## 🔧 API Endpoints

### Trial Business Creation
**Endpoint**: `POST /api/create-business-trial`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <supabase-jwt-token> (optional)
```

**Request Body**:
```json
{
  "name": "Business Name",
  "phoneNumber": "+1-555-123-4567",
  "twilioNumber": "+1-555-987-6543",
  "industry": "restaurant",
  "trialPlan": "pro",
  "email": "contact@business.com",
  "website": "https://business.com",
  "address": "123 Main St, City, State 12345",
  "teamSize": 5,
  "hoursJson": {
    "monday": { "open": "09:00", "close": "17:00" },
    "tuesday": { "open": "09:00", "close": "17:00" }
  },
  "onlineOrderingLink": "https://order.business.com",
  "reservationLink": "https://reserve.business.com",
  "faqs": [
    { "question": "What are your hours?", "answer": "9am-5pm Mon-Fri" }
  ],
  "customAutoTextMessage": "Thanks for contacting us!"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "businessId": "uuid-here",
  "message": "Trial business created successfully",
  "data": {
    "id": "uuid-here",
    "name": "Business Name",
    "phoneNumber": "+15551234567",
    "twilioNumber": "+15559876543",
    "businessType": "restaurant",
    "subscriptionTier": "trial",
    "trialEndsAt": "2025-06-12T14:30:00.000Z",
    "createdAt": "2025-05-29T14:30:00.000Z"
  }
}
```

**Error Responses**:
- `400` - Missing required fields or validation errors
- `403` - Database permission errors
- `409` - Duplicate business
- `500` - Server/database errors

### Required Fields
- `name` - Business name
- `phoneNumber` - Business phone number
- `industry` - Business type/industry

### Optional Fields
- `twilioNumber` - Assigned Twilio phone number
- `email` - Business email
- `website` - Business website URL
- `address` - Business address
- `teamSize` - Number of team members
- `trialPlan` - Trial plan type (defaults to "pro")
- `hoursJson` - Business hours object
- `onlineOrderingLink` - Online ordering URL
- `reservationLink` - Reservation system URL
- `faqs` - Array of FAQ objects
- `customAutoTextMessage` - Custom auto-reply message

## 🧪 Testing

### Run Trial Activation Tests
```bash
# Test the trial activation endpoint
node scripts/test-trial-activation.js

# Test against production (set environment variable)
TEST_BASE_URL=https://your-domain.com node scripts/test-trial-activation.js
```

### Run Checkout Session Tests
```bash
# Test the checkout session endpoint
node scripts/test-checkout-session.js

# Test against production
TEST_BASE_URL=https://your-domain.com node scripts/test-checkout-session.js
```

### Manual Testing Checklist

#### Trial Activation
- [ ] Create trial business with all fields
- [ ] Create trial business with only required fields
- [ ] Test with invalid email format
- [ ] Test with missing required fields
- [ ] Verify business appears in Supabase dashboard
- [ ] Check trial_ends_at is ~14 days from creation
- [ ] Confirm subscription_tier is set to "trial"
- [ ] Validate custom_settings contains trial info

#### Checkout Session
- [ ] Create checkout session with email
- [ ] Create checkout session without email
- [ ] Test invalid email format handling
- [ ] Verify GET request returns 405
- [ ] Test invalid JSON handling
- [ ] Confirm response contains valid checkout URL

## 🚀 Deployment Steps

### 1. Database Schema Update
Run the SQL script in `scripts/update-supabase-schema-for-trials.sql` on your Supabase database.

### 2. Environment Variables
Ensure these environment variables are configured:
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. Deploy to Vercel
```bash
# Deploy the updated code
vercel --prod

# Or if using git integration, push to main branch
git add .
git commit -m "Add trial activation endpoint and schema updates"
git push origin main
```

### 4. Verify Deployment
```bash
# Test the deployed endpoints
TEST_BASE_URL=https://your-domain.vercel.app node scripts/test-trial-activation.js
TEST_BASE_URL=https://your-domain.vercel.app node scripts/test-checkout-session.js
```

## 🔍 Verification Checklist

### Trial Activation Endpoint
- [ ] Endpoint responds to POST requests
- [ ] Returns 201 for successful creation
- [ ] Returns 400 for validation errors
- [ ] Returns 405 for non-POST methods
- [ ] Logs detailed information for debugging
- [ ] Creates business record in Supabase
- [ ] Sets trial_ends_at to 14 days from creation
- [ ] Associates business with authenticated user (if auth provided)

### Checkout Session Endpoint
- [ ] Endpoint responds to POST requests
- [ ] Returns 200 with checkout URL
- [ ] Returns 405 for GET requests
- [ ] Handles invalid JSON gracefully
- [ ] Validates email format
- [ ] Returns proper error messages

### Database Verification
- [ ] New business records appear in `businesses` table
- [ ] All fields are populated correctly
- [ ] `trial_ends_at` is set properly
- [ ] `subscription_tier` is "trial"
- [ ] `custom_settings` contains trial information
- [ ] User association works (if authenticated)

## 🐛 Troubleshooting

### Common Issues

#### "Database table not found"
- Ensure the schema update script has been run
- Check Supabase connection and permissions

#### "Invalid API key"
- Verify SUPABASE_SERVICE_ROLE_KEY is set correctly
- Check environment variable configuration

#### "Permission denied"
- Ensure RLS policies are configured correctly
- Verify service role has proper permissions

#### "Trial endpoint returns 404"
- Confirm the file is deployed to production
- Check Next.js routing configuration
- Verify the file is in the correct location: `app/api/create-business-trial/route.ts`

### Debug Logging
The trial activation endpoint includes comprehensive logging. Check your deployment logs for:
- Request parsing status
- Field validation results
- Authentication status
- Database operation results
- Error details

## 📋 Next Steps

1. **Frontend Integration**: Update your trial signup form to use the new endpoint
2. **Authentication**: Implement proper JWT token passing from frontend
3. **Trial Management**: Create endpoints for trial status checking and conversion
4. **Monitoring**: Set up alerts for trial creation failures
5. **Analytics**: Track trial conversion rates and usage patterns

## 🔗 Related Files

- `app/api/create-business-trial/route.ts` - Main endpoint implementation
- `scripts/update-supabase-schema-for-trials.sql` - Database schema updates
- `scripts/test-trial-activation.js` - Test suite
- `lib/supabase.js` - Supabase client configuration
- `pages/api/update-business-info.ts` - Existing business update endpoint
