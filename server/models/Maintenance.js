const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
    equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Component', required: true },
    equipmentName: { type: String, required: true },
    type: {
        type: String,
        enum: ['preventive', 'corrective', 'calibration', 'inspection'],
        required: true
    },
    scheduledDate: { type: Date, required: true },
    completedDate: Date,
    description: { type: String, required: true },
    performedBy: { type: String, required: true },
    cost: Number,
    notes: String,
    nextMaintenanceDate: Date,
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attachments: [{
        filename: String,
        path: String,
        uploadDate: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on save
maintenanceSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);
