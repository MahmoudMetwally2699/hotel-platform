/**
 * Fix Email Index Script
 *
 * This script removes the global unique email index and creates a hotel-scoped email index
 * to support the same email across different hotels while preventing duplicates within the same hotel
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixEmailIndex() {
  try {
    // Connect to MongoDB using the correct environment variable
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

    if (!mongoURI) {
      console.error('❌ MongoDB URI not found in environment variables');
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO') || k.includes('DB')));
      return;
    }

    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get the users collection
    const usersCollection = mongoose.connection.db.collection('users');

    // Drop the existing unique email index
    try {
      await usersCollection.dropIndex('email_1');
      console.log('✅ Dropped existing email_1 unique index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  email_1 index doesn\'t exist, skipping drop');
      } else {
        console.log('⚠️  Error dropping index:', error.message);
      }
    }

    // Create the new compound unique index for hotel-scoped emails
    await usersCollection.createIndex(
      { email: 1, selectedHotelId: 1 },
      {
        unique: true,
        partialFilterExpression: { role: 'guest' },
        name: 'email_selectedHotelId_guest_unique'
      }
    );
    console.log('✅ Created new compound unique index: email + selectedHotelId for guests');

    // Also ensure global email uniqueness for non-guest roles (admins, service providers)
    await usersCollection.createIndex(
      { email: 1 },
      {
        unique: true,
        partialFilterExpression: { role: { $ne: 'guest' } },
        name: 'email_non_guest_unique'
      }
    );
    console.log('✅ Created global email unique index for non-guest roles');

    // List current indexes to verify
    const indexes = await usersCollection.indexes();
    console.log('\n📋 Current indexes on users collection:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      if (index.unique) {
        console.log(`    └─ Unique: ${index.unique}`);
      }
      if (index.partialFilterExpression) {
        console.log(`    └─ Partial filter: ${JSON.stringify(index.partialFilterExpression)}`);
      }
    });

    console.log('\n🎉 Email index fix completed successfully!');
    console.log('✅ Same email can now be used across different hotels');
    console.log('✅ Duplicate emails within same hotel are still prevented');
    console.log('✅ Global email uniqueness maintained for admins/service providers');

  } catch (error) {
    console.error('❌ Error fixing email index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the script
fixEmailIndex();
