#!/usr/bin/env node

/**
 * Auth0 Integration Test Script
 * 
 * This script tests the Auth0 integration by:
 * 1. Making a request to the /api/auth/me endpoint to check if the user is authenticated
 * 2. If not authenticated, it provides instructions for logging in
 * 3. If authenticated, it displays the user's profile information
 * 
 * Usage:
 * node scripts/test-auth0-flow.js
 */

// Replace the CommonJS require with dynamic import
import('node-fetch').then(({ default: fetch }) => {
  // Call the function with fetch as a parameter
  testAuth0Integration(fetch);
});

// Modified to accept fetch as a parameter
async function testAuth0Integration(fetch) {
  console.log('🔒 Testing Auth0 Integration');
  console.log('---------------------------');
  
  try {
    // Make a request to the /api/auth/me endpoint
    console.log('Checking authentication status...');
    const response = await fetch('http://localhost:3000/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (response.status === 401) {
      console.log('❌ Not authenticated');
      console.log('\nTo test the authentication flow:');
      console.log('1. Start the development server: npm run dev');
      console.log('2. Open http://localhost:3000 in your browser');
      console.log('3. Click on "Login" in the navigation bar');
      console.log('4. Log in with your Auth0 credentials');
      console.log('5. After successful login, you should be redirected to the dashboard');
      console.log('6. Run this script again to verify that you are authenticated');
      return;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.user) {
      console.log('✅ Authenticated');
      console.log('\nUser Profile:');
      console.log(`- User ID: ${data.user.sub}`);
      console.log(`- Email: ${data.user.email}`);
      console.log(`- Name: ${data.user.name || 'Not provided'}`);
      console.log(`- Nickname: ${data.user.nickname || 'Not provided'}`);
      console.log(`- Email Verified: ${data.user.email_verified ? 'Yes' : 'No'}`);
      
      console.log('\nAuth0 Integration is working correctly!');
      console.log('You can now access protected routes in the application.');
    } else {
      console.log('❓ Unexpected response format');
      console.log(data);
    }
  } catch (error) {
    console.error('❌ Error testing Auth0 integration:', error);
    console.log('\nMake sure the development server is running on http://localhost:3000');
  }
}
