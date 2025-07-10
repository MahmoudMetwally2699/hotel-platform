/**
 * Simple login test script using Node.js http module (no external dependencies)
 * Run with: node scripts/simple-login-test.js
 */

const http = require('http');
require('dotenv').config();

// API URL and port (extract from environment or use default)
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 5000;
const API_PATH = '/api/auth/login';

// Login data
const loginData = {
  email: 'mahmetwally@gmail.com',
  password: 'SuperAdmin@2025',
  role: 'superadmin'
};

function makeLoginRequest(data) {
  return new Promise((resolve, reject) => {
    // Prepare the request options
    const requestData = JSON.stringify(data);

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };

    console.log(`Making request to: http://${API_HOST}:${API_PORT}${API_PATH}`);
    console.log('Request data:', data);

    // Create the request
    const req = http.request(options, (res) => {
      let responseData = '';

      // Collect the response data
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      // When the response is complete
      res.on('end', () => {
        console.log('Response status code:', res.statusCode);
        try {
          // Try to parse the response as JSON
          const parsedData = JSON.stringify(JSON.parse(responseData), null, 2);
          console.log('Response body:', parsedData);
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(responseData)
          });
        } catch (e) {
          console.log('Raw response:', responseData);
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    // Handle errors
    req.on('error', (error) => {
      console.error('Error making request:', error.message);
      reject(error);
    });

    // Send the request data
    req.write(requestData);
    req.end();
  });
}

async function runTests() {
  console.log('=== Starting Simple Login Tests ===\n');

  try {
    // Test 1: Login with role
    console.log('TEST 1: Login with role parameter');
    await makeLoginRequest(loginData);

    console.log('\n------------------------------\n');

    // Test 2: Login without role
    console.log('TEST 2: Login without role parameter');
    const { email, password } = loginData;
    await makeLoginRequest({ email, password });

    console.log('\n=== Tests completed ===');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

runTests();
