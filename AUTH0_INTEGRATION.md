# Auth0 Integration Guide

This guide explains how the Auth0 integration works in the SmartText AI application and how to configure it for your environment.

## Overview

SmartText AI uses Auth0 for authentication and authorization. Auth0 provides a secure and reliable way to handle user authentication, allowing users to sign up, log in, and access protected resources.

## How It Works

1. **Authentication Flow**:
   - When a user clicks the "Login" button, they are redirected to the Auth0 login page.
   - After successful authentication, Auth0 redirects the user back to the application with an authorization code.
   - The application exchanges the authorization code for an access token and ID token.
   - The user's session is created, and they are redirected to the dashboard.

2. **Protected Routes**:
   - All routes under `/dashboard/*` are protected and require authentication.
   - If a user tries to access a protected route without being authenticated, they are redirected to the login page.
   - After successful authentication, the user is redirected back to the originally requested route.

3. **User Profile**:
   - The user's profile information is available in the application through the `useAuth` hook.
   - The profile includes the user's ID, email, name, and other information provided by Auth0.

## Configuration

### Environment Variables

To configure Auth0 in your environment, you need to set the following environment variables in your `.env.local` file:

```
AUTH0_SECRET=your-auth0-secret
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_BASE_URL=http://localhost:3000
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
```

### Auth0 Dashboard Configuration

1. **Create an Auth0 Application**:
   - Log in to your Auth0 dashboard.
   - Go to "Applications" > "Applications" and click "Create Application".
   - Choose "Regular Web Applications" and give it a name (e.g., "SmartText AI").
   - Click "Create".

2. **Configure Application Settings**:
   - In the application settings, set the following:
     - **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback` (for development) and your production URL.
     - **Allowed Logout URLs**: `http://localhost:3000` (for development) and your production URL.
     - **Allowed Web Origins**: `http://localhost:3000` (for development) and your production URL.
   - Save the changes.

3. **Get Client ID and Secret**:
   - In the application settings, note the "Client ID" and "Client Secret".
   - Use these values for the `AUTH0_CLIENT_ID` and `AUTH0_CLIENT_SECRET` environment variables.

## Usage in the Application

### Authentication Context

The application provides an authentication context through the `useAuth` hook, which gives access to:

- `user`: The authenticated user's profile information.
- `isLoading`: A boolean indicating if the authentication state is being loaded.
- `isAuthenticated`: A boolean indicating if the user is authenticated.
- `error`: Any error that occurred during authentication.
- `login`: A function to initiate the login process.
- `logout`: A function to log the user out.

Example usage:

```jsx
import { useAuth } from '@/lib/auth-context';

function MyComponent() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <button onClick={() => login()}>
        Log In
      </button>
    );
  }

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={() => logout()}>
        Log Out
      </button>
    </div>
  );
}
```

### Protected Routes

The application uses middleware to protect routes under `/dashboard/*`. If a user tries to access a protected route without being authenticated, they are redirected to the login page.

Additionally, the dashboard layout component checks if the user is authenticated and redirects to the login page if not.

## Testing

You can test the Auth0 integration using the provided test script:

```bash
node scripts/test-auth0-flow.js
```

This script checks if you are authenticated and displays your profile information if you are. If you are not authenticated, it provides instructions for logging in.

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**:
   - Error: "Invalid redirect URI"
   - Solution: Make sure the callback URL in your Auth0 application settings matches the callback URL in your application.

2. **Invalid Client Secret**:
   - Error: "Invalid client secret"
   - Solution: Double-check your `AUTH0_CLIENT_SECRET` environment variable.

3. **Session Not Persisting**:
   - Issue: User is logged out after refreshing the page.
   - Solution: Make sure the `AUTH0_SECRET` environment variable is set correctly.

### Debugging

To debug authentication issues, you can:

1. Check the browser console for error messages.
2. Look at the network requests to see if there are any issues with the Auth0 API calls.
3. Check the server logs for error messages.

## Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [Next.js Auth0 SDK Documentation](https://auth0.github.io/nextjs-auth0/index.html)
