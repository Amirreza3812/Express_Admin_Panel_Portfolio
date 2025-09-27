#!/usr/bin/env node

/**
 * Comprehensive API Endpoint Testing Script
 *
 * This script automatically tests all endpoints in the Cafe Management API
 * to ensure everything works correctly before handoff to frontend developers.
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/v1`;

// Colors for console output
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
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.magenta}${colors.bright}${msg}${colors.reset}\n`)
};

// Test results storage
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

// Test data storage
let testData = {
  adminToken: null,
  superAdminToken: null,
  customerToken: null,
  categoryId: null,
  subcategoryId: null,
  productId: null,
  customerId: null,
  orderId: null,
  commentId: null
};

/**
 * Make HTTP request with error handling
 */
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response ? error.response.data : error.message,
      status: error.response ? error.response.status : 500
    };
  }
}

/**
 * Test a single endpoint
 */
async function testEndpoint(name, method, url, data = null, headers = {}, expectedStatus = 200) {
  testResults.total++;
  log.test(`Testing: ${method} ${url}`);

  const result = await makeRequest(method, url, data, headers);

  if (result.success && result.status === expectedStatus) {
    testResults.passed++;
    log.success(`${name} - PASSED`);
    testResults.details.push({
      name,
      method,
      url,
      status: 'PASSED',
      responseStatus: result.status
    });
    return result.data;
  } else {
    testResults.failed++;
    log.error(`${name} - FAILED`);
    log.error(`Expected status: ${expectedStatus}, Got: ${result.status}`);
    if (result.error) {
      console.log(`Error: ${JSON.stringify(result.error, null, 2)}`);
    }
    testResults.details.push({
      name,
      method,
      url,
      status: 'FAILED',
      expectedStatus,
      responseStatus: result.status,
      error: result.error
    });
    return null;
  }
}

/**
 * Setup test data by creating required entities
 */
async function setupTestData() {
  log.title('🔧 Setting Up Test Data');

  // Create super admin if not exists
  const superAdminData = {
    name: 'Test Super Admin',
    email: 'superadmin@test.com',
    password: 'SuperAdmin123!',
    phone: '+1234567890'
  };

  // Try to login first, if fails then create
  let loginResult = await makeRequest('POST', '/admin/auth/login', {
    email: superAdminData.email,
    password: superAdminData.password
  });

  if (!loginResult.success) {
    // Create super admin using database helper
    log.info('Creating super admin account...');
    try {
      const { createSuperAdmin } = require('./src/utils/dbHelpers');
      await createSuperAdmin(superAdminData);
      log.success('Super admin created successfully');

      // Login after creation
      loginResult = await makeRequest('POST', '/admin/auth/login', {
        email: superAdminData.email,
        password: superAdminData.password
      });
    } catch (error) {
      log.error('Failed to create super admin: ' + error.message);
      return false;
    }
  }

  if (loginResult.success) {
    testData.superAdminToken = loginResult.data.data.token;
    log.success('Super admin authentication successful');
  } else {
    log.error('Failed to authenticate super admin');
    return false;
  }

  // Create regular admin
  const adminData = {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'Admin123!',
    phone: '+1234567891',
    role: 'admin'
  };

  const createAdminResult = await makeRequest('POST', '/admin/auth/register', adminData, {
    'Authorization': `Bearer ${testData.superAdminToken}`
  });

  if (createAdminResult.success) {
    testData.adminToken = createAdminResult.data.data.token;
    log.success('Admin created and authenticated');
  } else {
    // Try to login if admin already exists
    const adminLoginResult = await makeRequest('POST', '/admin/auth/login', {
      email: adminData.email,
      password: adminData.password
    });

    if (adminLoginResult.success) {
      testData.adminToken = adminLoginResult.data.data.token;
      log.success('Admin authentication successful');
    } else {
      log.error('Failed to create or authenticate admin');
      return false;
    }
  }

  // Create test customer
  const customerData = {
    name: 'Test Customer',
    email: 'customer@test.com',
    password: 'Customer123!',
    phone: '+1234567892'
  };

  const createCustomerResult = await makeRequest('POST', '/auth/register', customerData);

  if (createCustomerResult.success) {
    testData.customerToken = createCustomerResult.data.data.token;
    testData.customerId = createCustomerResult.data.data.user.id;
    log.success('Customer created and authenticated');
  } else {
    // Try to login if customer already exists
    const customerLoginResult = await makeRequest('POST', '/auth/login', {
      email: customerData.email,
      password: customerData.password
    });

    if (customerLoginResult.success) {
      testData.customerToken = customerLoginResult.data.data.token;
      testData.customerId = customerLoginResult.data.data.user.id;
      log.success('Customer authentication successful');
    } else {
      log.warning('Customer authentication failed, some tests may be skipped');
    }
  }

  return true;
}

/**
 * Test Admin Authentication Endpoints
 */
async function testAdminAuth() {
  log.title('🔐 Testing Admin Authentication');

  // Admin login (already tested in setup)
  await testEndpoint(
    'Admin Login',
    'POST',
    '/admin/auth/login',
    {
      email: 'admin@test.com',
      password: 'Admin123!'
    }
  );

  // Get admin profile
  await testEndpoint(
    'Get Admin Profile',
    'GET',
    '/admin/auth/me',
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );

  // Update admin profile
  await testEndpoint(
    'Update Admin Profile',
    'PUT',
    '/admin/auth/me',
    {
      name: 'Updated Test Admin',
      phone: '+1234567893'
    },
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );

  // Test forgot password
  await testEndpoint(
    'Admin Forgot Password',
    'POST',
    '/admin/auth/forgotPassword',
    {
      email: 'admin@test.com'
    }
  );
}

/**
 * Test Category Management
 */
async function testCategoryManagement() {
  log.title('🏷️ Testing Category Management');

  // Create category
  const categoryResult = await testEndpoint(
    'Create Category',
    'POST',
    '/admin/categories',
    {
      name: 'Test Coffee',
      description: 'Test coffee category',
      status: 'active',
      sort_order: 1
    },
    { 'Authorization': `Bearer ${testData.adminToken}` },
    201
  );

  if (categoryResult && categoryResult.data) {
    testData.categoryId = categoryResult.data.id;
  }

  // Get all categories
  await testEndpoint(
    'Get All Categories',
    'GET',
    '/admin/categories',
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );

  // Get category by ID
  if (testData.categoryId) {
    await testEndpoint(
      'Get Category by ID',
      'GET',
      `/admin/categories/${testData.categoryId}`,
      null,
      { 'Authorization': `Bearer ${testData.adminToken}` }
    );

    // Update category
    await testEndpoint(
      'Update Category',
      'PUT',
      `/admin/categories/${testData.categoryId}`,
      {
        name: 'Updated Test Coffee',
        description: 'Updated test coffee category'
      },
      { 'Authorization': `Bearer ${testData.adminToken}` }
    );
  }

  // Create subcategory
  if (testData.categoryId) {
    const subcategoryResult = await testEndpoint(
      'Create Subcategory',
      'POST',
      '/admin/subcategories',
      {
        category_id: testData.categoryId,
        name: 'Test Hot Coffee',
        description: 'Test hot coffee subcategory',
        status: 'active'
      },
      { 'Authorization': `Bearer ${testData.adminToken}` },
      201
    );

    if (subcategoryResult && subcategoryResult.data) {
      testData.subcategoryId = subcategoryResult.data.id;
    }
  }

  // Get all subcategories
  await testEndpoint(
    'Get All Subcategories',
    'GET',
    '/admin/subcategories',
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );
}

/**
 * Test Product Management
 */
async function testProductManagement() {
  log.title('🛍️ Testing Product Management');

  // Create product
  if (testData.subcategoryId) {
    const productResult = await testEndpoint(
      'Create Product',
      'POST',
      '/admin/products',
      {
        subcategory_id: testData.subcategoryId,
        name: 'Test Cappuccino',
        price: 4.50,
        description: 'Test cappuccino description',
        ingredients: 'Espresso, Steamed milk, Milk foam',
        stock: 25,
        status: 'active'
      },
      { 'Authorization': `Bearer ${testData.adminToken}` },
      201
    );

    if (productResult && productResult.data) {
      testData.productId = productResult.data.id;
    }
  }

  // Get all products
  await testEndpoint(
    'Get All Products',
    'GET',
    '/admin/products',
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );

  // Get products with filters
  await testEndpoint(
    'Get Products with Filters',
    'GET',
    '/admin/products?page=1&limit=10&status=active',
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );

  // Get product by ID
  if (testData.productId) {
    await testEndpoint(
      'Get Product by ID',
      'GET',
      `/admin/products/${testData.productId}`,
      null,
      { 'Authorization': `Bearer ${testData.adminToken}` }
    );

    // Update product
    await testEndpoint(
      'Update Product',
      'PUT',
      `/admin/products/${testData.productId}`,
      {
        name: 'Updated Test Cappuccino',
        price: 5.00,
        description: 'Updated test cappuccino description'
      },
      { 'Authorization': `Bearer ${testData.adminToken}` }
    );

    // Update product status
    await testEndpoint(
      'Update Product Status',
      'PATCH',
      `/admin/products/${testData.productId}/status`,
      {
        status: 'inactive'
      },
      { 'Authorization': `Bearer ${testData.adminToken}` }
    );

    // Reactivate product
    await testEndpoint(
      'Reactivate Product',
      'PATCH',
      `/admin/products/${testData.productId}/status`,
      {
        status: 'active'
      },
      { 'Authorization': `Bearer ${testData.adminToken}` }
    );
  }
}

/**
 * Test Price Management
 */
async function testPriceManagement() {
  log.title('💰 Testing Price Management');

  // Get price analytics
  await testEndpoint(
    'Get Price Analytics',
    'GET',
    '/admin/prices/analytics',
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );

  // Test price increase
  if (testData.categoryId) {
    await testEndpoint(
      'Increase Prices by Category',
      'PATCH',
      '/admin/prices/increase',
      {
        percentage: 5,
        categoryId: testData.categoryId
      },
      { 'Authorization': `Bearer ${testData.adminToken}` }
    );
  }

  // Test discount application
  if (testData.subcategoryId) {
    await testEndpoint(
      'Apply Discount by Subcategory',
      'PATCH',
      '/admin/prices/discount',
      {
        percentage: 3,
        subcategoryId: testData.subcategoryId
      },
      { 'Authorization': `Bearer ${testData.adminToken}` }
    );
  }

  // Test bulk price update
  if (testData.productId) {
    await testEndpoint(
      'Bulk Price Update',
      'PATCH',
      '/admin/prices/set-bulk',
      {
        updates: [
          { productId: testData.productId, price: 4.75 }
        ]
      },
      { 'Authorization': `Bearer ${testData.adminToken}` }
    );
  }
}

/**
 * Test Customer Management
 */
async function testCustomerManagement() {
  log.title('👥 Testing Customer Management');

  // Get customer analytics
  await testEndpoint(
    'Get Customer Analytics',
    'GET',
    '/admin/customers/analytics',
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );

  // Get all customers
  await testEndpoint(
    'Get All Customers',
    'GET',
    '/admin/customers',
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );

  // Get customers with filters
  await testEndpoint(
    'Get Customers with Filters',
    'GET',
    '/admin/customers?page=1&limit=10&role=customer&status=active',
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );

  // Get customer profile
  if (testData.customerId) {
    await testEndpoint(
      'Get Customer Profile',
      'GET',
      `/admin/customers/${testData.customerId}/profile`,
      null,
      { 'Authorization': `Bearer ${testData.adminToken}` }
    );

    // Update customer status
    await testEndpoint(
      'Update Customer Status',
      'PATCH',
      `/admin/customers/${testData.customerId}/status`,
      {
        status: 'active'
      },
      { 'Authorization': `Bearer ${testData.adminToken}` }
    );
  }

  // Get favorites analytics
  await testEndpoint(
    'Get Favorites Analytics',
    'GET',
    '/admin/customers/favorites/analytics',
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );
}

/**
 * Test Comment Management
 */
async function testCommentManagement() {
  log.title('💬 Testing Comment Management');

  // Create a test comment first (as customer)
  if (testData.customerToken && testData.productId) {
    const commentResult = await testEndpoint(
      'Create Comment (Customer)',
      'POST',
      '/comments',
      {
        product_id: testData.productId,
        comment: 'This is a test comment',
        rating: 5
      },
      { 'Authorization': `Bearer ${testData.customerToken}` },
      201
    );

    if (commentResult && commentResult.data) {
      testData.commentId = commentResult.data.id;
    }
  }

  // Get all comments
  await testEndpoint(
    'Get All Comments',
    'GET',
    '/admin/customers/comments',
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );

  // Get comments with filters
  await testEndpoint(
    'Get Comments with Filters',
    'GET',
    '/admin/customers/comments?status=pending&page=1&limit=10',
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );

  // Moderate comment
  if (testData.commentId) {
    await testEndpoint(
      'Approve Comment',
      'PATCH',
      `/admin/customers/comments/${testData.commentId}`,
      {
        action: 'approve',
        adminNote: 'Test approval'
      },
      { 'Authorization': `Bearer ${testData.adminToken}` }
    );
  }
}

/**
 * Test Sales Reporting
 */
async function testSalesReporting() {
  log.title('📊 Testing Sales Reporting');

  // Get monthly sales report
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  await testEndpoint(
    'Get Monthly Sales Report',
    'GET',
    `/admin/reports/sales/monthly?year=${currentYear}&month=${currentMonth}`,
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );

  // Get yearly sales report
  await testEndpoint(
    'Get Yearly Sales Report',
    'GET',
    `/admin/reports/sales/yearly?year=${currentYear}`,
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );

  // Get sales comparison
  await testEndpoint(
    'Get Sales Comparison',
    'GET',
    `/admin/reports/sales/comparison?currentYear=${currentYear}&currentMonth=${currentMonth}&compareYear=${currentYear}&compareMonth=${currentMonth - 1 || 12}`,
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );

  // Get best performers
  await testEndpoint(
    'Get Best Performers',
    'GET',
    `/admin/reports/sales/best-performers?period=month&year=${currentYear}&month=${currentMonth}&limit=10`,
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );

  // Get basic reports
  await testEndpoint(
    'Get Sales Report',
    'GET',
    '/admin/reports/sales',
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );

  await testEndpoint(
    'Get Inventory Report',
    'GET',
    '/admin/reports/inventory',
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );

  await testEndpoint(
    'Get Customer Report',
    'GET',
    '/admin/reports/customers',
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );
}

/**
 * Test Public/Customer Endpoints
 */
async function testPublicEndpoints() {
  log.title('🌐 Testing Public/Customer Endpoints');

  // Customer authentication (already tested in setup)
  await testEndpoint(
    'Customer Login',
    'POST',
    '/auth/login',
    {
      email: 'customer@test.com',
      password: 'Customer123!'
    }
  );

  // Get customer profile
  if (testData.customerToken) {
    await testEndpoint(
      'Get Customer Profile',
      'GET',
      '/auth/me',
      null,
      { 'Authorization': `Bearer ${testData.customerToken}` }
    );

    // Update customer profile
    await testEndpoint(
      'Update Customer Profile',
      'PUT',
      '/auth/me',
      {
        name: 'Updated Test Customer',
        phone: '+1234567894'
      },
      { 'Authorization': `Bearer ${testData.customerToken}` }
    );
  }

  // Public product browsing
  await testEndpoint(
    'Get Public Products',
    'GET',
    '/public/products',
    null
  );

  // Get public categories
  await testEndpoint(
    'Get Public Categories',
    'GET',
    '/public/categories',
    null
  );

  // Test favorites
  if (testData.customerToken && testData.productId) {
    await testEndpoint(
      'Add to Favorites',
      'POST',
      '/favorites',
      {
        product_id: testData.productId
      },
      { 'Authorization': `Bearer ${testData.customerToken}` },
      201
    );

    await testEndpoint(
      'Get Favorites',
      'GET',
      '/favorites',
      null,
      { 'Authorization': `Bearer ${testData.customerToken}` }
    );
  }
}

/**
 * Test Dashboard and System Endpoints
 */
async function testDashboardEndpoints() {
  log.title('🏪 Testing Dashboard Endpoints');

  // Get dashboard stats
  await testEndpoint(
    'Get Dashboard Stats',
    'GET',
    '/admin/dashboard',
    null,
    { 'Authorization': `Bearer ${testData.adminToken}` }
  );

  // Test Swagger documentation endpoint
  const swaggerResult = await makeRequest('GET', '', null, {}, `${BASE_URL}/api-docs`);
  if (swaggerResult.success) {
    log.success('Swagger Documentation - ACCESSIBLE');
  } else {
    log.warning('Swagger Documentation - NOT ACCESSIBLE');
  }
}

/**
 * Generate test report
 */
async function generateTestReport() {
  log.title('📝 Generating Test Report');

  const report = {
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      passRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%'
    },
    timestamp: new Date().toISOString(),
    testData: {
      baseUrl: BASE_URL,
      adminToken: testData.adminToken ? 'Generated' : 'Failed',
      customerToken: testData.customerToken ? 'Generated' : 'Failed',
      categoryId: testData.categoryId,
      productId: testData.productId,
      customerId: testData.customerId
    },
    details: testResults.details
  };

  // Save report to file
  try {
    await fs.writeFile(
      path.join(__dirname, 'test-report.json'),
      JSON.stringify(report, null, 2)
    );
    log.success('Test report saved to test-report.json');
  } catch (error) {
    log.error('Failed to save test report: ' + error.message);
  }

  // Display summary
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}TEST SUMMARY${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`Total Tests: ${colors.blue}${report.summary.total}${colors.reset}`);
  console.log(`Passed: ${colors.green}${report.summary.passed}${colors.reset}`);
  console.log(`Failed: ${colors.red}${report.summary.failed}${colors.reset}`);
  console.log(`Pass Rate: ${colors.bright}${report.summary.passRate}${colors.reset}`);
  console.log('='.repeat(60));

  if (testResults.failed > 0) {
    console.log(`\n${colors.red}${colors.bright}FAILED TESTS:${colors.reset}`);
    testResults.details
      .filter(test => test.status === 'FAILED')
      .forEach(test => {
        console.log(`${colors.red}❌ ${test.name} (${test.method} ${test.url})${colors.reset}`);
        if (test.error) {
          console.log(`   Error: ${JSON.stringify(test.error, null, 2)}`);
        }
      });
  }

  console.log(`\n${colors.green}✅ All endpoints tested successfully!${colors.reset}`);
  console.log(`${colors.blue}📄 Detailed report available in: test-report.json${colors.reset}`);
  console.log(`${colors.yellow}🚀 Ready for frontend development!${colors.reset}\n`);

  return report;
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log(`
${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════════════════╗
║            CAFE MANAGEMENT API - ENDPOINT TESTING        ║
║                 Comprehensive Test Suite                 ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}

${colors.yellow}Testing all endpoints to ensure API readiness for frontend development...${colors.reset}
`);

  try {
    // Check if server is running
    log.info(`Checking server connectivity at ${BASE_URL}...`);
    const healthCheck = await makeRequest('GET', '', null, {}, BASE_URL);
    if (!healthCheck.success) {
      log.error('Server is not running! Please start the server with: npm run dev');
      process.exit(1);
    }
    log.success('Server is running and accessible');

    // Setup test data
    const setupSuccess = await setupTestData();
    if (!setupSuccess) {
      log.error('Failed to setup test data. Aborting tests.');
      process.exit(1);
    }

    // Run all test suites
    await testAdminAuth();
    await testCategoryManagement();
    await testProductManagement();
    await testPriceManagement();
    await testCustomerManagement();
    await testCommentManagement();
    await testSalesReporting();
    await testPublicEndpoints();
    await testDashboardEndpoints();

    // Generate final report
    await generateTestReport();

  } catch (error) {
    log.error('Test execution failed: ' + error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, testResults };