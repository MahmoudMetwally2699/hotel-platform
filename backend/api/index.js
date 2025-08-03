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
const rateLimit = require('express-rate-limit');
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
      family: 4,
      bufferCommands: false,
      bufferMaxEntries: 0,
    };

    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined');
    }

    await mongoose.connect(mongoURI, options);
    isConnected = true;
    console.log('Connected to MongoDB for serverless function');
  } catch (error) {
    console.error('Database connection error:', error);
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
      
      if (cleanOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        // For debugging, temporarily allow all origins
        callback(null, true);
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  };
  app.use(cors(corsOptions));

  // Rate limiting (reduced for serverless)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      error: 'Too many requests from this IP, please try again later'
    }
  });
  app.use('/api/', limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(compression());

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: 'vercel'
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
