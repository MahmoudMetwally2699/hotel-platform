/**
 * WhatsApp Webhook Routes
 * Handles WhatsApp Cloud API webhook verification and message processing
 */

const express = require('express');
const router = express.Router();
const { verifyWebhook, processWebhook } = require('../utils/whatsapp');
const logger = require('../utils/logger');

/**
 * @desc    Verify WhatsApp webhook
 * @route   GET /api/whatsapp/webhook
 * @access  Public (WhatsApp verification)
 */
router.get('/webhook', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    logger.info('WhatsApp webhook verification request', {
      mode,
      token: token ? 'provided' : 'missing',
      challenge: challenge ? 'provided' : 'missing'
    });

    const verificationResult = verifyWebhook(mode, token, challenge);

    if (verificationResult) {
      res.status(200).send(verificationResult);
    } else {
      res.status(403).send('Forbidden');
    }
  } catch (error) {
    logger.error('WhatsApp webhook verification error', { error: error.message });
    res.status(500).send('Internal Server Error');
  }
});

/**
 * @desc    Process WhatsApp webhook events
 * @route   POST /api/whatsapp/webhook
 * @access  Public (WhatsApp webhook)
 */
router.post('/webhook', async (req, res) => {
  try {
    logger.info('Received WhatsApp webhook', {
      body: JSON.stringify(req.body, null, 2)
    });

    await processWebhook(req.body);

    res.status(200).send('OK');
  } catch (error) {
    logger.error('WhatsApp webhook processing error', {
      error: error.message,
      body: req.body
    });
    res.status(500).send('Internal Server Error');
  }
});

/**
 * @desc    Send test WhatsApp message
 * @route   POST /api/whatsapp/test
 * @access  Private (Admin only for testing)
 */
router.post('/test', async (req, res) => {
  try {
    const { phone, templateName, parameters } = req.body;

    if (!phone || !templateName) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and template name are required'
      });
    }

    const { sendTemplateMessage } = require('../utils/whatsapp');

    const result = await sendTemplateMessage(phone, templateName, parameters || []);

    res.json({
      success: true,
      message: 'Test message sent successfully',
      data: result
    });

  } catch (error) {
    logger.error('WhatsApp test message error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to send test message',
      error: error.message
    });
  }
});

module.exports = router;
