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

// Create subcategory
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

module.exports = {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory
};