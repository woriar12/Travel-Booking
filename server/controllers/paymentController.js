const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature
} = require('../services/razorpayService');

// @desc    Create a Razorpay Order for a tour booking
// @route   POST /api/payments/create-order
// @access  Authenticated User
const createPaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide bookingId'
      });
    }

    const booking = await Booking.findById(bookingId).populate('destination');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const user = req.currentUser;
    const userId = user ? (user._id || user.id).toString() : null;
    const userEmail = user ? (user.email || '').toLowerCase().trim() : '';

    // Verify ownership
    if (user && user.role !== 'ADMIN') {
      const isOwner =
        (booking.user && booking.user.toString() === userId) ||
        (booking.userEmail && booking.userEmail.toLowerCase() === userEmail) ||
        !booking.user;

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not own this booking.'
        });
      }
    }

    // Check if already paid
    if (booking.paymentStatus === 'SUCCESS') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been paid for and confirmed.'
      });
    }

    // Check if cancelled
    if (booking.bookingStatus === 'CANCELLED' || booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot initiate payment for a cancelled booking.'
      });
    }

    // Call Razorpay Service to create order
    const orderResult = await createOrder(booking.totalPrice, booking._id.toString(), {
      bookingId: booking._id.toString(),
      customerName: booking.userName,
      customerEmail: booking.userEmail
    });

    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order with gateway.'
      });
    }

    // Create or update PENDING Payment record
    const paymentIdStr = `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let paymentDoc = await Payment.findOne({
      booking: booking._id,
      paymentStatus: 'PENDING'
    });

    if (!paymentDoc) {
      paymentDoc = await Payment.create({
        paymentId: paymentIdStr,
        booking: booking._id,
        user: booking.user || userId,
        userName: booking.userName,
        userEmail: booking.userEmail,
        razorpayOrderId: orderResult.orderId,
        amount: booking.totalPrice,
        currency: orderResult.currency || 'INR',
        paymentStatus: 'PENDING',
        notes: {
          destinationName: booking.destinationDetails?.name || 'Tour Destination'
        }
      });
    } else {
      paymentDoc.razorpayOrderId = orderResult.orderId;
      paymentDoc.amount = booking.totalPrice;
      await paymentDoc.save();
    }

    res.status(200).json({
      success: true,
      orderId: orderResult.orderId,
      amount: orderResult.amount, // in paise
      currency: orderResult.currency || 'INR',
      keyId: orderResult.keyId,
      bookingId: booking._id.toString(),
      isSimulated: orderResult.isSimulated || false,
      customer: {
        name: booking.userName,
        email: booking.userEmail,
        contact: booking.contactNumber
      }
    });
  } catch (error) {
    console.error('Error in createPaymentOrder:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay Payment Signature and Confirm Booking
// @route   POST /api/payments/verify
// @access  Authenticated User
const verifyPayment = async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!bookingId || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: 'Please provide bookingId and razorpay_payment_id'
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify signature cryptographically
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    let paymentDoc = await Payment.findOne({
      $or: [
        { booking: booking._id, razorpayOrderId: razorpay_order_id },
        { booking: booking._id, paymentStatus: 'PENDING' },
        { booking: booking._id }
      ]
    }).sort({ createdAt: -1 });

    if (!paymentDoc) {
      paymentDoc = new Payment({
        paymentId: `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        booking: booking._id,
        user: booking.user,
        userName: booking.userName,
        userEmail: booking.userEmail,
        amount: booking.totalPrice,
        currency: 'INR'
      });
    }

    if (!isValid) {
      // Payment verification failed
      paymentDoc.paymentStatus = 'FAILED';
      paymentDoc.razorpayOrderId = razorpay_order_id;
      paymentDoc.razorpayPaymentId = razorpay_payment_id;
      paymentDoc.errorMessage = 'Invalid Razorpay payment signature';
      await paymentDoc.save();

      booking.bookingStatus = 'PAYMENT_FAILED';
      booking.status = 'Payment Failed';
      booking.paymentStatus = 'FAILED';
      await booking.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature detected.'
      });
    }

    // Payment verification successful
    paymentDoc.paymentStatus = 'SUCCESS';
    paymentDoc.razorpayOrderId = razorpay_order_id;
    paymentDoc.razorpayPaymentId = razorpay_payment_id;
    paymentDoc.razorpaySignature = razorpay_signature;
    paymentDoc.paymentDate = new Date();
    await paymentDoc.save();

    // Confirm booking
    booking.bookingStatus = 'CONFIRMED';
    booking.status = 'Confirmed';
    booking.paymentStatus = 'SUCCESS';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Payment successfully verified! Your tour booking is now Confirmed.',
      data: {
        bookingId: booking._id.toString(),
        paymentId: paymentDoc.paymentId,
        razorpayPaymentId: razorpay_payment_id,
        amountPaid: booking.totalPrice,
        bookingStatus: 'CONFIRMED',
        paymentStatus: 'SUCCESS'
      }
    });
  } catch (error) {
    console.error('Error in verifyPayment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Refund Status for a specific booking
// @route   GET /api/payments/refund-status/:bookingId
// @access  Authenticated User / Admin
const getRefundStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const user = req.currentUser;
    const userId = user ? (user._id || user.id).toString() : null;
    const userEmail = user ? (user.email || '').toLowerCase().trim() : '';

    if (user && user.role !== 'ADMIN') {
      const isOwner =
        (booking.user && booking.user.toString() === userId) ||
        (booking.userEmail && booking.userEmail.toLowerCase() === userEmail) ||
        !booking.user;

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not own this booking.'
        });
      }
    }

    const refundDoc = await Refund.findOne({ booking: booking._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        bookingId: booking._id.toString(),
        bookingStatus: booking.bookingStatus || booking.status,
        cancellationDate: booking.cancellationDate,
        refundAmount: booking.refundAmount || (refundDoc ? refundDoc.refundAmount : 0),
        refundPercentage: booking.refundPercentage || 0,
        refundStatus: booking.refundStatus || (refundDoc ? refundDoc.refundStatus : 'NOT_APPLICABLE'),
        refundId: booking.refundId || (refundDoc ? refundDoc.refundId : null),
        refundDetails: refundDoc || null
      }
    });
  } catch (error) {
    console.error('Error in getRefundStatus:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Razorpay Webhook Handler
// @route   POST /api/payments/webhook
// @access  Public (Signature Verified)
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const payload = JSON.stringify(req.body);

    const isValid = verifyWebhookSignature(payload, signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const eventData = req.body.payload;

    if (event === 'payment.captured') {
      const p = eventData.payment.entity;
      const paymentDoc = await Payment.findOne({ razorpayOrderId: p.order_id });
      if (paymentDoc) {
        paymentDoc.paymentStatus = 'SUCCESS';
        paymentDoc.razorpayPaymentId = p.id;
        paymentDoc.paymentDate = new Date();
        await paymentDoc.save();

        await Booking.findByIdAndUpdate(paymentDoc.booking, {
          bookingStatus: 'CONFIRMED',
          status: 'Confirmed',
          paymentStatus: 'SUCCESS'
        });
      }
    } else if (event === 'refund.processed') {
      const r = eventData.refund.entity;
      const refundDoc = await Refund.findOne({ razorpayRefundId: r.id });
      if (refundDoc) {
        refundDoc.refundStatus = 'REFUNDED';
        refundDoc.refundCompletedDate = new Date();
        await refundDoc.save();

        await Booking.findByIdAndUpdate(refundDoc.booking, {
          refundStatus: 'REFUNDED'
        });
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getRefundStatus,
  handleWebhook
};
