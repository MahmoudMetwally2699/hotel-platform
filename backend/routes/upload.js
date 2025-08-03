const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, restrictTo } = require('../middleware/auth');
const logger = require('../utils/logger');

// Check if running in serverless environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;

// Ensure upload directories exist (only in non-serverless environments)
if (!isServerless) {
  const uploadDirs = ['hotels', 'services', 'profiles', 'documents'];
  uploadDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', 'uploads', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

// Configure multer for different file types
let storage;

if (isServerless) {
  // For serverless environments, disable file uploads or use memory storage
  storage = multer.memoryStorage();
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadPath = 'uploads/';

      // Determine upload path based on file purpose
      if (req.params.type === 'hotel') {
        uploadPath += 'hotels/';
      } else if (req.params.type === 'service') {
        uploadPath += 'services/';
      } else if (req.params.type === 'profile') {
        uploadPath += 'profiles/';
      } else if (req.params.type === 'document') {
        uploadPath += 'documents/';
      } else {
        uploadPath += 'misc/';
      }

      const fullPath = path.join(__dirname, '..', uploadPath);

      // Ensure directory exists
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }

      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = file.fieldname + '-' + uniqueSuffix + ext;
      cb(null, name);
    }
  });
}

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  if (req.params.type === 'document') {
    // Allow documents for business registration, licenses, etc.
    if (allowedDocTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOC files are allowed for documents'), false);
    }
  } else {
    // Allow images for hotels, services, profiles
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files per request
  },
  fileFilter: fileFilter
});

/**
 * @desc    Upload single file
 * @route   POST /api/upload/single/:type
 * @access  Private
 */
router.post('/single/:type', protect, (req, res, next) => {
  // For serverless environments, return a message about file upload limitations
  if (isServerless) {
    return res.status(501).json({
      success: false,
      message: 'File uploads are not supported in serverless deployment. Please use a cloud storage service like AWS S3 or Cloudinary.',
      suggestion: 'Consider implementing cloud storage integration for production use.'
    });
  }

  // Continue with normal file upload for non-serverless environments
  next();
}, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Apply role-based permissions
    if (req.params.type === 'hotel' && req.user.role !== 'superadmin' && req.user.role !== 'hotel') {
      if (req.file.path) fs.unlinkSync(req.file.path); // Delete the uploaded file
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to upload hotel files'
      });
    }

    if (req.params.type === 'service' && req.user.role !== 'hotel' && req.user.role !== 'service') {
      if (req.file.path) fs.unlinkSync(req.file.path); // Delete the uploaded file
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to upload service files'
      });
    }

    const fileUrl = `/uploads/${req.params.type}/${req.file.filename}`;

    logger.info(`File uploaded: ${fileUrl}`, {
      userId: req.user.id,
      role: req.user.role,
      fileType: req.params.type,
      fileSize: req.file.size
    });

    res.status(200).json({
      success: true,
      file: {
        filename: req.file.filename,
        url: fileUrl,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    logger.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file'
    });
  }
});

/**
 * @desc    Upload multiple files
 * @route   POST /api/upload/multiple/:type
 * @access  Private
 */
router.post('/multiple/:type', protect, (req, res, next) => {
  // For serverless environments, return a message about file upload limitations
  if (isServerless) {
    return res.status(501).json({
      success: false,
      message: 'File uploads are not supported in serverless deployment. Please use a cloud storage service like AWS S3 or Cloudinary.',
      suggestion: 'Consider implementing cloud storage integration for production use.'
    });
  }

  // Continue with normal file upload for non-serverless environments
  next();
}, upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Apply role-based permissions
    if (req.params.type === 'hotel' && req.user.role !== 'superadmin' && req.user.role !== 'hotel') {
      req.files.forEach(file => fs.unlinkSync(file.path)); // Delete all uploaded files
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to upload hotel files'
      });
    }

    if (req.params.type === 'service' && req.user.role !== 'hotel' && req.user.role !== 'service') {
      req.files.forEach(file => fs.unlinkSync(file.path)); // Delete all uploaded files
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to upload service files'
      });
    }

    const uploadedFiles = req.files.map(file => {
      return {
        filename: file.filename,
        url: `/uploads/${req.params.type}/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size
      };
    });

    logger.info(`Multiple files uploaded: ${req.files.length} files`, {
      userId: req.user.id,
      role: req.user.role,
      fileType: req.params.type
    });

    res.status(200).json({
      success: true,
      files: uploadedFiles
    });
  } catch (error) {
    logger.error('Multiple file upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading files'
    });
  }
});

/**
 * @desc    Delete file
 * @route   DELETE /api/upload/:type/:filename
 * @access  Private
 */
router.delete('/:type/:filename', protect, (req, res) => {
  try {
    // For serverless environments, return a message about file operations limitations
    if (isServerless) {
      return res.status(501).json({
        success: false,
        message: 'File operations are not supported in serverless deployment. Please use a cloud storage service like AWS S3 or Cloudinary.',
        suggestion: 'Consider implementing cloud storage integration for production use.'
      });
    }

    const filePath = path.join(__dirname, '..', 'uploads', req.params.type, req.params.filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Apply role-based permissions
    if (req.params.type === 'hotel' && req.user.role !== 'superadmin' && req.user.role !== 'hotel') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete hotel files'
      });
    }

    if (req.params.type === 'service' && req.user.role !== 'hotel' && req.user.role !== 'service') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete service files'
      });
    }

    if (req.params.type === 'profile' && req.user.role === 'guest') {
      // For guest users, only allow them to delete their own profile pictures
      // Implement additional checks if needed
    }

    // Delete file
    fs.unlinkSync(filePath);

    logger.info(`File deleted: ${req.params.filename}`, {
      userId: req.user.id,
      role: req.user.role,
      fileType: req.params.type
    });

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file'
    });
  }
});

module.exports = router;
