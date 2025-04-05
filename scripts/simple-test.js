// Simple test script to verify the server is running
import fetch from 'node-fetch';

console.log('Starting simple test...');

async function testServer() {
  try {
    console.log('Sending request to server...');
    const response = await fetch('http://localhost:3002/api/health');
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response text:', text);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testServer();
