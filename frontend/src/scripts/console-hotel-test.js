/**
 * Simple Hotel Creation Test Script
 * Run this in the browser console when on the Super Admin Hotels page
 */

// Test hotel data
const testHotelData = {
  name: 'Console Test Hotel',
  description: 'A test hotel created from browser console',
  contactEmail: 'test@consolehotel.com',
  contactPhone: '+1-555-123-4567',
  address: {
    street: '456 Console Street',
    city: 'Browser City',
    state: 'JS State',
    country: 'Web Country',
    zipCode: '54321'
  },
  facilities: ['WiFi', 'Pool', 'Restaurant'],
  isActive: true,
  isPublished: true,
  adminData: {
    firstName: 'Console',
    lastName: 'Admin',
    email: 'console.admin@testhotel.com',
    phone: '+1-555-123-4568',
    password: 'consoleadmin123',
    confirmPassword: 'consoleadmin123'
  }
};

// Function to create hotel via console
async function createHotelFromConsole() {
  try {
    console.log('🚀 Starting hotel creation from console...');

    // Check if we're on the right page and have access to Redux store
    if (typeof window.store === 'undefined') {
      console.error('❌ Redux store not found. Make sure you are on the Super Admin page.');
      return;
    }

    // Get current auth state
    const state = window.store.getState();
    const isAuthenticated = state.auth.isAuthenticated;
    const userRole = state.auth.user?.role;

    console.log('Current auth state:', { isAuthenticated, userRole });

    if (!isAuthenticated) {
      console.error('❌ Not authenticated. Please login first.');
      return;
    }

    if (userRole !== 'superadmin') {
      console.error('❌ Not authorized. Super admin access required.');
      return;
    }

    // Import createHotel action
    const { createHotel } = await import('../redux/slices/hotelSlice');

    console.log('📝 Dispatching hotel creation action...');
    console.log('Hotel data:', testHotelData);

    const result = await window.store.dispatch(createHotel(testHotelData));

    if (result.type === 'hotel/createHotel/fulfilled') {
      console.log('✅ Hotel created successfully!');
      console.log('Created hotel:', result.payload);
    } else {
      console.error('❌ Hotel creation failed:', result.payload);
    }

  } catch (error) {
    console.error('❌ Error creating hotel:', error);
  }
}

// Function to fill form automatically
function fillHotelForm() {
  try {
    console.log('📝 Filling hotel creation form...');

    // Basic hotel info
    const nameInput = document.querySelector('input[name="name"]');
    const descriptionInput = document.querySelector('textarea[name="description"]');
    const contactEmailInput = document.querySelector('input[name="contactEmail"]');
    const contactPhoneInput = document.querySelector('input[name="contactPhone"]');

    // Address fields
    const streetInput = document.querySelector('input[name="address.street"]');
    const cityInput = document.querySelector('input[name="address.city"]');
    const stateInput = document.querySelector('input[name="address.state"]');
    const countryInput = document.querySelector('input[name="address.country"]');
    const zipCodeInput = document.querySelector('input[name="address.zipCode"]');

    // Admin fields
    const adminFirstNameInput = document.querySelector('input[name="adminData.firstName"]');
    const adminLastNameInput = document.querySelector('input[name="adminData.lastName"]');
    const adminEmailInput = document.querySelector('input[name="adminData.email"]');
    const adminPhoneInput = document.querySelector('input[name="adminData.phone"]');
    const adminPasswordInput = document.querySelector('input[name="adminData.password"]');
    const adminConfirmPasswordInput = document.querySelector('input[name="adminData.confirmPassword"]');

    // Fill basic info
    if (nameInput) nameInput.value = testHotelData.name;
    if (descriptionInput) descriptionInput.value = testHotelData.description;
    if (contactEmailInput) contactEmailInput.value = testHotelData.contactEmail;
    if (contactPhoneInput) contactPhoneInput.value = testHotelData.contactPhone;

    // Fill address
    if (streetInput) streetInput.value = testHotelData.address.street;
    if (cityInput) cityInput.value = testHotelData.address.city;
    if (stateInput) stateInput.value = testHotelData.address.state;
    if (countryInput) countryInput.value = testHotelData.address.country;
    if (zipCodeInput) zipCodeInput.value = testHotelData.address.zipCode;

    // Fill admin data
    if (adminFirstNameInput) adminFirstNameInput.value = testHotelData.adminData.firstName;
    if (adminLastNameInput) adminLastNameInput.value = testHotelData.adminData.lastName;
    if (adminEmailInput) adminEmailInput.value = testHotelData.adminData.email;
    if (adminPhoneInput) adminPhoneInput.value = testHotelData.adminData.phone;
    if (adminPasswordInput) adminPasswordInput.value = testHotelData.adminData.password;
    if (adminConfirmPasswordInput) adminConfirmPasswordInput.value = testHotelData.adminData.confirmPassword;

    // Trigger change events
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    console.log('✅ Form filled successfully!');
    console.log('You can now click the "Create Hotel" button or run submitHotelForm()');

  } catch (error) {
    console.error('❌ Error filling form:', error);
  }
}

// Function to submit form programmatically
function submitHotelForm() {
  try {
    console.log('📤 Submitting hotel creation form...');

    const form = document.querySelector('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
      console.log('✅ Form submitted!');
    } else {
      console.error('❌ Form not found');
    }

  } catch (error) {
    console.error('❌ Error submitting form:', error);
  }
}

// Function to open create hotel modal
function openCreateHotelModal() {
  try {
    console.log('🔓 Opening create hotel modal...');

    const createButton = document.querySelector('button:contains("Create Hotel")') ||
                        document.querySelector('button[contains(text(), "Create Hotel")]') ||
                        document.querySelector('.bg-blue-600');

    if (createButton) {
      createButton.click();
      console.log('✅ Create hotel modal opened!');
      setTimeout(() => {
        console.log('You can now run fillHotelForm() to populate the form');
      }, 500);
    } else {
      console.error('❌ Create hotel button not found');
    }

  } catch (error) {
    console.error('❌ Error opening modal:', error);
  }
}

// Make functions available globally
window.hotelTest = {
  createHotelFromConsole,
  fillHotelForm,
  submitHotelForm,
  openCreateHotelModal,
  testHotelData
};

console.log('🎯 Hotel creation test functions loaded!');
console.log('Available functions:');
console.log('- hotelTest.openCreateHotelModal() - Opens the create hotel modal');
console.log('- hotelTest.fillHotelForm() - Fills the form with test data');
console.log('- hotelTest.submitHotelForm() - Submits the form');
console.log('- hotelTest.createHotelFromConsole() - Creates hotel directly via Redux');
console.log('- hotelTest.testHotelData - Test data object');
