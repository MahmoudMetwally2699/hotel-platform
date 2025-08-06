/**
 * Vercel Serverless Entry Point
 *
 * This file provides a serverless-compatible version of the Express app
 * for deployment on Vercel. It imports the main server logic but exports
 * it as a function rather than starting a server.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// Import middleware and utilities with correct paths
const { globalErrorHandler } = require('../middleware/error');

// Connect to database
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    const mongoose = require('mongoose');

    // Serverless-optimized options
    const options = {
      maxPoolSize: 1, // Single connection for serverless
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      family: 4, // Use IPv4, skip trying IPv6
    };

    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoURI, options);
    isConnected = true;
    console.log('Successfully connected to MongoDB for serverless function');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

  } catch (error) {
    console.error('Database connection error:', error);
    isConnected = false;
    throw error;
  }
};

let app;

function createApp() {
  if (app) return app;

  app = express();

  // Trust proxy (important for Vercel)
  app.set('trust proxy', 1);

  // Basic middleware
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));  // CORS configuration for Vercel
  console.log('Environment check:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);

  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'https://hotel-platform-teud.vercel.app'
      ];

      // Trim whitespace and trailing slashes from origins
      const cleanOrigins = allowedOrigins.map(origin => origin.trim().replace(/\/$/, ''));

      console.log('CORS check - Origin:', origin);
      console.log('CORS check - Allowed origins:', cleanOrigins);

      // For now, allow all origins to debug
      console.log('CORS: Allowing all origins for debugging');
      callback(null, true);

      // Uncomment below when environment variables are properly set
      // if (cleanOrigins.includes(origin)) {
      //   callback(null, true);
      // } else {
      //   console.log('CORS blocked origin:', origin);
      //   callback(new Error('Not allowed by CORS'));
      // }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  };
  app.use(cors(corsOptions));

  // Additional explicit CORS headers as fallback
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://hotel-platform-teud.vercel.app');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  // Rate limiting disabled for serverless
  console.log('Rate limiting disabled');

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(compression());
  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: 'vercel',
      origin: req.headers.origin,
      allowedOrigins: process.env.ALLOWED_ORIGINS
    });
  });

  // CORS test endpoint
  app.get('/test-cors', (req, res) => {
    res.status(200).json({
      message: 'CORS test successful',
      origin: req.headers.origin,
      timestamp: new Date().toISOString()
    });
  });
  // API Routes
  try {
    app.use('/api/auth', require('../routes/auth'));
    app.use('/api/superadmin', require('../routes/superadmin'));
    app.use('/api/hotel', require('../routes/hotel'));
    app.use('/api/service', require('../routes/service'));
    app.use('/api/client', require('../routes/client'));
    app.use('/api/payments', require('../routes/payments'));
  } catch (error) {
    console.error('Error loading routes:', error);
  }

  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  });

  // Global error handler
  app.use(globalErrorHandler);

  return app;
}

// Export for Vercel
module.exports = async (req, res) => {
  try {
    await connectToDatabase();
    const app = createApp();
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Also export the app for local testing
module.exports.app = createApp;
