const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const { validateUser, validateLogin, validatePasswordChange } = require('../middleware/validation');

// Rate limiter for login to prevent brute force attacks
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // limit each IP to 15 requests per windowMs
    message: { msg: 'Too many login attempts from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false
});

// @route   POST /api/auth/register
// @desc    Register a new user (Admin only)
// @access  Private/Admin
router.post('/register', authMiddleware, adminOnly, validateUser, authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginLimiter, validateLogin, authController.login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, authController.getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, authController.updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', authMiddleware, validatePasswordChange, authController.changePassword);

module.exports = router;