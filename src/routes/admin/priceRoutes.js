const express = require('express');
const router = express.Router();
const {
  increaseAllPrices,
  applyDiscountToAll,
  setBulkPrices,
  getPriceAnalytics
} = require('../../controllers/api/admin/priceController');

const { adminWithAudit } = require('../../middlewares/adminAuth');
const { body, query, validationResult } = require('express-validator');

// Validation middleware
const validatePriceIncrease = [
  body('percentage')
    .isFloat({ min: 0.01, max: 100 })
    .withMessage('Percentage must be between 0.01 and 100'),

  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),

  body('subcategoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Subcategory ID must be a positive integer'),

  (req, res, next) => {
    // Cannot specify both categoryId and subcategoryId
    if (req.body.categoryId && req.body.subcategoryId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot specify both categoryId and subcategoryId'
      });
    }

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

const validatePriceDiscount = [
  body('percentage')
    .isFloat({ min: 0.01, max: 99.99 })
    .withMessage('Discount percentage must be between 0.01 and 99.99'),

  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),

  body('subcategoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Subcategory ID must be a positive integer'),

  (req, res, next) => {
    // Cannot specify both categoryId and subcategoryId
    if (req.body.categoryId && req.body.subcategoryId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot specify both categoryId and subcategoryId'
      });
    }

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

const validateBulkPrices = [
  body('updates')
    .isArray({ min: 1, max: 100 })
    .withMessage('Updates must be an array with 1-100 items'),

  body('updates.*.productId')
    .isInt({ min: 1 })
    .withMessage('Each update must have a valid product ID'),

  body('updates.*.price')
    .isFloat({ min: 0 })
    .withMessage('Each update must have a valid price (minimum 0)'),

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

const validateAnalyticsQuery = [
  query('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),

  query('subcategoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Subcategory ID must be a positive integer'),

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

/**
 * @swagger
 * /api/v1/admin/prices/increase:
 *   patch:
 *     summary: Increase prices by percentage
 *     tags: [Admin - Price Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - percentage
 *             properties:
 *               percentage:
 *                 type: number
 *                 minimum: 0.01
 *                 maximum: 100
 *                 description: Percentage to increase prices
 *                 example: 10
 *               categoryId:
 *                 type: integer
 *                 minimum: 1
 *                 description: Optional - Apply only to specific category
 *               subcategoryId:
 *                 type: integer
 *                 minimum: 1
 *                 description: Optional - Apply only to specific subcategory
 *     responses:
 *       200:
 *         description: Prices increased successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: No products found
 */
router.patch('/increase',
  ...adminWithAudit('INCREASE_PRICES'),
  validatePriceIncrease,
  increaseAllPrices
);

/**
 * @swagger
 * /api/v1/admin/prices/discount:
 *   patch:
 *     summary: Apply discount by percentage
 *     tags: [Admin - Price Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - percentage
 *             properties:
 *               percentage:
 *                 type: number
 *                 minimum: 0.01
 *                 maximum: 99.99
 *                 description: Discount percentage to apply
 *                 example: 15
 *               categoryId:
 *                 type: integer
 *                 minimum: 1
 *                 description: Optional - Apply only to specific category
 *               subcategoryId:
 *                 type: integer
 *                 minimum: 1
 *                 description: Optional - Apply only to specific subcategory
 *     responses:
 *       200:
 *         description: Discount applied successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: No products found
 */
router.patch('/discount',
  ...adminWithAudit('APPLY_DISCOUNT'),
  validatePriceDiscount,
  applyDiscountToAll
);

/**
 * @swagger
 * /api/v1/admin/prices/set-bulk:
 *   patch:
 *     summary: Set specific prices for multiple products
 *     tags: [Admin - Price Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - price
 *                   properties:
 *                     productId:
 *                       type: integer
 *                       minimum: 1
 *                       example: 1
 *                     price:
 *                       type: number
 *                       minimum: 0
 *                       example: 12.99
 *     responses:
 *       200:
 *         description: Bulk prices updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Some products not found
 */
router.patch('/set-bulk',
  ...adminWithAudit('BULK_PRICE_UPDATE'),
  validateBulkPrices,
  setBulkPrices
);

/**
 * @swagger
 * /api/v1/admin/prices/analytics:
 *   get:
 *     summary: Get price analytics and statistics
 *     tags: [Admin - Price Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter by category ID
 *       - in: query
 *         name: subcategoryId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter by subcategory ID
 *     responses:
 *       200:
 *         description: Price analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalProducts:
 *                           type: integer
 *                         minPrice:
 *                           type: number
 *                         maxPrice:
 *                           type: number
 *                         avgPrice:
 *                           type: number
 *                     priceRanges:
 *                       type: object
 *                     categoryStats:
 *                       type: object
 *       400:
 *         description: Invalid query parameters
 */
router.get('/analytics',
  ...adminWithAudit('VIEW_PRICE_ANALYTICS'),
  validateAnalyticsQuery,
  getPriceAnalytics
);

module.exports = router;