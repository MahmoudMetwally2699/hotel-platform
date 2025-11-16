/**
 * Hotel Group Controller
 *
 * Manages hotel groups for shared loyalty programs
 * Super Admin only
 */

const HotelGroup = require('../models/HotelGroup');
const Hotel = require('../models/Hotel');
const LoyaltyMember = require('../models/LoyaltyMember');
const User = require('../models/User');

/**
 * Create a new hotel group
 * @route POST /api/hotel-groups
 * @access Super Admin
 */
exports.createHotelGroup = async (req, res) => {
  try {
    const { name, description, hotels } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    // Check if group name already exists
    const existing = await HotelGroup.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A hotel group with this name already exists'
      });
    }

    // Validate hotels exist and are not already in another group
    if (hotels && hotels.length > 0) {
      const hotelDocs = await Hotel.find({ _id: { $in: hotels } });

      if (hotelDocs.length !== hotels.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more hotels not found'
        });
      }

      // Check if any hotel is already in a group
      const hotelsInGroups = hotelDocs.filter(h => h.hotelGroupId);
      if (hotelsInGroups.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Hotels already in groups: ${hotelsInGroups.map(h => h.name).join(', ')}`,
          hotelsInGroups: hotelsInGroups.map(h => ({ id: h._id, name: h.name, currentGroup: h.hotelGroupId }))
        });
      }
    }

    // Create hotel group
    const hotelGroup = new HotelGroup({
      name,
      description,
      hotels: hotels || [],
      createdBy: req.user._id,
      isActive: true
    });

    await hotelGroup.save();

    // Update hotels with group ID
    if (hotels && hotels.length > 0) {
      await Hotel.updateMany(
        { _id: { $in: hotels } },
        { $set: { hotelGroupId: hotelGroup._id } }
      );
    }

    // Populate hotels
    await hotelGroup.populate('hotels', 'name email address.city address.country');

    res.status(201).json({
      success: true,
      message: 'Hotel group created successfully',
      data: hotelGroup
    });

  } catch (error) {
    console.error('Error creating hotel group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create hotel group',
      error: error.message
    });
  }
};

/**
 * Get all hotel groups
 * @route GET /api/hotel-groups
 * @access Super Admin
 */
exports.getAllHotelGroups = async (req, res) => {
  try {
    const { isActive, search, page = 1, limit = 20 } = req.query;

    // Build query
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const hotelGroups = await HotelGroup.find(query)
      .populate('hotels', 'name email address.city address.country isActive')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await HotelGroup.countDocuments(query);

    res.json({
      success: true,
      data: hotelGroups,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching hotel groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hotel groups',
      error: error.message
    });
  }
};

/**
 * Get hotel group by ID
 * @route GET /api/hotel-groups/:groupId
 * @access Super Admin
 */
exports.getHotelGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;

    const hotelGroup = await HotelGroup.findById(groupId)
      .populate('hotels', 'name email address phone website starRating category isActive')
      .populate('createdBy', 'name email');

    if (!hotelGroup) {
      return res.status(404).json({
        success: false,
        message: 'Hotel group not found'
      });
    }

    // Get loyalty statistics for the group
    const loyaltyStats = await LoyaltyMember.aggregate([
      {
        $match: {
          hotelGroupId: hotelGroup._id
        }
      },
      {
        $group: {
          _id: null,
          totalMembers: { $sum: 1 },
          totalPoints: { $sum: '$totalPoints' },
          totalSpending: { $sum: '$lifetimeSpending' },
          avgPointsPerMember: { $avg: '$totalPoints' }
        }
      }
    ]);

    const stats = loyaltyStats[0] || {
      totalMembers: 0,
      totalPoints: 0,
      totalSpending: 0,
      avgPointsPerMember: 0
    };

    res.json({
      success: true,
      data: {
        ...hotelGroup.toObject(),
        loyaltyStats: stats
      }
    });

  } catch (error) {
    console.error('Error fetching hotel group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hotel group',
      error: error.message
    });
  }
};

/**
 * Update hotel group
 * @route PATCH /api/hotel-groups/:groupId
 * @access Super Admin
 */
exports.updateHotelGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, isActive } = req.body;

    const hotelGroup = await HotelGroup.findById(groupId);

    if (!hotelGroup) {
      return res.status(404).json({
        success: false,
        message: 'Hotel group not found'
      });
    }

    // Check if new name conflicts with existing group
    if (name && name !== hotelGroup.name) {
      const existing = await HotelGroup.findOne({ name, _id: { $ne: groupId } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'A hotel group with this name already exists'
        });
      }
      hotelGroup.name = name;
    }

    if (description !== undefined) hotelGroup.description = description;
    if (isActive !== undefined) hotelGroup.isActive = isActive;

    await hotelGroup.save();

    await hotelGroup.populate('hotels', 'name email address.city address.country');

    res.json({
      success: true,
      message: 'Hotel group updated successfully',
      data: hotelGroup
    });

  } catch (error) {
    console.error('Error updating hotel group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hotel group',
      error: error.message
    });
  }
};

/**
 * Delete hotel group
 * @route DELETE /api/hotel-groups/:groupId
 * @access Super Admin
 */
exports.deleteHotelGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const hotelGroup = await HotelGroup.findById(groupId);

    if (!hotelGroup) {
      return res.status(404).json({
        success: false,
        message: 'Hotel group not found'
      });
    }

    // Remove group ID from all hotels in the group
    await Hotel.updateMany(
      { hotelGroupId: groupId },
      { $set: { hotelGroupId: null } }
    );

    // Note: We don't delete loyalty members - they keep their points
    // but they're no longer linked across hotels

    await hotelGroup.deleteOne();

    res.json({
      success: true,
      message: 'Hotel group deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting hotel group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete hotel group',
      error: error.message
    });
  }
};

/**
 * Add hotels to group
 * @route PATCH /api/hotel-groups/:groupId/hotels/add
 * @access Super Admin
 */
exports.addHotelsToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { hotelIds } = req.body;

    if (!hotelIds || !Array.isArray(hotelIds) || hotelIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Hotel IDs array is required'
      });
    }

    const hotelGroup = await HotelGroup.findById(groupId);

    if (!hotelGroup) {
      return res.status(404).json({
        success: false,
        message: 'Hotel group not found'
      });
    }

    // Validate hotels exist and are not already in another group
    const hotels = await Hotel.find({ _id: { $in: hotelIds } });

    if (hotels.length !== hotelIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more hotels not found'
      });
    }

    // Check if any hotel is already in a different group
    const hotelsInOtherGroups = hotels.filter(
      h => h.hotelGroupId && h.hotelGroupId.toString() !== groupId.toString()
    );

    if (hotelsInOtherGroups.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Hotels already in other groups: ${hotelsInOtherGroups.map(h => h.name).join(', ')}`
      });
    }

    // Add hotels to group
    hotelIds.forEach(hotelId => {
      if (!hotelGroup.hotels.includes(hotelId)) {
        hotelGroup.addHotel(hotelId);
      }
    });

    await hotelGroup.save();

    // Update hotels with group ID
    await Hotel.updateMany(
      { _id: { $in: hotelIds } },
      { $set: { hotelGroupId: groupId } }
    );

    await hotelGroup.populate('hotels', 'name email address.city address.country');

    res.json({
      success: true,
      message: 'Hotels added to group successfully',
      data: hotelGroup
    });

  } catch (error) {
    console.error('Error adding hotels to group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add hotels to group',
      error: error.message
    });
  }
};

/**
 * Remove hotels from group
 * @route PATCH /api/hotel-groups/:groupId/hotels/remove
 * @access Super Admin
 */
exports.removeHotelsFromGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { hotelIds } = req.body;

    if (!hotelIds || !Array.isArray(hotelIds) || hotelIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Hotel IDs array is required'
      });
    }

    const hotelGroup = await HotelGroup.findById(groupId);

    if (!hotelGroup) {
      return res.status(404).json({
        success: false,
        message: 'Hotel group not found'
      });
    }

    // Remove hotels from group
    hotelIds.forEach(hotelId => {
      hotelGroup.removeHotel(hotelId);
    });

    await hotelGroup.save();

    // Remove group ID from hotels
    await Hotel.updateMany(
      { _id: { $in: hotelIds } },
      { $set: { hotelGroupId: null } }
    );

    await hotelGroup.populate('hotels', 'name email address.city address.country');

    res.json({
      success: true,
      message: 'Hotels removed from group successfully',
      data: hotelGroup
    });

  } catch (error) {
    console.error('Error removing hotels from group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove hotels from group',
      error: error.message
    });
  }
};

/**
 * Get group analytics
 * @route GET /api/hotel-groups/:groupId/analytics
 * @access Super Admin
 */
exports.getGroupAnalytics = async (req, res) => {
  try {
    const { groupId } = req.params;

    const hotelGroup = await HotelGroup.findById(groupId).populate('hotels', 'name');

    if (!hotelGroup) {
      return res.status(404).json({
        success: false,
        message: 'Hotel group not found'
      });
    }

    // Get loyalty member statistics
    const memberStats = await LoyaltyMember.aggregate([
      {
        $match: {
          hotelGroupId: hotelGroup._id
        }
      },
      {
        $group: {
          _id: null,
          totalMembers: { $sum: 1 },
          totalPoints: { $sum: '$totalPoints' },
          totalTierPoints: { $sum: '$tierPoints' },
          totalAvailablePoints: { $sum: '$availablePoints' },
          totalSpending: { $sum: '$lifetimeSpending' },
          totalPointsEarned: { $sum: '$lifetimePointsEarned' },
          totalPointsRedeemed: { $sum: '$lifetimePointsRedeemed' },
          avgPointsPerMember: { $avg: '$totalPoints' },
          avgSpendingPerMember: { $avg: '$lifetimeSpending' }
        }
      }
    ]);

    // Get tier distribution
    const tierDistribution = await LoyaltyMember.aggregate([
      {
        $match: {
          hotelGroupId: hotelGroup._id
        }
      },
      {
        $group: {
          _id: '$currentTier',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top members
    const topMembers = await LoyaltyMember.find({
      hotelGroupId: hotelGroup._id
    })
      .populate('guest', 'name email firstName lastName')
      .sort({ totalPoints: -1 })
      .limit(10);

    // Get points by hotel
    const pointsByHotel = await LoyaltyMember.aggregate([
      {
        $match: {
          hotelGroupId: hotelGroup._id
        }
      },
      {
        $unwind: '$pointsHistory'
      },
      {
        $match: {
          'pointsHistory.type': 'EARNED',
          'pointsHistory.earnedAtHotel': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$pointsHistory.earnedAtHotel',
          totalPoints: { $sum: '$pointsHistory.points' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'hotels',
          localField: '_id',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      {
        $unwind: '$hotel'
      },
      {
        $project: {
          hotelId: '$_id',
          hotelName: '$hotel.name',
          totalPoints: 1,
          transactionCount: 1
        }
      }
    ]);

    const stats = memberStats[0] || {
      totalMembers: 0,
      totalPoints: 0,
      totalTierPoints: 0,
      totalAvailablePoints: 0,
      totalSpending: 0,
      totalPointsEarned: 0,
      totalPointsRedeemed: 0,
      avgPointsPerMember: 0,
      avgSpendingPerMember: 0
    };

    res.json({
      success: true,
      data: {
        group: {
          id: hotelGroup._id,
          name: hotelGroup.name,
          description: hotelGroup.description,
          totalHotels: hotelGroup.hotels.length,
          hotels: hotelGroup.hotels
        },
        overview: stats,
        tierDistribution,
        topMembers,
        pointsByHotel
      }
    });

  } catch (error) {
    console.error('Error fetching group analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group analytics',
      error: error.message
    });
  }
};
