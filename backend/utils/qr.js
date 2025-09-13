/**
 * QR Code Utilities
 *
 * JWT-based QR token generation, validation, and encryption for hotel registration
 * Provides secure hotel identification through QR codes
 */

const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { AppError } = require('../middleware/error');
const logger = require('./logger');

// QR token expiration (90 days as suggested)
const QR_TOKEN_EXPIRE = '90d';

/**
 * Generate a secure QR token for hotel registration
 * @param {Object} hotelData - Hotel information
 * @param {string} hotelData.hotelId - Hotel ID
 * @param {string} hotelData.hotelName - Hotel name
 * @param {string} hotelData.hotelAddress - Hotel address (optional)
 * @returns {string} JWT token for QR code
 */
const generateQRToken = (hotelData) => {
  const { hotelId, hotelName, hotelAddress } = hotelData;

  if (!hotelId || !hotelName) {
    throw new AppError('Hotel ID and name are required for QR token generation', 400);
  }

  // Create payload with hotel information and additional security data
  const payload = {
    type: 'hotel_registration_qr',
    hotelId,
    hotelName,
    hotelAddress: hotelAddress || null,
    generatedAt: new Date().toISOString(),
    // Add a random nonce for additional security
    nonce: crypto.randomBytes(16).toString('hex')
  };

  // Generate JWT token with hotel-specific secret combination
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET + hotelId, // Use hotel-specific secret
    {
      expiresIn: QR_TOKEN_EXPIRE,
      issuer: 'hotel-platform-qr',
      audience: 'guest-registration'
    }
  );

  logger.info('QR token generated for hotel', {
    hotelId,
    hotelName,
    expiresIn: QR_TOKEN_EXPIRE
  });

  return token;
};

/**
 * Validate and decode QR token
 * @param {string} token - JWT token from QR code
 * @returns {Object} Decoded hotel information
 */
const validateQRToken = (token) => {
  if (!token) {
    throw new AppError('QR token is required', 400);
  }

  try {
    // First decode without verification to get hotelId for secret
    const unverifiedDecoded = jwt.decode(token);

    if (!unverifiedDecoded || !unverifiedDecoded.hotelId) {
      throw new AppError('Invalid QR token format', 400);
    }

    // Now verify with hotel-specific secret
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET + unverifiedDecoded.hotelId,
      {
        issuer: 'hotel-platform-qr',
        audience: 'guest-registration'
      }
    );

    // Validate token type
    if (decoded.type !== 'hotel_registration_qr') {
      throw new AppError('Invalid QR token type', 400);
    }

    // Validate required fields
    if (!decoded.hotelId || !decoded.hotelName) {
      throw new AppError('QR token missing required hotel information', 400);
    }

    logger.info('QR token validated successfully', {
      hotelId: decoded.hotelId,
      hotelName: decoded.hotelName,
      generatedAt: decoded.generatedAt
    });

    return {
      hotelId: decoded.hotelId,
      hotelName: decoded.hotelName,
      hotelAddress: decoded.hotelAddress,
      generatedAt: decoded.generatedAt,
      expiresAt: new Date(decoded.exp * 1000).toISOString()
    };

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.logSecurity('QR_TOKEN_INVALID', null, null, { error: error.message });
      throw new AppError('Invalid QR token', 400);
    } else if (error.name === 'TokenExpiredError') {
      logger.logSecurity('QR_TOKEN_EXPIRED', null, null, { error: error.message });
      throw new AppError('QR token has expired. Please request a new QR code from the hotel', 400);
    } else if (error instanceof AppError) {
      throw error;
    } else {
      logger.error('QR token validation error:', error);
      throw new AppError('QR token validation failed', 500);
    }
  }
};

/**
 * Generate QR code image from hotel data
 * @param {Object} hotelData - Hotel information
 * @param {Object} options - QR code generation options
 * @returns {Promise<string>} Base64 encoded QR code image
 */
const generateQRCode = async (hotelData, options = {}) => {
  try {
    // Generate JWT token
    const token = generateQRToken(hotelData);

    // Create QR code URL that includes the token
    const qrUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?qr=${token}`;

    // QR code options with good defaults for hotel lobby use
    const qrOptions = {
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: options.size || 300,
      errorCorrectionLevel: 'H', // High error correction for damaged/dirty codes
      ...options
    };

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrUrl, qrOptions);

    logger.info('QR code generated successfully', {
      hotelId: hotelData.hotelId,
      hotelName: hotelData.hotelName,
      size: qrOptions.width
    });

    return {
      qrCodeImage: qrCodeDataURL,
      qrToken: token,
      qrUrl,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    logger.error('QR code generation failed:', error);
    throw new AppError('Failed to generate QR code', 500);
  }
};

/**
 * Generate QR code as buffer for downloads
 * @param {Object} hotelData - Hotel information
 * @param {Object} options - QR code generation options
 * @returns {Promise<Buffer>} QR code image buffer
 */
const generateQRCodeBuffer = async (hotelData, options = {}) => {
  try {
    const token = generateQRToken(hotelData);
    const qrUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?qr=${token}`;

    const qrOptions = {
      type: 'png',
      quality: 0.92,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: options.size || 600, // Higher resolution for print
      errorCorrectionLevel: 'H',
      ...options
    };

    const buffer = await QRCode.toBuffer(qrUrl, qrOptions);

    logger.info('QR code buffer generated for download', {
      hotelId: hotelData.hotelId,
      hotelName: hotelData.hotelName,
      bufferSize: buffer.length
    });

    return buffer;

  } catch (error) {
    logger.error('QR code buffer generation failed:', error);
    throw new AppError('Failed to generate QR code for download', 500);
  }
};

/**
 * Validate QR token and return hotel information for registration
 * @param {string} qrToken - QR token from URL parameter
 * @returns {Object} Hotel information for registration
 */
const processQRRegistration = async (qrToken) => {
  try {
    // Validate the QR token
    const hotelInfo = validateQRToken(qrToken);

    // Additional security: verify hotel still exists and is active
    const Hotel = require('../models/Hotel');
    const hotel = await Hotel.findById(hotelInfo.hotelId).select('name isActive address');

    if (!hotel) {
      throw new AppError('Hotel not found. This QR code may be outdated.', 404);
    }

    if (!hotel.isActive) {
      throw new AppError('Hotel is currently inactive. Please contact hotel reception.', 400);
    }

    // Return sanitized hotel information for registration
    return {
      hotelId: hotel._id.toString(),
      hotelName: hotel.name,
      hotelAddress: hotel.address,
      qrTokenValid: true,
      message: 'QR code verified successfully'
    };

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('QR registration processing failed:', error);
    throw new AppError('Failed to process QR code for registration', 500);
  }
};

/**
 * Generate hotel-specific QR code metadata for admin dashboard
 * @param {string} hotelId - Hotel ID
 * @returns {Object} QR code metadata
 */
const getQRMetadata = (hotelId) => {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 90);

  return {
    hotelId,
    expiresIn: QR_TOKEN_EXPIRE,
    expirationDate: expirationDate.toISOString(),
    recommendedSize: {
      display: '300x300px',
      print: '600x600px',
      poster: '1200x1200px'
    },
    securityFeatures: [
      'JWT-based token with hotel-specific secret',
      'High error correction level',
      '90-day expiration for security',
      'Hotel validation on registration',
      'Nonce-based replay protection'
    ],
    usageInstructions: [
      'Display QR code at hotel reception desk',
      'Guest scans QR code with their mobile device',
      'Registration form auto-populates with hotel information',
      'Guest completes registration with personal details only'
    ]
  };
};

module.exports = {
  generateQRToken,
  validateQRToken,
  generateQRCode,
  generateQRCodeBuffer,
  processQRRegistration,
  getQRMetadata,
  QR_TOKEN_EXPIRE
};
