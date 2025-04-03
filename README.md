# SmartText AI

SmartText AI is a platform that helps businesses respond to missed calls with personalized AI-generated text messages. It integrates with Auth0 for authentication, Airtable for data storage, Twilio for SMS messaging, and Zapier for automations.

## 🚀 Live Demo

Check out the live demo at [https://smarttext-connect.vercel.app](https://smarttext-connect.vercel.app)

## 🛠️ Tech Stack

- **Frontend**: Next.js (Lovable export)
- **Hosting**: Vercel
- **Authentication**: Auth0
- **Database**: Airtable
- **SMS**: Twilio
- **Automations**: Zapier
- **GitHub Repo**: [Smarttext-ai](https://github.com/Leosweetly/Smarttext-ai)

## 📋 Features

- **Authentication**: Secure login and signup with Auth0
- **Dashboard**: View and manage conversations, missed calls, and business settings
- **Conversations**: Real-time messaging with customers via Twilio
- **Missed Calls**: Automatic responses to missed calls with AI-generated text messages
- **Business Settings**: Configure your business information and preferences
- **Zapier Integration**: Connect with thousands of other apps and services

## 🔧 Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Auth0 account
- Airtable account
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

   # Airtable
   AIRTABLE_API_KEY=your-airtable-api-key
   AIRTABLE_BASE_ID=your-airtable-base-id

   # Twilio
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=your-twilio-phone-number

   # Zapier
   ZAPIER_MISSED_CALL_WEBHOOK_URL=your-zapier-missed-call-webhook-url
   ZAPIER_NEW_MESSAGE_WEBHOOK_URL=your-zapier-new-message-webhook-url
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Verify Setup

To verify that all integrations are working correctly, run:

```bash
node scripts/verify-core-functionality.js
```

This script will check if all required environment variables are set and test each integration.

## 📚 Documentation

- [Auth0 Integration](AUTH0_INTEGRATION.md)
- [Airtable Integration](AIRTABLE_OAUTH.md)
- [Twilio Integration](TWILIO_INTEGRATION.md)
- [Zapier Webhook Integration](ZAPIER_WEBHOOK_INTEGRATION.md)

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### End-to-End Tests

```bash
npm run cypress
```

For more detailed information on running Cypress tests locally and in CI, see the [Cypress Testing Guide](CYPRESS_TESTING.md).

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributors

- [Leo Sweetly](https://github.com/Leosweetly)

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [Auth0](https://auth0.com/)
- [Airtable](https://airtable.com/)
- [Twilio](https://www.twilio.com/)
- [Zapier](https://zapier.com/)
- [Vercel](https://vercel.com/)
