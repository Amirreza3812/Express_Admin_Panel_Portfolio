const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getInventoryReport,
  getCustomerReport,
  exportSalesData
} = require('../../controllers/api/admin/reportsController');

const { adminWithAudit } = require('../../middlewares/adminAuth');

// Sales Reports
router.get('/sales',
  ...adminWithAudit('VIEW_SALES_REPORTS'),
  getSalesReport
);

// Inventory Reports
router.get('/inventory',
  ...adminWithAudit('VIEW_INVENTORY_REPORTS'),
  getInventoryReport
);

// Customer Reports
router.get('/customers',
  ...adminWithAudit('VIEW_CUSTOMER_REPORTS'),
  getCustomerReport
);

// Export Sales Data
router.get('/export/sales',
  ...adminWithAudit('EXPORT_SALES_DATA'),
  exportSalesData
);

module.exports = router;