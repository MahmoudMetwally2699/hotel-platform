/**
 * Test Script for Hotel Creation from Frontend
 * This script tests the hotel creation functionality by simulating form submission
 */

import { store } from '../app/store';
import { createHotel } from '../redux/slices/hotelSlice';
import { loginUser } from '../redux/slices/authSlice';

// Test data for hotel creation
const testHotelData = {
  name: 'Test Luxury Hotel',
  description: 'A beautiful luxury hotel for testing purposes',
  contactEmail: 'contact@testhotel.com',
  contactPhone: '+1-234-567-8900',
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
  // Hotel Admin credentials
  adminData: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'admin@testhotel.com',
    phone: '+1-234-567-8901',
    password: 'adminpassword123',
    confirmPassword: 'adminpassword123'
  }
};

// Super admin credentials for testing
const superAdminCredentials = {
  email: 'mahmetwally@gmail.com',
  password: 'superadmin123'
};

/**
 * Test hotel creation process
 */
async function testHotelCreation() {
  try {
    console.log('🚀 Starting hotel creation test...');

    // Step 1: Login as super admin
    console.log('📝 Step 1: Logging in as super admin...');
    const loginResult = await store.dispatch(loginUser(superAdminCredentials));

    if (loginResult.type === 'auth/login/fulfilled') {
      console.log('✅ Super admin login successful');
      console.log('User data:', loginResult.payload.user);
    } else {
      console.error('❌ Super admin login failed:', loginResult.payload);
      return;
    }

    // Step 2: Validate form data
    console.log('📝 Step 2: Validating form data...');
    const validation = validateHotelData(testHotelData);
    if (!validation.isValid) {
      console.error('❌ Form validation failed:', validation.errors);
      return;
    }
    console.log('✅ Form data validation passed');

    // Step 3: Create hotel
    console.log('📝 Step 3: Creating hotel...');
    console.log('Hotel data:', testHotelData);

    const createResult = await store.dispatch(createHotel(testHotelData));

    if (createResult.type === 'hotel/createHotel/fulfilled') {
      console.log('✅ Hotel creation successful!');
      console.log('Created hotel:', createResult.payload);

      // Step 4: Verify hotel was created
      console.log('📝 Step 4: Verifying hotel creation...');
      const currentState = store.getState();
      console.log('Current hotels in store:', currentState.hotels.hotels);

    } else {
      console.error('❌ Hotel creation failed:', createResult.payload);
      console.error('Error type:', createResult.type);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
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
 * Test different scenarios
 */
async function runAllTests() {
  console.log('🧪 Running all hotel creation tests...\n');

  // Test 1: Valid hotel creation
  console.log('=== Test 1: Valid Hotel Creation ===');
  await testHotelCreation();

  // Test 2: Invalid admin email
  console.log('\n=== Test 2: Invalid Admin Email ===');
  const invalidEmailData = {
    ...testHotelData,
    adminData: {
      ...testHotelData.adminData,
      email: 'invalid-email'
    }
  };

  const validation = validateHotelData(invalidEmailData);
  if (!validation.isValid) {
    console.log('✅ Validation correctly caught invalid email:', validation.errors);
  } else {
    console.log('❌ Validation should have failed for invalid email');
  }

  // Test 3: Password mismatch
  console.log('\n=== Test 3: Password Mismatch ===');
  const passwordMismatchData = {
    ...testHotelData,
    adminData: {
      ...testHotelData.adminData,
      confirmPassword: 'differentpassword'
    }
  };

  const passwordValidation = validateHotelData(passwordMismatchData);
  if (!passwordValidation.isValid) {
    console.log('✅ Validation correctly caught password mismatch:', passwordValidation.errors);
  } else {
    console.log('❌ Validation should have failed for password mismatch');
  }

  console.log('\n🏁 All tests completed!');
}

// Export functions for use in other files
export {
  testHotelCreation,
  validateHotelData,
  runAllTests,
  testHotelData
};

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined' && window.location) {
  // Browser environment - add to window object for console access
  window.hotelCreationTest = {
    testHotelCreation,
    validateHotelData,
    runAllTests,
    testHotelData
  };

  console.log('🎯 Hotel creation test functions available on window.hotelCreationTest');
  console.log('Run window.hotelCreationTest.runAllTests() to start testing');
}
