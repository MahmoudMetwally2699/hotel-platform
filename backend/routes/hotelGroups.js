/**
 * Hotel Group Routes
 * Super Admin only - for managing hotel groups and shared loyalty programs
 */

const express = require('express');
const router = express.Router();
const {
  createHotelGroup,
  getAllHotelGroups,
  getHotelGroupById,
  updateHotelGroup,
  deleteHotelGroup,
  addHotelsToGroup,
  removeHotelsFromGroup,
  getGroupAnalytics
} = require('../controllers/hotelGroupController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes require Super Admin authentication
router.use(protect, restrictTo('superadmin'));

// Hotel group CRUD
router.post('/', createHotelGroup);
router.get('/', getAllHotelGroups);
router.get('/:groupId', getHotelGroupById);
router.patch('/:groupId', updateHotelGroup);
router.delete('/:groupId', deleteHotelGroup);

// Hotel management within groups
router.patch('/:groupId/hotels/add', addHotelsToGroup);
router.patch('/:groupId/hotels/remove', removeHotelsFromGroup);

// Analytics
router.get('/:groupId/analytics', getGroupAnalytics);

module.exports = router;
