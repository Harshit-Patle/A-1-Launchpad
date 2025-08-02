const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const userController = require('../controllers/userController');

// @route   GET /api/users
// @desc    Get all users with filtering and pagination
// @access  Private/Admin
router.get('/', authMiddleware, adminOnly, userController.getAllUsers);

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private/Admin
router.get('/stats', authMiddleware, adminOnly, userController.getUserStats);

// @route   GET /api/users/departments
// @desc    Get all departments
// @access  Private/Admin
router.get('/departments', authMiddleware, adminOnly, userController.getDepartments);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get('/:id', authMiddleware, adminOnly, userController.getUserById);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/:id', authMiddleware, adminOnly, userController.updateUser);

// @route   PUT /api/users/:id/reset-password
// @desc    Reset user password
// @access  Private/Admin
router.put('/:id/reset-password', authMiddleware, adminOnly, userController.resetPassword);

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete)
// @access  Private/Admin
router.delete('/:id', authMiddleware, adminOnly, userController.deleteUser);

module.exports = router;