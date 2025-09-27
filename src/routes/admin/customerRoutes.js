const express = require('express');
const router = express.Router();
const {
  getCustomerAnalytics,
  getCustomerProfile,
  manageComment,
  getAllComments,
  getFavoritesAnalytics
} = require('../../controllers/api/admin/customerManagementController');

// Import existing user management functions
const {
  getAllUsers,
  getUser,
  updateUserStatus,
  updateUserRole,
  getUserAnalytics,
  deleteUser
} = require('../../controllers/api/admin/userController');

const { adminWithAudit } = require('../../middlewares/adminAuth');
const { body, query, param, validationResult } = require('express-validator');

// Validation middleware
const validateUserFilters = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('role')
    .optional()
    .isIn(['customer', 'admin', 'super_admin'])
    .withMessage('Invalid role'),

  query('status')
    .optional()
    .isIn(['active', 'inactive', 'banned'])
    .withMessage('Invalid status'),

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

const validateCommentAction = [
  param('commentId')
    .isInt({ min: 1 })
    .withMessage('Comment ID must be a positive integer'),

  body('action')
    .isIn(['approve', 'reject', 'delete'])
    .withMessage('Action must be approve, reject, or delete'),

  body('adminNote')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Admin note must be less than 500 characters'),

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

const validateCommentFilters = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['all', 'pending', 'approved', 'rejected'])
    .withMessage('Status must be all, pending, approved, or rejected'),

  query('productId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),

  query('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),

  query('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

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

const validateUserStatusUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),

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

const validateUserRoleUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),

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

// User Management Routes
/**
 * @swagger
 * /api/v1/admin/customers:
 *   get:
 *     summary: Get all users with filtering and pagination
 *     tags: [Admin - Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [customer, admin, super_admin]
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, banned]
 *         description: Filter by user status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, email, or phone
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/',
  ...adminWithAudit('VIEW_ALL_USERS'),
  validateUserFilters,
  getAllUsers
);

/**
 * @swagger
 * /api/v1/admin/customers/analytics:
 *   get:
 *     summary: Get comprehensive customer analytics
 *     tags: [Admin - Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *       - in: query
 *         name: customerSegment
 *         schema:
 *           type: string
 *           enum: [all, new, returning, vip]
 *         description: Customer segment filter
 *     responses:
 *       200:
 *         description: Customer analytics retrieved successfully
 */
router.get('/analytics',
  ...adminWithAudit('VIEW_CUSTOMER_ANALYTICS'),
  getCustomerAnalytics
);

/**
 * @swagger
 * /api/v1/admin/customers/{id}/profile:
 *   get:
 *     summary: Get detailed customer profile
 *     tags: [Admin - Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer profile retrieved successfully
 *       404:
 *         description: Customer not found
 */
router.get('/:id/profile',
  ...adminWithAudit('VIEW_CUSTOMER_PROFILE'),
  getCustomerProfile
);

/**
 * @swagger
 * /api/v1/admin/customers/{id}:
 *   get:
 *     summary: Get single user details
 *     tags: [Admin - Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 */
router.get('/:id',
  ...adminWithAudit('VIEW_USER_DETAILS'),
  getUser
);

/**
 * @swagger
 * /api/v1/admin/customers/{id}/status:
 *   patch:
 *     summary: Update user status
 *     tags: [Admin - Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, banned]
 *     responses:
 *       200:
 *         description: User status updated successfully
 */
router.patch('/:id/status',
  ...adminWithAudit('UPDATE_USER_STATUS'),
  validateUserStatusUpdate,
  updateUserStatus
);

/**
 * @swagger
 * /api/v1/admin/customers/{id}/role:
 *   patch:
 *     summary: Update user role
 *     tags: [Admin - Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [customer, admin]
 *     responses:
 *       200:
 *         description: User role updated successfully
 */
router.patch('/:id/role',
  ...adminWithAudit('UPDATE_USER_ROLE'),
  validateUserRoleUpdate,
  updateUserRole
);

/**
 * @swagger
 * /api/v1/admin/customers/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Admin - Customer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/:id',
  ...adminWithAudit('DELETE_USER'),
  deleteUser
);

// Comment Management Routes
/**
 * @swagger
 * /api/v1/admin/customers/comments:
 *   get:
 *     summary: Get all comments with filtering
 *     tags: [Admin - Comment Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, approved, rejected]
 *         description: Filter by comment status
 *       - in: query
 *         name: productId
 *         schema:
 *           type: integer
 *         description: Filter by product ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by rating
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 */
router.get('/comments',
  ...adminWithAudit('VIEW_ALL_COMMENTS'),
  validateCommentFilters,
  getAllComments
);

/**
 * @swagger
 * /api/v1/admin/customers/comments/{commentId}:
 *   patch:
 *     summary: Moderate comment (approve, reject, delete)
 *     tags: [Admin - Comment Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject, delete]
 *               adminNote:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional note for rejection
 *     responses:
 *       200:
 *         description: Comment moderated successfully
 */
router.patch('/comments/:commentId',
  ...adminWithAudit('MODERATE_COMMENT'),
  validateCommentAction,
  manageComment
);

// Favorites Analytics Routes
/**
 * @swagger
 * /api/v1/admin/customers/favorites/analytics:
 *   get:
 *     summary: Get customer favorites analytics
 *     tags: [Admin - Customer Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorites analytics retrieved successfully
 */
router.get('/favorites/analytics',
  ...adminWithAudit('VIEW_FAVORITES_ANALYTICS'),
  getFavoritesAnalytics
);

module.exports = router;