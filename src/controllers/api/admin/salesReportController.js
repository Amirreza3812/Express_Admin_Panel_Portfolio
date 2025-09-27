const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const ApiResponse = require('../../../utils/apiResponse');
const { Order, OrderItem, Product, Category, SubCategory, User } = require('../../../models/associations');
const { Op } = require('sequelize');
const { sequelize } = require('../../../config/db');

// @desc    Get monthly sales report
// @route   GET /api/v1/admin/reports/sales/monthly
// @access  Admin
const getMonthlySalesReport = catchAsync(async (req, res, next) => {
  const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

  // Validate year and month
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);

  if (yearNum < 2020 || yearNum > 2030) {
    return next(new AppError('Year must be between 2020 and 2030', 400));
  }

  if (monthNum < 1 || monthNum > 12) {
    return next(new AppError('Month must be between 1 and 12', 400));
  }

  // Calculate date range for the month
  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

  // Get completed orders for the month
  const orders = await Order.findAll({
    where: {
      status: ['completed'],
      payment_status: 'paid',
      completed_at: {
        [Op.between]: [startDate, endDate]
      }
    },
    include: [
      {
        model: OrderItem,
        as: 'items',
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
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }
    ],
    order: [['completed_at', 'ASC']]
  });

  // Calculate overall statistics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.final_amount), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Group sales by day
  const dailySales = {};
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  // Initialize all days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${yearNum}-${monthNum.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    dailySales[dateKey] = {
      date: dateKey,
      orders: 0,
      revenue: 0,
      items: 0
    };
  }

  // Populate actual sales data
  orders.forEach(order => {
    const dateKey = order.completed_at.toISOString().split('T')[0];
    if (dailySales[dateKey]) {
      dailySales[dateKey].orders += 1;
      dailySales[dateKey].revenue += parseFloat(order.final_amount);
      dailySales[dateKey].items += order.items.length;
    }
  });

  // Calculate product sales
  const productSales = {};
  const categorySales = {};
  const subcategorySales = {};

  orders.forEach(order => {
    order.items.forEach(item => {
      const product = item.product;
      const subcategory = product.subcategory;
      const category = subcategory.category;

      // Product sales
      if (!productSales[product.id]) {
        productSales[product.id] = {
          productId: product.id,
          productName: product.name,
          category: category.name,
          subcategory: subcategory.name,
          quantitySold: 0,
          revenue: 0,
          orders: new Set()
        };
      }

      productSales[product.id].quantitySold += item.quantity;
      productSales[product.id].revenue += parseFloat(item.price) * item.quantity;
      productSales[product.id].orders.add(order.id);

      // Category sales
      if (!categorySales[category.id]) {
        categorySales[category.id] = {
          categoryId: category.id,
          categoryName: category.name,
          quantitySold: 0,
          revenue: 0,
          orders: new Set(),
          products: new Set()
        };
      }

      categorySales[category.id].quantitySold += item.quantity;
      categorySales[category.id].revenue += parseFloat(item.price) * item.quantity;
      categorySales[category.id].orders.add(order.id);
      categorySales[category.id].products.add(product.id);

      // Subcategory sales
      if (!subcategorySales[subcategory.id]) {
        subcategorySales[subcategory.id] = {
          subcategoryId: subcategory.id,
          subcategoryName: subcategory.name,
          categoryName: category.name,
          quantitySold: 0,
          revenue: 0,
          orders: new Set(),
          products: new Set()
        };
      }

      subcategorySales[subcategory.id].quantitySold += item.quantity;
      subcategorySales[subcategory.id].revenue += parseFloat(item.price) * item.quantity;
      subcategorySales[subcategory.id].orders.add(order.id);
      subcategorySales[subcategory.id].products.add(product.id);
    });
  });

  // Convert Sets to counts and sort
  const topProducts = Object.values(productSales)
    .map(p => ({
      ...p,
      orders: p.orders.size,
      avgOrderValue: p.revenue / p.orders.size
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const categoryReport = Object.values(categorySales)
    .map(c => ({
      ...c,
      orders: c.orders.size,
      products: c.products.size,
      avgOrderValue: c.revenue / c.orders.size
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const subcategoryReport = Object.values(subcategorySales)
    .map(s => ({
      ...s,
      orders: s.orders.size,
      products: s.products.size,
      avgOrderValue: s.revenue / s.orders.size
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Payment method analysis
  const paymentMethods = {};
  orders.forEach(order => {
    const method = order.payment_method || 'unknown';
    if (!paymentMethods[method]) {
      paymentMethods[method] = { orders: 0, revenue: 0 };
    }
    paymentMethods[method].orders += 1;
    paymentMethods[method].revenue += parseFloat(order.final_amount);
  });

  // Order type analysis
  const orderTypes = {};
  orders.forEach(order => {
    const type = order.order_type;
    if (!orderTypes[type]) {
      orderTypes[type] = { orders: 0, revenue: 0 };
    }
    orderTypes[type].orders += 1;
    orderTypes[type].revenue += parseFloat(order.final_amount);
  });

  ApiResponse.success(
    res,
    {
      period: {
        year: yearNum,
        month: monthNum,
        monthName: new Date(yearNum, monthNum - 1).toLocaleString('default', { month: 'long' }),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      overview: {
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        totalDays: daysInMonth,
        avgOrdersPerDay: Math.round((totalOrders / daysInMonth) * 100) / 100
      },
      dailySales: Object.values(dailySales),
      topProducts,
      categoryReport,
      subcategoryReport,
      paymentMethods,
      orderTypes
    },
    `Monthly sales report for ${new Date(yearNum, monthNum - 1).toLocaleString('default', { month: 'long' })} ${yearNum}`
  );
});

// @desc    Get yearly sales summary
// @route   GET /api/v1/admin/reports/sales/yearly
// @access  Admin
const getYearlySalesReport = catchAsync(async (req, res, next) => {
  const { year = new Date().getFullYear() } = req.query;
  const yearNum = parseInt(year);

  if (yearNum < 2020 || yearNum > 2030) {
    return next(new AppError('Year must be between 2020 and 2030', 400));
  }

  const startDate = new Date(yearNum, 0, 1);
  const endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);

  // Get monthly aggregated data using raw SQL for better performance
  const monthlyData = await sequelize.query(`
    SELECT
      MONTH(completed_at) as month,
      COUNT(*) as total_orders,
      SUM(final_amount) as total_revenue,
      AVG(final_amount) as avg_order_value
    FROM orders
    WHERE status = 'completed'
      AND payment_status = 'paid'
      AND completed_at BETWEEN :startDate AND :endDate
    GROUP BY MONTH(completed_at)
    ORDER BY month
  `, {
    replacements: { startDate, endDate },
    type: sequelize.QueryTypes.SELECT
  });

  // Initialize all months
  const monthlyReport = [];
  for (let month = 1; month <= 12; month++) {
    const existingData = monthlyData.find(m => m.month === month);
    monthlyReport.push({
      month,
      monthName: new Date(yearNum, month - 1).toLocaleString('default', { month: 'long' }),
      totalOrders: existingData ? parseInt(existingData.total_orders) : 0,
      totalRevenue: existingData ? parseFloat(existingData.total_revenue) : 0,
      avgOrderValue: existingData ? parseFloat(existingData.avg_order_value) : 0
    });
  }

  // Calculate yearly totals
  const yearlyTotals = monthlyReport.reduce((acc, month) => ({
    totalOrders: acc.totalOrders + month.totalOrders,
    totalRevenue: acc.totalRevenue + month.totalRevenue
  }), { totalOrders: 0, totalRevenue: 0 });

  const avgOrderValue = yearlyTotals.totalOrders > 0 ?
    yearlyTotals.totalRevenue / yearlyTotals.totalOrders : 0;

  ApiResponse.success(
    res,
    {
      year: yearNum,
      overview: {
        totalOrders: yearlyTotals.totalOrders,
        totalRevenue: Math.round(yearlyTotals.totalRevenue * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100
      },
      monthlyReport
    },
    `Yearly sales report for ${yearNum}`
  );
});

// @desc    Get sales comparison between periods
// @route   GET /api/v1/admin/reports/sales/comparison
// @access  Admin
const getSalesComparison = catchAsync(async (req, res, next) => {
  const {
    currentYear = new Date().getFullYear(),
    currentMonth = new Date().getMonth() + 1,
    compareYear,
    compareMonth
  } = req.query;

  const currentYearNum = parseInt(currentYear);
  const currentMonthNum = parseInt(currentMonth);
  const compareYearNum = parseInt(compareYear || currentYearNum - 1);
  const compareMonthNum = parseInt(compareMonth || currentMonthNum);

  // Get data for both periods
  const currentPeriodStart = new Date(currentYearNum, currentMonthNum - 1, 1);
  const currentPeriodEnd = new Date(currentYearNum, currentMonthNum, 0, 23, 59, 59, 999);

  const comparePeriodStart = new Date(compareYearNum, compareMonthNum - 1, 1);
  const comparePeriodEnd = new Date(compareYearNum, compareMonthNum, 0, 23, 59, 59, 999);

  const [currentData, compareData] = await Promise.all([
    Order.findAll({
      where: {
        status: 'completed',
        payment_status: 'paid',
        completed_at: { [Op.between]: [currentPeriodStart, currentPeriodEnd] }
      },
      attributes: ['final_amount']
    }),
    Order.findAll({
      where: {
        status: 'completed',
        payment_status: 'paid',
        completed_at: { [Op.between]: [comparePeriodStart, comparePeriodEnd] }
      },
      attributes: ['final_amount']
    })
  ]);

  const currentStats = {
    orders: currentData.length,
    revenue: currentData.reduce((sum, order) => sum + parseFloat(order.final_amount), 0)
  };

  const compareStats = {
    orders: compareData.length,
    revenue: compareData.reduce((sum, order) => sum + parseFloat(order.final_amount), 0)
  };

  // Calculate growth percentages
  const orderGrowth = compareStats.orders > 0 ?
    ((currentStats.orders - compareStats.orders) / compareStats.orders) * 100 : 0;

  const revenueGrowth = compareStats.revenue > 0 ?
    ((currentStats.revenue - compareStats.revenue) / compareStats.revenue) * 100 : 0;

  ApiResponse.success(
    res,
    {
      currentPeriod: {
        year: currentYearNum,
        month: currentMonthNum,
        monthName: new Date(currentYearNum, currentMonthNum - 1).toLocaleString('default', { month: 'long' }),
        ...currentStats,
        avgOrderValue: currentStats.orders > 0 ? currentStats.revenue / currentStats.orders : 0
      },
      comparePeriod: {
        year: compareYearNum,
        month: compareMonthNum,
        monthName: new Date(compareYearNum, compareMonthNum - 1).toLocaleString('default', { month: 'long' }),
        ...compareStats,
        avgOrderValue: compareStats.orders > 0 ? compareStats.revenue / compareStats.orders : 0
      },
      growth: {
        orders: Math.round(orderGrowth * 100) / 100,
        revenue: Math.round(revenueGrowth * 100) / 100
      }
    },
    'Sales comparison report generated successfully'
  );
});

// @desc    Get best performing items report
// @route   GET /api/v1/admin/reports/sales/best-performers
// @access  Admin
const getBestPerformers = catchAsync(async (req, res, next) => {
  const {
    period = 'month',
    year = new Date().getFullYear(),
    month = new Date().getMonth() + 1,
    limit = 10
  } = req.query;

  let startDate, endDate;

  if (period === 'month') {
    startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
  } else if (period === 'year') {
    startDate = new Date(parseInt(year), 0, 1);
    endDate = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);
  } else {
    return next(new AppError('Period must be "month" or "year"', 400));
  }

  // Get detailed order items data
  const orderItems = await OrderItem.findAll({
    include: [
      {
        model: Order,
        as: 'order',
        where: {
          status: 'completed',
          payment_status: 'paid',
          completed_at: { [Op.between]: [startDate, endDate] }
        },
        attributes: []
      },
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
    ],
    attributes: ['product_id', 'quantity', 'price'],
    raw: false
  });

  // Aggregate product performance
  const productPerformance = {};

  orderItems.forEach(item => {
    const productId = item.product_id;
    const revenue = parseFloat(item.price) * item.quantity;

    if (!productPerformance[productId]) {
      productPerformance[productId] = {
        productId,
        productName: item.product.name,
        category: item.product.subcategory.category.name,
        subcategory: item.product.subcategory.name,
        quantitySold: 0,
        revenue: 0,
        orders: new Set()
      };
    }

    productPerformance[productId].quantitySold += item.quantity;
    productPerformance[productId].revenue += revenue;
    productPerformance[productId].orders.add(item.order.id);
  });

  // Sort and format results
  const topProducts = Object.values(productPerformance)
    .map(p => ({
      ...p,
      ordersCount: p.orders.size,
      avgQuantityPerOrder: p.quantitySold / p.orders.size,
      avgRevenuePerOrder: p.revenue / p.orders.size
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, parseInt(limit));

  // Remove the Set object before sending response
  topProducts.forEach(product => delete product.orders);

  ApiResponse.success(
    res,
    {
      period: {
        type: period,
        year: parseInt(year),
        month: period === 'month' ? parseInt(month) : undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      topProducts,
      totalProductsAnalyzed: Object.keys(productPerformance).length
    },
    `Best performing products report for ${period}`
  );
});

module.exports = {
  getMonthlySalesReport,
  getYearlySalesReport,
  getSalesComparison,
  getBestPerformers
};