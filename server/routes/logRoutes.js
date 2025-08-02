const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly, userOrAdmin } = require('../middleware/roleMiddleware');
const logController = require('../controllers/logController');

// @route   GET /api/logs
// @desc    Get all logs with filtering and pagination
// @access  Private
router.get('/', authMiddleware, logController.getAllLogs);

// @route   GET /api/logs/stats
// @desc    Get log statistics
// @access  Private/Admin
router.get('/stats', authMiddleware, adminOnly, logController.getLogStats);

// @route   GET /api/logs/export
// @desc    Export logs to CSV
// @access  Private/Admin
router.get('/export', authMiddleware, adminOnly, logController.exportLogs);

// @route   GET /api/logs/component/:componentId
// @desc    Get logs for a specific component
// @access  Private
router.get('/component/:componentId', authMiddleware, logController.getComponentLogs);

// @route   GET /api/logs/user
// @desc    Get logs for current user
// @access  Private
router.get('/user', authMiddleware, logController.getUserLogs);

// @route   POST /api/logs
// @desc    Create manual log entry
// @access  Private/Admin
router.post('/', authMiddleware, adminOnly, logController.createLog);

module.exports = router;