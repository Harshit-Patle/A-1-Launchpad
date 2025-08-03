const mongoose = require('mongoose');

const wasteEntrySchema = mongoose.Schema(
    {
        componentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Component',
        },
        componentName: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        unit: {
            type: String,
            required: true,
            enum: ['g', 'kg', 'ml', 'l', 'pcs', 'container'],
        },
        wasteType: {
            type: String,
            required: true,
            enum: ['Chemical', 'Biological', 'Radioactive', 'Sharps', 'Electronic', 'Glass', 'Mixed', 'Other'],
        },
        hazardLevel: {
            type: String,
            required: true,
            enum: ['low', 'medium', 'high', 'extreme'],
        },
        disposalMethod: {
            type: String,
            required: true,
            enum: ['Incineration', 'Neutralization', 'Recycling', 'Landfill', 'Special Disposal', 'External Vendor'],
        },
        disposalDate: {
            type: Date,
            required: true,
        },
        disposedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        containerCode: {
            type: String,
        },
        notes: {
            type: String,
        },
        isCompliant: {
            type: Boolean,
            default: true,
        },
        attachments: [{
            type: String, // file paths or URLs
        }],
    },
    {
        timestamps: true,
    }
);

const WasteEntry = mongoose.model('WasteEntry', wasteEntrySchema);

module.exports = WasteEntry;
