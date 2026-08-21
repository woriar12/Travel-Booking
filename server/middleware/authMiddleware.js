const User = require('../models/User');

// @desc    Middleware to verify logged-in user via server-side session (HttpOnly cookie)
const requireAuth = async (req, res, next) => {
  try {
    const userId = req.session ? req.session.userId : null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      req.session.destroy();
      return res.status(401).json({
        success: false,
        message: 'User session invalid. Please log in again.'
      });
    }

    // Attach authenticated user to request
    req.currentUser = user;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Middleware to verify logged-in user has ADMIN role via server session
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.session ? req.session.userId : null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      req.session.destroy();
      return res.status(401).json({
        success: false,
        message: 'User session invalid. Please log in again.'
      });
    }

    // Server-side role check from database
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
