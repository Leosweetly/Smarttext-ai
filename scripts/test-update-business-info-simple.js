/**
 * Simple test script for the update-business-info API endpoint
 */

import fetch from 'node-fetch';

console.log('Starting test for update-business-info API...');

// Test data with all required fields
const testData = {
  name: 'Test Business ' + new Date().toISOString().slice(0, 16).replace('T', ' '),
  phoneNumber: '+15551234567',
  industry: 'Technology',
  hoursJson: JSON.stringify({
    monday: '9:00 AM - 5:00 PM',
    tuesday: '9:00 AM - 5:00 PM',
    wednesday: '9:00 AM - 5:00 PM',
    thursday: '9:00 AM - 5:00 PM',
    friday: '9:00 AM - 5:00 PM',
    saturday: 'Closed',
    sunday: 'Closed'
  }),
  size: 'Small',
  website: 'https://example.com',
  address: '123 Test St, Test City, TS 12345',
  email: 'test@example.com',
  faqs: [
    {
      question: 'What services do you offer?',
      answer: 'We offer a wide range of technology services including web development, app development, and cloud solutions.'
    },
    {
      question: 'What are your hours?',
      answer: 'We are open Monday through Friday, 9:00 AM to 5:00 PM.'
    },
    {
      question: 'Do you offer remote services?',
      answer: 'Yes, we offer remote services for clients anywhere in the world.'
    }
  ]
};

async function testEndpoint() {
  try {
    console.log('Sending request to http://localhost:3002/api/update-business-info');
    console.log('Request body:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3002/api/update-business-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const responseText = await response.text();
    console.log('Response status:', response.status);
    
    try {
      const data = JSON.parse(responseText);
      console.log('Response body:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log('✅ Test passed!');
        if (data.id) {
          console.log('Record created with ID:', data.id);
        }
      } else {
        console.log('❌ Test failed!');
        if (data.error) {
          console.log('Error:', data.error);
        }
      }
    } catch (error) {
      console.error('Error parsing JSON response:', error.message);
      console.log('Raw response:', responseText);
    }
  } catch (error) {
    console.error('Error making request:', error.message);
  }
}

// Run the test
testEndpoint();
