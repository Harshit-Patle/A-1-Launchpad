const express = require('express');
const router = express.Router();
const {
    generateInventoryReport,
    generateUsageReport,
    generateMaintenanceReport,
    generateReservationReport,
    getDashboardAnalytics
} = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   GET /api/reports/inventory
// @desc    Generate inventory report
// @access  Private
router.get('/inventory', generateInventoryReport);

// @route   GET /api/reports/usage
// @desc    Generate usage report
// @access  Private
router.get('/usage', generateUsageReport);

// @route   GET /api/reports/maintenance
// @desc    Generate maintenance report
// @access  Private
router.get('/maintenance', generateMaintenanceReport);

// @route   GET /api/reports/reservations
// @desc    Generate reservation report
// @access  Private
router.get('/reservations', generateReservationReport);

// @route   GET /api/reports/dashboard
// @desc    Get dashboard analytics
// @access  Private
router.get('/dashboard', getDashboardAnalytics);

module.exports = router;
