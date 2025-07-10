/**
 * Email Utility
 *
 * NodeMailer configuration for sending automated emails
 * Includes templates for various email types and SMTP setup
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Create transporter based on environment
 * @returns {Object} Nodemailer transporter
 */
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production SMTP configuration
    return nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Development - use Ethereal Email for testing
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }
};

/**
 * Email templates
 */
const templates = {
  welcome: (data) => ({
    subject: `Welcome to ${data.hotelName} Services Platform!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome ${data.firstName}!</h2>
        <p>Thank you for registering with our hotel services platform. You're now able to book amazing services during your stay at <strong>${data.hotelName}</strong>.</p>
        <p>To get started, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verifyURL}"
             style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #7f8c8d;">${data.verifyURL}</p>
        <p>If you didn't create this account, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;">
        <p style="color: #7f8c8d; font-size: 12px;">This email was sent from the Hotel Services Platform. Please do not reply to this email.</p>
      </div>
    `
  }),

  'email-verification': (data) => ({
    subject: 'Please verify your email address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Email Verification Required</h2>
        <p>Hello ${data.firstName},</p>
        <p>Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verifyURL}"
             style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #7f8c8d;">${data.verifyURL}</p>
        <p>This verification link will expire in 24 hours.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;">
        <p style="color: #7f8c8d; font-size: 12px;">If you didn't request this verification, please ignore this email.</p>
      </div>
    `
  }),

  'password-reset': (data) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Password Reset Request</h2>
        <p>Hello ${data.firstName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetURL}"
             style="background-color: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #7f8c8d;">${data.resetURL}</p>
        <p><strong>This link will expire in ${data.expiryTime}.</strong></p>
        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;">
        <p style="color: #7f8c8d; font-size: 12px;">For security reasons, this link can only be used once.</p>
      </div>
    `
  }),

  'booking-confirmation': (data) => ({
    subject: `Booking Confirmation - ${data.bookingNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Booking Confirmed!</h2>
        <p>Hello ${data.guestName},</p>
        <p>Your booking has been confirmed. Here are the details:</p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c3e50;">Booking Details</h3>
          <p><strong>Booking Number:</strong> ${data.bookingNumber}</p>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Provider:</strong> ${data.providerName}</p>
          <p><strong>Date:</strong> ${data.serviceDate}</p>
          <p><strong>Time:</strong> ${data.serviceTime}</p>
          <p><strong>Total Amount:</strong> $${data.totalAmount}</p>
        </div>

        <p>You will receive updates about your booking status via email and SMS.</p>
        <p>If you have any questions, please contact our support team.</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;">
        <p style="color: #7f8c8d; font-size: 12px;">Thank you for choosing our services!</p>
      </div>
    `
  }),

  'booking-status-update': (data) => ({
    subject: `Booking Update - ${data.bookingNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Booking Status Update</h2>
        <p>Hello ${data.guestName},</p>
        <p>Your booking status has been updated:</p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Booking Number:</strong> ${data.bookingNumber}</p>
          <p><strong>New Status:</strong> <span style="color: #27ae60; font-weight: bold;">${data.newStatus}</span></p>
          ${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ''}
          ${data.estimatedCompletion ? `<p><strong>Estimated Completion:</strong> ${data.estimatedCompletion}</p>` : ''}
        </div>

        <p>You can track your booking progress in your account dashboard.</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;">
        <p style="color: #7f8c8d; font-size: 12px;">Stay updated with real-time notifications!</p>
      </div>
    `
  }),

  'service-provider-credentials': (data) => ({
    subject: 'Your Service Provider Account has been Created',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome to the Platform!</h2>
        <p>Hello ${data.firstName},</p>
        <p>Your service provider account has been created for <strong>${data.businessName}</strong> at <strong>${data.hotelName}</strong>.</p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c3e50;">Login Credentials</h3>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Temporary Password:</strong> ${data.temporaryPassword}</p>
          <p><strong>Login URL:</strong> <a href="${data.loginURL}">${data.loginURL}</a></p>
        </div>

        <p><strong>Important:</strong> Please change your password immediately after your first login.</p>
        <p>You can now start creating and managing your services on the platform.</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;">
        <p style="color: #7f8c8d; font-size: 12px;">Welcome to our service provider network!</p>
      </div>
    `
  }),

  'hotel-admin-credentials': (data) => ({
    subject: 'Your Hotel Admin Account has been Created',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome to the Hotel Management Platform!</h2>
        <p>Hello ${data.firstName},</p>
        <p>Your hotel admin account has been created for <strong>${data.hotelName}</strong>.</p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c3e50;">Login Credentials</h3>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Temporary Password:</strong> ${data.temporaryPassword}</p>
          <p><strong>Login URL:</strong> <a href="${data.loginURL}">${data.loginURL}</a></p>
        </div>

        <p><strong>Important:</strong> Please change your password immediately after your first login.</p>
        <p>You can now manage your hotel's service providers, set markup rates, and monitor bookings.</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;">
        <p style="color: #7f8c8d; font-size: 12px;">Start managing your hotel services today!</p>
      </div>
    `
  }),

  'payment-receipt': (data) => ({
    subject: `Payment Receipt - ${data.bookingNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Payment Receipt</h2>
        <p>Hello ${data.guestName},</p>
        <p>Thank you for your payment. Here's your receipt:</p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2c3e50;">Payment Details</h3>
          <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
          <p><strong>Booking Number:</strong> ${data.bookingNumber}</p>
          <p><strong>Amount Paid:</strong> $${data.amountPaid}</p>
          <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
          <p><strong>Date:</strong> ${data.paymentDate}</p>
        </div>

        <p>Your service booking is now confirmed and will be processed shortly.</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;">
        <p style="color: #7f8c8d; font-size: 12px;">Keep this receipt for your records.</p>
      </div>
    `
  })
};

/**
 * Send email function
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject (optional if using template)
 * @param {string} options.template - Template name
 * @param {Object} options.data - Template data
 * @param {string} options.html - Custom HTML content
 * @param {string} options.text - Plain text content
 * @returns {Promise}
 */
const sendEmail = async (options) => {
  try {
    // Create transporter
    const transporter = createTransporter();

    // Prepare email content
    let emailContent = {};

    if (options.template && templates[options.template]) {
      // Use template
      const template = templates[options.template](options.data || {});
      emailContent = template;
    } else {
      // Use custom content
      emailContent = {
        subject: options.subject,
        html: options.html,
        text: options.text
      };
    }

    // Define the email options
    const mailOptions = {
      from: `Hotel Platform <${process.env.EMAIL_FROM || 'noreply@hotelplatform.com'}>`,
      to: options.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    logger.info('Email sent successfully', {
      to: options.email,
      subject: emailContent.subject,
      messageId: info.messageId
    });

    // Log preview URL in development
    if (process.env.NODE_ENV !== 'production') {
      logger.info('Preview URL: ' + nodemailer.getTestMessageUrl(info));
    }

    return info;

  } catch (error) {
    logger.error('Error sending email:', {
      error: error.message,
      to: options.email,
      template: options.template
    });
    throw error;
  }
};

/**
 * Send bulk emails
 * @param {Array} emailList - Array of email options
 * @returns {Promise}
 */
const sendBulkEmails = async (emailList) => {
  const results = {
    successful: [],
    failed: []
  };

  for (const emailOptions of emailList) {
    try {
      const info = await sendEmail(emailOptions);
      results.successful.push({
        email: emailOptions.email,
        messageId: info.messageId
      });
    } catch (error) {
      results.failed.push({
        email: emailOptions.email,
        error: error.message
      });
    }
  }

  logger.info('Bulk email results', {
    successful: results.successful.length,
    failed: results.failed.length
  });

  return results;
};

/**
 * Verify email configuration
 * @returns {Promise<boolean>}
 */
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info('Email configuration verified successfully');
    return true;
  } catch (error) {
    logger.error('Email configuration verification failed:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  verifyEmailConfig,
  templates
};
