const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const auth = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

// Get all settings
router.get('/', auth, settingsController.getAllSettings);

// Update settings for a section
router.put('/:section', [auth, adminOnly], settingsController.updateSettings);

// Reset all settings to default
router.post('/reset', [auth, adminOnly], settingsController.resetSettings);

// Get default settings
router.get('/defaults', auth, settingsController.getDefaults);

module.exports = router;
