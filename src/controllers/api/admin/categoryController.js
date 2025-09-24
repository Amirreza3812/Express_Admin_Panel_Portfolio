const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const Category = require('../../../models/entities/Category');
const SubCategory = require('../../../models/entities/SubCategory');
const Product = require('../../../models/entities/Product');

// Get all categories with subcategories
const getAllCategories = catchAsync(async (req, res) => {
  const categories = await Category.findAll({
    include: [
      {
        model: SubCategory,
        as: 'subcategories',
        include: [
          {
            model: Product,
            as: 'products',
            attributes: ['id', 'name', 'status']
          }
        ]
      }
    ],
    order: [['createdAt', 'ASC']]
  });

  res.json({
    success: true,
    data: categories
  });
});

// Get single category
const getCategory = catchAsync(async (req, res) => {
  const category = await Category.findByPk(req.params.id, {
    include: [
      {
        model: SubCategory,
        as: 'subcategories',
        include: [
          {
            model: Product,
            as: 'products',
            attributes: ['id', 'name', 'price', 'status']
          }
        ]
      }
    ]
  });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  res.json({
    success: true,
    data: category
  });
});

// Create new category
const createCategory = catchAsync(async (req, res) => {
  const { name, description } = req.body;

  // Handle image upload
  let image = null;
  if (req.file) {
    image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  const category = await Category.create({
    name,
    description,
    image,
    status: 'active'
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category
  });
});

// Update category
const updateCategory = catchAsync(async (req, res) => {
  const category = await Category.findByPk(req.params.id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  const { name, description, status } = req.body;

  // Handle image upload
  let image = category.image;
  if (req.file) {
    image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  await category.update({
    name: name || category.name,
    description: description || category.description,
    image,
    status: status || category.status
  });

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: category
  });
});

// Delete category
const deleteCategory = catchAsync(async (req, res) => {
  const category = await Category.findByPk(req.params.id, {
    include: [{ model: SubCategory, as: 'subcategories' }]
  });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Check if category has subcategories
  if (category.subcategories && category.subcategories.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete category with existing subcategories'
    });
  }

  await category.destroy();

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});


module.exports = {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};