const express = require('express');
const router = express.Router();
const {
    generateInventoryReport,
    generateUsageReport,
    generateMaintenanceReport,
    generateReservationReport,
    getDashboardAnalytics
} = require('../controllers/reportController');
const { exportReport } = require('../controllers/reportExportController');
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

// Advanced report routes for the front-end
// @route   GET /api/reports/inventory-overview
// @desc    Get inventory overview report
// @access  Private
router.get('/inventory-overview', (req, res) => {
    const { getInventoryOverviewData } = require('../controllers/reportExportController');
    getInventoryOverviewData(req.query)
        .then(data => res.json(data))
        .catch(err => {
            console.error('Error generating inventory overview:', err);
            res.status(500).json({ error: 'Error generating report' });
        });
});

// @route   GET /api/reports/usage-analytics
// @desc    Get usage analytics report
// @access  Private
router.get('/usage-analytics', (req, res) => {
    const { getUsageAnalyticsData } = require('../controllers/reportExportController');
    getUsageAnalyticsData(req.query)
        .then(data => res.json(data))
        .catch(err => {
            console.error('Error generating usage analytics:', err);
            res.status(500).json({ error: 'Error generating report' });
        });
});

// @route   GET /api/reports/stock-movement
// @desc    Get stock movement report
// @access  Private
router.get('/stock-movement', (req, res) => {
    const { getStockMovementData } = require('../controllers/reportExportController');
    getStockMovementData(req.query)
        .then(data => res.json(data))
        .catch(err => {
            console.error('Error generating stock movement report:', err);
            res.status(500).json({ error: 'Error generating report' });
        });
});

// @route   GET /api/reports/cost-analysis
// @desc    Get cost analysis report
// @access  Private
router.get('/cost-analysis', (req, res) => {
    const { getCostAnalysisData } = require('../controllers/reportExportController');
    getCostAnalysisData(req.query)
        .then(data => res.json(data))
        .catch(err => {
            console.error('Error generating cost analysis report:', err);
            res.status(500).json({ error: 'Error generating report' });
        });
});

// @route   GET /api/reports/compliance-report
// @desc    Get compliance report
// @access  Private
router.get('/compliance-report', (req, res) => {
    const { getComplianceReportData } = require('../controllers/reportExportController');
    getComplianceReportData(req.query)
        .then(data => res.json(data))
        .catch(err => {
            console.error('Error generating compliance report:', err);
            res.status(500).json({ error: 'Error generating report' });
        });
});

// @route   GET /api/reports/vendor-analysis
// @desc    Get vendor analysis report
// @access  Private
router.get('/vendor-analysis', (req, res) => {
    const { getVendorAnalysisData } = require('../controllers/reportExportController');
    getVendorAnalysisData(req.query)
        .then(data => res.json(data))
        .catch(err => {
            console.error('Error generating vendor analysis report:', err);
            res.status(500).json({ error: 'Error generating report' });
        });
});

// @route   GET /api/reports/waste-tracking
// @desc    Get waste tracking report
// @access  Private
router.get('/waste-tracking', (req, res) => {
    const { getWasteTrackingData } = require('../controllers/reportExportController');
    getWasteTrackingData(req.query)
        .then(data => res.json(data))
        .catch(err => {
            console.error('Error generating waste tracking report:', err);
            res.status(500).json({ error: 'Error generating report' });
        });
});

// @route   GET /api/reports/reservation-report
// @desc    Get reservation report
// @access  Private
router.get('/reservation-report', (req, res) => {
    const { getReservationReportData } = require('../controllers/reportExportController');
    getReservationReportData(req.query)
        .then(data => res.json(data))
        .catch(err => {
            console.error('Error generating reservation report:', err);
            res.status(500).json({ error: 'Error generating report' });
        });
});

// @route   GET /api/reports/:reportType/export
// @desc    Export a report in PDF or Excel format
// @access  Private
router.get('/:reportType/export', exportReport);

module.exports = router;
