/**
 * Database Configuration
 *
 * MongoDB connection setup with Mongoose ODM
 * Includes connection options, error handling, and environment-specific configurations
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Fix LoyaltyProgram indexes to allow multiple programs per hotel (one per channel)
 */
const fixLoyaltyProgramIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('loyaltyprograms');

    // Get current indexes
    const indexes = await collection.indexes();

    // Find the problematic index (hotel_1 without channel)
    const problematicIndex = indexes.find(
      idx => idx.name === 'hotel_1' && idx.key.hotel === 1 && !idx.key.channel
    );

    if (problematicIndex) {
      logger.info('Dropping old loyalty program index: hotel_1');
      await collection.dropIndex('hotel_1');
      logger.info('✓ Old index dropped successfully');
    }

    // Ensure compound index exists
    const compoundIndex = indexes.find(
      idx => idx.key.hotel === 1 && idx.key.channel === 1
    );

    if (!compoundIndex) {
      logger.info('Creating compound index { hotel: 1, channel: 1 }');
      await collection.createIndex({ hotel: 1, channel: 1 }, { unique: true });
      logger.info('✓ Compound index created successfully');
    }
  } catch (error) {
    // Don't fail server startup if index fix fails
    logger.warn(`Could not fix loyalty program indexes: ${error.message}`);
  }
};

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {    // MongoDB connection options
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    // Determine which database URI to use
    const mongoURI = process.env.NODE_ENV === 'test'
      ? process.env.MONGODB_TEST_URI
      : process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name}`);

    // Fix loyalty program indexes automatically
    await fixLoyaltyProgramIndexes();

    // Handle connection events
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`Mongoose connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('Mongoose connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error(`Error closing mongoose connection: ${error.message}`);
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);

    // Exit process with failure if in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }

    throw error;
  }
};

/**
 * Disconnect from MongoDB
 * Useful for testing and graceful shutdowns
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error(`Error disconnecting from MongoDB: ${error.message}`);
    throw error;
  }
};

/**
 * Clear all collections in the database
 * WARNING: Only use this for testing purposes
 * @returns {Promise<void>}
 */
const clearDatabase = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('clearDatabase can only be used in test environment');
  }

  try {
    const collections = await mongoose.connection.db.collections();

    for (const collection of collections) {
      await collection.deleteMany({});
    }

    logger.info('Database cleared for testing');
  } catch (error) {
    logger.error(`Error clearing database: ${error.message}`);
    throw error;
  }
};

/**
 * Check if database connection is ready
 * @returns {boolean}
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Get connection status
 * @returns {string}
 */
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  return states[mongoose.connection.readyState] || 'unknown';
};

module.exports = {
  connectDB,
  disconnectDB,
  clearDatabase,
  isConnected,
  getConnectionStatus
};
