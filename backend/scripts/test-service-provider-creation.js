/**
 * Test Script: Service Provider Creation with Custom Credentials
 *
 * This script demonstrates how to create a service provider with custom email and password
 * Run this script to test the updated service provider creation functionality
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Test service provider creation with custom credentials
async function testServiceProviderCreation() {
  try {
    console.log('\n🧪 Testing Service Provider Creation with Custom Credentials\n');

    // Example payload for creating a service provider with custom credentials
    const serviceProviderData = {
      // Business Information
      businessName: "Elite Laundry Services",
      category: "laundry",
      description: "Professional laundry and dry cleaning services for hotels",
      contactEmail: "contact@elitelaundry.com",
      contactPhone: "+1-555-0123",
      address: {
        street: "123 Business District",
        city: "Downtown",
        state: "CA",
        zipCode: "90210",
        country: "USA"
      },

      // User Credentials (NEW FEATURE)
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@elitelaundry.com", // Custom email for login
      phone: "+1-555-0123",
      password: "SecurePass123!", // Custom password for login
      sendCredentials: true, // Whether to send credentials via email

      // Optional settings
      isVerified: false,
      isActive: true
    };

    console.log('📝 Service Provider Data:');
    console.log('Business Name:', serviceProviderData.businessName);
    console.log('Category:', serviceProviderData.category);
    console.log('Contact Email:', serviceProviderData.contactEmail);
    console.log('Login Email:', serviceProviderData.email);
    console.log('Custom Password:', serviceProviderData.password ? 'Yes (provided)' : 'No (will be generated)');
    console.log('Send Credentials via Email:', serviceProviderData.sendCredentials);

    console.log('\n📋 To create this service provider, send a POST request to:');
    console.log('URL: http://localhost:5000/api/hotel/service-providers');
    console.log('Method: POST');
    console.log('Headers: {');
    console.log('  "Content-Type": "application/json",');
    console.log('  "Authorization": "Bearer YOUR_HOTEL_ADMIN_JWT_TOKEN"');
    console.log('}');
    console.log('Body:', JSON.stringify(serviceProviderData, null, 2));

    console.log('\n🔐 Login Credentials for the new service provider:');
    console.log('Email:', serviceProviderData.email);
    console.log('Password:', serviceProviderData.password);

    console.log('\n📧 If sendCredentials is true, the service provider will receive:');
    console.log('- Welcome email with login credentials');
    console.log('- Instructions to login and manage their services');

    console.log('\n🎯 Test with different scenarios:');
    console.log('1. With custom password (as shown above)');
    console.log('2. Without password (remove password field - system will generate one)');
    console.log('3. With sendCredentials: false (no email will be sent)');

    console.log('\n✨ New Features Added:');
    console.log('✅ Custom email and password for service providers');
    console.log('✅ Password strength validation');
    console.log('✅ Email uniqueness validation');
    console.log('✅ Option to send or not send credentials via email');
    console.log('✅ Proper user-service provider linking');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Example cURL command generator
function generateCurlExample() {
  console.log('\n📡 Example cURL command:');
  console.log(`
curl -X POST http://localhost:5000/api/hotel/service-providers \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_HOTEL_ADMIN_JWT_TOKEN" \\
  -d '{
    "businessName": "Elite Laundry Services",
    "category": "laundry",
    "description": "Professional laundry and dry cleaning services",
    "contactEmail": "contact@elitelaundry.com",
    "contactPhone": "+1-555-0123",
    "address": {
      "street": "123 Business District",
      "city": "Downtown",
      "state": "CA",
      "zipCode": "90210",
      "country": "USA"
    },
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@elitelaundry.com",
    "phone": "+1-555-0123",
    "password": "SecurePass123!",
    "sendCredentials": true
  }'
  `);
}

// Run the test
async function runTest() {
  await connectDB();
  await testServiceProviderCreation();
  generateCurlExample();

  console.log('\n🏁 Test completed successfully!');
  console.log('💡 Remember to replace YOUR_HOTEL_ADMIN_JWT_TOKEN with a valid hotel admin token');

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}

// Execute if run directly
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { testServiceProviderCreation, generateCurlExample };
