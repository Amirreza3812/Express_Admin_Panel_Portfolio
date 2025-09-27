const { sequelize } = require('../config/db');

/**
 * Database Helper Utilities
 *
 * This module provides helper functions for database operations,
 * migrations, and development tasks.
 */

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    return false;
  }
};

/**
 * Sync all models with database
 * @param {boolean} force - Whether to force sync (drop and recreate tables)
 * @returns {Promise<void>}
 */
const syncModels = async (force = false) => {
  try {
    if (force) {
      console.log('⚠️  Force syncing models (this will drop existing tables)...');
    } else {
      console.log('🔄 Syncing models with database...');
    }

    await sequelize.sync({ force });
    console.log('✅ All models synchronized successfully.');
  } catch (error) {
    console.error('❌ Model synchronization failed:', error.message);
    throw error;
  }
};

/**
 * Create a super admin user for initial setup
 * @param {Object} adminData - Admin user data
 * @returns {Promise<Object>} Created admin user
 */
const createSuperAdmin = async (adminData) => {
  const { User } = require('../models/associations');
  const bcrypt = require('bcryptjs');

  try {
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({
      where: { role: 'super_admin' }
    });

    if (existingSuperAdmin) {
      console.log('ℹ️  Super admin already exists:', existingSuperAdmin.email);
      return existingSuperAdmin;
    }

    // Create super admin
    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    const superAdmin = await User.create({
      name: adminData.name || 'Super Administrator',
      email: adminData.email,
      password: hashedPassword,
      phone: adminData.phone || null,
      role: 'super_admin',
      status: 'active'
    });

    console.log('✅ Super admin created successfully:', superAdmin.email);
    return superAdmin;
  } catch (error) {
    console.error('❌ Failed to create super admin:', error.message);
    throw error;
  }
};

/**
 * Get database statistics
 * @returns {Promise<Object>} Database statistics
 */
const getDatabaseStats = async () => {
  try {
    const { User, Product, Category, SubCategory, Order, Comment, Favorite } = require('../models/associations');

    const stats = {
      users: {
        total: await User.count(),
        customers: await User.count({ where: { role: 'customer' } }),
        admins: await User.count({ where: { role: 'admin' } }),
        superAdmins: await User.count({ where: { role: 'super_admin' } })
      },
      products: {
        total: await Product.count(),
        active: await Product.count({ where: { status: 'active' } }),
        inactive: await Product.count({ where: { status: 'inactive' } })
      },
      categories: {
        total: await Category.count(),
        active: await Category.count({ where: { status: 'active' } })
      },
      subcategories: {
        total: await SubCategory.count(),
        active: await SubCategory.count({ where: { status: 'active' } })
      },
      orders: {
        total: await Order.count(),
        completed: await Order.count({ where: { status: 'completed' } }),
        pending: await Order.count({ where: { status: 'pending' } })
      },
      comments: {
        total: await Comment.count(),
        approved: await Comment.count({ where: { status: 'approved' } }),
        pending: await Comment.count({ where: { status: 'pending' } })
      },
      favorites: {
        total: await Favorite.count()
      }
    };

    return stats;
  } catch (error) {
    console.error('❌ Failed to get database stats:', error.message);
    throw error;
  }
};

/**
 * Reset database for development (USE WITH CAUTION!)
 * @returns {Promise<void>}
 */
const resetDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ Cannot reset database in production environment!');
  }

  try {
    console.log('⚠️  Resetting database (development only)...');

    // Drop all tables
    await sequelize.drop();
    console.log('🗑️  All tables dropped.');

    // Recreate tables
    await sequelize.sync({ force: true });
    console.log('🔄 Tables recreated.');

    console.log('✅ Database reset completed.');
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    throw error;
  }
};

/**
 * Backup database (basic implementation)
 * @returns {Promise<string>} Backup file path
 */
const backupDatabase = async () => {
  // This is a basic implementation - in production use proper backup tools
  const fs = require('fs').promises;
  const path = require('path');

  try {
    const stats = await getDatabaseStats();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      timestamp: new Date().toISOString(),
      stats,
      version: require('../../package.json').version
    };

    const backupDir = path.join(__dirname, '../../backups');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    // Create backup directory if it doesn't exist
    try {
      await fs.mkdir(backupDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }

    await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
    console.log('✅ Database backup created:', backupFile);

    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
};

module.exports = {
  testConnection,
  syncModels,
  createSuperAdmin,
  getDatabaseStats,
  resetDatabase,
  backupDatabase
};