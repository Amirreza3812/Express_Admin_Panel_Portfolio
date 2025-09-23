const catchAsync = require('../../../utils/catchAsync');
const User = require('../../../models/entities/User');
const Product = require('../../../models/entities/Product');
const Category = require('../../../models/entities/Category');
const Order = require('../../../models/entities/Order');
const OrderItem = require('../../../models/entities/OrderItem');
const Comment = require('../../../models/entities/Comment');
const { Op } = require('sequelize');

// Get dashboard overview statistics
const getDashboardOverview = catchAsync(async (req, res) => {
  const { period = 'month' } = req.query;

  let startDate = new Date();
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  // Get current period data
  const currentPeriodPromises = [
    User.count({
      where: {
        createdAt: { [Op.gte]: startDate },
        role: 'customer'
      }
    }),
    Order.count({
      where: {
        order_date: { [Op.gte]: startDate },
        status: { [Op.not]: 'cancelled' }
      }
    }),
    Order.sum('total', {
      where: {
        order_date: { [Op.gte]: startDate },
        status: { [Op.not]: 'cancelled' }
      }
    }),
    Product.count({
      where: { status: 'active' }
    })
  ];

  // Get previous period for comparison
  let previousStartDate = new Date(startDate);
  let previousEndDate = new Date(startDate);

  switch (period) {
    case 'week':
      previousStartDate.setDate(previousStartDate.getDate() - 7);
      break;
    case 'month':
      previousStartDate.setMonth(previousStartDate.getMonth() - 1);
      break;
    case 'year':
      previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
      break;
  }

  const previousPeriodPromises = [
    User.count({
      where: {
        createdAt: { [Op.between]: [previousStartDate, previousEndDate] },
        role: 'customer'
      }
    }),
    Order.count({
      where: {
        order_date: { [Op.between]: [previousStartDate, previousEndDate] },
        status: { [Op.not]: 'cancelled' }
      }
    }),
    Order.sum('total', {
      where: {
        order_date: { [Op.between]: [previousStartDate, previousEndDate] },
        status: { [Op.not]: 'cancelled' }
      }
    })
  ];

  const [currentResults, previousResults] = await Promise.all([
    Promise.all(currentPeriodPromises),
    Promise.all(previousPeriodPromises)
  ]);

  const [newCustomers, totalOrders, totalRevenue, activeProducts] = currentResults;
  const [prevNewCustomers, prevTotalOrders, prevTotalRevenue] = previousResults;

  // Calculate percentage changes
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const stats = {
    newCustomers: {
      value: newCustomers,
      change: calculateChange(newCustomers, prevNewCustomers)
    },
    totalOrders: {
      value: totalOrders,
      change: calculateChange(totalOrders, prevTotalOrders)
    },
    totalRevenue: {
      value: parseFloat(totalRevenue || 0),
      change: calculateChange(parseFloat(totalRevenue || 0), parseFloat(prevTotalRevenue || 0))
    },
    activeProducts: {
      value: activeProducts,
      change: 0 // Products don't have comparison period
    },
    averageOrderValue: {
      value: totalOrders > 0 ? parseFloat(totalRevenue || 0) / totalOrders : 0,
      change: 0
    }
  };

  res.json({
    success: true,
    data: stats
  });
});

// Get recent activities
const getRecentActivities = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;

  const [recentOrders, recentCustomers, recentComments] = await Promise.all([
    Order.findAll({
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      attributes: ['id', 'total', 'status', 'createdAt']
    }),
    User.findAll({
      where: { role: 'customer' },
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'email', 'createdAt']
    }),
    Comment.findAll({
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name']
        }
      ],
      attributes: ['id', 'comment', 'rating', 'createdAt']
    })
  ]);

  const activities = [];

  // Add recent orders
  recentOrders.forEach(order => {
    activities.push({
      type: 'order',
      id: order.id,
      title: `New Order #${order.id}`,
      description: `${order.user.name} placed an order worth $${order.total}`,
      status: order.status,
      timestamp: order.createdAt,
      user: order.user
    });
  });

  // Add recent customers
  recentCustomers.forEach(customer => {
    activities.push({
      type: 'customer',
      id: customer.id,
      title: 'New Customer Registration',
      description: `${customer.name} joined the platform`,
      timestamp: customer.createdAt,
      user: customer
    });
  });

  // Add recent comments
  recentComments.forEach(comment => {
    activities.push({
      type: 'comment',
      id: comment.id,
      title: 'New Product Review',
      description: `${comment.user.name} rated ${comment.product.name} (${comment.rating}/5)`,
      rating: comment.rating,
      timestamp: comment.createdAt,
      user: comment.user,
      product: comment.product
    });
  });

  // Sort all activities by timestamp
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json({
    success: true,
    data: activities.slice(0, parseInt(limit))
  });
});

// Get sales chart data
const getSalesChart = catchAsync(async (req, res) => {
  const { period = 'week' } = req.query;

  let startDate = new Date();
  let dateFormat, groupBy;

  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      dateFormat = '%Y-%m-%d';
      groupBy = 'day';
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      dateFormat = '%Y-%m-%d';
      groupBy = 'day';
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      dateFormat = '%Y-%m';
      groupBy = 'month';
      break;
  }

  const salesData = await Order.findAll({
    where: {
      order_date: { [Op.gte]: startDate },
      status: { [Op.not]: 'cancelled' }
    },
    attributes: [
      [Order.sequelize.fn('DATE_FORMAT', Order.sequelize.col('order_date'), dateFormat), 'period'],
      [Order.sequelize.fn('COUNT', Order.sequelize.col('id')), 'orders'],
      [Order.sequelize.fn('SUM', Order.sequelize.col('total')), 'revenue']
    ],
    group: [Order.sequelize.fn('DATE_FORMAT', Order.sequelize.col('order_date'), dateFormat)],
    order: [[Order.sequelize.fn('DATE_FORMAT', Order.sequelize.col('order_date'), dateFormat), 'ASC']]
  });

  const chartData = salesData.map(item => ({
    period: item.get('period'),
    orders: parseInt(item.get('orders')),
    revenue: parseFloat(item.get('revenue'))
  }));

  res.json({
    success: true,
    data: {
      period,
      chartData
    }
  });
});

// Get top products
const getTopProducts = catchAsync(async (req, res) => {
  const { period = 'month', limit = 10 } = req.query;

  let startDate = new Date();
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  const topProducts = await OrderItem.findAll({
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'price', 'image']
      },
      {
        model: Order,
        as: 'order',
        where: {
          order_date: { [Op.gte]: startDate },
          status: { [Op.not]: 'cancelled' }
        },
        attributes: []
      }
    ],
    attributes: [
      'product_id',
      [OrderItem.sequelize.fn('SUM', OrderItem.sequelize.col('quantity')), 'totalQuantity'],
      [OrderItem.sequelize.fn('SUM',
        OrderItem.sequelize.literal('quantity * price')), 'totalRevenue'],
      [OrderItem.sequelize.fn('COUNT', OrderItem.sequelize.col('OrderItem.id')), 'orderCount']
    ],
    group: ['product_id'],
    order: [[OrderItem.sequelize.fn('SUM', OrderItem.sequelize.col('quantity')), 'DESC']],
    limit: parseInt(limit)
  });

  const formattedProducts = topProducts.map(item => ({
    product: item.product,
    totalQuantity: parseInt(item.get('totalQuantity')),
    totalRevenue: parseFloat(item.get('totalRevenue')),
    orderCount: parseInt(item.get('orderCount'))
  }));

  res.json({
    success: true,
    data: formattedProducts
  });
});

// Get order status distribution
const getOrderStatusDistribution = catchAsync(async (req, res) => {
  const { period = 'month' } = req.query;

  let startDate = new Date();
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  const statusDistribution = await Order.findAll({
    where: {
      order_date: { [Op.gte]: startDate }
    },
    attributes: [
      'status',
      [Order.sequelize.fn('COUNT', Order.sequelize.col('id')), 'count']
    ],
    group: ['status']
  });

  const distribution = statusDistribution.reduce((acc, item) => {
    acc[item.status] = parseInt(item.get('count'));
    return acc;
  }, {});

  res.json({
    success: true,
    data: distribution
  });
});

module.exports = {
  getDashboardOverview,
  getRecentActivities,
  getSalesChart,
  getTopProducts,
  getOrderStatusDistribution
};