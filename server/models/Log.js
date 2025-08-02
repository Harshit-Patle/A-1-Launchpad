const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    componentName: { type: String, required: true },
    componentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Component', required: true },
    type: { type: String, enum: ['inward', 'outward', 'adjustment'], required: true },
    quantity: { type: Number, required: true },
    remainingQuantity: { type: Number, required: true },
    reason: String,
    project: String,
    batchNumber: String,
    serialNumber: String,
    userName: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    location: String,
    supplier: String,
    invoiceNumber: String,
    cost: Number,
    date: { type: Date, default: Date.now },
    isApproved: { type: Boolean, default: true },
    metadata: {
        ipAddress: String,
        userAgent: String,
        sessionId: String
    }
});

// Index for better query performance
logSchema.index({ componentId: 1, date: -1 });
logSchema.index({ userId: 1, date: -1 });
logSchema.index({ type: 1, date: -1 });

module.exports = mongoose.model('Log', logSchema);
