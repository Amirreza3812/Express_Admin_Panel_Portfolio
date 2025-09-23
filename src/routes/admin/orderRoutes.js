const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrder,
  updateOrderStatus,
  getOrderStats,
  getMonthlySalesReport
} = require('../../controllers/api/admin/orderController');

const { adminWithAudit } = require('../../middlewares/adminAuth');
const { body, validationResult } = require('express-validator');

// Status validation middleware
const validateOrderStatus = [
  body('status')
    .isIn(['pending', 'preparing', 'ready', 'delivered', 'cancelled'])
    .withMessage('Status must be one of: pending, preparing, ready, delivered, cancelled'),

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

/**
 * @swagger
 * /api/v1/admin/orders:
 *   get:
 *     summary: Get all orders with filtering (Admin)
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, preparing, ready, delivered, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders from date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders to date
 *       - in: query
 *         name: customer
 *         schema:
 *           type: string
 *         description: Search by customer name or email
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           total:
 *                             type: number
 *                           status:
 *                             type: string
 *                           order_date:
 *                             type: string
 *                             format: date-time
 *                           orderItems:
 *                             type: array
 *                             items:
 *                               type: object
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get('/',
  ...adminWithAudit('VIEW_ORDERS'),
  getAllOrders
);

router.get('/stats',
  ...adminWithAudit('VIEW_ORDER_STATS'),
  getOrderStats
);

/**
 * @swagger
 * /api/v1/admin/orders/reports/monthly:
 *   get:
 *     summary: Get monthly sales report (Admin)
 *     tags: [Admin - Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2024
 *         description: Year for the report
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           example: 3
 *         description: Month for the report (optional, if not provided returns full year)
 *     responses:
 *       200:
 *         description: Monthly sales report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: string
 *                       example: "2024-03"
 *                     totalOrders:
 *                       type: integer
 *                       example: 156
 *                     totalRevenue:
 *                       type: number
 *                       example: 2847.50
 *                     averageOrderValue:
 *                       type: number
 *                       example: 18.25
 *                     topProducts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Cappuccino"
 *                           quantity:
 *                             type: integer
 *                             example: 45
 *                           revenue:
 *                             type: number
 *                             example: 202.50
 *                     dailyBreakdown:
 *                       type: object
 *                       example:
 *                         "2024-03-01":
 *                           orders: 8
 *                           revenue: 142.50
 *                         "2024-03-02":
 *                           orders: 12
 *                           revenue: 218.75
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get('/reports/monthly',
  ...adminWithAudit('VIEW_MONTHLY_SALES_REPORT'),
  getMonthlySalesReport
);

router.get('/:id',
  ...adminWithAudit('VIEW_ORDER'),
  getOrder
);

router.patch('/:id/status',
  ...adminWithAudit('UPDATE_ORDER_STATUS'),
  validateOrderStatus,
  updateOrderStatus
);

module.exports = router;