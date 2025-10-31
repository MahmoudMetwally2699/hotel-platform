const express = require('express');
const router = express.Router();
const {
  createOrUpdateProgram,
  getLoyaltyProgram,
  getAllChannelPrograms,
  getProgramByChannel,
  getAllMembers,
  getMemberDetails,
  getGuestLoyaltyHistory,
  adjustMemberPoints,
  adjustRedeemablePoints,
  changeMemberTier,
  getLoyaltyAnalytics,
  createReward,
  getRewards,
  updateReward,
  deleteReward,
  getMyMembership,
  getAvailableRewards,
  redeemReward,
  getPointsHistory,
  getProgramDetails,
  exportMemberReport
} = require('../controllers/loyaltyController');
const { protect, restrictTo } = require('../middleware/auth');



// ============================================
// HOTEL ADMIN ROUTES - Mounted at /api/loyalty/hotel/*
// ============================================

// Loyalty Program Configuration (Channel-Based)
router.post('/hotel/program', protect, restrictTo('hotel'), createOrUpdateProgram);
router.get('/hotel/program', protect, restrictTo('hotel'), getLoyaltyProgram);
router.get('/hotel/channels', protect, restrictTo('hotel'), getAllChannelPrograms);
router.get('/hotel/program/:channel', protect, restrictTo('hotel'), getProgramByChannel);

// Member Management
router.get('/hotel/members', protect, restrictTo('hotel'), getAllMembers);
router.get('/hotel/members/:memberId', protect, restrictTo('hotel'), getMemberDetails);
router.get('/hotel/guest-history/:guestId', protect, restrictTo('hotel'), getGuestLoyaltyHistory);
router.post('/hotel/members/:memberId/adjust-points', protect, restrictTo('hotel'), adjustMemberPoints);
router.post('/hotel/members/:memberId/adjust-redeemable-points', protect, restrictTo('hotel'), adjustRedeemablePoints);
router.post('/hotel/members/:memberId/change-tier', protect, restrictTo('hotel'), changeMemberTier);

// Analytics and Reports
router.get('/hotel/analytics', protect, restrictTo('hotel'), getLoyaltyAnalytics);
router.get('/hotel/reports', protect, restrictTo('hotel'), exportMemberReport);

// Reward Management
router.post('/hotel/rewards', protect, restrictTo('hotel'), createReward);
router.get('/hotel/rewards', protect, restrictTo('hotel'), getRewards);
router.put('/hotel/rewards/:rewardId', protect, restrictTo('hotel'), updateReward);
router.delete('/hotel/rewards/:rewardId', protect, restrictTo('hotel'), deleteReward);

// ============================================
// GUEST ROUTES - Mounted at /api/loyalty/*
// ============================================

// Guest Membership
router.get('/my-membership', protect, restrictTo('guest'), getMyMembership);
router.get('/my-history', protect, restrictTo('guest'), getPointsHistory);

// Rewards
router.get('/available-rewards', protect, restrictTo('guest'), getAvailableRewards);
router.post('/redeem/:rewardId', protect, restrictTo('guest'), redeemReward);

// Public Program Details
router.get('/program-details/:hotelId', getProgramDetails);

module.exports = router;
