const User = require('../models/User');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, role, department, isActive } = req.query;

        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } }
            ];
        }

        if (role && role !== 'all') {
            filter.role = role;
        }

        if (department && department !== 'all') {
            filter.department = department;
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        const users = await User.find(filter)
            .select('-password')
            .sort({ name: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(filter);

        res.json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update user (Admin only)
exports.updateUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, role, department, isActive } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.role = role || user.role;
        user.department = department || user.department;
        user.isActive = isActive !== undefined ? isActive : user.isActive;
        user.updatedAt = new Date();

        await user.save();

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                employeeId: user.employeeId,
                department: user.department,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Soft delete
        user.isActive = false;
        await user.save();

        res.json({ msg: 'User deactivated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Reset user password (Admin only)
exports.resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ msg: 'Password reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const adminUsers = await User.countDocuments({ role: 'Admin' });

        const usersByDepartment = await User.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const recentLogins = await User.find({ lastLogin: { $exists: true } })
            .select('name email lastLogin')
            .sort({ lastLogin: -1 })
            .limit(10);

        res.json({
            totalUsers,
            activeUsers,
            adminUsers,
            usersByDepartment,
            recentLogins
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get departments
exports.getDepartments = async (req, res) => {
    try {
        const departments = await User.distinct('department', { isActive: true });
        res.json(departments.filter(dept => dept)); // Remove null/undefined values
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, phone, department, preferences } = req.body;

        // Check if email is already taken by another user
        const existingUser = await User.findOne({
            email,
            _id: { $ne: req.user.id }
        });

        if (existingUser) {
            return res.status(400).json({ msg: 'Email already in use' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                name,
                email,
                phone,
                department,
                preferences,
                updatedAt: new Date()
            },
            { new: true }
        ).select('-password');

        res.json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.findByIdAndUpdate(req.user.id, {
            password: hashedPassword,
            updatedAt: new Date()
        });

        res.json({ msg: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update user role and permissions (Admin only)
exports.updateUserRole = async (req, res) => {
    try {
        const { role, permissions } = req.body;
        const userId = req.params.id;

        // Don't allow changing own role
        if (userId === req.user.id) {
            return res.status(400).json({ msg: 'Cannot change your own role' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                role,
                permissions,
                updatedAt: new Date()
            },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};
