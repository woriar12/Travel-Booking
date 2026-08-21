const express = require('express');
const router = express.Router();
const { createBooking, getUserBookings, getBookingStats, updateBookingStatus } = require('../controllers/bookingController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

// Protected: any logged-in user can create a booking
router.post('/', requireAuth, createBooking);

// Public: any user can view bookings (user sees their own bookings in UI)
router.get('/', getUserBookings);

// Admin-only
router.get('/stats', requireAdmin, getBookingStats);
router.patch('/:id/status', requireAdmin, updateBookingStatus);

module.exports = router;
