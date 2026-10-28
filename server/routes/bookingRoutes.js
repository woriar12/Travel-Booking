const express = require('express');
const router = express.Router();
const { createBooking, getUserBookings, getBookingStats, updateBookingStatus } = require('../controllers/bookingController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

// Protected: any logged-in user can create a booking
router.post('/', requireAuth, createBooking);

// Protected: user gets their own bookings, admin gets all
router.get('/', requireAuth, getUserBookings);

// Admin-only
router.get('/stats', requireAdmin, getBookingStats);
router.patch('/:id/status', requireAdmin, updateBookingStatus);

module.exports = router;
