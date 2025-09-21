/**
 * Checkout Scheduler Service
 *
 * Handles automatic user account deactivation at 4:00 PM on checkout dates
 * Runs every hour to check for expired checkouts and deactivate accounts
 */

const cron = require('node-cron');
const User = require('../models/User');
const logger = require('./logger');

class CheckoutScheduler {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  /**
   * Start the checkout scheduler
   * Runs every hour to check for expired checkouts
   */
  start() {
    if (this.isRunning) {
      logger.warn('Checkout scheduler is already running');
      return;
    }

    // Run every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)
    this.job = cron.schedule('0 * * * *', async () => {
      await this.processExpiredCheckouts();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    this.isRunning = true;
    logger.info('Checkout scheduler started - checking for expired checkouts every hour');

    // Run immediately on startup
    this.processExpiredCheckouts();
  }

  /**
   * Stop the checkout scheduler
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
    }
    this.isRunning = false;
    logger.info('Checkout scheduler stopped');
  }

  /**
   * Process all expired checkouts
   */
  async processExpiredCheckouts() {
    try {
      logger.info('Starting checkout expiration check...');

      const results = await User.deactivateExpiredCheckouts();

      if (results.length === 0) {
        logger.info('No expired checkouts found');
        return;
      }

      const deactivated = results.filter(r => r.status === 'deactivated');
      const errors = results.filter(r => r.status === 'error');

      logger.info(`Checkout processing complete: ${deactivated.length} accounts deactivated, ${errors.length} errors`);

      if (deactivated.length > 0) {
        logger.info('Deactivated accounts:', deactivated.map(u => ({
          email: u.email,
          checkoutTime: u.checkoutTime
        })));
      }

      if (errors.length > 0) {
        logger.error('Deactivation errors:', errors);
      }

    } catch (error) {
      logger.error('Error processing expired checkouts:', error);
    }
  }

  /**
   * Manually trigger checkout processing (for testing)
   */
  async triggerCheckout() {
    logger.info('Manually triggering checkout processing...');
    await this.processExpiredCheckouts();
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasJob: !!this.job
    };
  }
}

// Create singleton instance
const checkoutScheduler = new CheckoutScheduler();

module.exports = checkoutScheduler;
