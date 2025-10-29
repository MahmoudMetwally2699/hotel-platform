const LoyaltyProgram = require('../models/LoyaltyProgram');
const LoyaltyMember = require('../models/LoyaltyMember');
const LoyaltyReward = require('../models/LoyaltyReward');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const Booking = require('../models/Booking');
const TransportationBooking = require('../models/TransportationBooking');
const {
  calculatePointsEarned,
  determineTier,
  calculateTierDiscount,
  calculateRedemptionValue,
  checkPointsExpiration,
  calculateTierProgress,
  applyLoyaltyDiscount,
  calculateBookingPriceWithLoyalty,
  validateTierConfiguration,
  calculateLoyaltyROI
} = require('../utils/loyaltyHelper');
const { sendEmail } = require('../utils/email');

/**
 * Helper function to get hotel ID from user object
 * @param {Object} user - Request user object
 * @returns {String} Hotel ID
 */
const getHotelId = (user) => {
  return user.hotelId || user.hotel || user.selectedHotelId?._id || user.selectedHotelId;
};

/**
 * Create or Update Loyalty Program Configuration (Channel-Based)
 * @route POST /hotel/loyalty/program
 * @access Hotel Admin
 */
exports.createOrUpdateProgram = async (req, res) => {
  try {
    const hotelId = getHotelId(req.user);

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: 'Hotel ID not found. Please ensure you are logged in as a hotel admin.'
      });
    }

    const {
      channel,
      tierConfiguration,
      pointsRules,
      redemptionRules,
      isActive,
      expirationMonths
    } = req.body;

    // Validate channel
    if (!channel || !['Travel Agency', 'Corporate', 'Direct'].includes(channel)) {
      return res.status(400).json({
        success: false,
        message: 'Valid channel is required: Travel Agency, Corporate, or Direct'
      });
    }

    // Validate tier configuration
    if (tierConfiguration) {
      console.log('Validating tier configuration:', JSON.stringify(tierConfiguration, null, 2));
      const validation = validateTierConfiguration(tierConfiguration);
      if (!validation.valid) {
        console.error('Tier configuration validation failed:', validation.errors);
        return res.status(400).json({
          success: false,
          message: 'Invalid tier configuration',
          errors: validation.errors,
          receivedConfig: tierConfiguration
        });
      }
    }

    // Get default settings for this channel
    const channelDefaults = LoyaltyProgram.getDefaultChannelSettings(channel);

    // Prepare update data
    const updateData = {
      hotel: hotelId,
      channel: channel,
      tierConfiguration: tierConfiguration || LoyaltyProgram.getDefaultTierConfiguration(),
      pointsRules: pointsRules || {
        pointsPerDollar: channelDefaults.pointsPerDollar,
        pointsPerNight: channelDefaults.pointsPerNight,
        serviceMultipliers: channelDefaults.serviceMultipliers
      },
      redemptionRules: redemptionRules || {
        pointsToMoneyRatio: channelDefaults.pointsToMoneyRatio,
        minimumRedemption: channelDefaults.minimumRedemption,
        maximumRedemption: channelDefaults.maximumRedemption
      },
      isActive: isActive !== undefined ? isActive : true,
      expirationMonths: expirationMonths !== undefined ? expirationMonths : 12
    };

    // Check if tier configuration changed (for existing programs)
    const existingProgram = await LoyaltyProgram.findOne({ hotel: hotelId, channel: channel });
    const tierConfigChanged = existingProgram && tierConfiguration &&
      JSON.stringify(tierConfiguration) !== JSON.stringify(existingProgram.tierConfiguration);

    // Use findOneAndUpdate with upsert to avoid duplicate key errors
    const program = await LoyaltyProgram.findOneAndUpdate(
      { hotel: hotelId, channel: channel },
      { $set: updateData },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    // Recalculate all member tiers if tier configuration changed
    let tierUpdateCount = 0;
    if (tierConfigChanged) {
      console.log('Tier configuration changed, recalculating member tiers...');
      const members = await LoyaltyMember.find({ hotel: hotelId });

      for (const member of members) {
        // Only recalculate if member's guest has matching channel
        const guest = await User.findById(member.guest).select('channel');
        if (guest && guest.channel === channel) {
          const newTier = determineTier(member.totalPoints, program.tierConfiguration);
          if (newTier && newTier.name !== member.currentTier) {
            const oldTier = member.currentTier;
            member.updateTier(newTier.name, 'Tier threshold changed by admin');
            member.calculateTierProgress(program.tierConfiguration);
            await member.save();
            tierUpdateCount++;
            console.log(`Member ${member.guest} tier updated: ${oldTier} → ${newTier.name}`);
          }
        }
      }
      console.log(`Tier recalculation complete: ${tierUpdateCount} members updated`);
    }

    res.status(existingProgram ? 200 : 201).json({
      success: true,
      message: tierUpdateCount > 0
        ? `Loyalty program for ${channel} ${existingProgram ? 'updated' : 'created'} successfully. ${tierUpdateCount} member(s) had tier changes.`
        : `Loyalty program for ${channel} ${existingProgram ? 'updated' : 'created'} successfully`,
      data: program,
      tierUpdates: tierUpdateCount
    });
  } catch (error) {
    console.error('Create/Update Loyalty Program Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get Hotel's Loyalty Program
 * @route GET /hotel/loyalty/program
 * @access Hotel Admin
 */
exports.getLoyaltyProgram = async (req, res) => {
  try {
    const hotelId = getHotelId(req.user);
    const { channel } = req.query;

    if (channel) {
      // Get specific channel program
      const program = await LoyaltyProgram.findOne({ hotel: hotelId, channel: channel });

      if (!program) {
        return res.status(404).json({
          success: false,
          message: `No loyalty program found for ${channel} channel`
        });
      }

      res.status(200).json({
        success: true,
        data: program
      });
    } else {
      // Get all channel programs
      const programs = await LoyaltyProgram.find({ hotel: hotelId });

      res.status(200).json({
        success: true,
        data: programs
      });
    }
  } catch (error) {
    console.error('Get Loyalty Program Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get All Channel Programs for Hotel
 * @route GET /hotel/loyalty/channels
 * @access Hotel Admin
 */
exports.getAllChannelPrograms = async (req, res) => {
  try {
    const hotelId = getHotelId(req.user);

    const programs = await LoyaltyProgram.find({ hotel: hotelId });

    // Create a map of channel to program
    const channelPrograms = {
      'Travel Agency': null,
      'Corporate': null,
      'Direct': null
    };

    programs.forEach(program => {
      channelPrograms[program.channel] = program;
    });

    // Fill in missing channels with default settings
    for (const channel in channelPrograms) {
      if (!channelPrograms[channel]) {
        channelPrograms[channel] = {
          channel: channel,
          exists: false,
          defaults: LoyaltyProgram.getDefaultChannelSettings(channel)
        };
      } else {
        channelPrograms[channel] = {
          ...channelPrograms[channel].toObject(),
          exists: true
        };
      }
    }

    res.status(200).json({
      success: true,
      data: channelPrograms
    });
  } catch (error) {
    console.error('Get All Channel Programs Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get Loyalty Program by Channel
 * @route GET /hotel/loyalty/program/:channel
 * @access Hotel Admin
 */
exports.getProgramByChannel = async (req, res) => {
  try {
    const hotelId = getHotelId(req.user);
    const { channel } = req.params;

    if (!['Travel Agency', 'Corporate', 'Direct'].includes(channel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid channel. Must be: Travel Agency, Corporate, or Direct'
      });
    }

    const program = await LoyaltyProgram.findOne({ hotel: hotelId, channel: channel });

    if (!program) {
      // Return default settings if no program exists
      const defaults = LoyaltyProgram.getDefaultChannelSettings(channel);
      return res.status(200).json({
        success: true,
        exists: false,
        data: {
          channel: channel,
          tierConfiguration: LoyaltyProgram.getDefaultTierConfiguration(),
          pointsRules: {
            pointsPerDollar: defaults.pointsPerDollar,
            pointsPerNight: defaults.pointsPerNight,
            serviceMultipliers: defaults.serviceMultipliers
          },
          redemptionRules: {
            pointsToMoneyRatio: defaults.pointsToMoneyRatio,
            minimumRedemption: defaults.minimumRedemption,
            maximumRedemption: defaults.maximumRedemption
          },
          isActive: true,
          expirationMonths: 12
        }
      });
    }

    res.status(200).json({
      success: true,
      exists: true,
      data: program
    });
  } catch (error) {
    console.error('Get Program by Channel Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get All Loyalty Members
 * @route GET /hotel/loyalty/members
 * @access Hotel Admin
 */
exports.getAllMembers = async (req, res) => {
  try {
    const hotelId = getHotelId(req.user);
    const {
      page = 1,
      limit = 20,
      tier,
      channel,
      minPoints,
      maxPoints,
      sortBy = 'totalPoints',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build query
    const query = { hotel: hotelId, isActive: true };

    if (tier) {
      query.currentTier = tier;
    }

    if (minPoints !== undefined || maxPoints !== undefined) {
      query.totalPoints = {};
      if (minPoints !== undefined) query.totalPoints.$gte = Number(minPoints);
      if (maxPoints !== undefined) query.totalPoints.$lte = Number(maxPoints);
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get members with guest details
    let members = await LoyaltyMember.find(query)
      .populate('guest', 'firstName lastName name email phone channel checkInDate checkOutDate stayHistory')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(Number(limit));

    // Calculate nights stayed from check-in and check-out dates + stay history
    members = members.map(member => {
      const memberObj = member.toObject();

      let totalNights = memberObj.totalNightsStayed || 0;

      // Calculate nights from guest's current check-in/check-out dates
      if (memberObj.guest?.checkInDate && memberObj.guest?.checkOutDate) {
        const checkIn = new Date(memberObj.guest.checkInDate);
        const checkOut = new Date(memberObj.guest.checkOutDate);
        const diffTime = Math.abs(checkOut - checkIn);
        const currentNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalNights = Math.max(totalNights, currentNights);
      }

      // Add nights from stay history
      if (memberObj.guest?.stayHistory && Array.isArray(memberObj.guest.stayHistory)) {
        const historyNights = memberObj.guest.stayHistory.reduce((sum, stay) => {
          return sum + (stay.numberOfNights || 0);
        }, 0);
        totalNights += historyNights;
      }

      memberObj.totalNightsStayed = totalNights;

      return memberObj;
    });

    // Apply channel filter if provided (filter on populated guest data)
    if (channel) {
      members = members.filter(member => member.guest?.channel === channel);
    }

    // Apply search filter if provided
    if (search) {
      members = members.filter(member => {
        const guestName = member.guest?.name?.toLowerCase() || '';
        const guestEmail = member.guest?.email?.toLowerCase() || '';
        const searchLower = search.toLowerCase();
        return guestName.includes(searchLower) || guestEmail.includes(searchLower);
      });
    }

    const total = await LoyaltyMember.countDocuments(query);

    res.status(200).json({
      success: true,
      data: members,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get All Members Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get Specific Member Details
 * @route GET /hotel/loyalty/members/:memberId
 * @access Hotel Admin
 */
exports.getMemberDetails = async (req, res) => {
  try {
    const hotelId = getHotelId(req.user);
    const { memberId } = req.params;

    const member = await LoyaltyMember.findOne({
      _id: memberId,
      hotel: hotelId
    }).populate('guest', 'name email phone');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Get loyalty program for tier details
    const program = await LoyaltyProgram.findOne({ hotel: hotelId });

    // Calculate tier progress
    if (program) {
      member.calculateTierProgress(program.tierConfiguration);
      await member.save();
    }

    res.status(200).json({
      success: true,
      data: member
    });
  } catch (error) {
    console.error('Get Member Details Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get Guest Loyalty History by Guest ID
 * @route GET /hotel/loyalty/guest-history/:guestId
 * @access Hotel Admin
 */
exports.getGuestLoyaltyHistory = async (req, res) => {
  try {
    const hotelId = getHotelId(req.user);
    const { guestId } = req.params;

    const { getGuestLoyaltyHistory } = require('../utils/loyaltyIntegration');
    const historyData = await getGuestLoyaltyHistory(guestId, hotelId);

    if (!historyData) {
      return res.status(404).json({
        success: false,
        message: 'Guest is not a loyalty member at this hotel',
        data: {
          exists: false,
          totalNightsStayed: 0
        }
      });
    }

    res.status(200).json({
      success: true,
      data: historyData
    });
  } catch (error) {
    console.error('Get Guest Loyalty History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Manually Adjust Member Points
 * @route POST /hotel/loyalty/members/:memberId/adjust-points
 * @access Hotel Admin
 */
exports.adjustMemberPoints = async (req, res) => {
  try {
    const hotelId = getHotelId(req.user);
    const { memberId } = req.params;
    const { points, reason, adminNote, generatePDF } = req.body;

    if (!points || points === 0) {
      return res.status(400).json({
        success: false,
        message: 'Points value is required and must be non-zero'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason for adjustment is required'
      });
    }

    const member = await LoyaltyMember.findOne({
      _id: memberId,
      hotel: hotelId
    }).populate('guest', 'firstName lastName name email phone');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Get loyalty program and hotel details
    const program = await LoyaltyProgram.findOne({ hotel: hotelId });
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty program not found'
      });
    }

    const hotel = await Hotel.findById(hotelId).select('name location');

    // Adjust points
    const oldPoints = member.totalPoints;
    const oldTier = member.currentTier;

    member.adjustPoints(Number(points), reason, adminNote || '');

    // Check for tier change
    const newTier = determineTier(member.totalPoints, program.tierConfiguration);
    if (newTier && newTier.name !== member.currentTier) {
      const tierUpdate = member.updateTier(newTier.name, 'Admin adjustment');

      if (tierUpdate.upgraded) {
        // Send tier upgrade notification
        try {
          await sendEmail({
            to: member.guest.email,
            subject: 'Loyalty Tier Updated',
            template: 'tierUpdate',
            context: {
              guestName: member.guest.name,
              oldTier: tierUpdate.oldTier,
              newTier: tierUpdate.newTier,
              benefits: newTier.benefits
            }
          });
        } catch (emailError) {
          console.error('Error sending tier update email:', emailError);
        }
      }
    }

    // Update tier progress
    member.calculateTierProgress(program.tierConfiguration);

    await member.save();

    // Update program statistics
    if (points > 0) {
      program.statistics.totalPointsIssued += points;
      await program.save();
    }

    // Generate PDF if requested
    if (generatePDF) {
      try {
        const { generatePointsAdjustmentPDF } = require('../utils/pdfGenerator');

        // Build guest display name - handle different name formats
        let guestDisplayName = 'Guest';
        if (member.guest?.name) {
          guestDisplayName = member.guest.name;
        } else if (member.guest?.firstName || member.guest?.lastName) {
          const firstName = member.guest.firstName || '';
          const lastName = member.guest.lastName || '';
          guestDisplayName = `${firstName} ${lastName}`.trim();
        } else if (member.guest?.email) {
          guestDisplayName = member.guest.email.split('@')[0];
        }

        const pdfData = {
          member: {
            guestName: guestDisplayName,
            email: member.guest?.email || 'no-email@example.com',
            phone: member.guest?.phone || 'N/A',
            currentTier: member.currentTier,
            totalNights: member.totalNightsStayed || 0,
            lifetimeSpend: member.lifetimeSpending || 0,
            joinDate: member.joinDate
          },
          adjustment: {
            type: Number(points) > 0 ? 'add' : 'deduct',
            amount: Math.abs(Number(points)),
            previousPoints: oldPoints,
            newPoints: member.totalPoints,
            reason: reason || 'No reason provided'
          },
          hotel: {
            name: hotel?.name || 'Hotel Management System'
          }
        };

        // Generate PDF and collect chunks
        const chunks = [];
        const pdfDoc = generatePointsAdjustmentPDF(pdfData);

        let responseHandled = false;

        pdfDoc.on('data', (chunk) => chunks.push(chunk));

        pdfDoc.on('end', () => {
          if (responseHandled) return;
          responseHandled = true;

          try {
            const pdfBuffer = Buffer.concat(chunks);

            // Set response headers for PDF download
            const fileNameSafe = (guestDisplayName || 'member').replace(/\s+/g, '-');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=points-adjustment-${fileNameSafe}-${Date.now()}.pdf`);
            res.setHeader('Content-Length', pdfBuffer.length);

            // Send the PDF buffer
            res.send(pdfBuffer);
          } catch (sendError) {
            console.error('Error sending PDF:', sendError);
            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                message: 'Failed to send PDF report',
                error: sendError.message
              });
            }
          }
        });

        pdfDoc.on('error', (error) => {
          if (responseHandled) return;
          responseHandled = true;

          console.error('PDF Generation Error:', error);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'Failed to generate PDF report',
              error: error.message
            });
          }
        });

        pdfDoc.end();
      } catch (pdfError) {
        console.error('PDF Setup Error:', pdfError);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Failed to initialize PDF generator',
            error: pdfError.message
          });
        }
      }
    } else {
      res.status(200).json({
        success: true,
        message: 'Points adjusted successfully',
        data: {
          member,
          adjustment: {
            oldPoints,
            newPoints: member.totalPoints,
            pointsAdjusted: points,
            oldTier,
            newTier: member.currentTier
          }
        }
      });
    }
  } catch (error) {
    console.error('Adjust Member Points Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Manually Change Member Tier
 * @route POST /hotel/loyalty/members/:memberId/change-tier
 * @access Hotel Admin
 */
exports.changeMemberTier = async (req, res) => {
  try {
    const hotelId = getHotelId(req.user);
    const { memberId } = req.params;
    const { tier, reason } = req.body;

    if (!tier) {
      return res.status(400).json({
        success: false,
        message: 'Tier is required'
      });
    }

    const validTiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tier. Must be one of: ' + validTiers.join(', ')
      });
    }

    const member = await LoyaltyMember.findOne({
      _id: memberId,
      hotel: hotelId
    }).populate('guest', 'name email');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const oldTier = member.currentTier;
    const tierUpdate = member.updateTier(tier, reason || 'Manual admin change');

    if (tierUpdate.upgraded) {
      // Get program for tier details
      const program = await LoyaltyProgram.findOne({ hotel: hotelId });
      const newTierConfig = program?.tierConfiguration.find(t => t.name === tier);

      // Send notification
      try {
        await sendEmail({
          to: member.guest.email,
          subject: 'Loyalty Tier Changed',
          template: 'tierUpdate',
          context: {
            guestName: member.guest.name,
            oldTier: oldTier,
            newTier: tier,
            benefits: newTierConfig?.benefits || []
          }
        });
      } catch (emailError) {
        console.error('Error sending tier change email:', emailError);
      }
    }

    await member.save();

    res.status(200).json({
      success: true,
      message: 'Tier changed successfully',
      data: {
        member,
        tierChange: {
          oldTier,
          newTier: tier
        }
      }
    });
  } catch (error) {
    console.error('Change Member Tier Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get Loyalty Analytics
 * @route GET /hotel/loyalty/analytics
 * @access Hotel Admin
 */
exports.getLoyaltyAnalytics = async (req, res) => {
  try {
    const hotelId = getHotelId(req.user);

    const program = await LoyaltyProgram.findOne({ hotel: hotelId });
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty program not found'
      });
    }

    // Get member statistics
    const totalMembers = await LoyaltyMember.countDocuments({ hotel: hotelId, isActive: true });

    const membersByTier = await LoyaltyMember.aggregate([
      { $match: { hotel: hotelId, isActive: true } },
      { $group: { _id: '$currentTier', count: { $sum: 1 } } }
    ]);

    // Get points statistics
    const pointsStats = await LoyaltyMember.aggregate([
      { $match: { hotel: hotelId, isActive: true } },
      {
        $group: {
          _id: null,
          totalPointsIssued: { $sum: '$lifetimePointsEarned' },
          totalPointsRedeemed: { $sum: '$lifetimePointsRedeemed' },
          totalPointsAvailable: { $sum: '$availablePoints' },
          totalLifetimeSpending: { $sum: '$lifetimeSpending' }
        }
      }
    ]);

    // Get reward statistics
    const rewardStats = await LoyaltyReward.aggregate([
      { $match: { hotel: hotelId } },
      {
        $group: {
          _id: null,
          totalRewards: { $sum: 1 },
          activeRewards: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalRedemptions: { $sum: '$timesRedeemed' },
          totalValueRedeemed: { $sum: '$statistics.totalValueRedeemed' }
        }
      }
    ]);

    // Get recent activity (only active members)
    let recentMembers = await LoyaltyMember.find({ hotel: hotelId, isActive: true })
      .sort({ joinDate: -1 })
      .limit(5)
      .populate('guest', 'firstName lastName name email phone checkInDate checkOutDate stayHistory');

    // Calculate nights stayed from check-in and check-out dates + stay history for recent members
    recentMembers = recentMembers.map(member => {
      const memberObj = member.toObject();

      let totalNights = memberObj.totalNightsStayed || 0;

      // Calculate nights from guest's current check-in/check-out dates
      if (memberObj.guest?.checkInDate && memberObj.guest?.checkOutDate) {
        const checkIn = new Date(memberObj.guest.checkInDate);
        const checkOut = new Date(memberObj.guest.checkOutDate);
        const diffTime = Math.abs(checkOut - checkIn);
        const currentNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalNights = Math.max(totalNights, currentNights);
      }

      // Add nights from stay history
      if (memberObj.guest?.stayHistory && Array.isArray(memberObj.guest.stayHistory)) {
        const historyNights = memberObj.guest.stayHistory.reduce((sum, stay) => {
          return sum + (stay.numberOfNights || 0);
        }, 0);
        totalNights += historyNights;
      }

      memberObj.totalNightsStayed = totalNights;

      return memberObj;
    });

    // Top members by spending
    let topMembers = await LoyaltyMember.find({ hotel: hotelId, isActive: true })
      .sort({ lifetimeSpending: -1 })
      .limit(10)
      .populate('guest', 'firstName lastName name email phone checkInDate checkOutDate stayHistory');

    // Calculate nights stayed for top members too
    topMembers = topMembers.map(member => {
      const memberObj = member.toObject();

      let totalNights = memberObj.totalNightsStayed || 0;

      // Calculate nights from guest's current check-in/check-out dates
      if (memberObj.guest?.checkInDate && memberObj.guest?.checkOutDate) {
        const checkIn = new Date(memberObj.guest.checkInDate);
        const checkOut = new Date(memberObj.guest.checkOutDate);
        const diffTime = Math.abs(checkOut - checkIn);
        const currentNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalNights = Math.max(totalNights, currentNights);
      }

      // Add nights from stay history
      if (memberObj.guest?.stayHistory && Array.isArray(memberObj.guest.stayHistory)) {
        const historyNights = memberObj.guest.stayHistory.reduce((sum, stay) => {
          return sum + (stay.numberOfNights || 0);
        }, 0);
        totalNights += historyNights;
      }

      memberObj.totalNightsStayed = totalNights;

      return memberObj;
    });

    // Calculate ROI
    const totalRevenueFromLoyalMembers = pointsStats[0]?.totalLifetimeSpending || 0;
    const totalRewardsCost = rewardStats[0]?.totalValueRedeemed || 0;

    // Estimate discount costs
    const discountCosts = await LoyaltyMember.aggregate([
      { $match: { hotel: hotelId, isActive: true } },
      {
        $project: {
          estimatedDiscountCost: {
            $multiply: [
              '$lifetimeSpending',
              {
                $switch: {
                  branches: [
                    { case: { $eq: ['$currentTier', 'BRONZE'] }, then: 0.05 },
                    { case: { $eq: ['$currentTier', 'SILVER'] }, then: 0.10 },
                    { case: { $eq: ['$currentTier', 'GOLD'] }, then: 0.15 },
                    { case: { $eq: ['$currentTier', 'PLATINUM'] }, then: 0.20 }
                  ],
                  default: 0.05
                }
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalDiscounts: { $sum: '$estimatedDiscountCost' }
        }
      }
    ]);

    const totalDiscountsGiven = discountCosts[0]?.totalDiscounts || 0;
    const roi = calculateLoyaltyROI(totalRevenueFromLoyalMembers, totalRewardsCost, totalDiscountsGiven);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalMembers,
          totalPointsIssued: pointsStats[0]?.totalPointsIssued || 0,
          totalPointsRedeemed: pointsStats[0]?.totalPointsRedeemed || 0,
          totalPointsAvailable: pointsStats[0]?.totalPointsAvailable || 0,
          totalLifetimeSpending: totalRevenueFromLoyalMembers,
          totalRewards: rewardStats[0]?.totalRewards || 0,
          activeRewards: rewardStats[0]?.activeRewards || 0,
          totalRedemptions: rewardStats[0]?.totalRedemptions || 0
        },
        membersByTier: membersByTier.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        roi: {
          totalRevenue: totalRevenueFromLoyalMembers,
          totalCosts: totalRewardsCost + totalDiscountsGiven,
          rewardsCost: totalRewardsCost,
          discountsCost: totalDiscountsGiven,
          roi: roi.roi,
          roiPercentage: roi.roiPercentage
        },
        recentMembers,
        topMembers
      }
    });
  } catch (error) {
    console.error('Get Loyalty Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Create New Reward
 * @route POST /hotel/loyalty/rewards
 * @access Hotel Admin
 */
exports.createReward = async (req, res) => {
  try {
    const hotelId = getHotelId(req.user);
    const {
      name,
      description,
      pointsCost,
      category,
      value,
      requiredTier,
      validityDays,
      usageLimit,
      termsAndConditions,
      imageUrl
    } = req.body;

    // Validation
    if (!name || !description || !pointsCost || !category || !value) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, points cost, category, and value are required'
      });
    }

    const reward = new LoyaltyReward({
      hotel: hotelId,
      name,
      description,
      pointsCost: Number(pointsCost),
      category,
      value: Number(value),
      requiredTier: requiredTier || 'BRONZE',
      validityDays: validityDays || 30,
      usageLimit: usageLimit || null,
      termsAndConditions: termsAndConditions || '',
      imageUrl: imageUrl || '',
      createdBy: req.user._id
    });

    await reward.save();

    res.status(201).json({
      success: true,
      message: 'Reward created successfully',
      data: reward
    });
  } catch (error) {
    console.error('Create Reward Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get All Rewards
 * @route GET /hotel/loyalty/rewards
 * @access Hotel Admin
 */
exports.getRewards = async (req, res) => {
  try {
    const hotelId = getHotelId(req.user);
    const { category, tier, isActive } = req.query;

    const query = { hotel: hotelId };

    if (category) query.category = category;
    if (tier) query.requiredTier = tier;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const rewards = await LoyaltyReward.find(query).sort({ pointsCost: 1 });

    res.status(200).json({
      success: true,
      data: rewards
    });
  } catch (error) {
    console.error('Get Rewards Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Update Reward
 * @route PUT /hotel/loyalty/rewards/:rewardId
 * @access Hotel Admin
 */
exports.updateReward = async (req, res) => {
  try {
    const hotelId = getHotelId(req.user);
    const { rewardId } = req.params;

    const reward = await LoyaltyReward.findOne({
      _id: rewardId,
      hotel: hotelId
    });

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    // Update fields
    const updateFields = [
      'name', 'description', 'pointsCost', 'category', 'value',
      'requiredTier', 'validityDays', 'usageLimit', 'termsAndConditions',
      'imageUrl', 'isActive'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        reward[field] = req.body[field];
      }
    });

    await reward.save();

    res.status(200).json({
      success: true,
      message: 'Reward updated successfully',
      data: reward
    });
  } catch (error) {
    console.error('Update Reward Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Delete Reward
 * @route DELETE /hotel/loyalty/rewards/:rewardId
 * @access Hotel Admin
 */
exports.deleteReward = async (req, res) => {
  try {
    const hotelId = getHotelId(req.user);
    const { rewardId } = req.params;

    const reward = await LoyaltyReward.findOne({
      _id: rewardId,
      hotel: hotelId
    });

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    // Soft delete by marking as inactive
    reward.isActive = false;
    await reward.save();

    res.status(200).json({
      success: true,
      message: 'Reward deleted successfully'
    });
  } catch (error) {
    console.error('Delete Reward Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get My Membership (Guest)
 * @route GET /loyalty/my-membership
 * @access Guest
 */
exports.getMyMembership = async (req, res) => {
  try {
    const guestId = req.user._id;
    const { hotelId } = req.query;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: 'Hotel ID is required'
      });
    }

    let member = await LoyaltyMember.findOne({
      guest: guestId,
      hotel: hotelId
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'No membership found for this hotel'
      });
    }

    // Get loyalty program
    const program = await LoyaltyProgram.findOne({ hotel: hotelId });
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty program not found'
      });
    }

    // Check and expire old points
    const expiredPoints = member.expireOldPoints();
    if (expiredPoints > 0) {
      await member.save();
    }

    // Update tier progress
    member.calculateTierProgress(program.tierConfiguration);
    await member.save();

    // Get tier details
    const currentTierConfig = program.tierConfiguration.find(t => t.name === member.currentTier);

    res.status(200).json({
      success: true,
      data: {
        member,
        tierDetails: currentTierConfig,
        program: {
          isActive: program.isActive,
          pointsRules: program.pointsRules,
          redemptionRules: program.redemptionRules,
          expirationMonths: program.expirationMonths
        }
      }
    });
  } catch (error) {
    console.error('Get My Membership Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get Available Rewards (Guest)
 * @route GET /loyalty/available-rewards
 * @access Guest
 */
exports.getAvailableRewards = async (req, res) => {
  try {
    const guestId = req.user._id;
    const { hotelId } = req.query;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: 'Hotel ID is required'
      });
    }

    // Get member
    const member = await LoyaltyMember.findOne({
      guest: guestId,
      hotel: hotelId
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'No membership found'
      });
    }

    // Get all active rewards
    const rewards = await LoyaltyReward.find({
      hotel: hotelId,
      isActive: true
    }).sort({ pointsCost: 1 });

    // Check which rewards member can redeem
    const rewardsWithStatus = rewards.map(reward => {
      const canRedeem = reward.canMemberRedeem(member);
      return {
        ...reward.toObject(),
        canRedeem: canRedeem.available,
        reason: canRedeem.reason || null,
        pointsNeeded: canRedeem.pointsNeeded || 0
      };
    });

    res.status(200).json({
      success: true,
      data: rewardsWithStatus
    });
  } catch (error) {
    console.error('Get Available Rewards Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Redeem Reward (Guest)
 * @route POST /loyalty/redeem/:rewardId
 * @access Guest
 */
exports.redeemReward = async (req, res) => {
  try {
    const guestId = req.user._id;
    const { rewardId } = req.params;
    const { hotelId } = req.body;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: 'Hotel ID is required'
      });
    }

    // Get member
    const member = await LoyaltyMember.findOne({
      guest: guestId,
      hotel: hotelId
    }).populate('guest', 'name email');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'No membership found'
      });
    }

    // Get reward
    const reward = await LoyaltyReward.findOne({
      _id: rewardId,
      hotel: hotelId
    });

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    // Check if member can redeem
    const canRedeem = reward.canMemberRedeem(member);
    if (!canRedeem.available) {
      return res.status(400).json({
        success: false,
        message: canRedeem.reason
      });
    }

    // Redeem points
    member.redeemPoints(
      reward.pointsCost,
      reward.value,
      reward.name,
      reward._id
    );

    // Update reward statistics
    reward.incrementRedemption();

    await member.save();
    await reward.save();

    // Update program statistics
    const program = await LoyaltyProgram.findOne({ hotel: hotelId });
    if (program) {
      program.statistics.totalPointsRedeemed += reward.pointsCost;
      await program.save();
    }

    // Send confirmation email
    try {
      await sendEmail({
        to: member.guest.email,
        subject: 'Reward Redeemed Successfully',
        template: 'rewardRedeemed',
        context: {
          guestName: member.guest.name,
          rewardName: reward.name,
          pointsCost: reward.pointsCost,
          remainingPoints: member.availablePoints,
          validityDays: reward.validityDays
        }
      });
    } catch (emailError) {
      console.error('Error sending redemption email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Reward redeemed successfully',
      data: {
        reward,
        pointsUsed: reward.pointsCost,
        remainingPoints: member.availablePoints
      }
    });
  } catch (error) {
    console.error('Redeem Reward Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * Get Points History (Guest)
 * @route GET /loyalty/my-history
 * @access Guest
 */
exports.getPointsHistory = async (req, res) => {
  try {
    const guestId = req.user._id;
    const { hotelId, type, limit = 50 } = req.query;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: 'Hotel ID is required'
      });
    }

    const member = await LoyaltyMember.findOne({
      guest: guestId,
      hotel: hotelId
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'No membership found'
      });
    }

    let pointsHistory = member.pointsHistory;
    let redemptionHistory = member.redemptionHistory;

    // Filter by type if provided
    if (type) {
      if (type === 'REDEEMED') {
        pointsHistory = [];
      } else if (type === 'EARNED') {
        redemptionHistory = [];
        pointsHistory = pointsHistory.filter(h => h.type === 'EARNED');
      } else {
        pointsHistory = pointsHistory.filter(h => h.type === type);
        redemptionHistory = [];
      }
    }

    // Sort by date descending and limit
    pointsHistory = pointsHistory
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, Number(limit));

    redemptionHistory = redemptionHistory
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, Number(limit));

    res.status(200).json({
      success: true,
      data: {
        pointsHistory,
        redemptionHistory,
        summary: {
          totalPointsEarned: member.lifetimePointsEarned,
          totalPointsRedeemed: member.lifetimePointsRedeemed,
          availablePoints: member.availablePoints,
          totalPoints: member.totalPoints
        }
      }
    });
  } catch (error) {
    console.error('Get Points History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get Program Details for a Hotel (Guest)
 * @route GET /loyalty/program-details/:hotelId
 * @access Guest
 */
exports.getProgramDetails = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const program = await LoyaltyProgram.findOne({
      hotel: hotelId,
      isActive: true
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'No active loyalty program found for this hotel'
      });
    }

    // Get hotel details
    const hotel = await Hotel.findById(hotelId).select('name location');

    res.status(200).json({
      success: true,
      data: {
        hotel,
        program: {
          tierConfiguration: program.tierConfiguration,
          pointsRules: program.pointsRules,
          redemptionRules: program.redemptionRules,
          expirationMonths: program.expirationMonths
        }
      }
    });
  } catch (error) {
    console.error('Get Program Details Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Export Member Report (Hotel Admin)
 * @route GET /hotel/loyalty/reports
 * @access Hotel Admin
 */
exports.exportMemberReport = async (req, res) => {
  try {
    const hotelId = getHotelId(req.user);

    const members = await LoyaltyMember.find({ hotel: hotelId })
      .populate('guest', 'name email phone')
      .sort({ totalPoints: -1 });

    // Format data for CSV export
    const csvData = members.map(member => ({
      'Guest Name': member.guest?.name || 'N/A',
      'Email': member.guest?.email || 'N/A',
      'Phone': member.guest?.phone || 'N/A',
      'Current Tier': member.currentTier,
      'Total Points': member.totalPoints,
      'Available Points': member.availablePoints,
      'Lifetime Spending': `$${member.lifetimeSpending.toFixed(2)}`,
      'Join Date': new Date(member.joinDate).toLocaleDateString(),
      'Last Activity': new Date(member.lastActivity).toLocaleDateString(),
      'Status': member.isActive ? 'Active' : 'Inactive'
    }));

    res.status(200).json({
      success: true,
      data: csvData
    });
  } catch (error) {
    console.error('Export Member Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = exports;
