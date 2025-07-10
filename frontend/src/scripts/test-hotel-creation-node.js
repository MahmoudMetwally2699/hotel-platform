/**
 * Node.js Test Script for Hotel Creation
 * This script tests the hotel creation functionality using direct API calls
 */

const http = require('http');

// Test data for hotel creation
const testHotelData = {
  name: 'Test Luxury Hotel',
  description: 'A beautiful luxury hotel for testing purposes',
  email: 'contact@testhotel.com',
  phone: '+1-234-567-8900',
  contactEmail: 'contact@testhotel.com',
  contactPhone: '+12345678900',
  address: {
    street: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    zipCode: '12345'
  },
  facilities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym'],
  isActive: true,
  isPublished: true,
  // Required fields based on backend Hotel model
  category: 'luxury',
  starRating: 5,
  totalRooms: 100,
  totalFloors: 10,
  taxId: 'TAX123456789',
  businessLicense: {
    number: 'BL-2025-001',
    issuedBy: 'City Business Authority',
    issuedDate: '2025-01-01T00:00:00.000Z',
    expiryDate: '2026-01-01T00:00:00.000Z'
  },
  // Hotel Admin credentials
  adminData: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'admin@testhotel.com',
    phone: '+201211477556',
    password: 'Mah@1234',
    confirmPassword: 'Mah@1234'
  }
};

// Super admin credentials for testing
const superAdminCredentials = {
  email: 'mahmetwally@gmail.com',
  password: 'SuperAdmin@2025'
};

/**
 * Make HTTP request helper
 */
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }

    req.end();
  });
}

/**
 * Login as super admin
 */
async function loginAsSuperAdmin() {
  console.log('📝 Logging in as super admin...');

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };
  try {
    const response = await makeRequest(options, superAdminCredentials);    if (response.statusCode === 200) {
      console.log('✅ Super admin login successful');
      console.log('Full response:', JSON.stringify(response.data, null, 2));

      // Check if the response has the expected structure
      if (response.data && response.data.data && response.data.data.user && response.data.data.user.role) {
        console.log('User role:', response.data.data.user.role);
        return response.data.data.token;
      } else if (response.data && response.data.user && response.data.user.role) {
        console.log('User role:', response.data.user.role);
        return response.data.token;
      } else if (response.data && response.data.role) {
        console.log('User role:', response.data.role);
        return response.data.token;
      } else {
        console.error('❌ Unexpected response structure - no user role found');
        return null;
      }
    } else {
      console.error('❌ Super admin login failed:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Login request failed:', error.message);
    return null;
  }
}

/**
 * Create hotel using API
 */
async function createHotel(token) {
  console.log('📝 Creating hotel...');

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/superadmin/hotels',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  try {
    const response = await makeRequest(options, testHotelData);

    if (response.statusCode === 201) {
      console.log('✅ Hotel creation successful!');
      console.log('Created hotel:', response.data);
      return response.data;
    } else {
      console.error('❌ Hotel creation failed:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Hotel creation request failed:', error.message);
    return null;
  }
}

/**
 * Validate hotel data before submission
 */
function validateHotelData(data) {
  const errors = [];

  // Basic hotel info validation
  if (!data.name || data.name.trim().length < 3) {
    errors.push('Hotel name must be at least 3 characters long');
  }

  if (!data.contactEmail || !isValidEmail(data.contactEmail)) {
    errors.push('Valid contact email is required');
  }

  if (!data.contactPhone || data.contactPhone.trim().length < 10) {
    errors.push('Valid contact phone number is required');
  }

  // Address validation
  if (!data.address.street || data.address.street.trim().length < 5) {
    errors.push('Street address must be at least 5 characters long');
  }

  if (!data.address.city || data.address.city.trim().length < 2) {
    errors.push('City is required');
  }

  if (!data.address.country || data.address.country.trim().length < 2) {
    errors.push('Country is required');
  }

  // Admin data validation
  if (!data.adminData.firstName || data.adminData.firstName.trim().length < 2) {
    errors.push('Admin first name is required');
  }

  if (!data.adminData.lastName || data.adminData.lastName.trim().length < 2) {
    errors.push('Admin last name is required');
  }

  if (!data.adminData.email || !isValidEmail(data.adminData.email)) {
    errors.push('Valid admin email is required');
  }

  if (!data.adminData.password || data.adminData.password.length < 6) {
    errors.push('Admin password must be at least 6 characters long');
  }

  if (data.adminData.password !== data.adminData.confirmPassword) {
    errors.push('Admin passwords do not match');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Email validation helper
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Test hotel creation process
 */
async function testHotelCreation() {
  try {
    console.log('🚀 Starting hotel creation test...');

    // Step 1: Validate form data
    console.log('📝 Step 1: Validating form data...');
    const validation = validateHotelData(testHotelData);
    if (!validation.isValid) {
      console.error('❌ Form validation failed:', validation.errors);
      return;
    }
    console.log('✅ Form data validation passed');

    // Step 2: Login as super admin
    const token = await loginAsSuperAdmin();
    if (!token) {
      console.error('❌ Unable to obtain authentication token');
      return;
    }

    // Step 3: Create hotel
    const result = await createHotel(token);
    if (result) {
      console.log('✅ Hotel creation test completed successfully!');
    } else {
      console.error('❌ Hotel creation test failed');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

/**
 * Check if backend is running
 */
async function checkBackend() {
  console.log('🔍 Checking if backend is running...');

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 5000
  };

  try {
    const response = await makeRequest(options, { email: 'test@test.com', password: 'test' });
    // We expect this to fail, but if we get a response, the backend is running
    console.log('✅ Backend is running (responded with status:', response.statusCode, ')');
    return true;
  } catch (error) {
    console.error('❌ Backend is not running:', error.message);
    console.log('💡 Make sure to run "npm start" in the backend folder first');
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🧪 Hotel Creation Test Script\n');

  // Check if backend is running
  const backendRunning = await checkBackend();
  if (!backendRunning) {
    console.log('\n❌ Cannot proceed without backend running');
    process.exit(1);
  }

  // Run the test
  await testHotelCreation();

  console.log('\n🏁 Test completed!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testHotelCreation,
  validateHotelData,
  testHotelData,
  superAdminCredentials
};
