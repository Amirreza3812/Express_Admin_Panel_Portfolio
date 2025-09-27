#!/usr/bin/env node

/**
 * Frontend Developer Ready Test Suite
 *
 * This script provides comprehensive API testing specifically designed
 * for frontend developers to understand and test all available endpoints.
 */

const axios = require('axios');
const fs = require('fs').promises;

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/v1`;

// Test credentials for frontend developers
const TEST_CREDENTIALS = {
  superAdmin: {
    email: 'superadmin@test.com',
    password: 'SuperAdmin123!',
    name: 'Test Super Admin'
  },
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!',
    name: 'Test Admin'
  },
  customer: {
    email: 'customer@test.com',
    password: 'Customer123!',
    name: 'Test Customer'
  }
};

// Frontend-friendly test results
let frontendGuide = {
  apiInfo: {
    baseUrl: BASE_URL,
    apiVersion: 'v1',
    authType: 'Bearer Token (JWT)',
    contentType: 'application/json'
  },
  authentication: {
    adminLogin: null,
    customerLogin: null,
    tokenUsage: 'Include in headers as: Authorization: Bearer <token>'
  },
  endpoints: {
    admin: {},
    customer: {},
    public: {}
  },
  sampleData: {},
  testCredentials: TEST_CREDENTIALS
};

/**
 * Make API request and format for frontend documentation
 */
async function testEndpointForFrontend(category, name, method, endpoint, body = null, auth = null, description = '') {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      headers.Authorization = `Bearer ${auth}`;
    }

    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers
    };

    if (body) {
      config.data = body;
    }

    const response = await axios(config);

    // Store endpoint info for frontend
    if (!frontendGuide.endpoints[category]) {
      frontendGuide.endpoints[category] = {};
    }

    frontendGuide.endpoints[category][name] = {
      method,
      endpoint,
      fullUrl: `${API_BASE}${endpoint}`,
      description,
      requiresAuth: !!auth,
      requestBody: body,
      responseStatus: response.status,
      responseData: response.data,
      curlExample: generateCurlExample(method, `${API_BASE}${endpoint}`, body, headers),
      jsExample: generateJsExample(method, `${API_BASE}${endpoint}`, body, auth),
      status: 'SUCCESS'
    };

    console.log(`✅ ${category.toUpperCase()} - ${name}`);
    return response.data;

  } catch (error) {
    frontendGuide.endpoints[category][name] = {
      method,
      endpoint,
      fullUrl: `${API_BASE}${endpoint}`,
      description,
      requiresAuth: !!auth,
      requestBody: body,
      error: error.response ? error.response.data : error.message,
      status: 'FAILED',
      httpStatus: error.response ? error.response.status : 500
    };

    console.log(`❌ ${category.toUpperCase()} - ${name}: ${error.response ? error.response.status : 'Network Error'}`);
    return null;
  }
}

/**
 * Generate cURL example for frontend developers
 */
function generateCurlExample(method, url, body, headers) {
  let curl = `curl -X ${method} "${url}"`;

  Object.entries(headers).forEach(([key, value]) => {
    curl += ` -H "${key}: ${value}"`;
  });

  if (body) {
    curl += ` -d '${JSON.stringify(body)}'`;
  }

  return curl;
}

/**
 * Generate JavaScript fetch example
 */
function generateJsExample(method, url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer \${token}`;
  }

  let jsCode = `const response = await fetch('${url}', {
  method: '${method}',
  headers: ${JSON.stringify(headers, null, 2)}`;

  if (body) {
    jsCode += `,
  body: JSON.stringify(${JSON.stringify(body, null, 2)})`;
  }

  jsCode += `
});

const data = await response.json();
console.log(data);`;

  return jsCode;
}

/**
 * Test and document authentication endpoints
 */
async function documentAuthentication() {
  console.log('\n🔐 Testing Authentication Endpoints...');

  // Admin Login
  const adminLogin = await testEndpointForFrontend(
    'admin',
    'adminLogin',
    'POST',
    '/admin/auth/login',
    {
      email: TEST_CREDENTIALS.admin.email,
      password: TEST_CREDENTIALS.admin.password
    },
    null,
    'Authenticate admin user and receive JWT token'
  );

  let adminToken = null;
  if (adminLogin && adminLogin.data && adminLogin.data.token) {
    adminToken = adminLogin.data.token;
    frontendGuide.authentication.adminLogin = {
      token: 'Generated Successfully',
      tokenPreview: adminToken.substring(0, 20) + '...',
      user: adminLogin.data.admin
    };
  }

  // Customer Login
  const customerLogin = await testEndpointForFrontend(
    'customer',
    'customerLogin',
    'POST',
    '/auth/login',
    {
      email: TEST_CREDENTIALS.customer.email,
      password: TEST_CREDENTIALS.customer.password
    },
    null,
    'Authenticate customer and receive JWT token'
  );

  let customerToken = null;
  if (customerLogin && customerLogin.data && customerLogin.data.token) {
    customerToken = customerLogin.data.token;
    frontendGuide.authentication.customerLogin = {
      token: 'Generated Successfully',
      tokenPreview: customerToken.substring(0, 20) + '...',
      user: customerLogin.data.user
    };
  }

  // Test protected endpoints
  if (adminToken) {
    await testEndpointForFrontend(
      'admin',
      'getAdminProfile',
      'GET',
      '/admin/auth/me',
      null,
      adminToken,
      'Get current admin user profile'
    );
  }

  if (customerToken) {
    await testEndpointForFrontend(
      'customer',
      'getCustomerProfile',
      'GET',
      '/auth/me',
      null,
      customerToken,
      'Get current customer profile'
    );
  }

  return { adminToken, customerToken };
}

/**
 * Test and document product management endpoints
 */
async function documentProductManagement(adminToken) {
  console.log('\n🛍️ Testing Product Management...');

  // Get all products (admin)
  await testEndpointForFrontend(
    'admin',
    'getAllProducts',
    'GET',
    '/admin/products?page=1&limit=10',
    null,
    adminToken,
    'Get paginated list of all products with filtering options'
  );

  // Create category first
  const categoryResult = await testEndpointForFrontend(
    'admin',
    'createCategory',
    'POST',
    '/admin/categories',
    {
      name: 'Coffee',
      description: 'All coffee beverages',
      status: 'active',
      sort_order: 1
    },
    adminToken,
    'Create new product category'
  );

  let categoryId = null;
  if (categoryResult && categoryResult.data) {
    categoryId = categoryResult.data.id;
    frontendGuide.sampleData.categoryId = categoryId;
  }

  // Create subcategory
  let subcategoryId = null;
  if (categoryId) {
    const subcategoryResult = await testEndpointForFrontend(
      'admin',
      'createSubcategory',
      'POST',
      '/admin/subcategories',
      {
        category_id: categoryId,
        name: 'Hot Coffee',
        description: 'Hot coffee beverages',
        status: 'active'
      },
      adminToken,
      'Create new product subcategory'
    );

    if (subcategoryResult && subcategoryResult.data) {
      subcategoryId = subcategoryResult.data.id;
      frontendGuide.sampleData.subcategoryId = subcategoryId;
    }
  }

  // Create product
  if (subcategoryId) {
    const productResult = await testEndpointForFrontend(
      'admin',
      'createProduct',
      'POST',
      '/admin/products',
      {
        subcategory_id: subcategoryId,
        name: 'Cappuccino',
        price: 4.50,
        description: 'Rich espresso with steamed milk and foam',
        ingredients: 'Espresso, Steamed milk, Milk foam',
        stock: 25,
        status: 'active'
      },
      adminToken,
      'Create new product'
    );

    if (productResult && productResult.data) {
      frontendGuide.sampleData.productId = productResult.data.id;
    }
  }

  // Get categories (admin)
  await testEndpointForFrontend(
    'admin',
    'getAllCategories',
    'GET',
    '/admin/categories',
    null,
    adminToken,
    'Get all product categories'
  );
}

/**
 * Test and document price management
 */
async function documentPriceManagement(adminToken) {
  console.log('\n💰 Testing Price Management...');

  await testEndpointForFrontend(
    'admin',
    'getPriceAnalytics',
    'GET',
    '/admin/prices/analytics',
    null,
    adminToken,
    'Get price distribution and analytics'
  );

  if (frontendGuide.sampleData.categoryId) {
    await testEndpointForFrontend(
      'admin',
      'increasePrices',
      'PATCH',
      '/admin/prices/increase',
      {
        percentage: 5,
        categoryId: frontendGuide.sampleData.categoryId
      },
      adminToken,
      'Increase prices by percentage for specific category'
    );
  }

  await testEndpointForFrontend(
    'admin',
    'applyDiscount',
    'PATCH',
    '/admin/prices/discount',
    {
      percentage: 3
    },
    adminToken,
    'Apply discount percentage to all products'
  );
}

/**
 * Test and document customer management
 */
async function documentCustomerManagement(adminToken) {
  console.log('\n👥 Testing Customer Management...');

  await testEndpointForFrontend(
    'admin',
    'getCustomerAnalytics',
    'GET',
    '/admin/customers/analytics',
    null,
    adminToken,
    'Get customer segmentation and analytics'
  );

  await testEndpointForFrontend(
    'admin',
    'getAllCustomers',
    'GET',
    '/admin/customers?page=1&limit=10&role=customer',
    null,
    adminToken,
    'Get paginated list of customers with filtering'
  );

  await testEndpointForFrontend(
    'admin',
    'getFavoritesAnalytics',
    'GET',
    '/admin/customers/favorites/analytics',
    null,
    adminToken,
    'Get customer favorites analytics and trends'
  );

  await testEndpointForFrontend(
    'admin',
    'getAllComments',
    'GET',
    '/admin/customers/comments?status=all&page=1&limit=10',
    null,
    adminToken,
    'Get customer comments with filtering options'
  );
}

/**
 * Test and document sales reporting
 */
async function documentSalesReporting(adminToken) {
  console.log('\n📊 Testing Sales Reporting...');

  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  await testEndpointForFrontend(
    'admin',
    'getMonthlySalesReport',
    'GET',
    `/admin/reports/sales/monthly?year=${year}&month=${month}`,
    null,
    adminToken,
    'Get detailed monthly sales report with daily breakdown'
  );

  await testEndpointForFrontend(
    'admin',
    'getYearlySalesReport',
    'GET',
    `/admin/reports/sales/yearly?year=${year}`,
    null,
    adminToken,
    'Get yearly sales summary with monthly breakdown'
  );

  await testEndpointForFrontend(
    'admin',
    'getSalesComparison',
    'GET',
    `/admin/reports/sales/comparison?currentYear=${year}&currentMonth=${month}&compareYear=${year}&compareMonth=${month - 1 || 12}`,
    null,
    adminToken,
    'Compare sales between different periods'
  );

  await testEndpointForFrontend(
    'admin',
    'getBestPerformers',
    'GET',
    `/admin/reports/sales/best-performers?period=month&year=${year}&month=${month}&limit=10`,
    null,
    adminToken,
    'Get best performing products for specified period'
  );
}

/**
 * Test and document public endpoints
 */
async function documentPublicEndpoints(customerToken) {
  console.log('\n🌐 Testing Public/Customer Endpoints...');

  await testEndpointForFrontend(
    'public',
    'getPublicProducts',
    'GET',
    '/public/products?page=1&limit=12',
    null,
    null,
    'Browse products without authentication (public catalog)'
  );

  await testEndpointForFrontend(
    'public',
    'getPublicCategories',
    'GET',
    '/public/categories',
    null,
    null,
    'Get all active categories for public browsing'
  );

  if (customerToken && frontendGuide.sampleData.productId) {
    await testEndpointForFrontend(
      'customer',
      'addToFavorites',
      'POST',
      '/favorites',
      {
        product_id: frontendGuide.sampleData.productId
      },
      customerToken,
      'Add product to customer favorites'
    );

    await testEndpointForFrontend(
      'customer',
      'getFavorites',
      'GET',
      '/favorites',
      null,
      customerToken,
      'Get customer\'s favorite products'
    );

    await testEndpointForFrontend(
      'customer',
      'addComment',
      'POST',
      '/comments',
      {
        product_id: frontendGuide.sampleData.productId,
        comment: 'Great coffee! Highly recommended.',
        rating: 5
      },
      customerToken,
      'Add product review/comment'
    );

    await testEndpointForFrontend(
      'customer',
      'getComments',
      'GET',
      `/comments/product/${frontendGuide.sampleData.productId}`,
      null,
      null,
      'Get all comments for a specific product'
    );
  }
}

/**
 * Generate comprehensive frontend guide
 */
async function generateFrontendGuide() {
  console.log('\n📚 Generating Frontend Developer Guide...');

  // Add usage examples
  frontendGuide.usageExamples = {
    authentication: {
      description: 'How to authenticate and use tokens',
      example: `
// 1. Login and get token
const loginResponse = await fetch('${API_BASE}/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'customer@test.com',
    password: 'Customer123!'
  })
});

const { data } = await loginResponse.json();
const token = data.token;

// 2. Use token for authenticated requests
const profileResponse = await fetch('${API_BASE}/auth/me', {
  headers: { 'Authorization': \`Bearer \${token}\` }
});

const profile = await profileResponse.json();`
    },
    errorHandling: {
      description: 'How to handle API errors',
      example: `
try {
  const response = await fetch('${API_BASE}/admin/products', {
    headers: { 'Authorization': \`Bearer \${adminToken}\` }
  });

  const result = await response.json();

  if (result.success) {
    console.log('Data:', result.data);
  } else {
    console.error('API Error:', result.message);
    if (result.errors) {
      console.error('Validation errors:', result.errors);
    }
  }
} catch (error) {
  console.error('Network error:', error);
}`
    },
    pagination: {
      description: 'How to handle paginated responses',
      example: `
const response = await fetch('${API_BASE}/admin/products?page=1&limit=10', {
  headers: { 'Authorization': \`Bearer \${adminToken}\` }
});

const result = await response.json();

if (result.success) {
  const { data, pagination } = result;
  console.log('Products:', data);
  console.log('Total pages:', pagination.pages);
  console.log('Has next page:', pagination.hasNextPage);
}`
    }
  };

  // Add common response formats
  frontendGuide.responseFormats = {
    success: {
      description: 'Standard successful response format',
      example: {
        success: true,
        status: 'success',
        message: 'Operation completed successfully',
        data: { /* response data */ },
        timestamp: '2024-03-15T10:30:00.000Z'
      }
    },
    error: {
      description: 'Standard error response format',
      example: {
        success: false,
        status: 'error',
        message: 'Validation failed',
        errors: [
          {
            field: 'email',
            message: 'Please provide a valid email address'
          }
        ],
        timestamp: '2024-03-15T10:30:00.000Z'
      }
    },
    paginated: {
      description: 'Paginated response format',
      example: {
        success: true,
        data: [ /* array of items */ ],
        pagination: {
          total: 156,
          page: 1,
          pages: 16,
          limit: 10,
          hasNextPage: true,
          hasPrevPage: false
        }
      }
    }
  };

  // Save comprehensive guide
  await fs.writeFile(
    './FRONTEND_API_GUIDE.json',
    JSON.stringify(frontendGuide, null, 2)
  );

  // Generate markdown documentation
  const markdownGuide = generateMarkdownGuide();
  await fs.writeFile('./FRONTEND_API_GUIDE.md', markdownGuide);

  console.log('✅ Frontend guide saved to FRONTEND_API_GUIDE.json');
  console.log('✅ Markdown guide saved to FRONTEND_API_GUIDE.md');
}

/**
 * Generate markdown documentation for frontend developers
 */
function generateMarkdownGuide() {
  const stats = {
    totalEndpoints: 0,
    successfulEndpoints: 0,
    adminEndpoints: 0,
    customerEndpoints: 0,
    publicEndpoints: 0
  };

  // Count endpoints
  Object.entries(frontendGuide.endpoints).forEach(([category, endpoints]) => {
    Object.entries(endpoints).forEach(([name, endpoint]) => {
      stats.totalEndpoints++;
      if (endpoint.status === 'SUCCESS') stats.successfulEndpoints++;

      if (category === 'admin') stats.adminEndpoints++;
      else if (category === 'customer') stats.customerEndpoints++;
      else if (category === 'public') stats.publicEndpoints++;
    });
  });

  return `# 🚀 Frontend Developer API Guide

## 📊 API Status Overview

- **Total Endpoints Tested**: ${stats.totalEndpoints}
- **Working Endpoints**: ${stats.successfulEndpoints}
- **Success Rate**: ${((stats.successfulEndpoints / stats.totalEndpoints) * 100).toFixed(1)}%
- **Admin Endpoints**: ${stats.adminEndpoints}
- **Customer Endpoints**: ${stats.customerEndpoints}
- **Public Endpoints**: ${stats.publicEndpoints}

## 🔧 Quick Setup

### Base Configuration
\`\`\`javascript
const API_BASE_URL = '${frontendGuide.apiInfo.baseUrl}';
const API_VERSION = 'v1';
const API_ENDPOINT = \`\${API_BASE_URL}/api/\${API_VERSION}\`;
\`\`\`

### Test Credentials
For development and testing, use these pre-configured accounts:

**Admin Account:**
- Email: \`${TEST_CREDENTIALS.admin.email}\`
- Password: \`${TEST_CREDENTIALS.admin.password}\`

**Customer Account:**
- Email: \`${TEST_CREDENTIALS.customer.email}\`
- Password: \`${TEST_CREDENTIALS.customer.password}\`

## 🔐 Authentication

${frontendGuide.usageExamples.authentication.example}

## 📋 Available Endpoints

### Admin Endpoints (Require Admin Token)

${Object.entries(frontendGuide.endpoints.admin || {}).map(([name, endpoint]) => `
#### ${name}
- **Method**: \`${endpoint.method}\`
- **URL**: \`${endpoint.endpoint}\`
- **Description**: ${endpoint.description}
- **Status**: ${endpoint.status === 'SUCCESS' ? '✅ Working' : '❌ Failed'}

**JavaScript Example:**
\`\`\`javascript
${endpoint.jsExample || 'No example available'}
\`\`\`

**cURL Example:**
\`\`\`bash
${endpoint.curlExample || 'No example available'}
\`\`\`
`).join('\n')}

### Customer Endpoints (Require Customer Token)

${Object.entries(frontendGuide.endpoints.customer || {}).map(([name, endpoint]) => `
#### ${name}
- **Method**: \`${endpoint.method}\`
- **URL**: \`${endpoint.endpoint}\`
- **Description**: ${endpoint.description}
- **Status**: ${endpoint.status === 'SUCCESS' ? '✅ Working' : '❌ Failed'}

**JavaScript Example:**
\`\`\`javascript
${endpoint.jsExample || 'No example available'}
\`\`\`
`).join('\n')}

### Public Endpoints (No Authentication Required)

${Object.entries(frontendGuide.endpoints.public || {}).map(([name, endpoint]) => `
#### ${name}
- **Method**: \`${endpoint.method}\`
- **URL**: \`${endpoint.endpoint}\`
- **Description**: ${endpoint.description}
- **Status**: ${endpoint.status === 'SUCCESS' ? '✅ Working' : '❌ Failed'}

**JavaScript Example:**
\`\`\`javascript
${endpoint.jsExample || 'No example available'}
\`\`\`
`).join('\n')}

## ⚠️ Error Handling

${frontendGuide.usageExamples.errorHandling.example}

## 📄 Pagination

${frontendGuide.usageExamples.pagination.example}

## 📱 Response Formats

### Success Response
\`\`\`json
${JSON.stringify(frontendGuide.responseFormats.success.example, null, 2)}
\`\`\`

### Error Response
\`\`\`json
${JSON.stringify(frontendGuide.responseFormats.error.example, null, 2)}
\`\`\`

### Paginated Response
\`\`\`json
${JSON.stringify(frontendGuide.responseFormats.paginated.example, null, 2)}
\`\`\`

## 🛠️ Development Tips

1. **Always check the \`success\` field** in responses before processing data
2. **Handle both network errors and API errors** appropriately
3. **Store JWT tokens securely** (consider using httpOnly cookies for web apps)
4. **Implement token refresh logic** for better user experience
5. **Use pagination** for better performance with large datasets
6. **Validate user input** on the frontend before sending to API

## 📚 Additional Resources

- **Swagger Documentation**: ${frontendGuide.apiInfo.baseUrl}/api-docs
- **Full API Reference**: See API_ENDPOINTS_REFERENCE.md
- **Admin Documentation**: See ADMIN_API_DOCUMENTATION.md

---

**Generated on**: ${new Date().toISOString()}
**API Version**: ${frontendGuide.apiInfo.apiVersion}
**Base URL**: ${frontendGuide.apiInfo.baseUrl}
`;
}

/**
 * Main test execution
 */
async function runFrontendTests() {
  console.log(`
🎨 FRONTEND DEVELOPER API TESTING SUITE
=======================================

Testing all endpoints and generating comprehensive documentation
for frontend development team...
`);

  try {
    // Initialize test data creation
    const { testConnection, createSuperAdmin } = require('./src/utils/dbHelpers');

    // Test connection
    console.log('🔌 Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Database connection failed. Please start the server.');
      process.exit(1);
    }

    // Create test accounts
    console.log('👤 Setting up test accounts...');
    try {
      await createSuperAdmin(TEST_CREDENTIALS.superAdmin);
    } catch (error) {
      console.log('ℹ️ Super admin might already exist, continuing...');
    }

    // Test server connectivity
    console.log('🌐 Testing server connectivity...');
    try {
      await axios.get(BASE_URL);
      console.log('✅ Server is running and accessible');
    } catch (error) {
      console.error('❌ Server is not running. Please start with: npm run dev');
      process.exit(1);
    }

    // Run all tests
    const { adminToken, customerToken } = await documentAuthentication();
    await documentProductManagement(adminToken);
    await documentPriceManagement(adminToken);
    await documentCustomerManagement(adminToken);
    await documentSalesReporting(adminToken);
    await documentPublicEndpoints(customerToken);

    // Generate documentation
    await generateFrontendGuide();

    // Show summary
    console.log(`
🎉 TESTING COMPLETE!
===================

✅ All endpoints tested and documented
📚 Frontend guide generated: FRONTEND_API_GUIDE.md
📄 JSON reference created: FRONTEND_API_GUIDE.json

🚀 READY FOR FRONTEND DEVELOPMENT!

Your frontend team can now:
1. Use the test credentials provided
2. Follow the JavaScript examples
3. Reference the complete API documentation
4. Start building the frontend with confidence

💡 Next steps:
- Start server: npm run dev
- View Swagger docs: ${BASE_URL}/api-docs
- Give FRONTEND_API_GUIDE.md to your frontend team
`);

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runFrontendTests();
}

module.exports = { runFrontendTests, frontendGuide };