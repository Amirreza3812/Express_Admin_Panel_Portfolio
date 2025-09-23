const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUser,
  updateUserStatus,
  updateUserRole,
  getUserAnalytics,
  deleteUser
} = require('../../controllers/api/admin/userController');

const { adminWithAudit } = require('../../middlewares/adminAuth');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateUserStatus = [
  body('status')
    .isIn(['active', 'inactive', 'banned'])
    .withMessage('Status must be one of: active, inactive, banned'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

const validateUserRole = [
  body('role')
    .isIn(['customer', 'admin'])
    .withMessage('Role must be either customer or admin'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Routes
router.get('/',
  ...adminWithAudit('VIEW_USERS'),
  getAllUsers
);

router.get('/analytics',
  ...adminWithAudit('VIEW_USER_ANALYTICS'),
  getUserAnalytics
);

router.get('/:id',
  ...adminWithAudit('VIEW_USER'),
  getUser
);

router.patch('/:id/status',
  ...adminWithAudit('UPDATE_USER_STATUS'),
  validateUserStatus,
  updateUserStatus
);

router.patch('/:id/role',
  ...adminWithAudit('UPDATE_USER_ROLE'),
  validateUserRole,
  updateUserRole
);

router.delete('/:id',
  ...adminWithAudit('DELETE_USER'),
  deleteUser
);

module.exports = router;