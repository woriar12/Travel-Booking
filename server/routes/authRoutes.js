const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser, getMe, getUserProfile, getAllUsers } = require('../controllers/authController');
const { requireAdmin } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', getMe);
router.get('/profile', getUserProfile);
router.get('/users', requireAdmin, getAllUsers);

module.exports = router;
