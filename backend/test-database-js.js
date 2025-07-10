/**
 * Test Database Connection exactly like database.js does
 */
require('dotenv').config();

async function testDatabaseJs() {
  try {
    console.log('🗄️ Testing database.js connection...');

    const mongoose = require('mongoose');
    const logger = require('./utils/logger');

    console.log('Dependencies loaded, starting connection...');
      // MongoDB connection options (exactly like database.js)
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    // Determine which database URI to use
    const mongoURI = process.env.NODE_ENV === 'test'
      ? process.env.MONGODB_TEST_URI
      : process.env.MONGODB_URI;

    console.log('MongoDB URI exists:', !!mongoURI);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    console.log('Attempting connection...');
    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name}`);

    console.log('✅ Connection successful!');

    await mongoose.connection.close();
    console.log('Connection closed');
    process.exit(0);

  } catch (error) {
    console.error('💥 Connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

testDatabaseJs();
