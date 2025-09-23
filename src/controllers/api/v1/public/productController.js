const { Product, SubCategory, Category, Comment, User } = require('../../../../models/associations');
const ApiResponse = require('../../../../utils/apiResponse');
const catchAsync = require('../../../../utils/catchAsync');
const AppError = require('../../../../utils/AppError');
const { Op } = require('sequelize');

// @desc    Get all products with filtering and pagination
// @route   GET /api/v1/public/products
// @access  Public
const getAllProducts = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const offset = (page - 1) * limit;

  // Build filter conditions
  const whereConditions = { status: 'active' };

  // Filter by category
  if (req.query.category) {
    whereConditions['$subcategory.category.slug$'] = req.query.category;
  }

  // Filter by subcategory
  if (req.query.subcategory) {
    whereConditions['$subcategory.slug$'] = req.query.subcategory;
  }

  // Filter by price range
  if (req.query.minPrice || req.query.maxPrice) {
    whereConditions.price = {};
    if (req.query.minPrice) whereConditions.price[Op.gte] = req.query.minPrice;
    if (req.query.maxPrice) whereConditions.price[Op.lte] = req.query.maxPrice;
  }

  // Filter by rating
  if (req.query.minRating) {
    whereConditions.rating = { [Op.gte]: req.query.minRating };
  }

  // Search by name or description
  if (req.query.search) {
    whereConditions[Op.or] = [
      { name: { [Op.like]: `%${req.query.search}%` } },
      { description: { [Op.like]: `%${req.query.search}%` } }
    ];
  }

  // Featured products only
  if (req.query.featured === 'true') {
    whereConditions.is_featured = true;
  }

  // Sorting
  let orderBy = [['sort_order', 'ASC'], ['name', 'ASC']];
  if (req.query.sortBy) {
    switch (req.query.sortBy) {
      case 'price_low':
        orderBy = [['price', 'ASC']];
        break;
      case 'price_high':
        orderBy = [['price', 'DESC']];
        break;
      case 'rating':
        orderBy = [['rating', 'DESC']];
        break;
      case 'newest':
        orderBy = [['createdAt', 'DESC']];
        break;
      case 'popular':
        orderBy = [['total_reviews', 'DESC']];
        break;
    }
  }

  const { count, rows: products } = await Product.findAndCountAll({
    where: whereConditions,
    attributes: [
      'id', 'name', 'description', 'price', 'image', 'rating',
      'total_reviews', 'is_featured', 'slug', 'preparation_time',
      'calories', 'allergens'
    ],
    include: [
      {
        model: SubCategory,
        as: 'subcategory',
        attributes: ['id', 'name', 'slug'],
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug']
          }
        ]
      }
    ],
    order: orderBy,
    limit,
    offset
  });

  const pagination = {
    page,
    limit,
    total: count
  };

  ApiResponse.paginated(res, products, pagination, 'Products retrieved successfully');
});

// @desc    Get single product by slug/id
// @route   GET /api/v1/public/products/:identifier
// @access  Public
const getProduct = catchAsync(async (req, res, next) => {
  const { identifier } = req.params;

  // Check if identifier is numeric (ID) or string (slug)
  const whereCondition = isNaN(identifier)
    ? { slug: identifier, status: 'active' }
    : { id: identifier, status: 'active' };

  const product = await Product.findOne({
    where: whereCondition,
    attributes: [
      'id', 'name', 'description', 'price', 'image', 'gallery',
      'rating', 'total_reviews', 'is_featured', 'slug',
      'preparation_time', 'ingredients', 'calories', 'allergens', 'sizes'
    ],
    include: [
      {
        model: SubCategory,
        as: 'subcategory',
        attributes: ['id', 'name', 'slug', 'description'],
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug', 'description']
          }
        ]
      },
      {
        model: Comment,
        as: 'comments',
        where: { status: 'approved' },
        required: false,
        attributes: ['id', 'comment', 'rating', 'createdAt'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'avatar']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 10
      }
    ]
  });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  ApiResponse.success(res, product, 'Product retrieved successfully');
});

// @desc    Get featured products
// @route   GET /api/v1/public/products/featured
// @access  Public
const getFeaturedProducts = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 8;

  const products = await Product.findAll({
    where: {
      status: 'active',
      is_featured: true
    },
    attributes: [
      'id', 'name', 'description', 'price', 'image',
      'rating', 'total_reviews', 'slug'
    ],
    include: [
      {
        model: SubCategory,
        as: 'subcategory',
        attributes: ['id', 'name', 'slug'],
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug']
          }
        ]
      }
    ],
    order: [['sort_order', 'ASC'], ['rating', 'DESC']],
    limit
  });

  ApiResponse.success(res, products, 'Featured products retrieved successfully');
});

// @desc    Get related products
// @route   GET /api/v1/public/products/:id/related
// @access  Public
const getRelatedProducts = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit, 10) || 6;

  // First get the product to find its subcategory
  const product = await Product.findByPk(id, {
    attributes: ['subcategory_id']
  });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Find related products in the same subcategory
  const relatedProducts = await Product.findAll({
    where: {
      status: 'active',
      subcategory_id: product.subcategory_id,
      id: { [Op.ne]: id } // Exclude current product
    },
    attributes: [
      'id', 'name', 'price', 'image', 'rating', 'total_reviews', 'slug'
    ],
    order: [['rating', 'DESC'], ['total_reviews', 'DESC']],
    limit
  });

  ApiResponse.success(res, relatedProducts, 'Related products retrieved successfully');
});

module.exports = {
  getAllProducts,
  getProduct,
  getFeaturedProducts,
  getRelatedProducts
};