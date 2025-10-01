const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cafe Management API",
      version: "1.0.0",
      description: `
        Professional Cafe Management System API

        This API provides comprehensive functionality for managing a cafe including:

        **Customer Features:**
        - Customer registration and authentication
        - Product catalog with categories and subcategories
        - Customer reviews and ratings
        - Favorites/wishlist management
        - Order placement and tracking

        **Admin Features:**
        - Complete admin authentication system with role-based access
        - Advanced product, category, and subcategory management
        - Comprehensive user and customer management
        - Price management with bulk operations and percentage adjustments
        - Detailed sales reporting (monthly, yearly, comparisons)
        - Comment/review moderation system
        - Customer analytics and segmentation
        - Order management and tracking
        - Favorites analytics and trending

        **API Versioning**: All new endpoints use /api/v1/ prefix
        **Authentication**: JWT tokens required for protected routes
        **Response Format**: Standardized JSON responses with success/error status
        **Admin Access**: Admin routes require admin or super_admin role
        **Audit Logging**: All admin actions are logged for security
      `,
      contact: {
        name: "Getsu Team",
        email: "support@getsu.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        // url: process.env.BASE_URL,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from /api/v1/auth/login",
        },
      },
      schemas: {
        // User Schemas
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "John Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            phone: { type: "string", example: "+1234567890" },
            role: {
              type: "string",
              enum: ["customer", "admin", "super_admin"],
              example: "customer",
            },
            status: {
              type: "string",
              enum: ["active", "inactive", "banned"],
              example: "active",
            },
            avatar: {
              type: "string",
              example: "https://example.com/avatar.jpg",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // Category Schemas
        Category: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Coffee" },
            description: {
              type: "string",
              example: "Various coffee drinks and beverages",
            },
            image: {
              type: "string",
              example: "https://example.com/coffee.jpg",
            },
            slug: { type: "string", example: "coffee" },
            status: {
              type: "string",
              enum: ["active", "inactive"],
              example: "active",
            },
            sort_order: { type: "integer", example: 1 },
            subcategories: {
              type: "array",
              items: { $ref: "#/components/schemas/SubCategory" },
            },
          },
        },

        SubCategory: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            category_id: { type: "integer", example: 1 },
            name: { type: "string", example: "Hot Coffee" },
            description: { type: "string", example: "Hot coffee beverages" },
            image: {
              type: "string",
              example: "https://example.com/hot-coffee.jpg",
            },
            slug: { type: "string", example: "hot-coffee" },
            status: {
              type: "string",
              enum: ["active", "inactive"],
              example: "active",
            },
            sort_order: { type: "integer", example: 1 },
          },
        },

        // Product Schemas
        Product: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            subcategory_id: { type: "integer", example: 1 },
            name: { type: "string", example: "Espresso" },
            description: {
              type: "string",
              example: "Strong, concentrated coffee shot",
            },
            price: { type: "number", format: "decimal", example: 2.5 },
            cost_price: { type: "number", format: "decimal", example: 0.75 },
            image: {
              type: "string",
              example: "https://example.com/espresso.jpg",
            },
            gallery: {
              type: "array",
              items: { type: "string" },
              example: [
                "https://example.com/espresso1.jpg",
                "https://example.com/espresso2.jpg",
              ],
            },
            stock: { type: "integer", example: 50 },
            status: {
              type: "string",
              enum: ["active", "inactive", "out_of_stock"],
              example: "active",
            },
            is_featured: { type: "boolean", example: true },
            preparation_time: {
              type: "integer",
              example: 3,
              description: "Time in minutes",
            },
            ingredients: { type: "string", example: "Coffee beans, Water" },
            calories: { type: "integer", example: 5 },
            allergens: {
              type: "array",
              items: { type: "string" },
              example: ["caffeine"],
            },
            sizes: {
              type: "object",
              example: { small: 2.5, medium: 3.0, large: 3.5 },
            },
            rating: { type: "number", format: "decimal", example: 4.5 },
            total_reviews: { type: "integer", example: 127 },
            slug: { type: "string", example: "espresso" },
          },
        },

        // Comment Schema
        Comment: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            user_id: { type: "integer", example: 1 },
            product_id: { type: "integer", example: 1 },
            comment: {
              type: "string",
              example: "Amazing coffee! Perfect for morning energy boost.",
            },
            rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
            status: {
              type: "string",
              enum: ["pending", "approved", "rejected"],
              example: "approved",
            },
            admin_reply: {
              type: "string",
              example: "Thank you for your feedback!",
            },
            helpful_count: { type: "integer", example: 12 },
            createdAt: { type: "string", format: "date-time" },
            user: { $ref: "#/components/schemas/User" },
          },
        },

        // Request/Response Schemas
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            status: { type: "string", example: "success" },
            message: {
              type: "string",
              example: "Operation completed successfully",
            },
            data: { type: "object" },
            timestamp: { type: "string", format: "date-time" },
          },
        },

        PaginatedResponse: {
          allOf: [
            { $ref: "#/components/schemas/ApiResponse" },
            {
              type: "object",
              properties: {
                pagination: {
                  type: "object",
                  properties: {
                    page: { type: "integer", example: 1 },
                    limit: { type: "integer", example: 12 },
                    total: { type: "integer", example: 156 },
                    totalPages: { type: "integer", example: 13 },
                    hasNextPage: { type: "boolean", example: true },
                    hasPrevPage: { type: "boolean", example: false },
                  },
                },
              },
            },
          ],
        },

        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            status: { type: "string", example: "error" },
            message: { type: "string", example: "An error occurred" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
            timestamp: { type: "string", format: "date-time" },
          },
        },
      }, // what
    },
    tags: [
      // Customer-facing API tags
      {
        name: "Authentication",
        description: "User registration, login, and profile management",
      },
      {
        name: "Categories",
        description: "Browse product categories and subcategories",
      },
      {
        name: "Products",
        description: "Browse products, search, and filtering",
      },
      {
        name: "Comments & Reviews",
        description: "Customer reviews and ratings",
      },
      {
        name: "Favorites",
        description: "Customer wishlist management",
      },

      // Admin API tags - Authentication & Core
      {
        name: "Admin Auth",
        description: "Admin authentication, registration, and profile management",
      },

      // Admin API tags - Product Management
      {
        name: "Admin - Categories",
        description: "Admin category management with full CRUD operations",
      },
      {
        name: "Admin - Products",
        description: "Admin product management with inventory and status control",
      },
      {
        name: "Admin - Price Management",
        description: "Bulk price updates, percentage adjustments, and pricing analytics",
      },

      // Admin API tags - Customer & User Management
      {
        name: "Admin - Customer Management",
        description: "Customer analytics, segmentation, and profile management",
      },
      {
        name: "Admin - Comment Management",
        description: "Comment moderation, approval, and management system",
      },

      // Admin API tags - Sales & Analytics
      {
        name: "Admin - Reports",
        description: "Comprehensive sales reports, monthly/yearly analytics",
      },
      {
        name: "Admin - Dashboard",
        description: "Admin dashboard overview and real-time statistics",
      },

      // Admin API tags - Order Management
      {
        name: "Admin - Orders",
        description: "Order management, tracking, and fulfillment",
      },
    ],
  },
  apis: [
    "./src/routes/api/v1/*.js",
    "./src/routes/admin/*.js",
    "./src/controllers/api/v1/**/*.js",
    "./src/controllers/api/admin/*.js",
    //"./routes/*.js", // Keep legacy routes for now
  ],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
