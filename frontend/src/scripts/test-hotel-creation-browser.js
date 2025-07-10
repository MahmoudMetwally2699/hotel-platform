/**
 * Browser Console Test Script for Hotel Creation
 * Run this script in the browser console on your frontend app
 */

// Test data for hotel creation
const testHotelData = {
  name: 'Test Luxury Hotel Console',
  description: 'A beautiful luxury hotel for testing purposes via console',
  contactEmail: 'contact@testhotelconsole.com',
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
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'admin@testhotelconsole.com',
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
 * Test hotel creation using Redux store
 */
async function testHotelCreationFromBrowser() {
  try {
    console.log('🚀 Starting hotel creation test from browser...');

    // Check if Redux store is available
    if (typeof window.store === 'undefined') {
      console.error('❌ Redux store not found on window object');
      console.log('💡 Make sure you are on the frontend app page');
      return;
    }

    const { store } = window;

    // Step 1: Check current auth state
    console.log('📝 Step 1: Checking current auth state...');
    const currentState = store.getState();
    console.log('Current auth state:', currentState.auth);

    // Step 2: Login as super admin if not already logged in
    if (!currentState.auth.isAuthenticated || currentState.auth.user.role !== 'superadmin') {
      console.log('📝 Step 2: Logging in as super admin...');

      // Import the login action
      const { loginUser } = await import('/src/redux/slices/authSlice.js');
      const loginResult = await store.dispatch(loginUser(superAdminCredentials));

      if (loginResult.type === 'auth/login/fulfilled') {
        console.log('✅ Super admin login successful');
        console.log('User data:', loginResult.payload.user);
      } else {
        console.error('❌ Super admin login failed:', loginResult.payload);
        return;
      }
    } else {
      console.log('✅ Already logged in as super admin');
    }

    // Step 3: Create hotel
    console.log('📝 Step 3: Creating hotel...');
    console.log('Hotel data:', testHotelData);

    // Import the createHotel action
    const { createHotel } = await import('/src/redux/slices/hotelSlice.js');
    const createResult = await store.dispatch(createHotel(testHotelData));

    if (createResult.type === 'hotel/createHotel/fulfilled') {
      console.log('✅ Hotel creation successful!');
      console.log('Created hotel:', createResult.payload);
    } else {
      console.error('❌ Hotel creation failed:', createResult.payload);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

/**
 * Test hotel creation using direct API calls
 */
async function testHotelCreationWithAPI() {
  try {
    console.log('🚀 Starting hotel creation test with direct API calls...');

    // Step 1: Login as super admin
    console.log('📝 Step 1: Logging in as super admin...');

    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(superAdminCredentials)
    });

    const loginData = await loginResponse.json();

    if (loginResponse.ok) {
      console.log('✅ Super admin login successful');
      console.log('User role:', loginData.user.role);
    } else {
      console.error('❌ Super admin login failed:', loginData);
      return;
    }

    // Step 2: Create hotel
    console.log('📝 Step 2: Creating hotel...');

    const createResponse = await fetch('/api/superadmin/hotels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify(testHotelData)
    });

    const createData = await createResponse.json();

    if (createResponse.ok) {
      console.log('✅ Hotel creation successful!');
      console.log('Created hotel:', createData);
    } else {
      console.error('❌ Hotel creation failed:', createData);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

/**
 * Simulate form submission on the hotels page
 */
async function simulateFormSubmission() {
  try {
    console.log('🚀 Simulating form submission...');

    // Check if we're on the hotels page
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/superadmin/hotels')) {
      console.log('💡 Navigate to /superadmin/hotels first');
      console.log('Current path:', currentPath);
      return;
    }

    // Fill form fields
    console.log('📝 Filling form fields...');

    const nameInput = document.querySelector('input[name="name"]');
    const descriptionInput = document.querySelector('textarea[name="description"]');
    const contactEmailInput = document.querySelector('input[name="contactEmail"]');
    const contactPhoneInput = document.querySelector('input[name="contactPhone"]');

    if (nameInput) {
      nameInput.value = testHotelData.name;
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (descriptionInput) {
      descriptionInput.value = testHotelData.description;
      descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (contactEmailInput) {
      contactEmailInput.value = testHotelData.contactEmail;
      contactEmailInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (contactPhoneInput) {
      contactPhoneInput.value = testHotelData.contactPhone;
      contactPhoneInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Fill address fields
    const cityInput = document.querySelector('input[name="address.city"]');
    const countryInput = document.querySelector('input[name="address.country"]');
    const streetInput = document.querySelector('input[name="address.street"]');

    if (cityInput) {
      cityInput.value = testHotelData.address.city;
      cityInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (countryInput) {
      countryInput.value = testHotelData.address.country;
      countryInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (streetInput) {
      streetInput.value = testHotelData.address.street;
      streetInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Fill admin fields
    const adminFirstNameInput = document.querySelector('input[name="adminData.firstName"]');
    const adminLastNameInput = document.querySelector('input[name="adminData.lastName"]');
    const adminEmailInput = document.querySelector('input[name="adminData.email"]');
    const adminPasswordInput = document.querySelector('input[name="adminData.password"]');
    const adminConfirmPasswordInput = document.querySelector('input[name="adminData.confirmPassword"]');

    if (adminFirstNameInput) {
      adminFirstNameInput.value = testHotelData.adminData.firstName;
      adminFirstNameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (adminLastNameInput) {
      adminLastNameInput.value = testHotelData.adminData.lastName;
      adminLastNameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (adminEmailInput) {
      adminEmailInput.value = testHotelData.adminData.email;
      adminEmailInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (adminPasswordInput) {
      adminPasswordInput.value = testHotelData.adminData.password;
      adminPasswordInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (adminConfirmPasswordInput) {
      adminConfirmPasswordInput.value = testHotelData.adminData.confirmPassword;
      adminConfirmPasswordInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    console.log('✅ Form fields filled successfully');
    console.log('💡 You can now click the submit button manually or run submitForm()');

  } catch (error) {
    console.error('❌ Form simulation failed:', error);
  }
}

/**
 * Submit the form programmatically
 */
function submitForm() {
  try {
    const form = document.querySelector('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
      console.log('✅ Form submitted');
    } else {
      console.error('❌ Form not found');
    }
  } catch (error) {
    console.error('❌ Form submission failed:', error);
  }
}

// Make functions available globally
window.hotelTestUtils = {
  testHotelCreationFromBrowser,
  testHotelCreationWithAPI,
  simulateFormSubmission,
  submitForm,
  testHotelData,
  superAdminCredentials
};

console.log('🎯 Hotel creation test utilities loaded!');
console.log('Available functions:');
console.log('- hotelTestUtils.testHotelCreationFromBrowser() - Test using Redux store');
console.log('- hotelTestUtils.testHotelCreationWithAPI() - Test using direct API calls');
console.log('- hotelTestUtils.simulateFormSubmission() - Fill form fields automatically');
console.log('- hotelTestUtils.submitForm() - Submit the form programmatically');
