const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const User = require('../../../models/entities/User');
const Order = require('../../../models/entities/Order');
const Comment = require('../../../models/entities/Comment');
const Favorite = require('../../../models/entities/Favorite');
const { Op } = require('sequelize');

// Get all users with filtering and pagination
const getAllUsers = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    role,
    status,
    search
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  if (role) where.role = role;
  if (status) where.status = status;
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } }
    ];
  }

  const { count, rows: users } = await User.findAndCountAll({
    where,
    attributes: ['id', 'name', 'email', 'phone', 'role', 'status', 'createdAt'],
    include: [
      {
        model: Order,
        as: 'orders',
        attributes: ['id', 'total', 'status'],
        limit: 5,
        order: [['createdAt', 'DESC']]
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  // Add user statistics
  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const userStats = await getUserStatistics(user.id);
      return {
        ...user.toJSON(),
        statistics: userStats
      };
    })
  );

  res.json({
    success: true,
    data: {
      users: usersWithStats,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    }
  });
});

// Get single user with detailed info
const getUser = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: ['id', 'name', 'email', 'phone', 'role', 'status', 'createdAt'],
    include: [
      {
        model: Order,
        as: 'orders',
        attributes: ['id', 'total', 'status', 'order_date'],
        order: [['order_date', 'DESC']]
      },
      {
        model: Comment,
        as: 'comments',
        attributes: ['id', 'comment', 'rating', 'createdAt'],
        limit: 10,
        order: [['createdAt', 'DESC']]
      },
      {
        model: Favorite,
        as: 'favorites',
        attributes: ['id', 'createdAt']
      }
    ]
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Add detailed statistics
  const statistics = await getUserStatistics(user.id);

  res.json({
    success: true,
    data: {
      ...user.toJSON(),
      statistics
    }
  });
});

// Helper function to get user statistics
const getUserStatistics = async (userId) => {
  const [orderStats, commentStats, favoriteCount] = await Promise.all([
    Order.findAll({
      where: { user_id: userId },
      attributes: ['total', 'status', 'order_date']
    }),
    Comment.findAll({
      where: { user_id: userId },
      attributes: ['rating']
    }),
    Favorite.count({
      where: { user_id: userId }
    })
  ]);

  const totalOrders = orderStats.length;
  const totalSpent = orderStats.reduce((sum, order) => sum + parseFloat(order.total), 0);
  const averageRating = commentStats.length > 0
    ? commentStats.reduce((sum, comment) => sum + comment.rating, 0) / commentStats.length
    : 0;

  const orderStatusBreakdown = orderStats.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  return {
    totalOrders,
    totalSpent,
    averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
    averageRating: Math.round(averageRating * 10) / 10,
    totalComments: commentStats.length,
    totalFavorites: favoriteCount,
    orderStatusBreakdown
  };
};

// Update user status
const updateUserStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['active', 'inactive', 'banned'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
    });
  }

  const user = await User.findByPk(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  await user.update({ status });

  res.json({
    success: true,
    message: `User status updated to ${status}`,
    data: {
      id: user.id,
      name: user.name,
      status: user.status
    }
  });
});

// Update user role
const updateUserRole = catchAsync(async (req, res) => {
  const { role } = req.body;
  const validRoles = ['customer', 'admin'];

  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role. Valid roles: ' + validRoles.join(', ')
    });
  }

  const user = await User.findByPk(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  await user.update({ role });

  res.json({
    success: true,
    message: `User role updated to ${role}`,
    data: {
      id: user.id,
      name: user.name,
      role: user.role
    }
  });
});

// Get user analytics
const getUserAnalytics = catchAsync(async (req, res) => {
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

  const [totalUsers, newUsers, activeUsers, usersByRole] = await Promise.all([
    User.count(),
    User.count({
      where: {
        createdAt: {
          [Op.gte]: startDate
        }
      }
    }),
    User.count({
      where: { status: 'active' }
    }),
    User.findAll({
      attributes: ['role', [User.sequelize.fn('COUNT', User.sequelize.col('role')), 'count']],
      group: ['role']
    })
  ]);

  // User growth over time
  const userGrowth = await User.findAll({
    where: {
      createdAt: {
        [Op.gte]: startDate
      }
    },
    attributes: [
      [User.sequelize.fn('DATE', User.sequelize.col('createdAt')), 'date'],
      [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
    ],
    group: [User.sequelize.fn('DATE', User.sequelize.col('createdAt'))],
    order: [[User.sequelize.fn('DATE', User.sequelize.col('createdAt')), 'ASC']]
  });

  res.json({
    success: true,
    data: {
      totalUsers,
      newUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = parseInt(item.get('count'));
        return acc;
      }, {}),
      userGrowth: userGrowth.map(item => ({
        date: item.get('date'),
        count: parseInt(item.get('count'))
      }))
    }
  });
});

// Delete user (soft delete by setting status to inactive)
const deleteUser = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user has orders
  const hasOrders = await Order.findOne({
    where: { user_id: user.id }
  });

  if (hasOrders) {
    // Soft delete - set status to inactive
    await user.update({ status: 'inactive' });
    res.json({
      success: true,
      message: 'User deactivated (has order history)'
    });
  } else {
    // Hard delete if no orders
    await user.destroy();
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  }
});

module.exports = {
  getAllUsers,
  getUser,
  updateUserStatus,
  updateUserRole,
  getUserAnalytics,
  deleteUser
};