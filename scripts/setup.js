#!/usr/bin/env node

/**
 * Setup Script for Cafe Management API
 *
 * This script helps initialize the application for development or production.
 */

require('dotenv').config();
const readline = require('readline');
const {
  testConnection,
  syncModels,
  createSuperAdmin,
  getDatabaseStats
} = require('../src/utils/dbHelpers');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.cyan}${colors.bright}${msg}${colors.reset}\n`)
};

const showWelcome = () => {
  console.log(`
${colors.cyan}${colors.bright}
╔══════════════════════════════════════╗
║      Cafe Management API Setup       ║
║         Professional Edition         ║
╚══════════════════════════════════════╝
${colors.reset}

${colors.yellow}This setup wizard will help you initialize your application.${colors.reset}
`);
};

const checkEnvironment = () => {
  log.title('🔍 Environment Check');

  const requiredEnvVars = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    log.error('Missing required environment variables:');
    missing.forEach(envVar => console.log(`  - ${envVar}`));
    console.log('\nPlease update your .env file and try again.');
    process.exit(1);
  }

  log.success('All required environment variables are set');
};

const setupDatabase = async () => {
  log.title('🗄️  Database Setup');

  // Test connection
  log.info('Testing database connection...');
  const connected = await testConnection();

  if (!connected) {
    log.error('Database connection failed. Please check your database configuration.');
    process.exit(1);
  }

  // Ask about syncing models
  const shouldSync = await question('Do you want to sync models with the database? (y/N): ');

  if (shouldSync.toLowerCase() === 'y' || shouldSync.toLowerCase() === 'yes') {
    const shouldForce = await question('⚠️  Force sync (this will drop existing tables)? (y/N): ');
    const force = shouldForce.toLowerCase() === 'y' || shouldForce.toLowerCase() === 'yes';

    if (force) {
      log.warning('This will DELETE all existing data!');
      const confirm = await question('Are you absolutely sure? Type "DELETE" to confirm: ');

      if (confirm !== 'DELETE') {
        log.info('Operation cancelled.');
        return;
      }
    }

    await syncModels(force);
  }
};

const setupSuperAdmin = async () => {
  log.title('👤 Super Administrator Setup');

  const createAdmin = await question('Do you want to create a super administrator account? (Y/n): ');

  if (createAdmin.toLowerCase() === 'n' || createAdmin.toLowerCase() === 'no') {
    return;
  }

  log.info('Please provide super administrator details:');

  const name = await question('Full Name: ');
  const email = await question('Email: ');
  const password = await question('Password (min 8 characters): ');
  const phone = await question('Phone (optional): ');

  if (!name || !email || !password) {
    log.error('Name, email, and password are required.');
    return;
  }

  if (password.length < 8) {
    log.error('Password must be at least 8 characters long.');
    return;
  }

  try {
    await createSuperAdmin({
      name,
      email,
      password,
      phone: phone || null
    });
  } catch (error) {
    log.error('Failed to create super admin: ' + error.message);
  }
};

const showDatabaseStats = async () => {
  log.title('📊 Database Statistics');

  try {
    const stats = await getDatabaseStats();

    console.log('Users:');
    console.log(`  Total: ${stats.users.total}`);
    console.log(`  Customers: ${stats.users.customers}`);
    console.log(`  Admins: ${stats.users.admins}`);
    console.log(`  Super Admins: ${stats.users.superAdmins}`);

    console.log('\nProducts:');
    console.log(`  Total: ${stats.products.total}`);
    console.log(`  Active: ${stats.products.active}`);
    console.log(`  Inactive: ${stats.products.inactive}`);

    console.log('\nCategories:');
    console.log(`  Total: ${stats.categories.total}`);
    console.log(`  Active: ${stats.categories.active}`);

    console.log('\nSubcategories:');
    console.log(`  Total: ${stats.subcategories.total}`);
    console.log(`  Active: ${stats.subcategories.active}`);

    console.log('\nOrders:');
    console.log(`  Total: ${stats.orders.total}`);
    console.log(`  Completed: ${stats.orders.completed}`);
    console.log(`  Pending: ${stats.orders.pending}`);

    console.log('\nComments:');
    console.log(`  Total: ${stats.comments.total}`);
    console.log(`  Approved: ${stats.comments.approved}`);
    console.log(`  Pending: ${stats.comments.pending}`);

    console.log('\nFavorites:');
    console.log(`  Total: ${stats.favorites.total}`);

  } catch (error) {
    log.error('Failed to get database stats: ' + error.message);
  }
};

const showCompletionInfo = () => {
  log.title('🎉 Setup Complete!');

  console.log('Your Cafe Management API is ready to use!\n');

  console.log('Available Scripts:');
  console.log('  npm start          - Start the production server');
  console.log('  npm run dev        - Start the development server');
  console.log('  npm test           - Run tests');
  console.log('  npm run lint       - Run linter');

  console.log('\nAPI Documentation:');
  console.log(`  Swagger UI: http://localhost:${process.env.PORT || 3000}/api-docs`);

  console.log('\nAdmin Features:');
  console.log('  - Complete admin authentication system');
  console.log('  - Product, category, and subcategory management');
  console.log('  - Price management with bulk operations');
  console.log('  - Customer management and analytics');
  console.log('  - Sales reporting and analytics');
  console.log('  - Comment moderation system');

  console.log('\nNext Steps:');
  console.log('  1. Start the server: npm run dev');
  console.log('  2. Visit Swagger documentation for API details');
  console.log('  3. Login as super admin to access admin features');
  console.log('  4. Configure your cafe data (categories, products, etc.)');

  console.log(`\n${colors.green}Happy coding! 🚀${colors.reset}\n`);
};

const main = async () => {
  try {
    showWelcome();
    checkEnvironment();
    await setupDatabase();
    await setupSuperAdmin();
    await showDatabaseStats();
    showCompletionInfo();
  } catch (error) {
    log.error('Setup failed: ' + error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { main };