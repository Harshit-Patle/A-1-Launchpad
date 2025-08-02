const express = require('express');
const router = express.Router();
const importExportController = require('../controllers/importExportController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly, userOrAdmin } = require('../middleware/roleMiddleware');
const upload = require('../middleware/upload');

// @route   GET /api/import-export/components/export
// @desc    Export all components to Excel
// @access  Private
router.get('/components/export', authMiddleware, userOrAdmin, importExportController.exportComponents);

// @route   POST /api/import-export/components/import
// @desc    Import components from Excel
// @access  Private/Admin
router.post('/components/import', authMiddleware, adminOnly, upload.single('file'), importExportController.importComponents);

// @route   GET /api/import-export/components/template
// @desc    Download import template
// @access  Private
router.get('/components/template', authMiddleware, importExportController.generateTemplate);

// @route   GET /api/import-export/logs/export
// @desc    Export activity logs to Excel
// @access  Private/Admin
router.get('/logs/export', authMiddleware, adminOnly, importExportController.exportLogs);

module.exports = router;
