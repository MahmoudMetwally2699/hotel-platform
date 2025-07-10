/**
 * Minimal Server Test - Step by step debugging
 */
require('dotenv').config();

async function startServer() {
  try {
    console.log('🚀 Starting minimal server...');

    // Step 1: Load basic dependencies
    console.log('📦 Loading basic dependencies...');
    const express = require('express');
    const app = express();
    console.log('✅ Express loaded');

    // Step 2: Basic middleware
    console.log('🔧 Setting up basic middleware...');
    app.use(express.json());
    console.log('✅ JSON middleware added');

    // Step 3: Test route
    app.get('/health', (req, res) => {
      res.json({ status: 'OK', message: 'Server is running' });
    });
    console.log('✅ Health route added');
      // Step 4: Database connection
    console.log('🗄️ Connecting to database...');
    const { connectDB } = require('./config/database');
    await connectDB();
    console.log('✅ Database connected');

    // Step 5: Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🎉 Server is running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error('💥 Server startup failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

startServer();
