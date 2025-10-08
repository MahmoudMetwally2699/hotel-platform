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
  // ...existing code...
      return;
    }

    await mongoose.connect(mongoURI);
  // ...existing code...

    // Get the users collection
    const usersCollection = mongoose.connection.db.collection('users');

    // Drop the existing unique email index
    try {
      await usersCollection.dropIndex('email_1');
  // ...existing code...
    } catch (error) {
      if (error.code === 27) {
  // ...existing code...
      } else {
  // ...existing code...
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
  // ...existing code...

    // Also ensure global email uniqueness for non-guest roles (admins, service providers)
    await usersCollection.createIndex(
      { email: 1 },
      {
        unique: true,
        partialFilterExpression: { role: { $ne: 'guest' } },
        name: 'email_non_guest_unique'
      }
    );
  // ...existing code...

    // List current indexes to verify
    const indexes = await usersCollection.indexes();
  // ...existing code...
    // ...existing code...

  // ...existing code...

  } catch (error) {
  } finally {
    await mongoose.disconnect();
  // ...existing code...
  }
}

// Run the script
fixEmailIndex();
