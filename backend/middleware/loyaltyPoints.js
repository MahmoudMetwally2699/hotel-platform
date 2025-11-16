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
const Hotel = require('../models/Hotel');
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
    console.log(`🎯 Starting loyalty points award process for booking ${bookingId} (${bookingType})`);

    let booking;

    // Get the booking
    if (bookingType === 'transportation') {
      booking = await TransportationBooking.findById(bookingId).populate('guestId', 'channel');
    } else {
      booking = await Booking.findById(bookingId).populate('guestId', 'channel');
    }

    if (!booking) {
      console.error(`❌ Booking not found: ${bookingId}`);
      return { success: false, message: 'Booking not found' };
    }

    console.log(`📦 Booking found:`, {
      bookingId: booking._id,
      guestId: booking.guestId?._id,
      hotelId: booking.hotelId,
      status: booking.status || booking.bookingStatus,
      serviceType: booking.serviceType,
      category: booking.category,
      pricing: booking.pricing,
      totalAmount: booking.totalAmount
    });

    // Only award points for completed bookings - handle different status field names
    const bookingStatus = bookingType === 'transportation' ? booking.bookingStatus : booking.status;
    if (bookingStatus !== 'completed') {
      return { success: false, message: 'Booking not completed yet' };
    }

    const guestId = booking.guestId._id || booking.guestId;
    const hotelId = booking.hotelId;
    const guestChannel = booking.guestId.channel || 'Direct';

    console.log(`👤 Guest details:`, { guestId, hotelId, guestChannel });

    // Get the loyalty program for this channel
    const program = await LoyaltyProgram.findOne({
      hotel: hotelId,
      channel: guestChannel,
      isActive: true
    });

    if (!program) {
      console.log(`⚠️ No active loyalty program found for channel: ${guestChannel} at hotel: ${hotelId}`);
      return { success: false, message: 'No active loyalty program for this channel' };
    }

    console.log(`✅ Loyalty program found:`, {
      programId: program._id,
      channel: program.channel,
      pointsPerDollar: program.pointsRules?.pointsPerDollar,
      multipliers: program.pointsRules?.serviceMultipliers
    });

    // ============================================
    // HOTEL GROUP SUPPORT
    // ============================================
    // Check if hotel is part of a group
    const hotel = await Hotel.findById(hotelId);
    const hotelGroupId = hotel?.hotelGroupId;
    const guest = await User.findById(guestId);
    const guestEmail = guest?.email;

    console.log(`🏨 Hotel group check:`, {
      hotelId,
      hotelGroupId: hotelGroupId || 'None',
      guestEmail: guestEmail || 'No email'
    });

    // Get or create loyalty member
    let member;

    if (hotelGroupId && guestEmail) {
      // Hotel is in a group - find member by email + groupId (shared across hotels)
      console.log(`🔍 Looking for group member by email: ${guestEmail} and groupId: ${hotelGroupId}`);

      member = await LoyaltyMember.findOne({
        hotelGroupId: hotelGroupId,
        guestEmail: guestEmail
      });

      if (member) {
        console.log(`✅ Found existing group loyalty member:`, {
          memberId: member._id,
          primaryHotel: member.hotel,
          linkedAccounts: member.linkedAccounts.length,
          currentPoints: member.totalPoints
        });

        // Link this hotel/user combination if not already linked
        if (!member.isLinked(hotelId, guestId)) {
          console.log(`🔗 Linking new account: hotel ${hotelId}, user ${guestId}`);
          member.linkAccount(hotelId, guestId, guest.name || guest.email, guestEmail);
        }
      } else {
        // Create new group member
        console.log(`➕ Creating new group loyalty member for email ${guestEmail}`);
        member = new LoyaltyMember({
          guest: guestId,
          hotel: hotelId,
          hotelGroupId: hotelGroupId,
          guestEmail: guestEmail,
          currentTier: 'BRONZE',
          totalPoints: 0,
          availablePoints: 0,
          linkedAccounts: [{
            hotelId: hotelId,
            userId: guestId,
            userName: guest.name || guest.email,
            userEmail: guestEmail,
            linkedDate: new Date()
          }]
        });
      }
    } else {
      // Hotel is NOT in a group - use traditional per-hotel loyalty
      console.log(`🏨 Hotel not in group - using traditional per-hotel loyalty`);

      member = await LoyaltyMember.findOne({
        guest: guestId,
        hotel: hotelId
      });

      if (!member) {
        console.log(`➕ Creating new loyalty member for guest ${guestId} at hotel ${hotelId}`);
        member = new LoyaltyMember({
          guest: guestId,
          hotel: hotelId,
          guestEmail: guestEmail,
          currentTier: 'BRONZE',
          totalPoints: 0,
          availablePoints: 0
        });
      } else {
        console.log(`✅ Existing loyalty member found:`, {
          memberId: member._id,
          currentPoints: member.totalPoints,
          currentTier: member.currentTier,
          lifetimeSpending: member.lifetimeSpending
        });
      }
    }

    // Calculate points
    let pointsToAward = 0;
    let pointsBreakdown = {
      basePoints: 0,
      serviceMultiplier: 1,
      nightsPoints: 0,
      totalPoints: 0
    };

    // Points per dollar spent - handle different amount field locations
    let amountSpent = 0;
    if (bookingType === 'transportation') {
      // For transportation bookings, amount is in quote.finalPrice or payment.totalAmount
      amountSpent = booking.quote?.finalPrice || booking.payment?.totalAmount || 0;
    } else {
      // For regular bookings, try multiple locations where amount might be stored
      amountSpent = booking.pricing?.totalAmount ||
                    booking.pricing?.total ||
                    booking.totalAmount ||
                    booking.payment?.totalAmount ||
                    0;
    }

    console.log(`💰 Amount extraction for booking ${bookingId} (${bookingType}):`, {
      amountSpent,
      pricingTotalAmount: booking.pricing?.totalAmount,
      pricingTotal: booking.pricing?.total,
      totalAmount: booking.totalAmount,
      paymentTotalAmount: booking.payment?.totalAmount,
      quoteFinalPrice: booking.quote?.finalPrice
    });

    if (amountSpent === 0) {
      console.warn(`⚠️ No amount found for booking ${bookingId} - cannot award points`);
      return { success: false, message: 'No booking amount found' };
    }

    const pointsPerDollar = program.pointsRules.pointsPerDollar || 1;
    pointsBreakdown.basePoints = Math.floor(amountSpent * pointsPerDollar);

    // Apply service category multiplier
    let serviceCategory = 'general';
    if (bookingType === 'transportation') {
      serviceCategory = 'transportation';
    } else {
      // Try multiple fields to determine service category
      serviceCategory = booking.serviceDetails?.category ||
                       booking.serviceType ||
                       booking.category ||
                       booking.serviceId?.category ||
                       'general';
    }

    console.log(`🏷️ Service category for booking ${bookingId}:`, {
      serviceCategory,
      serviceDetailsCategory: booking.serviceDetails?.category,
      serviceType: booking.serviceType,
      category: booking.category,
      serviceIdCategory: booking.serviceId?.category
    });

    const multipliers = program.pointsRules.serviceMultipliers || {};

    let multiplier = 1;
    if (serviceCategory === 'laundry' && multipliers.laundry) {
      multiplier = multipliers.laundry;
    } else if (serviceCategory === 'transportation' && multipliers.transportation) {
      multiplier = multipliers.transportation;
    } else if (serviceCategory === 'dining' && multipliers.dining) {
      multiplier = multipliers.dining;
    } else if (serviceCategory === 'restaurant' && multipliers.dining) {
      multiplier = multipliers.dining;
    } else if (serviceCategory === 'housekeeping' && multipliers.housekeeping) {
      multiplier = multipliers.housekeeping;
    }

    console.log(`⚡ Multiplier calculation:`, {
      serviceCategory,
      availableMultipliers: Object.keys(multipliers),
      selectedMultiplier: multiplier,
      multiplierValue: multipliers[serviceCategory]
    });

    pointsBreakdown.serviceMultiplier = multiplier;
    pointsToAward = Math.floor(pointsBreakdown.basePoints * multiplier);

    // Add to total
    pointsBreakdown.totalPoints = pointsToAward;

    // Award the points
    if (pointsToAward > 0) {
      const bookingRef = bookingType === 'transportation'
        ? (booking.bookingReference || bookingId)
        : (booking.bookingNumber || bookingId);

      const description = `Earned from ${serviceCategory} booking #${bookingRef}`;

      member.addPoints(
        pointsToAward,
        description,
        bookingType === 'regular' ? bookingId : null,
        bookingType === 'transportation' ? bookingId : null,
        program.expirationMonths || 12,
        hotelId  // Track which hotel earned the points (for group analytics)
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

      // If hotel is in a group, sync points to all other members with same email
      if (hotel.hotelGroupId && member.guestEmail) {
        const otherGroupMembers = await LoyaltyMember.find({
          hotelGroupId: hotel.hotelGroupId,
          guestEmail: member.guestEmail,
          _id: { $ne: member._id } // Exclude the current member
        });

        if (otherGroupMembers.length > 0) {
          console.log(`🔄 Syncing points to ${otherGroupMembers.length} other member(s) in the group`);

          for (const otherMember of otherGroupMembers) {
            otherMember.totalPoints = member.totalPoints;
            otherMember.tierPoints = member.tierPoints;
            otherMember.availablePoints = member.availablePoints;
            otherMember.lifetimeSpending = member.lifetimeSpending;
            otherMember.lifetimePointsEarned = member.lifetimePointsEarned;

            // Recalculate tier based on that hotel's program configuration
            const otherHotelProgram = await LoyaltyProgram.findOne({
              hotel: otherMember.hotel,
              channel: program.channel
            });

            if (otherHotelProgram) {
              const otherTier = otherHotelProgram.getTierByPoints(otherMember.totalPoints);
              if (otherTier && otherTier.name !== otherMember.currentTier) {
                otherMember.updateTier(otherTier.name, 'Synced from group member points');
              }
              otherMember.calculateTierProgress(otherHotelProgram.tierConfiguration);
            }

            await otherMember.save();
          }

          console.log(`✅ Synced ${pointsToAward} points to ${otherGroupMembers.length} group member(s)`);
        }
      }

      // Update program statistics
      program.statistics.totalPointsIssued += pointsToAward;
      program.statistics.totalRevenueFromLoyalMembers += amountSpent;
      await program.save();

      console.log(`✅ Successfully awarded ${pointsToAward} points to guest ${guestId} for ${serviceCategory} booking ${bookingId}`);
      console.log(`💵 Revenue added: ${amountSpent}, New lifetime spending: ${member.lifetimeSpending}`);

      return {
        success: true,
        pointsAwarded: pointsToAward,
        breakdown: pointsBreakdown,
        newBalance: member.availablePoints,
        tier: member.currentTier,
        amountSpent: amountSpent
      };
    }

    console.warn(`⚠️ No points to award for booking ${bookingId} - pointsToAward: ${pointsToAward}`);
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

/**
 * Get or create loyalty member for guest at hotel
 * Supports hotel groups - links accounts by email
 * @param {ObjectId} guestId - Guest user ID
 * @param {ObjectId} hotelId - Hotel ID
 * @returns {LoyaltyMember} Member document
 */
const getOrCreateMember = async (guestId, hotelId) => {
  try {
    // Get hotel and guest info
    const hotel = await Hotel.findById(hotelId);
    const guest = await User.findById(guestId);

    if (!hotel || !guest) {
      throw new Error('Hotel or guest not found');
    }

    const hotelGroupId = hotel.hotelGroupId;
    const guestEmail = guest.email;

    // If hotel is in a group, create separate members per hotel but with shared points
    if (hotelGroupId && guestEmail) {
      // Find this guest's member at this specific hotel
      let member = await LoyaltyMember.findOne({
        guest: guestId,
        hotel: hotelId
      });

      if (member) {
        // Member exists at this hotel
        // Ensure group fields are set
        if (!member.hotelGroupId) {
          member.hotelGroupId = hotelGroupId;
          member.guestEmail = guestEmail;
          await member.save();
        }
        return member;
      }

      // Member doesn't exist at this hotel - check if they exist at other hotels in group
      const existingGroupMember = await LoyaltyMember.findOne({
        hotelGroupId: hotelGroupId,
        guestEmail: guestEmail
      });

      if (existingGroupMember) {
        // Guest has loyalty at another hotel in the group - create new member with shared points
        member = new LoyaltyMember({
          guest: guestId,
          hotel: hotelId,
          hotelGroupId: hotelGroupId,
          guestEmail: guestEmail,
          currentTier: 'BRONZE', // Will be recalculated based on this hotel's tier config
          totalPoints: existingGroupMember.totalPoints,
          tierPoints: existingGroupMember.tierPoints,
          availablePoints: existingGroupMember.availablePoints,
          lifetimeSpending: existingGroupMember.lifetimeSpending,
          lifetimePointsEarned: existingGroupMember.lifetimePointsEarned,
          linkedAccounts: [{
            hotelId: hotelId,
            userId: guestId,
            userName: guest.name || guest.email,
            userEmail: guestEmail,
            linkedDate: new Date()
          }]
        });
        await member.save();

        console.log(`✅ Created linked loyalty member at hotel ${hotelId} for ${guestEmail} with ${member.totalPoints} shared points`);
        return member;
      } else {
        // First time in the group - create new member
        member = new LoyaltyMember({
          guest: guestId,
          hotel: hotelId,
          hotelGroupId: hotelGroupId,
          guestEmail: guestEmail,
          currentTier: 'BRONZE',
          totalPoints: 0,
          availablePoints: 0,
          linkedAccounts: [{
            hotelId: hotelId,
            userId: guestId,
            userName: guest.name || guest.email,
            userEmail: guestEmail,
            linkedDate: new Date()
          }]
        });
        await member.save();
        return member;
      }
    } else {
      // Hotel not in group - traditional per-hotel loyalty
      let member = await LoyaltyMember.findOne({
        guest: guestId,
        hotel: hotelId
      });

      if (!member) {
        member = new LoyaltyMember({
          guest: guestId,
          hotel: hotelId,
          guestEmail: guestEmail,
          currentTier: 'BRONZE',
          totalPoints: 0,
          availablePoints: 0
        });
        await member.save();
      }

      return member;
    }
  } catch (error) {
    console.error('Error in getOrCreateMember:', error);
    throw error;
  }
};

module.exports = {
  awardPointsForBooking,
  awardPointsForNights,
  autoAwardPoints,
  calculateLoyaltyDiscount,
  getOrCreateMember
};
