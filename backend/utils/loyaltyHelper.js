/**
 * Loyalty Helper Utilities
 * Business logic functions for loyalty program operations
 */

/**
 * Calculate points earned from a booking
 * @param {Number} bookingAmount - Final booking amount in dollars
 * @param {String} serviceType - Type of service (laundry, transportation, tourism, housekeeping)
 * @param {Object} loyaltyProgram - Loyalty program configuration
 * @returns {Number} Points earned
 */
const calculatePointsEarned = (bookingAmount, serviceType, loyaltyProgram) => {
  try {
    if (!loyaltyProgram || !loyaltyProgram.isActive) {
      return 0;
    }

    const { pointsPerDollar } = loyaltyProgram.pointsRules;
    const serviceMultiplier = loyaltyProgram.pointsRules.serviceMultipliers[serviceType.toLowerCase()] || 1;

    const points = Math.floor(bookingAmount * pointsPerDollar * serviceMultiplier);

    return Math.max(0, points);
  } catch (error) {
    console.error('Error calculating points earned:', error);
    return 0;
  }
};

/**
 * Determine tier based on total points
 * @param {Number} totalPoints - Member's total points
 * @param {Array} tierConfiguration - Array of tier objects
 * @returns {Object} Tier object
 */
const determineTier = (totalPoints, tierConfiguration) => {
  try {
    if (!tierConfiguration || tierConfiguration.length === 0) {
      return null;
    }

    // Sort tiers by minPoints descending to check from highest to lowest
    const sortedTiers = [...tierConfiguration].sort((a, b) => b.minPoints - a.minPoints);

    for (const tier of sortedTiers) {
      if (totalPoints >= tier.minPoints && totalPoints <= tier.maxPoints) {
        return tier;
      }
    }

    // Default to first tier (Bronze)
    return tierConfiguration[0];
  } catch (error) {
    console.error('Error determining tier:', error);
    return null;
  }
};

/**
 * Calculate tier discount percentage
 * @param {String} tierName - Name of the tier (BRONZE, SILVER, GOLD, PLATINUM)
 * @param {Array} tierConfiguration - Array of tier objects
 * @returns {Number} Discount percentage
 */
const calculateTierDiscount = (tierName, tierConfiguration) => {
  try {
    if (!tierConfiguration || tierConfiguration.length === 0) {
      return 0;
    }

    const tier = tierConfiguration.find(t => t.name === tierName);
    return tier ? tier.discountPercentage : 0;
  } catch (error) {
    console.error('Error calculating tier discount:', error);
    return 0;
  }
};

/**
 * Calculate redemption value (points to money)
 * @param {Number} points - Points to redeem
 * @param {Object} redemptionRules - Redemption rules from loyalty program
 * @returns {Number} Monetary value in dollars
 */
const calculateRedemptionValue = (points, redemptionRules) => {
  try {
    if (!redemptionRules || points < redemptionRules.minimumRedemption) {
      return 0;
    }

    const { pointsToMoneyRatio } = redemptionRules;
    const value = points / pointsToMoneyRatio;

    return Math.round(value * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error calculating redemption value:', error);
    return 0;
  }
};

/**
 * Check points expiration and return expired points
 * @param {Array} pointsHistory - Array of points history entries
 * @param {Number} expirationMonths - Number of months before points expire
 * @returns {Object} { expiredPoints, expiredEntries }
 */
const checkPointsExpiration = (pointsHistory, expirationMonths) => {
  try {
    const now = new Date();
    let expiredPoints = 0;
    const expiredEntries = [];

    pointsHistory.forEach(entry => {
      if (entry.type === 'EARNED' && !entry.isExpired && entry.expirationDate) {
        if (entry.expirationDate < now) {
          expiredPoints += entry.points;
          expiredEntries.push(entry);
        }
      }
    });

    return { expiredPoints, expiredEntries };
  } catch (error) {
    console.error('Error checking points expiration:', error);
    return { expiredPoints: 0, expiredEntries: [] };
  }
};

/**
 * Calculate tier progress
 * @param {Number} currentPoints - Member's current total points
 * @param {Array} tierConfiguration - Array of tier objects
 * @param {String} currentTierName - Current tier name
 * @returns {Object} { pointsToNextTier, nextTier, progressPercentage }
 */
const calculateTierProgress = (currentPoints, tierConfiguration, currentTierName) => {
  try {
    if (!tierConfiguration || tierConfiguration.length === 0) {
      return { pointsToNextTier: 0, nextTier: null, progressPercentage: 0 };
    }

    // Sort tiers by minPoints
    const sortedTiers = [...tierConfiguration].sort((a, b) => a.minPoints - b.minPoints);
    const currentTierIndex = sortedTiers.findIndex(t => t.name === currentTierName);

    if (currentTierIndex === -1) {
      return { pointsToNextTier: 0, nextTier: null, progressPercentage: 0 };
    }

    const currentTier = sortedTiers[currentTierIndex];

    // Check if already at highest tier
    if (currentTierIndex === sortedTiers.length - 1) {
      return {
        pointsToNextTier: 0,
        nextTier: null,
        progressPercentage: 100
      };
    }

    const nextTier = sortedTiers[currentTierIndex + 1];
    const pointsToNextTier = Math.max(0, nextTier.minPoints - currentPoints);

    // Calculate progress percentage within current tier
    const tierRange = nextTier.minPoints - currentTier.minPoints;
    const pointsInCurrentTier = currentPoints - currentTier.minPoints;
    const progressPercentage = Math.min(100, Math.max(0, (pointsInCurrentTier / tierRange) * 100));

    return {
      pointsToNextTier,
      nextTier: nextTier.name,
      progressPercentage: Math.round(progressPercentage * 10) / 10 // Round to 1 decimal place
    };
  } catch (error) {
    console.error('Error calculating tier progress:', error);
    return { pointsToNextTier: 0, nextTier: null, progressPercentage: 0 };
  }
};

/**
 * Apply loyalty discount to final price
 * @param {Number} finalPrice - Price after markup
 * @param {Number} tierDiscountPercentage - Discount percentage from tier
 * @returns {Object} { discountedPrice, discountAmount }
 */
const applyLoyaltyDiscount = (finalPrice, tierDiscountPercentage) => {
  try {
    if (tierDiscountPercentage <= 0 || finalPrice <= 0) {
      return { discountedPrice: finalPrice, discountAmount: 0 };
    }

    const discountAmount = (finalPrice * tierDiscountPercentage) / 100;
    const discountedPrice = finalPrice - discountAmount;

    return {
      discountedPrice: Math.round(discountedPrice * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100
    };
  } catch (error) {
    console.error('Error applying loyalty discount:', error);
    return { discountedPrice: finalPrice, discountAmount: 0 };
  }
};

/**
 * Calculate complete booking price with markup and loyalty discount
 * @param {Number} basePrice - Service provider's base price
 * @param {Number} markupPercentage - Hotel's markup percentage
 * @param {Number} loyaltyDiscountPercentage - Tier discount percentage
 * @returns {Object} Complete price breakdown
 */
const calculateBookingPriceWithLoyalty = (basePrice, markupPercentage, loyaltyDiscountPercentage = 0) => {
  try {
    // Calculate markup
    const markupAmount = (basePrice * markupPercentage) / 100;
    const priceWithMarkup = basePrice + markupAmount;

    // Apply loyalty discount
    const loyaltyDiscountAmount = (priceWithMarkup * loyaltyDiscountPercentage) / 100;
    const finalPrice = priceWithMarkup - loyaltyDiscountAmount;

    return {
      basePrice: Math.round(basePrice * 100) / 100,
      markupAmount: Math.round(markupAmount * 100) / 100,
      priceWithMarkup: Math.round(priceWithMarkup * 100) / 100,
      loyaltyDiscountAmount: Math.round(loyaltyDiscountAmount * 100) / 100,
      loyaltyDiscountPercentage,
      finalPrice: Math.round(finalPrice * 100) / 100
    };
  } catch (error) {
    console.error('Error calculating booking price with loyalty:', error);
    return {
      basePrice,
      markupAmount: 0,
      priceWithMarkup: basePrice,
      loyaltyDiscountAmount: 0,
      loyaltyDiscountPercentage: 0,
      finalPrice: basePrice
    };
  }
};

/**
 * Validate tier configuration
 * @param {Array} tierConfiguration - Array of tier objects
 * @returns {Object} { valid, errors }
 */
const validateTierConfiguration = (tierConfiguration) => {
  const errors = [];

  if (!Array.isArray(tierConfiguration) || tierConfiguration.length === 0) {
    return { valid: false, errors: ['Tier configuration must be a non-empty array'] };
  }

  // Check for duplicate tier names
  const tierNames = tierConfiguration.map(t => t.name);
  const uniqueTierNames = new Set(tierNames);
  if (tierNames.length !== uniqueTierNames.size) {
    errors.push('Duplicate tier names found');
  }

  // Sort by minPoints to check for gaps/overlaps
  const sortedTiers = [...tierConfiguration].sort((a, b) => a.minPoints - b.minPoints);

  sortedTiers.forEach((tier, index) => {
    // Validate required fields
    if (!tier.name) {
      errors.push(`Tier at index ${index} is missing name`);
    }
    if (tier.minPoints === undefined || tier.minPoints < 0) {
      errors.push(`Tier ${tier.name || index} has invalid minPoints`);
    }
    if (tier.maxPoints === undefined || tier.maxPoints < 0) {
      errors.push(`Tier ${tier.name || index} has invalid maxPoints`);
    }
    if (tier.minPoints >= tier.maxPoints) {
      errors.push(`Tier ${tier.name || index}: minPoints must be less than maxPoints`);
    }

    // Check discount percentage (handle both tier.discountPercentage and tier.benefits.discountPercentage)
    const discountPercentage = tier.discountPercentage || tier.benefits?.discountPercentage;
    if (discountPercentage === undefined || discountPercentage < 0 || discountPercentage > 100) {
      errors.push(`Tier ${tier.name || index} has invalid discount percentage`);
    }

    // Check for gaps between tiers (allow consecutive ranges)
    if (index > 0) {
      const prevTier = sortedTiers[index - 1];
      // Allow either exact consecutive (prevMax + 1 = currentMin) or overlapping at boundary (prevMax = currentMin - 1)
      if (tier.minPoints < prevTier.maxPoints) {
        errors.push(`Overlap between ${prevTier.name} (max: ${prevTier.maxPoints}) and ${tier.name} (min: ${tier.minPoints})`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Get tier color
 * @param {String} tierName - Name of the tier
 * @returns {String} Hex color code
 */
const getTierColor = (tierName) => {
  const colors = {
    'BRONZE': '#CD7F32',
    'SILVER': '#C0C0C0',
    'GOLD': '#FFD700',
    'PLATINUM': '#E5E4E2'
  };
  return colors[tierName] || '#CD7F32';
};

/**
 * Calculate loyalty program ROI
 * @param {Number} totalRevenueFromLoyalMembers - Total revenue from loyalty members
 * @param {Number} totalRewardsCost - Total cost of rewards redeemed
 * @param {Number} totalDiscountsGiven - Total discounts given through tier benefits
 * @returns {Object} { roi, roiPercentage }
 */
const calculateLoyaltyROI = (totalRevenueFromLoyalMembers, totalRewardsCost, totalDiscountsGiven) => {
  try {
    const totalCost = totalRewardsCost + totalDiscountsGiven;
    if (totalCost === 0) {
      return { roi: 0, roiPercentage: 0 };
    }

    const roi = totalRevenueFromLoyalMembers - totalCost;
    const roiPercentage = (roi / totalCost) * 100;

    return {
      roi: Math.round(roi * 100) / 100,
      roiPercentage: Math.round(roiPercentage * 10) / 10
    };
  } catch (error) {
    console.error('Error calculating loyalty ROI:', error);
    return { roi: 0, roiPercentage: 0 };
  }
};

module.exports = {
  calculatePointsEarned,
  determineTier,
  calculateTierDiscount,
  calculateRedemptionValue,
  checkPointsExpiration,
  calculateTierProgress,
  applyLoyaltyDiscount,
  calculateBookingPriceWithLoyalty,
  validateTierConfiguration,
  getTierColor,
  calculateLoyaltyROI
};
