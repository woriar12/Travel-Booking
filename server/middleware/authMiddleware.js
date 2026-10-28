const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'naturetrails_jwt_secret_key_2026';

// Helper: extract userId from Session, JWT Bearer Token, or x-user-id header
const extractUserId = (req) => {
  if (req.session && req.session.userId) {
    return req.session.userId;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded.id;
    } catch (err) {
      // Invalid/expired token
    }
  }

  if (req.headers['x-user-id']) {
    return req.headers['x-user-id'];
  }

  return null;
};

// @desc    Middleware to verify logged-in user via Session, JWT Bearer token, or custom header
const requireAuth = async (req, res, next) => {
  try {
    const userId = extractUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      if (req.session) req.session.destroy();
      return res.status(401).json({
        success: false,
        message: 'User session invalid. Please log in again.'
      });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Middleware to verify logged-in user has ADMIN role
const requireAdmin = async (req, res, next) => {
  try {
    const userId = extractUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      if (req.session) req.session.destroy();
      return res.status(401).json({
        success: false,
        message: 'User session invalid. Please log in again.'
      });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Legacy pass-through
const protect = (req, res, next) => {
  next();
};

module.exports = { protect, requireAuth, requireAdmin };
