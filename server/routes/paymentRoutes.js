const express = require('express');
const router = express.Router();
const {
  createPaymentOrder,
  verifyPayment,
  getRefundStatus,
  handleWebhook
} = require('../controllers/paymentController');
const { requireAuth } = require('../middleware/authMiddleware');

// Protected: create Razorpay order for tour booking
router.post('/create-order', requireAuth, createPaymentOrder);

// Protected: verify Razorpay payment signature
router.post('/verify', requireAuth, verifyPayment);

// Protected: fetch refund status for a specific booking
router.get('/refund-status/:bookingId', requireAuth, getRefundStatus);

// Public (HMAC Verified): Razorpay Webhook receiver
router.post('/webhook', handleWebhook);

module.exports = router;
