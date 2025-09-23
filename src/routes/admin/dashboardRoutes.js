const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardOverview:
 *       type: object
 *       properties:
 *         newCustomers:
 *           type: object
 *           properties:
 *             value:
 *               type: integer
 *               example: 45
 *             change:
 *               type: integer
 *               example: 12
 *         totalOrders:
 *           type: object
 *           properties:
 *             value:
 *               type: integer
 *               example: 156
 *             change:
 *               type: integer
 *               example: 8
 *         totalRevenue:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *               example: 2847.50
 *             change:
 *               type: integer
 *               example: 15
 *         activeProducts:
 *           type: object
 *           properties:
 *             value:
 *               type: integer
 *               example: 32
 *             change:
 *               type: integer
 *               example: 0
 *         averageOrderValue:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *               example: 18.25
 *             change:
 *               type: integer
 *               example: 5
 */
const {
  getDashboardOverview,
  getRecentActivities,
  getSalesChart,
  getTopProducts,
  getOrderStatusDistribution
} = require('../../controllers/api/admin/dashboardController');

const { adminWithAudit } = require('../../middlewares/adminAuth');

// Dashboard Routes

/**
 * @swagger
 * /api/v1/admin/dashboard/overview:
 *   get:
 *     summary: Get dashboard overview statistics (Admin)
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: month
 *         description: Time period for statistics
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DashboardOverview'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get('/overview',
  ...adminWithAudit('VIEW_DASHBOARD_OVERVIEW'),
  getDashboardOverview
);

router.get('/activities',
  ...adminWithAudit('VIEW_RECENT_ACTIVITIES'),
  getRecentActivities
);

router.get('/sales-chart',
  ...adminWithAudit('VIEW_SALES_CHART'),
  getSalesChart
);

router.get('/top-products',
  ...adminWithAudit('VIEW_TOP_PRODUCTS'),
  getTopProducts
);

router.get('/order-status',
  ...adminWithAudit('VIEW_ORDER_STATUS_DISTRIBUTION'),
  getOrderStatusDistribution
);

module.exports = router;