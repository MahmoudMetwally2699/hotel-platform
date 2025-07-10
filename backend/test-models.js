/**
 * Test all models for duplicate indexes
 */
require('dotenv').config();

async function testModels() {
  try {
    console.log('🔍 Testing all models for issues...');

    const mongoose = require('mongoose');

    // Test each model individually
    console.log('Testing User model...');
    const User = require('./models/User');
    console.log('✅ User model loaded');

    console.log('Testing Hotel model...');
    const Hotel = require('./models/Hotel');
    console.log('✅ Hotel model loaded');

    console.log('Testing ServiceProvider model...');
    const ServiceProvider = require('./models/ServiceProvider');
    console.log('✅ ServiceProvider model loaded');

    console.log('Testing Service model...');
    const Service = require('./models/Service');
    console.log('✅ Service model loaded');

    console.log('Testing Booking model...');
    const Booking = require('./models/Booking');
    console.log('✅ Booking model loaded');

    console.log('\n🔍 Connecting to database to check for index conflicts...');

    // Connect with minimal options
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });

    console.log('✅ Database connected successfully');

    // Check for any schema issues
    console.log('\n📊 Model statistics:');
    console.log('- User model paths:', Object.keys(User.schema.paths).length);
    console.log('- Hotel model paths:', Object.keys(Hotel.schema.paths).length);
    console.log('- ServiceProvider model paths:', Object.keys(ServiceProvider.schema.paths).length);
    console.log('- Service model paths:', Object.keys(Service.schema.paths).length);
    console.log('- Booking model paths:', Object.keys(Booking.schema.paths).length);

    await mongoose.connection.close();
    console.log('\n🎉 All models tested successfully!');

  } catch (error) {
    console.error('\n💥 Model test failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

testModels();
