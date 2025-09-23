const express = require('express');
const categoryController = require('../../../controllers/api/v1/public/categoryController');
const productController = require('../../../controllers/api/v1/public/productController');

const router = express.Router();

/**
 * @swagger
 * /api/v1/public/categories:
 *   get:
 *     summary: Get all active categories
 *     description: Retrieve all active categories with their subcategories and featured products
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/categories', categoryController.getAllCategories);

/**
 * @swagger
 * /api/v1/public/categories/stats:
 *   get:
 *     summary: Get category statistics
 *     description: Retrieve statistics for all categories including product counts
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Category statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/categories/stats', categoryController.getCategoryStats);

/**
 * @swagger
 * /api/v1/public/categories/{identifier}:
 *   get:
 *     summary: Get single category
 *     description: Retrieve a specific category by ID or slug with all its subcategories and products
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           oneOf:
 *             - type: integer
 *               description: Category ID
 *             - type: string
 *               description: Category slug
 *         examples:
 *           byId:
 *             value: 1
 *             summary: Get by ID
 *           bySlug:
 *             value: "coffee"
 *             summary: Get by slug
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/categories/:identifier', categoryController.getCategory);

/**
 * @swagger
 * /api/v1/public/products:
 *   get:
 *     summary: Get all products with filtering and pagination
 *     description: Retrieve products with optional filtering, search, and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 12
 *         description: Number of products per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category slug
 *         example: coffee
 *       - in: query
 *         name: subcategory
 *         schema:
 *           type: string
 *         description: Filter by subcategory slug
 *         example: hot-coffee
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *         example: 2.00
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *         example: 10.00
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         description: Minimum rating filter
 *         example: 4.0
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in product name and description
 *         example: espresso
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter featured products only
 *         example: true
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price_low, price_high, rating, newest, popular]
 *         description: Sort products by criteria
 *         example: price_low
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 */
router.get('/products', productController.getAllProducts);

/**
 * @swagger
 * /api/v1/public/products/featured:
 *   get:
 *     summary: Get featured products
 *     description: Retrieve featured products for homepage or promotional displays
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 8
 *         description: Number of featured products to return
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 */
router.get('/products/featured', productController.getFeaturedProducts);

/**
 * @swagger
 * /api/v1/public/products/{identifier}:
 *   get:
 *     summary: Get single product
 *     description: Retrieve detailed information about a specific product including reviews
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           oneOf:
 *             - type: integer
 *               description: Product ID
 *             - type: string
 *               description: Product slug
 *         examples:
 *           byId:
 *             value: 1
 *             summary: Get by ID
 *           bySlug:
 *             value: "espresso"
 *             summary: Get by slug
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/products/:identifier', productController.getProduct);

/**
 * @swagger
 * /api/v1/public/products/{id}/related:
 *   get:
 *     summary: Get related products
 *     description: Retrieve products related to a specific product (same subcategory)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           default: 6
 *         description: Number of related products to return
 *     responses:
 *       200:
 *         description: Related products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/products/:id/related', productController.getRelatedProducts);

module.exports = router;