const express = require('express');
const router = express.Router();
const {
  getRevenueAnalytics,
  getRevenueTransactions,
  getRevenueRefunds
} = require('../controllers/adminRevenueController');
const { requireAdmin } = require('../middleware/authMiddleware');

// All admin revenue routes are protected and strictly require ADMIN role
router.get('/revenue', requireAdmin, getRevenueAnalytics);
router.get('/revenue/transactions', requireAdmin, getRevenueTransactions);
router.get('/revenue/refunds', requireAdmin, getRevenueRefunds);

module.exports = router;
