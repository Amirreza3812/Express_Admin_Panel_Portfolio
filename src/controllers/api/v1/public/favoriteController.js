const catchAsync = require('../../../../utils/catchAsync');
const AppError = require('../../../../utils/AppError');
const Favorite = require('../../../../models/entities/Favorite');
const Product = require('../../../../models/entities/Product');
const Category = require('../../../../models/entities/Category');
const SubCategory = require('../../../../models/entities/SubCategory');

// Get user's favorite products
const getUserFavorites = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 12, category, subcategory } = req.query;
  const offset = (page - 1) * limit;

  // Build include conditions for filtering
  const productInclude = {
    model: Product,
    as: 'product',
    where: { status: 'active' },
    include: [
      {
        model: SubCategory,
        as: 'subcategory',
        include: [{ model: Category, as: 'category' }]
      }
    ]
  };

  // Add category/subcategory filters
  if (category) {
    productInclude.include[0].include[0].where = { slug: category };
  }
  if (subcategory) {
    productInclude.include[0].where = { slug: subcategory };
  }

  const { count, rows: favorites } = await Favorite.findAndCountAll({
    where: { user_id: userId },
    include: [productInclude],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  // Format response
  const products = favorites.map(fav => ({
    ...fav.product.toJSON(),
    favoriteId: fav.id,
    addedToFavoritesAt: fav.createdAt
  }));

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    }
  });
});

// Add product to favorites
const addToFavorites = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  // Check if product exists and is active
  const product = await Product.findOne({
    where: {
      id: productId,
      status: 'active'
    }
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found or not available'
    });
  }

  // Check if already in favorites
  const existingFavorite = await Favorite.findOne({
    where: {
      user_id: userId,
      product_id: productId
    }
  });

  if (existingFavorite) {
    return res.status(400).json({
      success: false,
      message: 'Product is already in your favorites'
    });
  }

  // Add to favorites
  const favorite = await Favorite.create({
    user_id: userId,
    product_id: productId
  });

  // Get the complete favorite with product info
  const favoriteWithProduct = await Favorite.findByPk(favorite.id, {
    include: [
      {
        model: Product,
        as: 'product',
        include: [
          {
            model: SubCategory,
            as: 'subcategory',
            include: [{ model: Category, as: 'category' }]
          }
        ]
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Product added to favorites successfully',
    data: favoriteWithProduct
  });
});

// Remove product from favorites
const removeFromFavorites = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  const favorite = await Favorite.findOne({
    where: {
      user_id: userId,
      product_id: productId
    }
  });

  if (!favorite) {
    return res.status(404).json({
      success: false,
      message: 'Product not found in favorites'
    });
  }

  await favorite.destroy();

  res.json({
    success: true,
    message: 'Product removed from favorites successfully'
  });
});

// Check if product is in user's favorites
const checkFavoriteStatus = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  const favorite = await Favorite.findOne({
    where: {
      user_id: userId,
      product_id: productId
    }
  });

  res.json({
    success: true,
    data: {
      isFavorite: !!favorite,
      favoriteId: favorite ? favorite.id : null
    }
  });
});

// Get favorite products count
const getFavoritesCount = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const count = await Favorite.count({
    where: { user_id: userId },
    include: [
      {
        model: Product,
        as: 'product',
        where: { status: 'active' }
      }
    ]
  });

  res.json({
    success: true,
    data: { count }
  });
});

// Clear all favorites
const clearAllFavorites = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const deletedCount = await Favorite.destroy({
    where: { user_id: userId }
  });

  res.json({
    success: true,
    message: `Removed ${deletedCount} items from favorites`,
    data: { deletedCount }
  });
});

// Get favorite products by category
const getFavoritesByCategory = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const favorites = await Favorite.findAll({
    where: { user_id: userId },
    include: [
      {
        model: Product,
        as: 'product',
        where: { status: 'active' },
        include: [
          {
            model: SubCategory,
            as: 'subcategory',
            include: [{ model: Category, as: 'category' }]
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  // Group by category
  const groupedFavorites = {};
  favorites.forEach(fav => {
    const category = fav.product.subcategory.category;
    if (!groupedFavorites[category.slug]) {
      groupedFavorites[category.slug] = {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug
        },
        products: []
      };
    }
    groupedFavorites[category.slug].products.push({
      ...fav.product.toJSON(),
      favoriteId: fav.id,
      addedToFavoritesAt: fav.createdAt
    });
  });

  res.json({
    success: true,
    data: {
      favoritesByCategory: Object.values(groupedFavorites),
      totalFavorites: favorites.length
    }
  });
});

// Get recently added favorites
const getRecentFavorites = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { limit = 5 } = req.query;

  const recentFavorites = await Favorite.findAll({
    where: { user_id: userId },
    include: [
      {
        model: Product,
        as: 'product',
        where: { status: 'active' },
        attributes: ['id', 'name', 'price', 'image', 'slug', 'rating']
      }
    ],
    limit: parseInt(limit),
    order: [['createdAt', 'DESC']]
  });

  const products = recentFavorites.map(fav => ({
    ...fav.product.toJSON(),
    favoriteId: fav.id,
    addedToFavoritesAt: fav.createdAt
  }));

  res.json({
    success: true,
    data: products
  });
});

module.exports = {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavoriteStatus,
  getFavoritesCount,
  clearAllFavorites,
  getFavoritesByCategory,
  getRecentFavorites
};