const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getBookingStats,
  updateBookingStatus,
  cancelBooking,
  getCancellationPolicy,
  getBookingById
} = require('../controllers/bookingController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

// Public: view cancellation policy rules and tiered refund windows
router.get('/policy', getCancellationPolicy);

// Admin: booking statistics (MUST be before /:bookingId)
router.get('/stats', requireAdmin, getBookingStats);

// Protected: list bookings - root & /my-bookings (MUST be before /:bookingId)
router.get('/', requireAuth, getUserBookings);
router.get('/my-bookings', requireAuth, getUserBookings);

// Protected: create new tour booking
router.post('/', requireAuth, createBooking);

// Protected: get single booking by ID with cancellation estimate
router.get('/:bookingId', requireAuth, getBookingById);

// Protected: cancel an eligible booking and process refund
router.post('/:bookingId/cancel', requireAuth, cancelBooking);

// Admin: update booking status
router.patch('/:id/status', requireAdmin, updateBookingStatus);

module.exports = router;
