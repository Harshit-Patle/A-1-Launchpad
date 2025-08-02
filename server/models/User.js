
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Manager', 'Technician', 'User'], default: 'User' },
    employeeId: { type: String, unique: true },
    department: String,
    phone: String,
    permissions: {
        view_inventory: { type: Boolean, default: true },
        edit_inventory: { type: Boolean, default: false },
        delete_inventory: { type: Boolean, default: false },
        manage_users: { type: Boolean, default: false },
        view_reports: { type: Boolean, default: false },
        export_data: { type: Boolean, default: false },
        manage_reservations: { type: Boolean, default: false },
        manage_maintenance: { type: Boolean, default: false },
        approve_requests: { type: Boolean, default: false },
        system_settings: { type: Boolean, default: false }
    },
    preferences: {
        notifications: { type: Boolean, default: true },
        emailAlerts: { type: Boolean, default: true },
        theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' }
    },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);