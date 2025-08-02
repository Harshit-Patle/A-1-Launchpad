const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    partNumber: { type: String, required: true, unique: true },
    description: String,
    manufacturer: String,
    quantity: { type: Number, required: true, min: 0 },
    location: String,
    unitPrice: { type: Number, required: true, min: 0 },
    totalValue: { type: Number },
    datasheetLink: String,
    criticalLow: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true },
    supplier: String,
    supplierPartNumber: String,
    leadTime: Number, // in days
    packageType: String,
    specifications: {
        voltage: String,
        current: String,
        power: String,
        tolerance: String,
        operatingTemp: String,
        other: String
    },
    tags: [String],
    lastRestocked: Date,
    addedDate: { type: Date, default: Date.now },
    lastUsedDate: Date,
    lastMovementDate: { type: Date, default: Date.now }, // Tracks both inward and outward movement for old stock detection
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
    notificationSettings: {
        lowStockEnabled: { type: Boolean, default: true },
        oldStockEnabled: { type: Boolean, default: true },
        oldStockThreshold: { type: Number, default: 90 } // Days of no movement that triggers old stock alert (default 90 days = 3 months)
    }
});

// Calculate total value before saving
componentSchema.pre('save', function (next) {
    this.totalValue = this.quantity * this.unitPrice;
    this.updatedAt = Date.now();
    next();
});

// Virtual for low stock status
componentSchema.virtual('isLowStock').get(function () {
    return this.quantity <= this.criticalLow;
});

module.exports = mongoose.model('Component', componentSchema);