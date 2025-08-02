const jwt = require('jsonwebtoken');

const generateToken = (userId, userRole) => {
    return jwt.sign(
        {
            id: userId,
            role: userRole
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE || '7d',
            issuer: 'inventory-management',
            audience: 'inventory-users'
        }
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken
};