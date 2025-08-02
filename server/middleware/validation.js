const { body } = require('express-validator');

// User validation rules
const validateUser = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('role')
        .optional()
        .isIn(['Admin', 'User'])
        .withMessage('Role must be either Admin or User'),
    body('employeeId')
        .optional()
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Employee ID must be between 1 and 20 characters'),
    body('department')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Department must be less than 50 characters')
];

// Login validation rules
const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Component validation rules
const validateComponent = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Component name is required and must be less than 100 characters'),
    body('category')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Category is required and must be less than 50 characters'),
    body('partNumber')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Part number is required and must be less than 50 characters'),
    body('quantity')
        .isInt({ min: 0 })
        .withMessage('Quantity must be a non-negative integer'),
    body('unitPrice')
        .isFloat({ min: 0 })
        .withMessage('Unit price must be a non-negative number'),
    body('criticalLow')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Critical low must be a non-negative integer'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
    body('manufacturer')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Manufacturer must be less than 100 characters'),
    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Location must be less than 100 characters'),
    body('supplier')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Supplier must be less than 100 characters'),
    body('datasheetLink')
        .optional()
        .isURL()
        .withMessage('Datasheet link must be a valid URL'),
    body('leadTime')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Lead time must be a non-negative integer')
];

// Quantity update validation rules
const validateQuantityUpdate = [
    body('type')
        .isIn(['inward', 'outward', 'adjustment'])
        .withMessage('Type must be inward, outward, or adjustment'),
    body('quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer'),
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Reason must be less than 200 characters'),
    body('project')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Project must be less than 100 characters'),
    body('cost')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Cost must be a non-negative number')
];

// Password change validation rules
const validatePasswordChange = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

module.exports = {
    validateUser,
    validateLogin,
    validateComponent,
    validateQuantityUpdate,
    validatePasswordChange
};
