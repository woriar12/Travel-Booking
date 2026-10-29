const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const Booking = require('../models/Booking');

// Helper: parse date filter range
const parseDateRange = (query) => {
  const { filter = 'all', startDate, endDate } = query;
  const now = new Date();

  if (filter === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end, label: 'Today' };
  }

  if (filter === 'week') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    return { start, end: now, label: 'Last 7 Days' };
  }

  if (filter === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return { start, end: now, label: 'This Month' };
  }

  if (filter === 'year') {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    return { start, end: now, label: 'This Year' };
  }

  if (filter === 'custom' && (startDate || endDate)) {
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    // Set end of day if endDate is provided without specific time
    if (endDate && !endDate.includes('T')) {
      end.setHours(23, 59, 59, 999);
    }
    return { start, end, label: 'Custom Range' };
  }

  // Default: All Time
  return { start: null, end: null, label: 'All Time' };
};

// @desc    Get Revenue Analytics and 9 KPI Metrics with Date Range Filter
// @route   GET /api/admin/revenue
// @access  Admin Only
const getRevenueAnalytics = async (req, res) => {
  try {
    const dateRange = parseDateRange(req.query);
    const { start, end } = dateRange;

    // Build Payment Date Filter
    const paymentDateFilter = {};
    if (start && end) {
      paymentDateFilter.$or = [
        { paymentDate: { $gte: start, $lte: end } },
        { paymentDate: null, createdAt: { $gte: start, $lte: end } }
      ];
    }

    // 1. Gross Revenue & Successful Payments Count
    // Any payment that was successfully charged (status is SUCCESS, REFUNDED, or PARTIALLY_REFUNDED)
    const successfulPaymentsQuery = {
      paymentStatus: { $in: ['SUCCESS', 'REFUNDED', 'PARTIALLY_REFUNDED'] },
      ...paymentDateFilter
    };

    const successfulPayments = await Payment.find(successfulPaymentsQuery);
    const grossRevenue = successfulPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const successfulPaymentsCount = successfulPayments.length;

    // 2. Pending Payments Count
    const pendingPaymentsQuery = {
      paymentStatus: 'PENDING',
      ...paymentDateFilter
    };
    const pendingPaymentsCount = await Payment.countDocuments(pendingPaymentsQuery);

    // 3. Failed Payments Count
    const failedPaymentsQuery = {
      paymentStatus: 'FAILED',
      ...paymentDateFilter
    };
    const failedPaymentsCount = await Payment.countDocuments(failedPaymentsQuery);

    // Build Refund Date Filter
    const refundDateFilter = {};
    if (start && end) {
      refundDateFilter.$or = [
        { refundCompletedDate: { $gte: start, $lte: end } },
        { refundCompletedDate: null, createdAt: { $gte: start, $lte: end } }
      ];
    }

    // 4. Completed Refunds (Total Refunds)
    // ONLY completed refunds (status === 'REFUNDED') reduce revenue
    const completedRefundsQuery = {
      refundStatus: 'REFUNDED',
      ...refundDateFilter
    };
    const completedRefunds = await Refund.find(completedRefundsQuery);
    const totalRefunds = completedRefunds.reduce((sum, r) => sum + (Number(r.refundAmount) || 0), 0);
    const refundedBookingsCount = completedRefunds.length;

    // 5. Total Refund Pending Amount (pending or processing refunds)
    const pendingRefundsQuery = {
      refundStatus: { $in: ['REFUND_PENDING', 'REFUND_PROCESSING'] }
    };
    if (start && end) {
      pendingRefundsQuery.refundInitiatedDate = { $gte: start, $lte: end };
    }
    const pendingRefunds = await Refund.find(pendingRefundsQuery);
    const totalRefundPendingAmount = pendingRefunds.reduce((sum, r) => sum + (Number(r.refundAmount) || 0), 0);

    // 6. Net Revenue Formula: Gross Revenue - Total Refunds
    const netRevenue = Math.max(0, grossRevenue - totalRefunds);

    // 7. Cancelled Bookings Count
    const bookingDateFilter = {};
    if (start && end) {
      bookingDateFilter.$or = [
        { cancellationDate: { $gte: start, $lte: end } },
        { cancellationDate: null, updatedAt: { $gte: start, $lte: end } }
      ];
    }
    const cancelledBookingsCount = await Booking.countDocuments({
      $or: [
        { bookingStatus: 'CANCELLED' },
        { status: 'Cancelled' }
      ],
      ...bookingDateFilter
    });

    res.status(200).json({
      success: true,
      data: {
        filterApplied: dateRange.label,
        dateRange: {
          start: start ? start.toISOString() : null,
          end: end ? end.toISOString() : null
        },
        kpis: {
          grossRevenue,                  // 1. Gross Revenue
          totalRefunds,                  // 2. Total Refunds
          netRevenue,                    // 3. Net Revenue
          successfulPayments: successfulPaymentsCount, // 4. Successful Payments
          pendingPayments: pendingPaymentsCount,       // 5. Pending Payments
          failedPayments: failedPaymentsCount,         // 6. Failed Payments
          cancelledBookings: cancelledBookingsCount,   // 7. Cancelled Bookings
          refundedBookings: refundedBookingsCount,     // 8. Refunded Bookings
          totalRefundPendingAmount       // 9. Total Refund Pending Amount
        }
      }
    });
  } catch (error) {
    console.error('Error in getRevenueAnalytics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Verified Transactions with Date Range Filter
// @route   GET /api/admin/revenue/transactions
// @access  Admin Only
const getRevenueTransactions = async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);

    const filter = {
      paymentStatus: { $in: ['SUCCESS', 'REFUNDED', 'PARTIALLY_REFUNDED'] }
    };

    if (start && end) {
      filter.$or = [
        { paymentDate: { $gte: start, $lte: end } },
        { paymentDate: null, createdAt: { $gte: start, $lte: end } }
      ];
    }

    const transactions = await Payment.find(filter)
      .populate({
        path: 'booking',
        populate: { path: 'destination' }
      })
      .sort({ paymentDate: -1, createdAt: -1 })
      .limit(100);

    const formatted = transactions.map(t => ({
      id: t._id.toString(),
      paymentId: t.paymentId,
      razorpayPaymentId: t.razorpayPaymentId || 'N/A',
      razorpayOrderId: t.razorpayOrderId || 'N/A',
      amount: t.amount,
      currency: t.currency || 'INR',
      paymentStatus: t.paymentStatus,
      paymentDate: t.paymentDate || t.createdAt,
      customerName: t.userName || t.booking?.userName || 'Customer',
      customerEmail: t.userEmail || t.booking?.userEmail || 'N/A',
      destinationName: t.booking?.destinationDetails?.name || t.booking?.destination?.name || 'Tour Destination',
      bookingId: t.booking ? t.booking._id.toString() : null
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('Error in getRevenueTransactions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Refunds List with Date Range Filter
// @route   GET /api/admin/revenue/refunds
// @access  Admin Only
const getRevenueRefunds = async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);

    const filter = {};
    if (start && end) {
      filter.$or = [
        { refundCompletedDate: { $gte: start, $lte: end } },
        { refundInitiatedDate: { $gte: start, $lte: end } },
        { createdAt: { $gte: start, $lte: end } }
      ];
    }

    const refunds = await Refund.find(filter)
      .populate({
        path: 'booking',
        populate: { path: 'destination' }
      })
      .populate('payment')
      .sort({ refundInitiatedDate: -1, createdAt: -1 })
      .limit(100);

    const formatted = refunds.map(r => ({
      id: r._id.toString(),
      refundId: r.refundId,
      razorpayRefundId: r.razorpayRefundId || 'N/A',
      razorpayPaymentId: r.razorpayPaymentId || 'N/A',
      refundAmount: r.refundAmount,
      currency: r.currency || 'INR',
      refundStatus: r.refundStatus,
      refundInitiatedDate: r.refundInitiatedDate || r.createdAt,
      refundCompletedDate: r.refundCompletedDate,
      customerName: r.userName || r.booking?.userName || 'Customer',
      customerEmail: r.userEmail || r.booking?.userEmail || 'N/A',
      destinationName: r.booking?.destinationDetails?.name || r.booking?.destination?.name || 'Tour Destination',
      cancellationPolicy: r.cancellationPolicy,
      bookingId: r.booking ? r.booking._id.toString() : null
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('Error in getRevenueRefunds:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRevenueAnalytics,
  getRevenueTransactions,
  getRevenueRefunds
};
