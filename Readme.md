# ☕ Cafe Management System API

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)
![Express.js](https://img.shields.io/badge/Express.js-4.x-blue.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.x-orange.svg)
![Sequelize](https://img.shields.io/badge/Sequelize-6.x-purple.svg)
![JWT](https://img.shields.io/badge/JWT-Authentication-red.svg)
![Swagger](https://img.shields.io/badge/Swagger-API%20Docs-lightgreen.svg)
  <h1> <b> GETSU TEAM </b></h1>
**A comprehensive RESTful API for managing cafe operations with professional admin panel**

[Features](#-features) • [Installation](#-installation) • [API Documentation](#-api-documentation) • [Usage](#-usage) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Usage Examples](#-usage-examples)
- [Admin Panel](#-admin-panel)
- [Authentication](#-authentication)
- [Error Handling](#-error-handling)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Overview

The **Cafe Management System API** is a robust, scalable RESTful API built with Node.js and Express.js, designed to handle all aspects of cafe operations. From customer management to order processing and sales analytics, this system provides a complete backend solution for modern cafe businesses.

### Key Highlights

- **🏗️ Clean Architecture** - MVC+ pattern with clear separation of concerns
- **🔐 Secure Authentication** - JWT-based role-based access control
- **📊 Business Intelligence** - Comprehensive sales reporting and analytics
- **🚀 Production Ready** - Professional error handling and validation
- **📚 Well Documented** - Interactive Swagger API documentation
- **🧪 Type Safe** - Robust data validation with Sequelize ORM

## ✨ Features

### 🛍️ **Customer Management**
- User registration and authentication
- Customer profiles and preferences
- Favorites/wishlist system
- Order history tracking

### 📦 **Product Management**
- Hierarchical category system (Categories → Subcategories → Products)
- Product variants with pricing
- Inventory tracking and stock alerts
- Product reviews and ratings
- Image upload support

### 📋 **Order Management**
- Real-time order processing
- Order status tracking (Pending → Preparing → Ready → Delivered)
- Order history and analytics
- Customer notifications

### 👨‍💼 **Admin Panel**
- Complete CRUD operations for all entities
- Role-based access control (Customer/Admin)
- Real-time dashboard with key metrics
- User management and moderation

### 📈 **Business Intelligence**
- Monthly sales reports
- Top-selling products analytics
- Customer behavior insights
- Revenue tracking and forecasting
- Order status distribution

### 🔧 **Developer Experience**
- Interactive Swagger API documentation
- Comprehensive error handling
- Request/response validation
- Audit logging for admin actions
- Professional JSON responses

## 🛠️ Technology Stack

### Backend Framework
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **Sequelize ORM** - Database object-relational mapping

### Database
- **MySQL** - Primary database
- **Database Migrations** - Schema version control

### Authentication & Security
- **JWT (JSON Web Tokens)** - Stateless authentication
- **bcrypt** - Password hashing
- **express-validator** - Input validation
- **CORS** - Cross-origin resource sharing

### Documentation & Testing
- **Swagger/OpenAPI 3.0** - API documentation
- **Jest** - Testing framework (ready for implementation)

### Development Tools
- **Nodemon** - Development server
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 🚀 Installation

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v18.x or higher)
- **MySQL** (v8.x or higher)
- **npm** or **yarn**

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/cafe-management-api.git
cd cafe-management-api
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cafe_management
DB_USER=your_username
DB_PASSWORD=your_password

# Server Configuration
PORT=3001
BASE_URL=http://localhost:3001

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Environment
NODE_ENV=development
```

### Step 4: Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE cafe_management;
exit

# Run the application (tables will be created automatically)
npm start
```

### Step 5: Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:3001`

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | MySQL host | localhost | ✅ |
| `DB_PORT` | MySQL port | 3306 | ✅ |
| `DB_NAME` | Database name | cafe_management | ✅ |
| `DB_USER` | Database username | - | ✅ |
| `DB_PASSWORD` | Database password | - | ✅ |
| `PORT` | Server port | 3001 | ❌ |
| `JWT_SECRET` | JWT signing secret | - | ✅ |
| `NODE_ENV` | Environment mode | development | ❌ |

## 📚 API Documentation

### Interactive Documentation

Access the interactive Swagger documentation at:
**🌐 [http://localhost:3001/api-docs](http://localhost:3001/api-docs)**

### API Versioning

All API endpoints are versioned and follow RESTful conventions:

```
Base URL: http://localhost:3001/api/v1
```

### Main Endpoints

#### 🔓 **Public Endpoints**
```
GET    /api/v1/public/categories          # Get all categories
GET    /api/v1/public/products            # Get all products
GET    /api/v1/public/products/:id        # Get product details
POST   /api/v1/auth/register              # User registration
POST   /api/v1/auth/login                 # User login
```

#### 🔐 **Protected Customer Endpoints**
```
GET    /api/v1/customer/profile           # Get user profile
PUT    /api/v1/customer/profile           # Update profile
GET    /api/v1/customer/favorites         # Get favorites
POST   /api/v1/customer/favorites         # Add to favorites
POST   /api/v1/customer/orders            # Create order
GET    /api/v1/customer/orders            # Get order history
```

#### 👨‍💼 **Admin Endpoints**
```
GET    /api/v1/admin/dashboard/overview   # Dashboard statistics
GET    /api/v1/admin/products             # Manage products
POST   /api/v1/admin/products             # Create product
GET    /api/v1/admin/orders               # Manage orders
GET    /api/v1/admin/users                # Manage users
GET    /api/v1/admin/orders/reports/monthly # Sales reports
```

## 🗄️ Database Schema

### Core Entities

```
Users (Customers & Admins)
├── id, name, email, password, phone, role
├── status, avatar, email_verified_at
└── Relationships: orders, comments, favorites

Categories (Coffee, Pastries, etc.)
├── id, name, description, image, status
└── Relationships: subcategories

SubCategories (Hot Coffee, Iced Coffee, etc.)
├── id, category_id, name, description, image
└── Relationships: products

Products (Specific Items)
├── id, subcategory_id, name, price, description
├── image, stock, rating, ingredients, status
└── Relationships: comments, favorites, order_items

Orders & Sales Tracking
├── id, user_id, total, status, order_date
└── Relationships: order_items

OrderItems (Order Details)
├── id, order_id, product_id, quantity, price
└── Essential for sales analytics

Comments & Ratings
├── id, user_id, product_id, comment, rating
└── Customer feedback system

Favorites (Wishlist)
├── id, user_id, product_id
└── Customer preferences
```

## 💡 Usage Examples

### Authentication

```javascript
// Register a new user
POST /api/v1/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+1234567890"
}

// Login
POST /api/v1/auth/login
{
  "email": "john@example.com",
  "password": "securePassword123"
}

// Response
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    }
  }
}
```

### Product Management

```javascript
// Get products with filtering
GET /api/v1/public/products?category=1&limit=10&page=1

// Create a new product (Admin only)
POST /api/v1/admin/products
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

{
  "subcategory_id": 1,
  "name": "Cappuccino",
  "price": 4.50,
  "description": "Rich espresso with steamed milk and foam",
  "ingredients": "Espresso, Steamed milk, Milk foam",
  "stock": 25,
  "image": <file>
}
```

### Order Processing

```javascript
// Create an order
POST /api/v1/customer/orders
Authorization: Bearer <jwt_token>

{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 3,
      "quantity": 1
    }
  ],
  "order_type": "dine_in"
}

// Update order status (Admin only)
PATCH /api/v1/admin/orders/123/status
Authorization: Bearer <admin_jwt_token>

{
  "status": "preparing"
}
```

### Sales Reports

```javascript
// Get monthly sales report
GET /api/v1/admin/orders/reports/monthly?year=2024&month=3
Authorization: Bearer <admin_jwt_token>

// Response
{
  "success": true,
  "data": {
    "period": "2024-03",
    "totalOrders": 156,
    "totalRevenue": 2847.50,
    "averageOrderValue": 18.25,
    "topProducts": [
      {
        "name": "Cappuccino",
        "quantity": 45,
        "revenue": 202.50
      }
    ],
    "dailyBreakdown": {
      "2024-03-01": {
        "orders": 8,
        "revenue": 142.50
      }
    }
  }
}
```

## 🎛️ Admin Panel

### Dashboard Features

- **📊 Real-time Statistics** - Revenue, orders, customers, products
- **📈 Sales Analytics** - Charts and trends
- **🔍 Recent Activities** - System activity feed
- **⚡ Quick Actions** - Common admin tasks

### Management Capabilities

- **Product Management** - Full CRUD with image upload
- **Category Management** - Hierarchical organization
- **Order Management** - Status tracking and updates
- **User Management** - Customer accounts and roles
- **Sales Reporting** - Comprehensive business insights

### Security Features

- **Role-based Access Control** - Admin/Customer permissions
- **Audit Logging** - Track all admin actions
- **Session Management** - JWT token validation
- **Input Validation** - Comprehensive data validation

## 🔐 Authentication

### JWT Implementation

The API uses JSON Web Tokens for stateless authentication:

```javascript
// Token structure
{
  "id": 1,
  "email": "user@example.com",
  "role": "customer",
  "iat": 1635123456,
  "exp": 1635209856
}
```

### Authorization Levels

| Role | Permissions |
|------|------------|
| **Customer** | View products, manage profile, place orders, add favorites |
| **Admin** | Full system access, user management, reports, product management |

### Protected Routes

Use the `Authorization` header with Bearer token:

```
Authorization: Bearer <your_jwt_token>
```

## 🛡️ Error Handling

### Standardized Error Responses

All errors follow a consistent format:

```javascript
{
  "success": false,
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "timestamp": "2024-03-15T10:30:00.000Z"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request - Validation Error |
| `401` | Unauthorized - Authentication Required |
| `403` | Forbidden - Insufficient Permissions |
| `404` | Not Found |
| `409` | Conflict - Duplicate Resource |
| `500` | Internal Server Error |

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests** (when implemented)
5. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Standards

- Follow ESLint configuration
- Use meaningful commit messages
- Add JSDoc comments for functions
- Maintain test coverage above 80%
- Follow RESTful API conventions

### Development Scripts

```bash
npm run dev          # Start development server
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for the coffee community**



</div>