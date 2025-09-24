const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    console.log('Validation errors:', errorMessages); // Debug log

    const error = new AppError('Validation failed', 400);
    error.errors = errorMessages;
    return next(error);
  }
  next();
};

// User Registration Validation
const validateUserRegistration = [
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
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('phone')
    .optional()
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 characters')
    .matches(/^[\+]?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number format'),

  handleValidationErrors
];

// User Login Validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
];

// Category Validation
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),

  handleValidationErrors
];

// Product Validation
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),

  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),

  body('subcategory_id')
    .isInt({ min: 1 })
    .withMessage('Please provide a valid subcategory ID'),

  handleValidationErrors
];

// Comment Validation
const validateComment = [
  body('comment')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),

  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  handleValidationErrors
];

// Order Validation
const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),

  body('items.*.product_id')
    .isInt({ min: 1 })
    .withMessage('Please provide valid product IDs'),

  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),

  body('order_type')
    .isIn(['dine_in', 'takeaway', 'delivery'])
    .withMessage('Order type must be dine_in, takeaway, or delivery'),

  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateCategory,
  validateProduct,
  validateComment,
  validateOrder,
  handleValidationErrors
};