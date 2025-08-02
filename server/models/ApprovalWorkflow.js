const mongoose = require('mongoose');

const approvalWorkflowSchema = new mongoose.Schema({
    requestId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Reference to the item being approved
    requestType: {
        type: String,
        enum: ['component_addition', 'quantity_update', 'maintenance_request', 'large_reservation'],
        required: true
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestData: mongoose.Schema.Types.Mixed, // The actual request data
    approvers: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        comment: String,
        approvedAt: Date
    }],
    finalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    reason: String, // Reason for the request
    comments: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        comment: String,
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    completedAt: Date
});

// Update the updatedAt field on save
approvalWorkflowSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('ApprovalWorkflow', approvalWorkflowSchema);
