# Auth Module Testing

This document provides an overview of the Auth module testing process and results.

## Overview

The Auth module in SmartText AI is built on Auth0 and provides authentication functionality for the application. It consists of:

1. **Auth0 Integration** (`lib/auth/auth0.js`):
   - Uses `@auth0/nextjs-auth0` package
   - Configures Auth0 with environment variables
   - Exports key functions: `auth0`, `getSession`, `withApiAuthRequired`, `withPageAuthRequired`

2. **Auth Context** (`lib/auth/context.js`):
   - React context for client-side auth state management
   - Provides `useAuth` hook for components to access auth state
   - Handles user fetching, login/logout functions

3. **API Routes**:
   - `/api/auth/login` - Redirects to Auth0 login page
   - `/api/auth/logout` - Handles user logout
   - `/api/auth/callback` - Processes Auth0 callback after login
   - `/api/auth/me` - Protected endpoint to get user profile

4. **Protected Routes**:
   - Dashboard layout uses client-side protection with `useAuth`
   - API routes use server-side protection with `withApiAuthRequired`

## Testing Approach

We created a test script (`scripts/test-auth.mjs`) that simulates the authentication flow and verifies the behavior of protected routes. The script tests:

1. **Login Functionality**:
   - Tests login endpoint redirection
   - Verifies login page rendering
   - Tests error handling

2. **Logout Functionality**:
   - Tests logout endpoint redirection

3. **Authentication Callback Handling**:
   - Tests callback endpoint behavior

4. **Protected Routes**:
   - Tests API protection
   - Tests page protection

5. **Session Management**:
   - Verifies session-related code exists

## Test Results

The simulated tests completed successfully, but with some expected errors due to the lack of Auth0 credentials. The main findings are:

- The Auth module code structure is correct
- All expected functions are exported
- The client-side and server-side protection mechanisms are in place
- Full functionality requires Auth0 credentials

## Setting Up Auth0 for Full Integration Testing

To perform full integration testing with Auth0:

1. **Create an Auth0 Account**:
   - Sign up at [Auth0](https://auth0.com/)
   - Create a new tenant for testing

2. **Create an Application**:
   - In the Auth0 dashboard, go to "Applications" > "Create Application"
   - Select "Regular Web Applications"
   - Name it "SmartText AI"

3. **Configure Application Settings**:
   - Set "Allowed Callback URLs" to `http://localhost:3001/api/auth/callback`
   - Set "Allowed Logout URLs" to `http://localhost:3001`
   - Set "Allowed Web Origins" to `http://localhost:3001`

4. **Add Auth0 Credentials to .env.local**:
   ```
   # Auth0 credentials
   AUTH0_SECRET=your-auth0-secret
   AUTH0_BASE_URL=http://localhost:3001
   AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret
   ```

5. **Create Test Users**:
   - In the Auth0 dashboard, go to "User Management" > "Users"
   - Create test users with different roles/permissions

6. **Run the Tests**:
   ```
   node scripts/test-auth.mjs
   ```

## Manual Testing

In addition to automated testing, manual testing should be performed to verify the full authentication flow:

1. **Login Flow**:
   - Visit the login page
   - Click login button
   - Complete Auth0 login form
   - Verify redirect to dashboard

2. **Protected Routes**:
   - Try accessing dashboard without authentication
   - Verify redirect to login page
   - Try accessing API endpoints without authentication
   - Verify 401 response

3. **Logout Flow**:
   - Click logout button
   - Verify redirect to home page
   - Verify session is terminated

## Conclusion

The Auth module is well-structured and follows best practices for authentication with Auth0. The simulated tests provide a good foundation for testing, but full integration testing with Auth0 credentials is recommended for production deployments.
