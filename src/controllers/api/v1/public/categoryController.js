const { Category, SubCategory, Product } = require('../../../../models/associations');
const ApiResponse = require('../../../../utils/apiResponse');
const catchAsync = require('../../../../utils/catchAsync');
const AppError = require('../../../../utils/AppError');

// @desc    Get all active categories
// @route   GET /api/v1/public/categories
// @access  Public
const getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.findAll({
    where: { status: 'active' },
    attributes: ['id', 'name', 'description', 'image', 'slug', 'sort_order'],
    order: [['sort_order', 'ASC'], ['name', 'ASC']],
    include: [
      {
        model: SubCategory,
        as: 'subcategories',
        where: { status: 'active' },
        required: false,
        attributes: ['id', 'name', 'description', 'image', 'slug', 'sort_order'],
        order: [['sort_order', 'ASC']],
        include: [
          {
            model: Product,
            as: 'products',
            where: { status: 'active' },
            required: false,
            attributes: ['id', 'name', 'price', 'image', 'rating', 'total_reviews'],
            limit: 5 // Show only top 5 products per subcategory
          }
        ]
      }
    ]
  });

  ApiResponse.success(res, categories, 'Categories retrieved successfully');
});

// @desc    Get single category by slug/id
// @route   GET /api/v1/public/categories/:identifier
// @access  Public
const getCategory = catchAsync(async (req, res, next) => {
  const { identifier } = req.params;

  // Check if identifier is numeric (ID) or string (slug)
  const whereCondition = isNaN(identifier)
    ? { slug: identifier, status: 'active' }
    : { id: identifier, status: 'active' };

  const category = await Category.findOne({
    where: whereCondition,
    attributes: ['id', 'name', 'description', 'image', 'slug'],
    include: [
      {
        model: SubCategory,
        as: 'subcategories',
        where: { status: 'active' },
        required: false,
        attributes: ['id', 'name', 'description', 'image', 'slug', 'sort_order'],
        order: [['sort_order', 'ASC']],
        include: [
          {
            model: Product,
            as: 'products',
            where: { status: 'active' },
            required: false,
            attributes: [
              'id', 'name', 'description', 'price', 'image',
              'rating', 'total_reviews', 'is_featured', 'slug'
            ],
            order: [['is_featured', 'DESC'], ['sort_order', 'ASC']]
          }
        ]
      }
    ]
  });

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  ApiResponse.success(res, category, 'Category retrieved successfully');
});

// @desc    Get category statistics
// @route   GET /api/v1/public/categories/stats
// @access  Public
const getCategoryStats = catchAsync(async (req, res, next) => {
  const stats = await Category.findAll({
    where: { status: 'active' },
    attributes: [
      'id',
      'name',
      'slug',
      [
        Category.sequelize.fn('COUNT', Category.sequelize.col('subcategories.products.id')),
        'product_count'
      ]
    ],
    include: [
      {
        model: SubCategory,
        as: 'subcategories',
        where: { status: 'active' },
        required: false,
        attributes: [],
        include: [
          {
            model: Product,
            as: 'products',
            where: { status: 'active' },
            required: false,
            attributes: []
          }
        ]
      }
    ],
    group: ['Category.id'],
    order: [['name', 'ASC']]
  });

  ApiResponse.success(res, stats, 'Category statistics retrieved successfully');
});

module.exports = {
  getAllCategories,
  getCategory,
  getCategoryStats
};