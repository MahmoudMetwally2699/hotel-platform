/**
 * Login Test Script
 * This script tests the login API directly using Node's built-in http module
 * Run with: node scripts/test-login.js
 */

require('dotenv').config();
const http = require('http');
const https = require('https');
const { URL } = require('url');

// Login data
const loginData = {
  email: 'mahmetwally@gmail.com',
  password: 'SuperAdmin@2025',
  role: 'superadmin'
};

// API URL
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

function httpRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url);
    const protocol = url.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = protocol.request(requestOptions, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        let parsedData;
        try {
          parsedData = JSON.parse(responseData);
        } catch (e) {
          parsedData = responseData;
        }

        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsedData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testLogin() {
  try {
    console.log('Attempting login with:', {
      email: loginData.email,
      role: loginData.role
    });

    // Test without role first
    console.log('\n--- TEST 1: Login without role ---');
    const { email, password } = loginData;
    let response = await httpRequest({
      url: `${API_URL}/auth/login`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, { email, password });

    if (response.status === 200) {
      console.log('Login successful!');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('Login failed!');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    }

    // Test with role
    console.log('\n--- TEST 2: Login with role ---');
    response = await httpRequest({
      url: `${API_URL}/auth/login`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, loginData);

    if (response.status === 200) {
      console.log('Login successful!');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));

      // If successful, store the token
      if (response.data.token) {
        console.log('JWT Token:', response.data.token);
      }

      return response.data;
    } else {
      console.log('Login failed!');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      return null;
    }
  } catch (error) {
    console.error('Login failed!');
    console.error('Full error:', error.message);
    return null;
  }
}

// Execute the login test
testLogin()
  .then(result => {
    if (result) {
      console.log('Test completed successfully');
    } else {
      console.log('Test failed');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
