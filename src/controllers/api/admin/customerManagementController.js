const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const ApiResponse = require('../../../utils/apiResponse');
const { User, Order, OrderItem, Comment, Favorite, Product, Category, SubCategory } = require('../../../models/associations');
const { Op } = require('sequelize');
const { sequelize } = require('../../../config/db');

// @desc    Get comprehensive customer analytics
// @route   GET /api/v1/admin/customers/analytics
// @access  Admin
const getCustomerAnalytics = catchAsync(async (req, res, next) => {
  const {
    startDate,
    endDate,
    customerSegment = 'all' // all, new, returning, vip
  } = req.query;

  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter = {
      createdAt: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };
  } else {
    // Default to last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    dateFilter = {
      createdAt: {
        [Op.gte]: thirtyDaysAgo
      }
    };
  }

  // Get customer statistics
  const totalCustomers = await User.count({
    where: { role: 'customer' }
  });

  const activeCustomers = await User.count({
    where: {
      role: 'customer',
      status: 'active'
    }
  });

  const newCustomers = await User.count({
    where: {
      role: 'customer',
      ...dateFilter
    }
  });

  // Customer segmentation based on order behavior
  const customerSegmentation = await sequelize.query(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.createdAt as registration_date,
      COUNT(o.id) as total_orders,
      COALESCE(SUM(o.final_amount), 0) as total_spent,
      COALESCE(AVG(o.final_amount), 0) as avg_order_value,
      MAX(o.completed_at) as last_order_date,
      DATEDIFF(CURDATE(), MAX(o.completed_at)) as days_since_last_order
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
      AND o.status = 'completed'
      AND o.payment_status = 'paid'
    WHERE u.role = 'customer'
    GROUP BY u.id
    ORDER BY total_spent DESC
  `, {
    type: sequelize.QueryTypes.SELECT
  });

  // Categorize customers
  const customerCategories = {
    vip: customerSegmentation.filter(c => c.total_spent > 500 && c.total_orders >= 10),
    regular: customerSegmentation.filter(c => c.total_spent >= 100 && c.total_orders >= 3 && c.total_spent <= 500),
    occasional: customerSegmentation.filter(c => c.total_orders >= 1 && c.total_spent < 100),
    inactive: customerSegmentation.filter(c => c.days_since_last_order > 90 || c.total_orders === 0),
    new: customerSegmentation.filter(c => {
      const regDate = new Date(c.registration_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return regDate >= thirtyDaysAgo;
    })
  };

  // Get top customers by spending
  const topCustomers = customerSegmentation.slice(0, 10).map(customer => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    totalOrders: parseInt(customer.total_orders),
    totalSpent: parseFloat(customer.total_spent),
    avgOrderValue: parseFloat(customer.avg_order_value),
    lastOrderDate: customer.last_order_date,
    daysSinceLastOrder: customer.days_since_last_order,
    segment: customer.total_spent > 500 ? 'VIP' :
             customer.total_spent >= 100 ? 'Regular' :
             customer.total_orders >= 1 ? 'Occasional' : 'New'
  }));

  // Calculate customer lifetime value trends
  const monthlyCustomerStats = await sequelize.query(`
    SELECT
      YEAR(u.createdAt) as year,
      MONTH(u.createdAt) as month,
      COUNT(u.id) as new_customers,
      COUNT(o.id) as total_orders_in_month,
      COALESCE(SUM(o.final_amount), 0) as revenue_from_new_customers
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
      AND YEAR(o.completed_at) = YEAR(u.createdAt)
      AND MONTH(o.completed_at) = MONTH(u.createdAt)
      AND o.status = 'completed'
      AND o.payment_status = 'paid'
    WHERE u.role = 'customer'
      AND u.createdAt >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY YEAR(u.createdAt), MONTH(u.createdAt)
    ORDER BY year DESC, month DESC
  `, {
    type: sequelize.QueryTypes.SELECT
  });

  ApiResponse.success(
    res,
    {
      overview: {
        totalCustomers,
        activeCustomers,
        newCustomers,
        inactiveCustomers: totalCustomers - activeCustomers
      },
      segmentation: {
        vip: {
          count: customerCategories.vip.length,
          avgSpent: customerCategories.vip.reduce((sum, c) => sum + c.total_spent, 0) / customerCategories.vip.length || 0
        },
        regular: {
          count: customerCategories.regular.length,
          avgSpent: customerCategories.regular.reduce((sum, c) => sum + c.total_spent, 0) / customerCategories.regular.length || 0
        },
        occasional: {
          count: customerCategories.occasional.length,
          avgSpent: customerCategories.occasional.reduce((sum, c) => sum + c.total_spent, 0) / customerCategories.occasional.length || 0
        },
        inactive: {
          count: customerCategories.inactive.length
        },
        new: {
          count: customerCategories.new.length
        }
      },
      topCustomers,
      monthlyTrends: monthlyCustomerStats
    },
    'Customer analytics retrieved successfully'
  );
});

// @desc    Get customer's complete profile with order history
// @route   GET /api/v1/admin/customers/:id/profile
// @access  Admin
const getCustomerProfile = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const customer = await User.findByPk(id, {
    attributes: ['id', 'name', 'email', 'phone', 'role', 'status', 'avatar', 'createdAt', 'updatedAt']
  });

  if (!customer || customer.role !== 'customer') {
    return next(new AppError('Customer not found', 404));
  }

  // Get customer's orders with details
  const orders = await Order.findAll({
    where: { user_id: id },
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'image']
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  // Get customer's comments/reviews
  const comments = await Comment.findAll({
    where: { user_id: id },
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'image'],
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

  // Get customer's favorites
  const favorites = await Favorite.findAll({
    where: { user_id: id },
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'price', 'image', 'status'],
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

  // Calculate customer statistics
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalSpent = completedOrders.reduce((sum, order) => sum + parseFloat(order.final_amount), 0);
  const avgOrderValue = completedOrders.length > 0 ? totalSpent / completedOrders.length : 0;

  // Most ordered items
  const itemCounts = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const productId = item.product_id;
      if (!itemCounts[productId]) {
        itemCounts[productId] = {
          product: item.product,
          quantity: 0,
          totalSpent: 0
        };
      }
      itemCounts[productId].quantity += item.quantity;
      itemCounts[productId].totalSpent += parseFloat(item.price) * item.quantity;
    });
  });

  const mostOrderedItems = Object.values(itemCounts)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Last order info
  const lastOrder = orders.length > 0 ? orders[0] : null;

  ApiResponse.success(
    res,
    {
      customer,
      statistics: {
        totalOrders,
        completedOrders: completedOrders.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        totalComments: comments.length,
        totalFavorites: favorites.length
      },
      orderHistory: orders.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        totalAmount: order.final_amount,
        itemCount: order.items.length,
        createdAt: order.createdAt,
        completedAt: order.completed_at
      })),
      recentComments: comments.slice(0, 10),
      favoriteProducts: favorites,
      mostOrderedItems,
      lastOrder: lastOrder ? {
        id: lastOrder.id,
        orderNumber: lastOrder.order_number,
        status: lastOrder.status,
        amount: lastOrder.final_amount,
        date: lastOrder.createdAt
      } : null
    },
    'Customer profile retrieved successfully'
  );
});

// @desc    Manage customer comments (approve, reject, delete)
// @route   PATCH /api/v1/admin/customers/comments/:commentId
// @access  Admin
const manageComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const { action, adminNote } = req.body; // action: approve, reject, delete

  if (!['approve', 'reject', 'delete'].includes(action)) {
    return next(new AppError('Invalid action. Must be approve, reject, or delete', 400));
  }

  const comment = await Comment.findByPk(commentId, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name']
      }
    ]
  });

  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }

  let updateData = {};
  let message = '';

  switch (action) {
    case 'approve':
      updateData = {
        status: 'approved',
        moderated_by: req.user.id,
        moderated_at: new Date()
      };
      message = 'Comment approved successfully';
      break;
    case 'reject':
      updateData = {
        status: 'rejected',
        moderated_by: req.user.id,
        moderated_at: new Date(),
        admin_note: adminNote || null
      };
      message = 'Comment rejected';
      break;
    case 'delete':
      await comment.destroy();

      // Log the deletion for audit
      console.log(`[COMMENT DELETED] Admin ${req.user.id} deleted comment ${commentId}`, {
        timestamp: new Date().toISOString(),
        adminId: req.user.id,
        adminEmail: req.user.email,
        commentId,
        userId: comment.user.id,
        userEmail: comment.user.email,
        productId: comment.product.id,
        originalComment: comment.comment,
        adminNote
      });

      return ApiResponse.success(res, null, 'Comment deleted successfully');
  }

  await comment.update(updateData);

  // Log the moderation action for audit
  console.log(`[COMMENT ${action.toUpperCase()}] Admin ${req.user.id} ${action}ed comment ${commentId}`, {
    timestamp: new Date().toISOString(),
    adminId: req.user.id,
    adminEmail: req.user.email,
    commentId,
    userId: comment.user.id,
    userEmail: comment.user.email,
    productId: comment.product.id,
    action,
    adminNote
  });

  const updatedComment = await Comment.findByPk(commentId, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name']
      }
    ]
  });

  ApiResponse.success(res, updatedComment, message);
});

// @desc    Get all comments with filtering (pending, approved, rejected)
// @route   GET /api/v1/admin/customers/comments
// @access  Admin
const getAllComments = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    status = 'all', // all, pending, approved, rejected
    productId,
    userId,
    rating
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  if (status !== 'all') {
    where.status = status;
  }

  if (productId) {
    where.product_id = productId;
  }

  if (userId) {
    where.user_id = userId;
  }

  if (rating) {
    where.rating = rating;
  }

  const { count, rows: comments } = await Comment.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'avatar']
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'image', 'price'],
        include: [
          {
            model: SubCategory,
            as: 'subcategory',
            include: [{ model: Category, as: 'category' }]
          }
        ]
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  // Get comment statistics
  const commentStats = await Comment.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['status'],
    raw: true
  });

  const stats = {
    total: count,
    pending: commentStats.find(s => s.status === 'pending')?.count || 0,
    approved: commentStats.find(s => s.status === 'approved')?.count || 0,
    rejected: commentStats.find(s => s.status === 'rejected')?.count || 0
  };

  ApiResponse.success(
    res,
    {
      comments,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      },
      statistics: stats
    },
    'Comments retrieved successfully'
  );
});

// @desc    Get customer favorites analytics
// @route   GET /api/v1/admin/customers/favorites/analytics
// @access  Admin
const getFavoritesAnalytics = catchAsync(async (req, res, next) => {
  // Most favorited products
  const topFavorites = await sequelize.query(`
    SELECT
      p.id,
      p.name,
      p.price,
      p.image,
      c.name as category_name,
      sc.name as subcategory_name,
      COUNT(f.id) as favorites_count,
      COUNT(DISTINCT f.user_id) as unique_users
    FROM favorites f
    JOIN products p ON f.product_id = p.id
    JOIN subcategories sc ON p.subcategory_id = sc.id
    JOIN categories c ON sc.category_id = c.id
    GROUP BY p.id
    ORDER BY favorites_count DESC
    LIMIT 20
  `, {
    type: sequelize.QueryTypes.SELECT
  });

  // Favorites by category
  const favoritesByCategory = await sequelize.query(`
    SELECT
      c.id,
      c.name as category_name,
      COUNT(f.id) as favorites_count,
      COUNT(DISTINCT f.user_id) as unique_users
    FROM favorites f
    JOIN products p ON f.product_id = p.id
    JOIN subcategories sc ON p.subcategory_id = sc.id
    JOIN categories c ON sc.category_id = c.id
    GROUP BY c.id
    ORDER BY favorites_count DESC
  `, {
    type: sequelize.QueryTypes.SELECT
  });

  // Customer favorite trends (last 6 months)
  const favoriteTrends = await sequelize.query(`
    SELECT
      YEAR(f.createdAt) as year,
      MONTH(f.createdAt) as month,
      COUNT(f.id) as new_favorites,
      COUNT(DISTINCT f.user_id) as active_users
    FROM favorites f
    WHERE f.createdAt >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY YEAR(f.createdAt), MONTH(f.createdAt)
    ORDER BY year DESC, month DESC
  `, {
    type: sequelize.QueryTypes.SELECT
  });

  ApiResponse.success(
    res,
    {
      topFavoriteProducts: topFavorites.map(item => ({
        productId: item.id,
        productName: item.name,
        price: parseFloat(item.price),
        image: item.image,
        category: item.category_name,
        subcategory: item.subcategory_name,
        favoritesCount: parseInt(item.favorites_count),
        uniqueUsers: parseInt(item.unique_users)
      })),
      favoritesByCategory: favoritesByCategory.map(cat => ({
        categoryId: cat.id,
        categoryName: cat.category_name,
        favoritesCount: parseInt(cat.favorites_count),
        uniqueUsers: parseInt(cat.unique_users)
      })),
      trends: favoriteTrends.map(trend => ({
        year: trend.year,
        month: trend.month,
        monthName: new Date(trend.year, trend.month - 1).toLocaleString('default', { month: 'long' }),
        newFavorites: parseInt(trend.new_favorites),
        activeUsers: parseInt(trend.active_users)
      }))
    },
    'Favorites analytics retrieved successfully'
  );
});

module.exports = {
  getCustomerAnalytics,
  getCustomerProfile,
  manageComment,
  getAllComments,
  getFavoritesAnalytics
};