const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory
} = require('../../controllers/api/admin/categoryController');

const { adminWithAudit } = require('../../middlewares/adminAuth');
const { validateCategory } = require('../../middlewares/validation');
const upload = require('../../middlewares/upload');

// Category Routes
router.get('/',
  ...adminWithAudit('VIEW_CATEGORIES'),
  getAllCategories
);

router.get('/:id',
  ...adminWithAudit('VIEW_CATEGORY'),
  getCategory
);

router.post('/',
  ...adminWithAudit('CREATE_CATEGORY'),
  upload.single('image'),
  validateCategory,
  createCategory
);

router.put('/:id',
  ...adminWithAudit('UPDATE_CATEGORY'),
  upload.single('image'),
  validateCategory,
  updateCategory
);

router.delete('/:id',
  ...adminWithAudit('DELETE_CATEGORY'),
  deleteCategory
);

// Subcategory Routes
router.post('/subcategories',
  ...adminWithAudit('CREATE_SUBCATEGORY'),
  upload.single('image'),
  validateCategory,
  createSubCategory
);

router.put('/subcategories/:id',
  ...adminWithAudit('UPDATE_SUBCATEGORY'),
  upload.single('image'),
  validateCategory,
  updateSubCategory
);

router.delete('/subcategories/:id',
  ...adminWithAudit('DELETE_SUBCATEGORY'),
  deleteSubCategory
);

module.exports = router;