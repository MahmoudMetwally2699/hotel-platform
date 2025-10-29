/**
 * Loyalty Points Middleware
 *
 * Automatically calculates and awards loyalty points when:
 * - A booking is completed
 * - A service is used
 * - Based on the guest's channel settings
 */

const LoyaltyProgram = require('../models/LoyaltyProgram');
const LoyaltyMember = require('../models/LoyaltyMember');
const User = require('../models/User');
const Booking = require('../models/Booking');
const TransportationBooking = require('../models/TransportationBooking');

/**
 * Calculate and award points for a completed booking
 * @param {String} bookingId - Booking ID
 * @param {String} bookingType - 'regular' or 'transportation'
 */
const awardPointsForBooking = async (bookingId, bookingType = 'regular') => {
  try {
    let booking;

    // Get the booking
    if (bookingType === 'transportation') {
      booking = await TransportationBooking.findById(bookingId).populate('guestId', 'channel');
    } else {
      booking = await Booking.findById(bookingId).populate('guestId', 'channel');
    }

    if (!booking) {
      console.error('Booking not found:', bookingId);
      return { success: false, message: 'Booking not found' };
    }

    // Only award points for completed bookings
    if (booking.status !== 'completed') {
      return { success: false, message: 'Booking not completed yet' };
    }

    const guestId = booking.guestId._id || booking.guestId;
    const hotelId = booking.hotelId;
    const guestChannel = booking.guestId.channel || 'Direct';

    // Get the loyalty program for this channel
    const program = await LoyaltyProgram.findOne({
      hotel: hotelId,
      channel: guestChannel,
      isActive: true
    });

    if (!program) {
      console.log(`No active loyalty program found for channel: ${guestChannel}`);
      return { success: false, message: 'No active loyalty program for this channel' };
    }

    // Get or create loyalty member
    let member = await LoyaltyMember.findOne({
      guest: guestId,
      hotel: hotelId
    });

    if (!member) {
      // Create new member
      member = new LoyaltyMember({
        guest: guestId,
        hotel: hotelId,
        currentTier: 'BRONZE',
        totalPoints: 0,
        availablePoints: 0
      });
    }

    // Calculate points
    let pointsToAward = 0;
    let pointsBreakdown = {
      basePoints: 0,
      serviceMultiplier: 1,
      nightsPoints: 0,
      totalPoints: 0
    };

    // Points per dollar spent
    const amountSpent = booking.pricing?.totalAmount || 0;
    const pointsPerDollar = program.pointsRules.pointsPerDollar || 1;
    pointsBreakdown.basePoints = Math.floor(amountSpent * pointsPerDollar);

    // Apply service category multiplier
    const serviceCategory = booking.serviceDetails?.category || 'general';
    const multipliers = program.pointsRules.serviceMultipliers || {};

    let multiplier = 1;
    if (serviceCategory === 'laundry' && multipliers.laundry) {
      multiplier = multipliers.laundry;
    } else if (serviceCategory === 'transportation' && multipliers.transportation) {
      multiplier = multipliers.transportation;
    } else if (['tours', 'travel'].includes(serviceCategory)) {
      multiplier = multipliers.travel || multipliers.tourism || 1;
    } else if (serviceCategory === 'housekeeping' && multipliers.housekeeping) {
      multiplier = multipliers.housekeeping;
    }

    pointsBreakdown.serviceMultiplier = multiplier;
    pointsToAward = Math.floor(pointsBreakdown.basePoints * multiplier);

    // Add to total
    pointsBreakdown.totalPoints = pointsToAward;

    // Award the points
    if (pointsToAward > 0) {
      const description = `Earned from ${serviceCategory} booking #${booking.bookingNumber || bookingId}`;

      member.addPoints(
        pointsToAward,
        description,
        bookingType === 'regular' ? bookingId : null,
        bookingType === 'transportation' ? bookingId : null,
        program.expirationMonths || 12
      );

      // Update lifetime spending
      member.lifetimeSpending += amountSpent;

      // Check for tier upgrade
      const currentTier = program.getTierByPoints(member.totalPoints);
      if (currentTier && currentTier.name !== member.currentTier) {
        member.updateTier(currentTier.name, 'Points threshold reached');
      }

      // Calculate tier progress
      member.calculateTierProgress(program.tierConfiguration);

      await member.save();

      // Update program statistics
      program.statistics.totalPointsIssued += pointsToAward;
      program.statistics.totalRevenueFromLoyalMembers += amountSpent;
      await program.save();

      console.log(`Awarded ${pointsToAward} points to guest ${guestId} for booking ${bookingId}`);

      return {
        success: true,
        pointsAwarded: pointsToAward,
        breakdown: pointsBreakdown,
        newBalance: member.availablePoints,
        tier: member.currentTier
      };
    }

    return { success: false, message: 'No points to award' };

  } catch (error) {
    console.error('Error awarding points for booking:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Award points for nights stayed
 * Called when a guest checks out
 * @param {String} guestId - Guest ID
 * @param {String} hotelId - Hotel ID
 * @param {Number} numberOfNights - Number of nights stayed
 */
const awardPointsForNights = async (guestId, hotelId, numberOfNights) => {
  try {
    // Get guest to determine channel
    const guest = await User.findById(guestId).select('channel');
    if (!guest) {
      return { success: false, message: 'Guest not found' };
    }

    const guestChannel = guest.channel || 'Direct';

    // Get the loyalty program for this channel
    const program = await LoyaltyProgram.findOne({
      hotel: hotelId,
      channel: guestChannel,
      isActive: true
    });

    if (!program) {
      return { success: false, message: 'No active loyalty program for this channel' };
    }

    // Get or create loyalty member
    let member = await LoyaltyMember.findOne({
      guest: guestId,
      hotel: hotelId
    });

    if (!member) {
      member = new LoyaltyMember({
        guest: guestId,
        hotel: hotelId,
        currentTier: 'BRONZE',
        totalPoints: 0,
        availablePoints: 0
      });
    }

    // Calculate points for nights
    const pointsPerNight = program.pointsRules.pointsPerNight || 50;
    const pointsToAward = numberOfNights * pointsPerNight;

    if (pointsToAward > 0) {
      const description = `Earned ${pointsToAward} points for ${numberOfNights} night(s) stayed`;

      member.addPoints(
        pointsToAward,
        description,
        null,
        null,
        program.expirationMonths || 12
      );

      // Update nights stayed
      member.totalNightsStayed += numberOfNights;

      // Check for tier upgrade
      const currentTier = program.getTierByPoints(member.totalPoints);
      if (currentTier && currentTier.name !== member.currentTier) {
        member.updateTier(currentTier.name, 'Points threshold reached');
      }

      // Calculate tier progress
      member.calculateTierProgress(program.tierConfiguration);

      await member.save();

      // Update program statistics
      program.statistics.totalPointsIssued += pointsToAward;
      await program.save();

      console.log(`Awarded ${pointsToAward} points to guest ${guestId} for ${numberOfNights} nights`);

      return {
        success: true,
        pointsAwarded: pointsToAward,
        newBalance: member.availablePoints,
        tier: member.currentTier
      };
    }

    return { success: false, message: 'No points to award' };

  } catch (error) {
    console.error('Error awarding points for nights:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Middleware to automatically award points after booking completion
 * Add this to booking update routes
 */
const autoAwardPoints = async (req, res, next) => {
  try {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to intercept response
    res.json = function(data) {
      // Check if booking was completed
      if (data.success && data.data?.status === 'completed') {
        const bookingId = data.data._id || req.params.bookingId || req.params.id;
        const bookingType = req.baseUrl.includes('transportation') ? 'transportation' : 'regular';

        // Award points asynchronously (don't wait)
        awardPointsForBooking(bookingId, bookingType).catch(err => {
          console.error('Error in auto-award points:', err);
        });
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  } catch (error) {
    console.error('Error in autoAwardPoints middleware:', error);
    next();
  }
};

/**
 * Calculate discount based on loyalty tier
 * @param {String} guestId - Guest ID
 * @param {String} hotelId - Hotel ID
 * @param {Number} amount - Original amount
 * @returns {Object} - Discount details
 */
const calculateLoyaltyDiscount = async (guestId, hotelId, amount) => {
  try {
    const member = await LoyaltyMember.findOne({
      guest: guestId,
      hotel: hotelId,
      isActive: true
    });

    if (!member) {
      return { hasDiscount: false, discount: 0, finalAmount: amount };
    }

    // Get guest channel
    const guest = await User.findById(guestId).select('channel');
    const guestChannel = guest?.channel || 'Direct';

    // Get program to get tier configuration
    const program = await LoyaltyProgram.findOne({
      hotel: hotelId,
      channel: guestChannel,
      isActive: true
    });

    if (!program) {
      return { hasDiscount: false, discount: 0, finalAmount: amount };
    }

    // Find tier details
    const tierConfig = program.tierConfiguration.find(t => t.name === member.currentTier);
    const discountPercentage = tierConfig?.discountPercentage || 0;

    if (discountPercentage > 0) {
      const discountAmount = (amount * discountPercentage) / 100;
      const finalAmount = amount - discountAmount;

      return {
        hasDiscount: true,
        discount: discountAmount,
        discountPercentage: discountPercentage,
        finalAmount: finalAmount,
        tier: member.currentTier
      };
    }

    return { hasDiscount: false, discount: 0, finalAmount: amount };

  } catch (error) {
    console.error('Error calculating loyalty discount:', error);
    return { hasDiscount: false, discount: 0, finalAmount: amount };
  }
};

module.exports = {
  awardPointsForBooking,
  awardPointsForNights,
  autoAwardPoints,
  calculateLoyaltyDiscount
};
