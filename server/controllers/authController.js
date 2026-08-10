// Simple in-memory user store (No JWT, No Password Hashing)
const users = [];

// @desc    Register a new user (Simple - No Security)
// @route   POST /api/auth/register
// @access  Public
const registerUser = (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const newUser = {
      id: String(users.length + 1),
      name,
      email: email.toLowerCase(),
      password, // Plain text as requested
      createdAt: new Date()
    };

    users.push(newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user (Simple - No Security)
// @route   POST /api/auth/login
// @access  Public
const loginUser = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all registered users or user profile
// @route   GET /api/auth/profile
// @access  Public
const getUserProfile = (req, res) => {
  res.status(200).json({
    success: true,
    count: users.length,
    data: users.map(u => ({ id: u.id, name: u.name, email: u.email }))
  });
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  users
};
