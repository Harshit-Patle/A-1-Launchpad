const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database to ensure they still exist and are active
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ msg: 'Token is not valid' });
        }

        if (!user.isActive) {
            return res.status(401).json({ msg: 'Account is deactivated' });
        }

        // Add user info to request object
        req.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId,
            department: user.department
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = authMiddleware;