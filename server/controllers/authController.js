const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'naturetrails_jwt_secret_key_2026';

// Helper: safe user object (no password)
const safeUser = (u) => ({
  id: u._id ? u._id.toString() : u.id,
  _id: u._id ? u._id.toString() : u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt
});

// Helper: generate JWT Token
const generateToken = (user) => {
  const id = user._id ? user._id.toString() : user.id;
  return jwt.sign(
    { id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: 'USER'
    });

    // Create server-side session
    if (req.session) {
      req.session.userId = newUser._id.toString();
      req.session.role = newUser.role;
    }

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to NatureTrails.',
      token,
      user: safeUser(newUser)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Set server-side session
    if (req.session) {
      req.session.userId = user._id.toString();
      req.session.role = user.role;
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: safeUser(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user & destroy session
// @route   POST /api/auth/logout
// @access  Public / Authenticated
const logoutUser = (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Logout failed' });
      }
      res.clearCookie('naturetrails_sid');
      return res.status(200).json({ success: true, message: 'Logged out successfully' });
    });
  } else {
    res.clearCookie('naturetrails_sid');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  }
};

// @desc    Get current authenticated session user
// @route   GET /api/auth/me
// @access  Authenticated
const getMe = async (req, res) => {
  try {
    let userId = req.session ? req.session.userId : null;

    if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch {
        // invalid token
      }
    }

    if (!userId && req.headers['x-user-id']) {
      userId = req.headers['x-user-id'];
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: safeUser(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all registered users (Admin only)
// @route   GET /api/auth/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users.map(safeUser)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Legacy profile endpoint
const getUserProfile = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users.map(safeUser)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  getUserProfile,
  getAllUsers
};
