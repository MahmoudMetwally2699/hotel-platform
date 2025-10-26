const mongoose = require('mongoose');

/**
 * LoyaltyReward Schema
 * Defines redeemable rewards in the loyalty program
 */
const loyaltyRewardSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },

  // Reward Details
  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true
  },

  // Points Cost
  pointsCost: {
    type: Number,
    required: true,
    min: 0
  },

  // Category
  category: {
    type: String,
    enum: ['DISCOUNT', 'UPGRADE', 'AMENITY', 'SERVICE', 'VOUCHER', 'EXPERIENCE'],
    required: true
  },

  // Monetary Value
  value: {
    type: Number,
    required: true,
    min: 0
  },

  // Tier Requirement
  requiredTier: {
    type: String,
    enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
    default: 'BRONZE'
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Validity
  validityDays: {
    type: Number,
    default: 30, // Reward valid for 30 days after redemption
    min: 1
  },

  // Usage Limits
  usageLimit: {
    type: Number,
    default: null, // null means unlimited
    min: 0
  },

  timesRedeemed: {
    type: Number,
    default: 0,
    min: 0
  },

  // Terms and Conditions
  termsAndConditions: {
    type: String,
    default: ''
  },

  // Image
  imageUrl: {
    type: String,
    default: ''
  },

  // Availability
  availableFrom: {
    type: Date,
    default: Date.now
  },

  availableUntil: {
    type: Date,
    default: null
  },

  // Statistics
  statistics: {
    totalRedemptions: {
      type: Number,
      default: 0
    },
    totalValueRedeemed: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
loyaltyRewardSchema.index({ hotel: 1, isActive: 1 });
loyaltyRewardSchema.index({ hotel: 1, category: 1 });
loyaltyRewardSchema.index({ hotel: 1, requiredTier: 1 });
loyaltyRewardSchema.index({ pointsCost: 1 });

// Pre-save middleware
loyaltyRewardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if reward is available
loyaltyRewardSchema.methods.isAvailable = function() {
  const now = new Date();

  // Check if active
  if (!this.isActive) {
    return { available: false, reason: 'Reward is currently inactive' };
  }

  // Check availability dates
  if (this.availableFrom && this.availableFrom > now) {
    return { available: false, reason: 'Reward not yet available' };
  }

  if (this.availableUntil && this.availableUntil < now) {
    return { available: false, reason: 'Reward has expired' };
  }

  // Check usage limit
  if (this.usageLimit !== null && this.timesRedeemed >= this.usageLimit) {
    return { available: false, reason: 'Reward usage limit reached' };
  }

  return { available: true };
};

// Method to check if member can redeem
loyaltyRewardSchema.methods.canMemberRedeem = function(member) {
  const availabilityCheck = this.isAvailable();
  if (!availabilityCheck.available) {
    return availabilityCheck;
  }

  // Check if member has enough points
  if (member.availablePoints < this.pointsCost) {
    return {
      available: false,
      reason: 'Insufficient points',
      pointsNeeded: this.pointsCost - member.availablePoints
    };
  }

  // Check tier requirement
  const tierOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
  const memberTierIndex = tierOrder.indexOf(member.currentTier);
  const requiredTierIndex = tierOrder.indexOf(this.requiredTier);

  if (memberTierIndex < requiredTierIndex) {
    return {
      available: false,
      reason: `Requires ${this.requiredTier} tier or higher`,
      currentTier: member.currentTier,
      requiredTier: this.requiredTier
    };
  }

  return { available: true };
};

// Method to increment redemption count
loyaltyRewardSchema.methods.incrementRedemption = function() {
  this.timesRedeemed += 1;
  this.statistics.totalRedemptions += 1;
  this.statistics.totalValueRedeemed += this.value;
};

// Static method to get rewards by tier
loyaltyRewardSchema.statics.getRewardsByTier = function(hotelId, tier) {
  const tierOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
  const tierIndex = tierOrder.indexOf(tier);

  const allowedTiers = tierOrder.slice(0, tierIndex + 1);

  return this.find({
    hotel: hotelId,
    isActive: true,
    requiredTier: { $in: allowedTiers }
  }).sort({ pointsCost: 1 });
};

// Static method to get popular rewards
loyaltyRewardSchema.statics.getPopularRewards = function(hotelId, limit = 5) {
  return this.find({
    hotel: hotelId,
    isActive: true
  })
  .sort({ 'statistics.totalRedemptions': -1 })
  .limit(limit);
};

module.exports = mongoose.model('LoyaltyReward', loyaltyRewardSchema);
