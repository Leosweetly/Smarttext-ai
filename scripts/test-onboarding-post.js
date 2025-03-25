/**
 * Test script for onboarding POST API endpoint
 */

const http = require('http');

function testOnboardingPostAPI() {
  console.log('Testing POST /api/onboarding-test...');
  
  // Sample onboarding data
  const onboardingData = {
    userId: 'test-user-id',
    steps: {
      businessInfo: {
        completed: true,
        data: {
          name: 'Test Business',
          businessType: 'retail',
          address: '123 Test St, Test City, TS 12345'
        }
      },
      phoneSetup: {
        completed: false,
        data: {
          phoneNumber: '+15551234567',
          configured: false
        }
      },
      preferences: {
        completed: false,
        data: {
          notifications: true,
          autoRespond: true,
          theme: 'light'
        }
      }
    },
    currentStep: 'phoneSetup',
    completed: false,
    lastUpdated: new Date().toISOString()
  };
  
  const postData = JSON.stringify(onboardingData);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/onboarding-test',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = http.request(options, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers));
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:', data);
      
      try {
        // Try to parse as JSON if possible
        const json = JSON.parse(data);
        console.log('Response JSON:', json);
        
        // Test the reset endpoint
        testResetEndpoint();
      } catch (e) {
        console.log('Response is not valid JSON');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Error:', error);
  });
  
  req.write(postData);
  req.end();
}

function testResetEndpoint() {
  console.log('\nTesting POST /api/onboarding-test/reset...');
  
  const resetData = {
    userId: 'test-user-id'
  };
  
  const postData = JSON.stringify(resetData);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/onboarding-test/reset',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = http.request(options, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers));
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:', data);
      
      try {
        // Try to parse as JSON if possible
        const json = JSON.parse(data);
        console.log('Response JSON:', json);
      } catch (e) {
        console.log('Response is not valid JSON');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Error:', error);
  });
  
  req.write(postData);
  req.end();
}

// Start the tests
testOnboardingPostAPI();
