const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema(
    {
        section: {
            type: String,
            required: true,
            unique: true,
            enum: ['general', 'notifications', 'security', 'backup', 'integrations']
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true,
    }
);

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
