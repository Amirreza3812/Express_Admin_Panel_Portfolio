const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const Order = require('../../../models/entities/Order');
const OrderItem = require('../../../models/entities/OrderItem');
const Product = require('../../../models/entities/Product');
const User = require('../../../models/entities/User');
const { Op } = require('sequelize');

// Get all orders with filtering and pagination
const getAllOrders = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    startDate,
    endDate,
    customer
  } = req.query;

  const offset = (page - 1) * limit;

  const where = {};

  if (status) where.status = status;
  if (startDate && endDate) {
    where.order_date = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  const include = [
    {
      model: User,
      as: 'user',
      attributes: ['id', 'name', 'email', 'phone']
    },
    {
      model: OrderItem,
      as: 'orderItems',
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price', 'image']
        }
      ]
    }
  ];

  if (customer) {
    include[0].where = {
      [Op.or]: [
        { name: { [Op.like]: `%${customer}%` } },
        { email: { [Op.like]: `%${customer}%` } }
      ]
    };
  }

  const { count, rows: orders } = await Order.findAndCountAll({
    where,
    include,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['order_date', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    }
  });
});

// Get single order
const getOrder = catchAsync(async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'phone']
      },
      {
        model: OrderItem,
        as: 'orderItems',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'image', 'description']
          }
        ]
      }
    ]
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.json({
    success: true,
    data: order
  });
});

// Update order status
const updateOrderStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
    });
  }

  const order = await Order.findByPk(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  await order.update({ status });

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: { id: order.id, status: order.status }
  });
});

// Get order statistics
const getOrderStats = catchAsync(async (req, res) => {
  const { period = 'week' } = req.query; // week, month, year

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

  const orders = await Order.findAll({
    where: {
      order_date: {
        [Op.gte]: startDate
      }
    },
    include: [
      {
        model: OrderItem,
        as: 'orderItems'
      }
    ]
  });

  const stats = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + parseFloat(order.total), 0),
    statusBreakdown: {},
    dailyStats: {}
  };

  // Status breakdown
  orders.forEach(order => {
    stats.statusBreakdown[order.status] = (stats.statusBreakdown[order.status] || 0) + 1;
  });

  // Daily stats for the period
  orders.forEach(order => {
    const date = order.order_date.toISOString().split('T')[0];
    if (!stats.dailyStats[date]) {
      stats.dailyStats[date] = { orders: 0, revenue: 0 };
    }
    stats.dailyStats[date].orders++;
    stats.dailyStats[date].revenue += parseFloat(order.total);
  });

  res.json({
    success: true,
    data: stats
  });
});

// Get monthly sales report
const getMonthlySalesReport = catchAsync(async (req, res) => {
  const { year = new Date().getFullYear(), month } = req.query;

  let startDate, endDate;

  if (month) {
    // Specific month
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0);
  } else {
    // Entire year
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31);
  }

  const orders = await Order.findAll({
    where: {
      order_date: {
        [Op.between]: [startDate, endDate]
      },
      status: {
        [Op.not]: 'cancelled'
      }
    },
    include: [
      {
        model: OrderItem,
        as: 'orderItems',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price']
          }
        ]
      }
    ]
  });

  const report = {
    period: month ? `${year}-${month.toString().padStart(2, '0')}` : year.toString(),
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + parseFloat(order.total), 0),
    averageOrderValue: 0,
    topProducts: {},
    dailyBreakdown: {}
  };

  // Calculate average order value
  if (orders.length > 0) {
    report.averageOrderValue = report.totalRevenue / orders.length;
  }

  // Top products
  orders.forEach(order => {
    order.orderItems.forEach(item => {
      const productName = item.product.name;
      if (!report.topProducts[productName]) {
        report.topProducts[productName] = {
          quantity: 0,
          revenue: 0
        };
      }
      report.topProducts[productName].quantity += item.quantity;
      report.topProducts[productName].revenue += item.quantity * parseFloat(item.price);
    });
  });

  // Convert topProducts to sorted array
  report.topProducts = Object.entries(report.topProducts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Daily breakdown
  orders.forEach(order => {
    const date = order.order_date.toISOString().split('T')[0];
    if (!report.dailyBreakdown[date]) {
      report.dailyBreakdown[date] = { orders: 0, revenue: 0 };
    }
    report.dailyBreakdown[date].orders++;
    report.dailyBreakdown[date].revenue += parseFloat(order.total);
  });

  res.json({
    success: true,
    data: report
  });
});

module.exports = {
  getAllOrders,
  getOrder,
  updateOrderStatus,
  getOrderStats,
  getMonthlySalesReport
};