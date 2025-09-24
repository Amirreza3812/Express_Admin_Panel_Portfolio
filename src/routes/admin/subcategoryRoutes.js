const express = require('express');
const router = express.Router();
const {
  getAllSubCategories,
  getSubCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  toggleSubCategoryStatus
} = require('../../controllers/api/admin/subcategoryController');

const { adminWithAudit } = require('../../middlewares/adminAuth');
const { validateCategory } = require('../../middlewares/validation');
const upload = require('../../middlewares/upload');

// Get all subcategories with filtering and pagination
router.get('/',
  ...adminWithAudit('VIEW_SUBCATEGORIES'),
  getAllSubCategories
);

// Get single subcategory
router.get('/:id',
  ...adminWithAudit('VIEW_SUBCATEGORY'),
  getSubCategory
);

// Create new subcategory
router.post('/',
  ...adminWithAudit('CREATE_SUBCATEGORY'),
  upload.single('image'),
  validateCategory,
  createSubCategory
);

// Update subcategory
router.put('/:id',
  ...adminWithAudit('UPDATE_SUBCATEGORY'),
  upload.single('image'),
  validateCategory,
  updateSubCategory
);

// Delete subcategory
router.delete('/:id',
  ...adminWithAudit('DELETE_SUBCATEGORY'),
  deleteSubCategory
);

// Toggle subcategory status
router.patch('/:id/toggle-status',
  ...adminWithAudit('UPDATE_SUBCATEGORY'),
  toggleSubCategoryStatus
);

module.exports = router;