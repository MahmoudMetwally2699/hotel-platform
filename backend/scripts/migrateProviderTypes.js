/**
 * Data Migration Script: Add Provider Type to Existing Service Providers
 *
 * This script updates all existing service providers in the database to include
 * the new providerType field. All existing providers are set to 'internal' by default
 * since most hotels manage their services in-house (laundry, housekeeping, dining, etc.).
 *
 * Usage:
 *   node scripts/migrateProviderTypes.js
 *
 * Features:
 * - Sets all existing providers to 'internal' type
 * - Sets markup to 0% for internal providers (as per business rules)
 * - Provides detailed logging
 * - Handles errors gracefully
 * - Supports rollback capability
 */

const mongoose = require('mongoose');
const ServiceProvider = require('../models/ServiceProvider');
const logger = require('../utils/logger');
const path = require('path');

// Load environment variables from backend directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ MongoDB Connected Successfully');
    logger.info('Migration script connected to database');
  } catch (error) {
    console.error('✗ MongoDB Connection Error:', error.message);
    logger.error('Database connection failed', { error: error.message });
    process.exit(1);
  }
};

// Backup current state before migration
const createBackup = async () => {
  try {
    const providers = await ServiceProvider.find({}).lean();
    const backupData = {
      timestamp: new Date().toISOString(),
      count: providers.length,
      providers: providers
    };

    // Store backup info in logger
    logger.info('Backup created before migration', {
      count: providers.length,
      timestamp: backupData.timestamp
    });

    console.log(`✓ Backup created: ${providers.length} service providers`);
    return backupData;
  } catch (error) {
    console.error('✗ Backup creation failed:', error.message);
    logger.error('Backup creation failed', { error: error.message });
    throw error;
  }
};

// Main migration function
const migrateProviderTypes = async () => {
  try {
    console.log('\n=== Service Provider Type Migration ===\n');

    // Find all service providers without providerType field
    const providersToUpdate = await ServiceProvider.find({
      $or: [
        { providerType: { $exists: false } },
        { providerType: null }
      ]
    });

    console.log(`Found ${providersToUpdate.length} service providers to migrate`);

    if (providersToUpdate.length === 0) {
      console.log('✓ No service providers need migration. All are up to date.');
      logger.info('No providers to migrate - all up to date');
      return {
        success: true,
        updated: 0,
        message: 'No providers needed migration'
      };
    }

    let updated = 0;
    let failed = 0;
    const errors = [];

    // Update each provider
    for (const provider of providersToUpdate) {
      try {
        // Set provider type to internal (default for existing providers)
        provider.providerType = 'internal';

        // Internal providers must have 0% markup
        // The pre-save middleware will enforce this, but we set it explicitly here
        if (!provider.markup) {
          provider.markup = {};
        }
        provider.markup.percentage = 0;
        provider.markup.setAt = new Date();
        provider.markup.notes = 'Migrated from legacy data';
        provider.markup.reason = 'Internal provider - No markup applied (all revenue goes to hotel)';

        // Save with validation disabled to handle legacy data with expired dates
        await provider.save({ validateBeforeSave: false });
        updated++;

        console.log(`  ✓ Updated: ${provider.businessName} (${provider._id}) -> Internal Provider`);

      } catch (error) {
        failed++;
        errors.push({
          providerId: provider._id,
          businessName: provider.businessName,
          error: error.message
        });

        console.error(`  ✗ Failed: ${provider.businessName} - ${error.message}`);
        logger.error('Provider migration failed', {
          providerId: provider._id,
          businessName: provider.businessName,
          error: error.message
        });
      }
    }

    // Log summary
    console.log('\n=== Migration Summary ===');
    console.log(`Total providers found: ${providersToUpdate.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Failed: ${failed}`);

    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(err => {
        console.log(`  - ${err.businessName}: ${err.error}`);
      });
    }

    logger.info('Provider type migration completed', {
      total: providersToUpdate.length,
      updated,
      failed,
      errors: errors.length > 0 ? errors : undefined
    });

    return {
      success: failed === 0,
      updated,
      failed,
      errors
    };

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    logger.error('Migration process failed', { error: error.message });
    throw error;
  }
};

// Rollback function (for emergencies)
const rollback = async (backupData) => {
  try {
    console.log('\n=== Rolling Back Migration ===\n');

    let restored = 0;
    let failed = 0;

    for (const providerData of backupData.providers) {
      try {
        await ServiceProvider.findByIdAndUpdate(
          providerData._id,
          { $unset: { providerType: "" } },
          { runValidators: false }
        );
        restored++;
        console.log(`  ✓ Rolled back: ${providerData.businessName}`);
      } catch (error) {
        failed++;
        console.error(`  ✗ Rollback failed: ${providerData.businessName} - ${error.message}`);
      }
    }

    console.log('\n=== Rollback Summary ===');
    console.log(`Total providers: ${backupData.providers.length}`);
    console.log(`Successfully rolled back: ${restored}`);
    console.log(`Failed: ${failed}`);

    logger.info('Rollback completed', { restored, failed });

  } catch (error) {
    console.error('✗ Rollback failed:', error.message);
    logger.error('Rollback process failed', { error: error.message });
    throw error;
  }
};

// Verify migration results
const verifyMigration = async () => {
  try {
    const totalProviders = await ServiceProvider.countDocuments({});
    const providersWithType = await ServiceProvider.countDocuments({
      providerType: { $exists: true, $ne: null }
    });
    const internalProviders = await ServiceProvider.countDocuments({
      providerType: 'internal'
    });
    const externalProviders = await ServiceProvider.countDocuments({
      providerType: 'external'
    });

    console.log('\n=== Verification Results ===');
    console.log(`Total service providers: ${totalProviders}`);
    console.log(`Providers with type field: ${providersWithType}`);
    console.log(`Internal providers: ${internalProviders}`);
    console.log(`External providers: ${externalProviders}`);
    console.log(`Providers missing type: ${totalProviders - providersWithType}`);

    const allMigrated = totalProviders === providersWithType;
    console.log(`\n${allMigrated ? '✓' : '✗'} Migration ${allMigrated ? 'successful' : 'incomplete'}`);

    logger.info('Migration verification completed', {
      total: totalProviders,
      withType: providersWithType,
      external: externalProviders,
      internal: internalProviders,
      complete: allMigrated
    });

    return allMigrated;

  } catch (error) {
    console.error('✗ Verification failed:', error.message);
    logger.error('Verification process failed', { error: error.message });
    throw error;
  }
};

// Main execution
const run = async () => {
  let backup = null;

  try {
    // Connect to database
    await connectDB();

    // Create backup
    backup = await createBackup();

    // Run migration
    const result = await migrateProviderTypes();

    // Verify results
    const verified = await verifyMigration();

    if (result.success && verified) {
      console.log('\n✓ Migration completed successfully!');
      logger.info('Migration process completed successfully');
    } else {
      console.log('\n⚠ Migration completed with warnings. Please review the logs.');
      logger.warn('Migration completed with warnings', { result });
    }

  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    console.error(error.stack);
    logger.error('Migration process encountered an error', {
      error: error.message,
      stack: error.stack
    });

    // Optionally uncomment to enable automatic rollback on failure
    // if (backup) {
    //   console.log('\nAttempting rollback...');
    //   await rollback(backup);
    // }

    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
};

// Execute if run directly
if (require.main === module) {
  run();
}

module.exports = {
  migrateProviderTypes,
  rollback,
  verifyMigration
};
