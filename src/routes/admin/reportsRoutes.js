const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getInventoryReport,
  getCustomerReport,
  exportSalesData
} = require('../../controllers/api/admin/reportsController');

const {
  getMonthlySalesReport,
  getYearlySalesReport,
  getSalesComparison,
  getBestPerformers
} = require('../../controllers/api/admin/salesReportController');

const { adminWithAudit } = require('../../middlewares/adminAuth');
const { query, validationResult } = require('express-validator');

// Validation middleware
const validateMonthlyReport = [
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030'),

  query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),

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

const validateYearlyReport = [
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030'),

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

const validateBestPerformers = [
  query('period')
    .optional()
    .isIn(['month', 'year'])
    .withMessage('Period must be either "month" or "year"'),

  query('year')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030'),

  query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),

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

// Existing basic reports
router.get('/sales',
  ...adminWithAudit('VIEW_SALES_REPORTS'),
  getSalesReport
);

router.get('/inventory',
  ...adminWithAudit('VIEW_INVENTORY_REPORTS'),
  getInventoryReport
);

router.get('/customers',
  ...adminWithAudit('VIEW_CUSTOMER_REPORTS'),
  getCustomerReport
);

router.get('/export/sales',
  ...adminWithAudit('EXPORT_SALES_DATA'),
  exportSalesData
);

// New detailed sales reporting routes
/**
 * @swagger
 * /api/v1/admin/reports/sales/monthly:
 *   get:
 *     summary: Get detailed monthly sales report
 *     tags: [Admin - Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           minimum: 2020
 *           maximum: 2030
 *         description: Year for the report
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month for the report
 *     responses:
 *       200:
 *         description: Monthly sales report generated successfully
 */
router.get('/sales/monthly',
  ...adminWithAudit('VIEW_MONTHLY_SALES_REPORT'),
  validateMonthlyReport,
  getMonthlySalesReport
);

/**
 * @swagger
 * /api/v1/admin/reports/sales/yearly:
 *   get:
 *     summary: Get yearly sales summary
 *     tags: [Admin - Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           minimum: 2020
 *           maximum: 2030
 *         description: Year for the report
 *     responses:
 *       200:
 *         description: Yearly sales report generated successfully
 */
router.get('/sales/yearly',
  ...adminWithAudit('VIEW_YEARLY_SALES_REPORT'),
  validateYearlyReport,
  getYearlySalesReport
);

/**
 * @swagger
 * /api/v1/admin/reports/sales/comparison:
 *   get:
 *     summary: Compare sales between periods
 *     tags: [Admin - Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currentYear
 *         schema:
 *           type: integer
 *         description: Current period year
 *       - in: query
 *         name: currentMonth
 *         schema:
 *           type: integer
 *         description: Current period month
 *       - in: query
 *         name: compareYear
 *         schema:
 *           type: integer
 *         description: Comparison period year
 *       - in: query
 *         name: compareMonth
 *         schema:
 *           type: integer
 *         description: Comparison period month
 *     responses:
 *       200:
 *         description: Sales comparison report generated successfully
 */
router.get('/sales/comparison',
  ...adminWithAudit('VIEW_SALES_COMPARISON'),
  getSalesComparison
);

/**
 * @swagger
 * /api/v1/admin/reports/sales/best-performers:
 *   get:
 *     summary: Get best performing products report
 *     tags: [Admin - Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [month, year]
 *         description: Report period
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year for the report
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Month for the report (when period is month)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Number of top products to return
 *     responses:
 *       200:
 *         description: Best performers report generated successfully
 */
router.get('/sales/best-performers',
  ...adminWithAudit('VIEW_BEST_PERFORMERS_REPORT'),
  validateBestPerformers,
  getBestPerformers
);

module.exports = router;