/**
 * Advanced Login Test Script
 * This script provides comprehensive login testing with detailed diagnostics
 * Run with: node scripts/advanced-test-login.js
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// API URL
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Test users for different roles
const testUsers = [
  {
    description: 'Super Admin',
    credentials: {
      email: 'mahmetwally@gmail.com',
      password: 'SuperAdmin@2025',
      role: 'superadmin'
    }
  },
  {
    description: 'Hotel Admin (test user - you may need to update credentials)',
    credentials: {
      email: 'hotel@example.com',
      password: 'Hotel@123',
      role: 'hotel'
    }
  },
  {
    description: 'Service Provider (test user - you may need to update credentials)',
    credentials: {
      email: 'service@example.com',
      password: 'Service@123',
      role: 'service'
    }
  },
  {
    description: 'Guest (test user - you may need to update credentials)',
    credentials: {
      email: 'guest@example.com',
      password: 'Guest@123',
      role: 'guest'
    }
  }
];

// Function to decode JWT and display user info
function decodeToken(token) {
  try {
    const decoded = jwt.decode(token);
    return {
      id: decoded.id,
      expiresAt: new Date(decoded.exp * 1000).toLocaleString(),
      issuedAt: new Date(decoded.iat * 1000).toLocaleString()
    };
  } catch (error) {
    return { error: 'Failed to decode token' };
  }
}

// Test login for a user
async function testUserLogin(userConfig) {
  console.log(`\n------ Testing ${userConfig.description} Login ------`);

  try {
    console.log('Request:');
    console.log(`- Endpoint: POST ${API_URL}/auth/login`);
    console.log(`- Email: ${userConfig.credentials.email}`);
    console.log(`- Role: ${userConfig.credentials.role}`);

    // Test with and without role to see the difference
    const withRoleResponse = await testLoginWithRole(userConfig.credentials);
    const withoutRoleResponse = await testLoginWithoutRole(userConfig.credentials);

    return { withRole: withRoleResponse, withoutRole: withoutRoleResponse };
  } catch (error) {
    console.error('Unexpected test execution error:', error.message);
    return { error: error.message };
  }
}

// Test login with role parameter
async function testLoginWithRole(credentials) {
  try {
    console.log('\nAttempting login WITH role parameter...');
    const response = await axios.post(`${API_URL}/auth/login`, credentials, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Success! Status:', response.status);
    if (response.data.token) {
      console.log('Token info:', decodeToken(response.data.token));
    }
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Failed! Status:', error.response?.status);
    console.error('Error:', error.response?.data?.message || error.message);
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data || error.message
    };
  }
}

// Test login without role parameter
async function testLoginWithoutRole(credentials) {
  const { email, password } = credentials;

  try {
    console.log('\nAttempting login WITHOUT role parameter...');
    const response = await axios.post(`${API_URL}/auth/login`, { email, password }, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Success! Status:', response.status);
    if (response.data.token) {
      console.log('Token info:', decodeToken(response.data.token));
    }
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Failed! Status:', error.response?.status);
    console.error('Error:', error.response?.data?.message || error.message);
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data || error.message
    };
  }
}

// Main function to run all tests
async function runAllTests() {
  console.log('=== Starting Login API Tests ===');
  console.log(`API URL: ${API_URL}`);

  const results = {};

  // Test only the superadmin user first (you can uncomment the loop below to test all users)
  const superAdmin = testUsers[0];
  results[superAdmin.description] = await testUserLogin(superAdmin);

  /*
  // Test all users
  for (const user of testUsers) {
    results[user.description] = await testUserLogin(user);
  }
  */

  console.log('\n=== Test Summary ===');
  for (const [user, result] of Object.entries(results)) {
    console.log(`\n${user}:`);
    console.log(`- With role: ${result.withRole?.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`- Without role: ${result.withoutRole?.success ? 'SUCCESS' : 'FAILED'}`);
  }

  return results;
}

// Run the tests
runAllTests()
  .then(() => {
    console.log('\nAll tests completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
