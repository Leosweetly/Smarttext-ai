# Auto-Text Enhancement Deployment Guide

This document provides instructions for deploying the enhanced auto-text functionality for SmartText AI.

## Overview of Changes

The auto-text functionality has been enhanced with the following features:

1. **Standardized Format**: Auto-text messages now follow a specific format:
   ```
   Hey! Thanks for calling [business name], sorry we missed your call. Were you calling about [business-type-specific topics]?
   ```

2. **Business-Type Specific Topics**: The system now suggests relevant topics based on the business type (e.g., for restaurants: "placing an order or making a reservation").

3. **FAQ Response System**: When customers reply to the auto-text with questions, the system can now:
   - Match questions to the business's FAQs stored in Supabase
   - Generate responses based on those FAQs
   - Fall back to OpenAI for questions not covered by FAQs

4. **Customizable Auto-Text Messages**: Businesses can now customize their auto-text message through the dashboard:
   - Custom messages are stored in the business's `custom_settings` field in Supabase
   - The system will use the custom message instead of the generated one if available
   - This allows businesses to personalize their auto-text messages to match their brand voice

## Files Modified/Created

### New Files:
- `lib/business-topics.js` - Utility for generating business-type specific topics
- `scripts/deploy-autotext-update.sh` - Deployment script
- `scripts/verify-autotext-deployment.js` - Post-deployment verification script
- `scripts/test-custom-autotext.js` - Script to test custom auto-text message functionality
- `scripts/test-sms-response.js` - Script to test SMS response functionality
- `MALIBU_AUTOTEXT_TESTING.md` - Updated testing documentation
- `AUTOTEXT_ENHANCEMENT_DEPLOYMENT.md` - This deployment guide

### Modified Files:
- `lib/openai.js` - Updated to use the new format and handle FAQ responses
- `lib/api-compat.js` - Enhanced mock implementation with more business data
- `scripts/test-malibu-autotext.js` - Updated test script with FAQ testing mode
- `pages/api/update-business-info.ts` - Updated to handle custom auto-text messages
- `pages/api/twilio/sms.ts` - Updated to use the handleIncomingSms function

## Deployment Instructions

### Prerequisites

1. Ensure you have the necessary environment variables set in your `.env.local` and `.env.production` files:
   - `TWILIO_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
   - `OPENAI_API_KEY`

2. Make sure you have Vercel CLI installed:
   ```
   npm install -g vercel
   ```

### Pre-Deployment Testing

1. Run the test script to verify the changes locally:
   ```
   node scripts/test-malibu-autotext.js
   ```

2. Test the FAQ response system:
   ```
   node scripts/test-malibu-autotext.js faq
   ```

3. Test the custom auto-text message feature:
   ```
   node scripts/test-custom-autotext.js "Your custom message here"
   ```

4. Test the SMS response functionality:
   ```
   node scripts/test-sms-response.js "What are your hours?"
   ```

### Deployment Process

1. Make the deployment script executable (if not already):
   ```
   chmod +x scripts/deploy-autotext-update.sh
   ```

2. Run the deployment script:
   ```
   ./scripts/deploy-autotext-update.sh
   ```

   This script will:
   - Run tests to verify the changes
   - Build the project
   - Deploy to Vercel

### Post-Deployment Verification

1. Make the verification script executable (if not already):
   ```
   chmod +x scripts/verify-autotext-deployment.js
   ```

2. Run the verification script:
   ```
   node scripts/verify-autotext-deployment.js
   ```

   This script will:
   - Verify the environment
   - Test the missed call auto-text on the production environment
   - Test the FAQ response system on the production environment
   - Test the custom auto-text message feature on the production environment

3. You can also run individual tests:
   ```
   # Test SMS response functionality
   node scripts/test-sms-response.js "What are your hours?"
   
   # Test custom auto-text message
   node scripts/test-custom-autotext.js "Your custom message here"
   ```

## Rollback Plan

If issues are encountered after deployment, you can roll back to the previous version:

1. Use Vercel's rollback feature:
   ```
   npx vercel rollback
   ```

2. Or revert the changes in the codebase and redeploy:
   ```
   git revert HEAD~1
   ./scripts/deploy-autotext-update.sh
   ```

## Monitoring

After deployment, monitor the following:

1. Check the Vercel logs for any errors
2. Monitor Twilio logs for SMS delivery issues
3. Test the auto-text functionality with real missed calls
4. Test the FAQ response system with real customer questions

## Additional Resources

- For detailed testing instructions, see `MALIBU_AUTOTEXT_TESTING.md`
- For information on the business types and topics, see `lib/business-topics.js`
- For information on the FAQ response system, see the `handleIncomingSms` function in `lib/openai.js`
