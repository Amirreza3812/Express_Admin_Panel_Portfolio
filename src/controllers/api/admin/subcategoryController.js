const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const SubCategory = require('../../../models/entities/SubCategory');
const Category = require('../../../models/entities/Category');
const Product = require('../../../models/entities/Product');

// Get all subcategories with filtering and pagination
const getAllSubCategories = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, category, status } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (category) where.category_id = category;

  const { count, rows: subcategories } = await SubCategory.findAndCountAll({
    where,
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      },
      {
        model: Product,
        as: 'products',
        attributes: ['id', 'name', 'status']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      subcategories,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    }
  });
});

// Get single subcategory
const getSubCategory = catchAsync(async (req, res) => {
  const subcategory = await SubCategory.findByPk(req.params.id, {
    include: [
      {
        model: Category,
        as: 'category'
      },
      {
        model: Product,
        as: 'products',
        attributes: ['id', 'name', 'price', 'status']
      }
    ]
  });

  if (!subcategory) {
    return res.status(404).json({
      success: false,
      message: 'Subcategory not found'
    });
  }

  res.json({
    success: true,
    data: subcategory
  });
});

// Create new subcategory
const createSubCategory = catchAsync(async (req, res) => {
  const { category_id, name, description } = req.body;

  // Check if category exists
  const category = await Category.findByPk(category_id);
  if (!category) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category ID'
    });
  }

  // Handle image upload
  let image = null;
  if (req.file) {
    image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  const subcategory = await SubCategory.create({
    category_id,
    name,
    description,
    image,
    status: 'active'
  });

  const newSubCategory = await SubCategory.findByPk(subcategory.id, {
    include: [{ model: Category, as: 'category' }]
  });

  res.status(201).json({
    success: true,
    message: 'Subcategory created successfully',
    data: newSubCategory
  });
});

// Update subcategory
const updateSubCategory = catchAsync(async (req, res) => {
  const subcategory = await SubCategory.findByPk(req.params.id);

  if (!subcategory) {
    return res.status(404).json({
      success: false,
      message: 'Subcategory not found'
    });
  }

  const { category_id, name, description, status } = req.body;

  // Validate category_id if provided
  if (category_id && category_id !== subcategory.category_id) {
    const category = await Category.findByPk(category_id);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }
  }

  // Handle image upload
  let image = subcategory.image;
  if (req.file) {
    image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  await subcategory.update({
    category_id: category_id || subcategory.category_id,
    name: name || subcategory.name,
    description: description || subcategory.description,
    image,
    status: status || subcategory.status
  });

  const updatedSubCategory = await SubCategory.findByPk(subcategory.id, {
    include: [{ model: Category, as: 'category' }]
  });

  res.json({
    success: true,
    message: 'Subcategory updated successfully',
    data: updatedSubCategory
  });
});

// Delete subcategory
const deleteSubCategory = catchAsync(async (req, res) => {
  const subcategory = await SubCategory.findByPk(req.params.id, {
    include: [{ model: Product, as: 'products' }]
  });

  if (!subcategory) {
    return res.status(404).json({
      success: false,
      message: 'Subcategory not found'
    });
  }

  // Check if subcategory has products
  if (subcategory.products && subcategory.products.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete subcategory with existing products'
    });
  }

  await subcategory.destroy();

  res.json({
    success: true,
    message: 'Subcategory deleted successfully'
  });
});

// Toggle subcategory status
const toggleSubCategoryStatus = catchAsync(async (req, res) => {
  const subcategory = await SubCategory.findByPk(req.params.id);

  if (!subcategory) {
    return res.status(404).json({
      success: false,
      message: 'Subcategory not found'
    });
  }

  const newStatus = subcategory.status === 'active' ? 'inactive' : 'active';
  await subcategory.update({ status: newStatus });

  res.json({
    success: true,
    message: `Subcategory ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
    data: { status: newStatus }
  });
});

module.exports = {
  getAllSubCategories,
  getSubCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  toggleSubCategoryStatus
};