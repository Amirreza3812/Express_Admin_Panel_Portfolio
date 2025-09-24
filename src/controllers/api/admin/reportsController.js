const catchAsync = require('../../../utils/catchAsync');
const Product = require('../../../models/entities/Product');
const Category = require('../../../models/entities/Category');
const SubCategory = require('../../../models/entities/SubCategory');
const Order = require('../../../models/entities/Order');
const OrderItem = require('../../../models/entities/OrderItem');
const User = require('../../../models/entities/User');
const { Op } = require('sequelize');

// Get comprehensive sales report
const getSalesReport = catchAsync(async (req, res) => {
  const {
    startDate,
    endDate,
    period = 'month',
    category,
    subcategory
  } = req.query;

  // Set date range
  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter = {
      order_date: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };
  } else {
    let start = new Date();
    switch (period) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    dateFilter = { order_date: { [Op.gte]: start } };
  }

  // Build include conditions for filtering
  const productInclude = {
    model: Product,
    as: 'product',
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
    productInclude.include[0].include[0].where = { id: category };
  }
  if (subcategory) {
    productInclude.include[0].where = { id: subcategory };
  }

  // Get detailed sales data
  const salesData = await OrderItem.findAll({
    include: [
      productInclude,
      {
        model: Order,
        as: 'order',
        where: {
          ...dateFilter,
          status: { [Op.not]: 'cancelled' }
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ]
      }
    ],
    order: [['order', 'order_date', 'DESC']]
  });

  // Calculate totals
  const totalRevenue = salesData.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const totalQuantity = salesData.reduce((sum, item) => sum + item.quantity, 0);
  const totalOrders = [...new Set(salesData.map(item => item.order.id))].length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Group by products
  const productSales = {};
  salesData.forEach(item => {
    const productId = item.product.id;
    if (!productSales[productId]) {
      productSales[productId] = {
        product: item.product,
        totalQuantity: 0,
        totalRevenue: 0,
        orderCount: 0
      };
    }
    productSales[productId].totalQuantity += item.quantity;
    productSales[productId].totalRevenue += item.quantity * item.price;
    productSales[productId].orderCount++;
  });

  // Convert to array and sort by revenue
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  // Group by categories
  const categorySales = {};
  salesData.forEach(item => {
    const categoryId = item.product.subcategory.category.id;
    const categoryName = item.product.subcategory.category.name;
    if (!categorySales[categoryId]) {
      categorySales[categoryId] = {
        category: { id: categoryId, name: categoryName },
        totalQuantity: 0,
        totalRevenue: 0,
        productCount: new Set()
      };
    }
    categorySales[categoryId].totalQuantity += item.quantity;
    categorySales[categoryId].totalRevenue += item.quantity * item.price;
    categorySales[categoryId].productCount.add(item.product.id);
  });

  // Convert category data
  const categoryReport = Object.values(categorySales).map(cat => ({
    category: cat.category,
    totalQuantity: cat.totalQuantity,
    totalRevenue: cat.totalRevenue,
    uniqueProducts: cat.productCount.size
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Group by subcategories
  const subcategorySales = {};
  salesData.forEach(item => {
    const subcategoryId = item.product.subcategory.id;
    const subcategoryName = item.product.subcategory.name;
    if (!subcategorySales[subcategoryId]) {
      subcategorySales[subcategoryId] = {
        subcategory: {
          id: subcategoryId,
          name: subcategoryName,
          category: item.product.subcategory.category
        },
        totalQuantity: 0,
        totalRevenue: 0,
        productCount: new Set()
      };
    }
    subcategorySales[subcategoryId].totalQuantity += item.quantity;
    subcategorySales[subcategoryId].totalRevenue += item.quantity * item.price;
    subcategorySales[subcategoryId].productCount.add(item.product.id);
  });

  // Convert subcategory data
  const subcategoryReport = Object.values(subcategorySales).map(subcat => ({
    subcategory: subcat.subcategory,
    totalQuantity: subcat.totalQuantity,
    totalRevenue: subcat.totalRevenue,
    uniqueProducts: subcat.productCount.size
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);

  res.json({
    success: true,
    data: {
      summary: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalQuantity,
        totalOrders,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        period: period,
        dateRange: startDate && endDate ? { startDate, endDate } : null
      },
      topProducts,
      categoryReport,
      subcategoryReport,
      recentSales: salesData.slice(0, 20).map(item => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          category: item.product.subcategory.category.name,
          subcategory: item.product.subcategory.name
        },
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
        order: {
          id: item.order.id,
          date: item.order.order_date,
          customer: item.order.user.name
        }
      }))
    }
  });
});

// Get inventory report
const getInventoryReport = catchAsync(async (req, res) => {
  const { category, subcategory, lowStock = 10 } = req.query;

  const where = {};
  const include = [
    {
      model: SubCategory,
      as: 'subcategory',
      include: [{ model: Category, as: 'category' }]
    }
  ];

  if (category) {
    include[0].include[0].where = { id: category };
  }
  if (subcategory) {
    include[0].where = { id: subcategory };
  }

  const products = await Product.findAll({
    where,
    include,
    order: [['stock', 'ASC']]
  });

  // Calculate inventory statistics
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const inactiveProducts = totalProducts - activeProducts;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= lowStock).length;
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);

  // Group by categories
  const categoryInventory = {};
  products.forEach(product => {
    const categoryId = product.subcategory.category.id;
    const categoryName = product.subcategory.category.name;
    if (!categoryInventory[categoryId]) {
      categoryInventory[categoryId] = {
        category: { id: categoryId, name: categoryName },
        totalProducts: 0,
        totalStock: 0,
        totalValue: 0,
        outOfStock: 0,
        lowStock: 0
      };
    }
    categoryInventory[categoryId].totalProducts++;
    categoryInventory[categoryId].totalStock += product.stock;
    categoryInventory[categoryId].totalValue += product.stock * product.price;
    if (product.stock === 0) categoryInventory[categoryId].outOfStock++;
    if (product.stock > 0 && product.stock <= lowStock) categoryInventory[categoryId].lowStock++;
  });

  res.json({
    success: true,
    data: {
      summary: {
        totalProducts,
        activeProducts,
        inactiveProducts,
        outOfStock,
        lowStockItems,
        totalInventoryValue: parseFloat(totalInventoryValue.toFixed(2))
      },
      categoryBreakdown: Object.values(categoryInventory),
      lowStockAlert: products
        .filter(p => p.stock > 0 && p.stock <= lowStock)
        .map(p => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          price: p.price,
          category: p.subcategory.category.name,
          subcategory: p.subcategory.name
        })),
      outOfStockItems: products
        .filter(p => p.stock === 0)
        .map(p => ({
          id: p.id,
          name: p.name,
          category: p.subcategory.category.name,
          subcategory: p.subcategory.name
        }))
    }
  });
});

// Get customer report
const getCustomerReport = catchAsync(async (req, res) => {
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

  // Get customers with their order statistics
  const customers = await User.findAll({
    where: { role: 'customer' },
    include: [
      {
        model: Order,
        as: 'orders',
        where: {
          order_date: { [Op.gte]: startDate },
          status: { [Op.not]: 'cancelled' }
        },
        required: false
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  // Calculate customer statistics
  const customerStats = customers.map(customer => {
    const orders = customer.orders || [];
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      joinDate: customer.createdAt,
      totalOrders,
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2))
    };
  });

  // Get top customers by spending
  const topCustomers = customerStats
    .filter(c => c.totalSpent > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, parseInt(limit));

  // Calculate summary
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const customersWithOrders = customerStats.filter(c => c.totalOrders > 0).length;
  const totalRevenue = customerStats.reduce((sum, c) => sum + c.totalSpent, 0);
  const averageCustomerValue = customersWithOrders > 0 ? totalRevenue / customersWithOrders : 0;

  res.json({
    success: true,
    data: {
      summary: {
        totalCustomers,
        activeCustomers,
        customersWithOrders,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        averageCustomerValue: parseFloat(averageCustomerValue.toFixed(2)),
        period
      },
      topCustomers,
      newCustomers: customers
        .filter(c => c.createdAt >= startDate)
        .slice(0, parseInt(limit))
        .map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          joinDate: c.createdAt
        }))
    }
  });
});

// Export sales data (CSV format)
const exportSalesData = catchAsync(async (req, res) => {
  const { startDate, endDate, format = 'json' } = req.query;

  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter = {
      order_date: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };
  }

  const salesData = await OrderItem.findAll({
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
      },
      {
        model: Order,
        as: 'order',
        where: {
          ...dateFilter,
          status: { [Op.not]: 'cancelled' }
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ]
      }
    ],
    order: [['order', 'order_date', 'DESC']]
  });

  const exportData = salesData.map(item => ({
    orderID: item.order.id,
    orderDate: item.order.order_date,
    customerName: item.order.user.name,
    customerEmail: item.order.user.email,
    productID: item.product.id,
    productName: item.product.name,
    category: item.product.subcategory.category.name,
    subcategory: item.product.subcategory.name,
    quantity: item.quantity,
    unitPrice: item.price,
    totalAmount: item.quantity * item.price
  }));

  if (format === 'csv') {
    // Convert to CSV
    const headers = Object.keys(exportData[0] || {}).join(',');
    const csvData = exportData.map(row =>
      Object.values(row).map(val => `"${val}"`).join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv');
    res.send(headers + '\n' + csvData);
  } else {
    res.json({
      success: true,
      data: exportData
    });
  }
});

module.exports = {
  getSalesReport,
  getInventoryReport,
  getCustomerReport,
  exportSalesData
};