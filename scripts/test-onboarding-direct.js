/**
 * Simple test script for onboarding API endpoints
 */

const http = require('http');

function testOnboardingAPI() {
  console.log('Testing GET /api/onboarding-test...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/onboarding-test',
    method: 'GET'
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
  
  req.end();
}

testOnboardingAPI();
