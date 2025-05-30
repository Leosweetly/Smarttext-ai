# SmartText AI

SmartText AI is a platform that helps businesses respond to missed calls with personalized AI-generated text messages. It integrates with Auth0 for authentication, Supabase for data storage, Twilio for SMS messaging, and Zapier for automations.

## 🎉 **v1.3.0 - Major Architecture Update**

**SmartText AI has completed its full migration from Airtable to Supabase!** This major update brings enhanced security, better performance, and improved data privacy through Supabase's Row Level Security (RLS).

## 🚀 Live Demo

Check out the live demo at [https://smarttext-connect.vercel.app](https://smarttext-connect.vercel.app)

## 🛠️ Tech Stack

- **Frontend**: Next.js (Lovable export)
- **Hosting**: Vercel
- **Authentication**: Auth0
- **Database**: Supabase (PostgreSQL with RLS)
- **SMS**: Twilio
- **Automations**: Zapier
- **GitHub Repo**: [Smarttext-ai](https://github.com/Leosweetly/Smarttext-ai)

## 🏗️ Architecture

SmartText AI uses a modern, secure architecture built around Supabase:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App  │────│   Supabase DB    │────│  Twilio SMS API │
│   (Frontend)    │    │  (PostgreSQL)    │    │   (Messaging)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌──────────────────┐             │
         └──────────────│   Auth0 Auth     │─────────────┘
                        │  (Identity)      │
                        └──────────────────┘
```

**Key Benefits of Supabase Integration:**
- **Enhanced Security**: Row Level Security (RLS) ensures data isolation
- **Better Performance**: Direct PostgreSQL queries with optimized indexing
- **Improved Privacy**: Reduced PII exposure through proper data handling
- **Simplified Architecture**: Direct database integration without API overhead

## 📋 Features

- **Authentication**: Secure login and signup with Auth0
- **Dashboard**: View and manage conversations, missed calls, and business settings
- **Conversations**: Real-time messaging with customers via Twilio
- **Missed Calls**: Automatic responses to missed calls with AI-generated text messages
- **Business Settings**: Configure your business information and preferences
- **Zapier Integration**: Connect with thousands of other apps and services
- **Data Security**: Enterprise-grade security with Supabase RLS

## 🔧 Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Auth0 account
- Supabase account
- Twilio account
- Zapier account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Leosweetly/Smarttext-ai.git
   cd smarttext-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following environment variables:

   ```
   # Auth0
   AUTH0_SECRET=your-auth0-secret
   AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
   AUTH0_BASE_URL=http://localhost:3000
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Twilio
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=your-twilio-phone-number

   # Zapier
   ZAPIER_MISSED_CALL_WEBHOOK_URL=your-zapier-missed-call-webhook-url
   ZAPIER_NEW_MESSAGE_WEBHOOK_URL=your-zapier-new-message-webhook-url
   ```

4. Set up your Supabase database:
   ```bash
   # Create the database schema
   node scripts/create-supabase-schema.sql

   # Set up Row Level Security
   node scripts/setup-supabase-rls.sql
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Verify Setup

To verify that all integrations are working correctly, run:

```bash
node scripts/test-supabase-integration.js
```

This script will check if all required environment variables are set and test each integration.

## 📚 Documentation

- [Auth0 Integration](AUTH0_INTEGRATION.md)
- [Supabase Migration Guide](SUPABASE_MIGRATION.md)
- [Twilio Integration](TWILIO_INTEGRATION.md)
- [Twilio Testing Guide](TWILIO_TESTING.md)
- [Zapier Webhook Integration](ZAPIER_WEBHOOK_INTEGRATION.md)
- [Security Implementation](SECURITY_PHASE_1_IMPLEMENTATION.md)

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### End-to-End Tests

```bash
npm run cypress
```

### Twilio Webhook Tests

```bash
# Test incoming call webhook
npm run test:twilio:call

# Test incoming SMS webhook
npm run test:twilio:sms

# Test missed call auto-text functionality
node scripts/test-malibu-autotext.js

# Verify test results
npm run test:twilio:verify sms +15551234567
```

### Supabase Integration Tests

```bash
# Test Supabase connection and basic operations
node scripts/test-supabase-integration.js

# Test business lookup functionality
node scripts/test-business-lookup.js

# Test monitoring and analytics
node scripts/test-monitoring.js
```

For more detailed information on testing:
- [Cypress Testing Guide](CYPRESS_TESTING.md)
- [Twilio Testing Guide](TWILIO_TESTING.md)
- [Supabase Testing](SUPABASE_MIGRATION.md#testing)

## 🔒 Security

SmartText AI implements enterprise-grade security measures:

- **Row Level Security (RLS)**: Database-level access control
- **Environment Variable Protection**: Sensitive data properly isolated
- **Input Validation**: All user inputs sanitized and validated
- **Rate Limiting**: Protection against abuse and spam
- **Audit Logging**: Comprehensive activity tracking

See [Security Documentation](SECURITY_PHASE_1_IMPLEMENTATION.md) for detailed security implementation.

## 🚀 Deployment

SmartText AI is optimized for Vercel deployment:

```bash
# Deploy to Vercel
vercel --prod

# The custom build script automatically handles:
# - Environment setup
# - Database connection verification
# - Mock fallbacks for development
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributors

- [Leo Sweetly](https://github.com/Leosweetly)

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [Auth0](https://auth0.com/)
- [Supabase](https://supabase.com/)
- [Twilio](https://www.twilio.com/)
- [Zapier](https://zapier.com/)
- [Vercel](https://vercel.com/)

## 📈 Changelog

### v1.3.0 (2025-05-30)
- **MAJOR**: Complete migration from Airtable to Supabase
- **SECURITY**: Enhanced data protection with Row Level Security
- **PERFORMANCE**: Improved query performance with direct PostgreSQL access
- **ARCHITECTURE**: Simplified codebase with removal of compatibility layers
- **TESTING**: Comprehensive test suite for Supabase integration
