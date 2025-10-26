/**
 * Loyalty Integration Helper
 * Handles loyalty program integration with booking system
 */

const LoyaltyProgram = require('../models/LoyaltyProgram');
const LoyaltyMember = require('../models/LoyaltyMember');
const {
  calculatePointsEarned,
  determineTier,
  calculateTierDiscount,
  calculateBookingPriceWithLoyalty
} = require('./loyaltyHelper');
const { sendEmail } = require('./email');

/**
 * Get or Create Loyalty Member
 * Automatically enrolls guest in loyalty program on first booking
 * @param {String} guestId - Guest user ID
 * @param {String} hotelId - Hotel ID
 * @returns {Object|null} Loyalty member or null if no program exists
 */
const getOrCreateLoyaltyMember = async (guestId, hotelId) => {
  try {
    // Check if loyalty program exists and is active
    const program = await LoyaltyProgram.findOne({
      hotel: hotelId,
      isActive: true
    });

    if (!program) {
      return null;
    }

    // Check if member already exists
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
        availablePoints: 0,
        lifetimeSpending: 0,
        tierHistory: [{
          tier: 'BRONZE',
          date: new Date(),
          reason: 'Initial enrollment'
        }]
      });

      // Calculate tier progress
      member.calculateTierProgress(program.tierConfiguration);
      await member.save();

      // Update program statistics
      program.statistics.totalMembers += 1;
      await program.save();

      // Send welcome email
      const User = require('../models/User');
      const guest = await User.findById(guestId).select('name email');

      if (guest && guest.email) {
        try {
          await sendEmail({
            to: guest.email,
            subject: 'Welcome to Our Loyalty Program!',
            template: 'loyaltyWelcome',
            context: {
              guestName: guest.name,
              currentTier: 'BRONZE',
              benefits: program.tierConfiguration[0]?.benefits || []
            }
          });
        } catch (emailError) {
          console.error('Error sending loyalty welcome email:', emailError);
        }
      }
    }

    return { member, program };
  } catch (error) {
    console.error('Error in getOrCreateLoyaltyMember:', error);
    return null;
  }
};

/**
 * Calculate Booking Price with Loyalty Discount
 * @param {Number} basePrice - Service base price
 * @param {Number} markupPercentage - Hotel markup percentage
 * @param {String} guestId - Guest user ID
 * @param {String} hotelId - Hotel ID
 * @returns {Object} Price breakdown with loyalty discount
 */
const calculatePriceWithLoyaltyDiscount = async (basePrice, markupPercentage, guestId, hotelId) => {
  try {
    const loyaltyData = await getOrCreateLoyaltyMember(guestId, hotelId);

    if (!loyaltyData) {
      // No loyalty program, return regular price
      return calculateBookingPriceWithLoyalty(basePrice, markupPercentage, 0);
    }

    const { member, program } = loyaltyData;

    // Get tier discount
    const tierDiscount = calculateTierDiscount(member.currentTier, program.tierConfiguration);

    // Calculate complete price breakdown
    const priceBreakdown = calculateBookingPriceWithLoyalty(
      basePrice,
      markupPercentage,
      tierDiscount
    );

    return {
      ...priceBreakdown,
      loyaltyMember: member,
      loyaltyProgram: program,
      hasLoyaltyDiscount: tierDiscount > 0
    };
  } catch (error) {
    console.error('Error calculating price with loyalty discount:', error);
    // Return regular price on error
    return calculateBookingPriceWithLoyalty(basePrice, markupPercentage, 0);
  }
};

/**
 * Award Loyalty Points for Completed Booking
 * Called after successful payment or when booking is completed
 * @param {String} bookingId - Booking ID
 * @param {String} guestId - Guest user ID
 * @param {String} hotelId - Hotel ID
 * @param {Number} finalPrice - Final booking price
 * @param {String} serviceType - Service type (laundry, transportation, tourism, housekeeping)
 * @param {String} bookingType - 'regular' or 'transportation'
 * @returns {Object} Points awarded information
 */
const awardLoyaltyPoints = async (bookingId, guestId, hotelId, finalPrice, serviceType, bookingType = 'regular', numberOfNights = 0) => {
  try {
    console.log('=== Award Loyalty Points Debug ===');
    console.log('bookingId:', bookingId);
    console.log('guestId:', guestId);
    console.log('hotelId:', hotelId);
    console.log('finalPrice:', finalPrice, 'type:', typeof finalPrice);
    console.log('serviceType:', serviceType);
    console.log('bookingType:', bookingType);
    console.log('numberOfNights:', numberOfNights);

    const loyaltyData = await getOrCreateLoyaltyMember(guestId, hotelId);

    if (!loyaltyData) {
      return { success: false, message: 'No active loyalty program' };
    }

    const { member, program } = loyaltyData;

    console.log('Program pointsPerDollar:', program.pointsRules?.pointsPerDollar);
    console.log('Program pointsPerNight:', program.pointsRules?.pointsPerNight);
    console.log('Program serviceMultipliers:', program.pointsRules?.serviceMultipliers);
    console.log('Service multiplier for', serviceType, ':', program.pointsRules?.serviceMultipliers?.[serviceType.toLowerCase()]);

    // Calculate points to award from spending
    const pointsFromSpending = calculatePointsEarned(finalPrice, serviceType, program);
    console.log('Points from spending:', pointsFromSpending, 'type:', typeof pointsFromSpending);

    // Calculate points from nights stayed
    const pointsPerNight = program.pointsRules?.pointsPerNight || 0;
    const pointsFromNights = numberOfNights > 0 ? Math.floor(numberOfNights * pointsPerNight) : 0;
    console.log('Points from nights:', pointsFromNights, '(', numberOfNights, 'nights x', pointsPerNight, 'points/night)');

    // Total points
    const totalPointsEarned = pointsFromSpending + pointsFromNights;
    console.log('Total points earned:', totalPointsEarned);

    if (totalPointsEarned <= 0) {
      return { success: false, message: 'No points to award' };
    }

    // Add points to member
    const bookingRef = bookingType === 'transportation' ? null : bookingId;
    const transportationRef = bookingType === 'transportation' ? bookingId : null;

    // Award points from spending
    if (pointsFromSpending > 0) {
      member.addPoints(
        pointsFromSpending,
        `Earned from ${serviceType} booking ($${finalPrice.toFixed(2)})`,
        bookingRef,
        transportationRef,
        program.expirationMonths
      );
    }

    // Award points from nights
    if (pointsFromNights > 0) {
      member.pointsHistory.push({
        type: 'NIGHTS',
        points: pointsFromNights,
        nights: numberOfNights,
        description: `Earned from ${numberOfNights} night${numberOfNights > 1 ? 's' : ''} stayed`,
        date: new Date(),
        bookingReference: bookingRef,
        transportationBookingReference: transportationRef,
        expirationDate: new Date(Date.now() + (program.expirationMonths * 30 * 24 * 60 * 60 * 1000))
      });
      member.totalPoints += pointsFromNights;
      member.availablePoints += pointsFromNights;
      member.lifetimePointsEarned += pointsFromNights;
      member.totalNightsStayed += numberOfNights;
    }

    // Update lifetime spending
    member.lifetimeSpending += finalPrice;

    // Check for tier upgrade
    const oldTier = member.currentTier;
    const newTier = determineTier(member.totalPoints, program.tierConfiguration);

    let tierUpgraded = false;
    if (newTier && newTier.name !== member.currentTier) {
      const tierUpdate = member.updateTier(newTier.name, 'Points threshold reached');
      tierUpgraded = tierUpdate.upgraded;

      // Send tier upgrade notification
      if (tierUpgraded) {
        const User = require('../models/User');
        const guest = await User.findById(guestId).select('name email');

        if (guest && guest.email) {
          try {
            await sendEmail({
              to: guest.email,
              subject: '🎉 Congratulations! You\'ve Been Upgraded!',
              template: 'tierUpgrade',
              context: {
                guestName: guest.name,
                oldTier: oldTier,
                newTier: newTier.name,
                benefits: newTier.benefits,
                discountPercentage: newTier.discountPercentage,
                currentPoints: member.totalPoints
              }
            });
          } catch (emailError) {
            console.error('Error sending tier upgrade email:', emailError);
          }
        }
      }
    }

    // Update tier progress
    member.calculateTierProgress(program.tierConfiguration);

    await member.save();

    // Update program statistics
    program.statistics.totalPointsIssued += totalPointsEarned;
    program.statistics.totalRevenueFromLoyalMembers += finalPrice;
    await program.save();

    // Send points earned notification
    const User = require('../models/User');
    const guest = await User.findById(guestId).select('name email');

    if (guest && guest.email) {
      try {
        let emailDescription = `Earned ${pointsFromSpending} points from spending`;
        if (pointsFromNights > 0) {
          emailDescription += ` and ${pointsFromNights} points from ${numberOfNights} night${numberOfNights > 1 ? 's' : ''} stayed`;
        }

        await sendEmail({
          to: guest.email,
          subject: 'You Earned Loyalty Points!',
          template: 'pointsEarned',
          context: {
            guestName: guest.name,
            pointsEarned: totalPointsEarned,
            pointsFromSpending,
            pointsFromNights,
            numberOfNights,
            totalPoints: member.totalPoints,
            availablePoints: member.availablePoints,
            currentTier: member.currentTier,
            serviceType: serviceType,
            tierUpgraded: tierUpgraded,
            newTier: tierUpgraded ? newTier.name : null
          }
        });
      } catch (emailError) {
        console.error('Error sending points earned email:', emailError);
      }
    }

    return {
      success: true,
      pointsAwarded: totalPointsEarned,
      pointsFromSpending,
      pointsFromNights,
      numberOfNights,
      totalPoints: member.totalPoints,
      availablePoints: member.availablePoints,
      currentTier: member.currentTier,
      tierUpgraded,
      oldTier: tierUpgraded ? oldTier : null,
      newTier: tierUpgraded ? newTier.name : null
    };
  } catch (error) {
    console.error('Error awarding loyalty points:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Check Loyalty Discount for Guest
 * @param {String} guestId - Guest user ID
 * @param {String} hotelId - Hotel ID
 * @returns {Object} Loyalty discount information
 */
const checkLoyaltyDiscount = async (guestId, hotelId) => {
  try {
    const member = await LoyaltyMember.findOne({
      guest: guestId,
      hotel: hotelId,
      isActive: true
    });

    if (!member) {
      return { hasDiscount: false, discountPercentage: 0 };
    }

    const program = await LoyaltyProgram.findOne({
      hotel: hotelId,
      isActive: true
    });

    if (!program) {
      return { hasDiscount: false, discountPercentage: 0 };
    }

    const tierDiscount = calculateTierDiscount(member.currentTier, program.tierConfiguration);

    return {
      hasDiscount: tierDiscount > 0,
      discountPercentage: tierDiscount,
      currentTier: member.currentTier,
      totalPoints: member.totalPoints,
      availablePoints: member.availablePoints
    };
  } catch (error) {
    console.error('Error checking loyalty discount:', error);
    return { hasDiscount: false, discountPercentage: 0 };
  }
};

/**
 * Expire Old Points for All Members (Cron Job Helper)
 * @param {String} hotelId - Hotel ID (optional - if not provided, checks all hotels)
 * @returns {Object} Expiration results
 */
const expireOldPoints = async (hotelId = null) => {
  try {
    const query = { isActive: true };
    if (hotelId) {
      query.hotel = hotelId;
    }

    const members = await LoyaltyMember.find(query).populate('guest', 'name email');
    let totalExpired = 0;
    let membersAffected = 0;

    for (const member of members) {
      const expiredPoints = member.expireOldPoints();

      if (expiredPoints > 0) {
        // Check for tier downgrade
        const program = await LoyaltyProgram.findOne({ hotel: member.hotel });
        if (program) {
          const newTier = determineTier(member.totalPoints, program.tierConfiguration);
          if (newTier && newTier.name !== member.currentTier) {
            member.updateTier(newTier.name, 'Points expiration');
          }
          member.calculateTierProgress(program.tierConfiguration);
        }

        await member.save();

        totalExpired += expiredPoints;
        membersAffected++;

        // Send expiration notification
        if (member.guest && member.guest.email) {
          try {
            await sendEmail({
              to: member.guest.email,
              subject: 'Loyalty Points Expired',
              template: 'pointsExpired',
              context: {
                guestName: member.guest.name,
                expiredPoints: expiredPoints,
                remainingPoints: member.availablePoints,
                currentTier: member.currentTier
              }
            });
          } catch (emailError) {
            console.error('Error sending points expiration email:', emailError);
          }
        }
      }
    }

    return {
      success: true,
      totalExpired,
      membersAffected
    };
  } catch (error) {
    console.error('Error expiring old points:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Get Guest Loyalty History
 * Retrieves guest's loyalty membership data including total nights stayed
 * @param {String} guestId - Guest user ID
 * @param {String} hotelId - Hotel ID
 * @returns {Object} Guest loyalty data or null
 */
const getGuestLoyaltyHistory = async (guestId, hotelId) => {
  try {
    const member = await LoyaltyMember.findOne({
      guest: guestId,
      hotel: hotelId
    }).populate('guest', 'name email');

    if (!member) {
      return null;
    }

    // Get nights history from points history
    const nightsHistory = member.pointsHistory
      .filter(entry => entry.type === 'NIGHTS' && entry.nights > 0)
      .map(entry => ({
        nights: entry.nights,
        points: entry.points,
        date: entry.date,
        bookingReference: entry.bookingReference
      }));

    return {
      exists: true,
      guestName: member.guest?.name || 'Guest',
      guestEmail: member.guest?.email,
      currentTier: member.currentTier,
      totalPoints: member.totalPoints,
      availablePoints: member.availablePoints,
      lifetimeSpending: member.lifetimeSpending,
      totalNightsStayed: member.totalNightsStayed || 0,
      joinDate: member.joinDate,
      isActive: member.isActive,
      nightsHistory: nightsHistory,
      tierProgress: member.tierProgress
    };
  } catch (error) {
    console.error('Error getting guest loyalty history:', error);
    return null;
  }
};

module.exports = {
  getOrCreateLoyaltyMember,
  calculatePriceWithLoyaltyDiscount,
  awardLoyaltyPoints,
  checkLoyaltyDiscount,
  expireOldPoints,
  getGuestLoyaltyHistory
};
