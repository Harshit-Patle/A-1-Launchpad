const Settings = require('../models/Settings');

// Default settings for each section
const defaultSettings = {
    general: {
        siteName: 'A-1 Launchpad',
        description: 'Laboratory Inventory Management System',
        contactEmail: 'admin@a1launchpad.com',
        dateFormat: 'MM/DD/YYYY',
        timeZone: 'UTC'
    },
    notifications: {
        emailNotifications: true,
        lowStockAlerts: true,
        expiryAlerts: true,
        stockThreshold: 10,
        expiryThresholdDays: 30,
        dailyDigest: false
    },
    security: {
        passwordExpiry: 90,
        sessionTimeout: 30,
        enforceTwoFactor: false,
        lockoutAttempts: 5,
        requireStrongPassword: true
    },
    backup: {
        autoBackup: true,
        backupFrequency: 'daily',
        retentionPeriod: 30,
        backupTime: '01:00'
    },
    integrations: {
        enableApiAccess: false,
        enableVendorPortal: false,
        enableEmailService: true
    }
};

// Get all settings
exports.getAllSettings = async (req, res) => {
    try {
        // Get all settings from DB
        const settingsData = await Settings.find();

        // If no settings found, initialize with defaults
        if (settingsData.length === 0) {
            await this.initializeDefaults();
            const newSettings = await Settings.find();

            // Convert array to object with section keys
            const formattedSettings = {};
            newSettings.forEach(item => {
                formattedSettings[item.section] = item.data;
            });

            return res.json(formattedSettings);
        }

        // Convert array to object with section keys
        const formattedSettings = {};
        settingsData.forEach(item => {
            formattedSettings[item.section] = item.data;
        });

        res.json(formattedSettings);
    } catch (err) {
        console.error('Error retrieving settings:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Initialize default settings
exports.initializeDefaults = async () => {
    try {
        const promises = Object.keys(defaultSettings).map(section => {
            return Settings.findOneAndUpdate(
                { section },
                { section, data: defaultSettings[section] },
                { upsert: true, new: true }
            );
        });

        await Promise.all(promises);
        return true;
    } catch (err) {
        console.error('Error initializing default settings:', err);
        return false;
    }
};

// Update settings for a section
exports.updateSettings = async (req, res) => {
    try {
        const { section } = req.params;
        const updatedData = req.body;

        if (!Object.keys(defaultSettings).includes(section)) {
            return res.status(400).json({ msg: 'Invalid section' });
        }

        const result = await Settings.findOneAndUpdate(
            { section },
            {
                section,
                data: updatedData,
                lastUpdated: Date.now(),
                updatedBy: req.user.id
            },
            { upsert: true, new: true }
        );

        res.json({ section: result.section, data: result.data });
    } catch (err) {
        console.error('Error updating settings:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Reset all settings to default
exports.resetSettings = async (req, res) => {
    try {
        await Settings.deleteMany({});
        await this.initializeDefaults();

        const settings = await Settings.find();
        const formattedSettings = {};
        settings.forEach(item => {
            formattedSettings[item.section] = item.data;
        });

        res.json({ msg: 'Settings reset to defaults', settings: formattedSettings });
    } catch (err) {
        console.error('Error resetting settings:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get default settings
exports.getDefaults = async (req, res) => {
    res.json(defaultSettings);
};
