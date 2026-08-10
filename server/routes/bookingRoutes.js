const express = require('express');
const router = express.Router();
const { createBooking, getUserBookings } = require('../controllers/bookingController');

router.post('/', createBooking);
router.get('/', getUserBookings);

module.exports = router;
