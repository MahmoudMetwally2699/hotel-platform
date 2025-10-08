/**
 * Minimal Server Test - Step by step debugging
 */
require('dotenv').config();

async function startServer() {
  try {
  // Starting minimal server (output removed)

  // Step 1: Load basic dependencies
  // Loading basic dependencies (output removed)
  const express = require('express');
  const app = express();
  // Express loaded (output removed)

  // Step 2: Basic middleware
  // Setting up basic middleware (output removed)
  app.use(express.json());
  // JSON middleware added (output removed)

    // Step 3: Test route
    app.get('/health', (req, res) => {
      res.json({ status: 'OK', message: 'Server is running' });
    });
    // Health route added (output removed)
    // Step 4: Database connection
    // Connecting to database (output removed)
    const { connectDB } = require('./config/database');
    await connectDB();
    // Database connected (output removed)

    // Step 5: Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      // Server is running and health check (output removed)
    });

  } catch (error) {
    // Server startup failed (output removed)
    process.exit(1);
  }
}

startServer();
