const roleMiddleware = (roles) => {
    return (req, res, next) => {
        try {
            // Ensure user is authenticated
            if (!req.user) {
                return res.status(401).json({ msg: 'Authentication required' });
            }

            // Check if user role is in allowed roles
            const allowedRoles = Array.isArray(roles) ? roles : [roles];

            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    msg: 'Access denied. Insufficient permissions.',
                    requiredRoles: allowedRoles,
                    userRole: req.user.role
                });
            }

            next();
        } catch (error) {
            console.error('Role middleware error:', error);
            res.status(500).json({ msg: 'Server error in role verification' });
        }
    };
};

// Common role checks
const adminOnly = roleMiddleware(['Admin']);
const userOrAdmin = roleMiddleware(['User', 'Admin']);

module.exports = {
    roleMiddleware,
    adminOnly,
    userOrAdmin
};