const express = require('express');
const router = express.Router();
const {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavoriteStatus,
  getFavoritesCount,
  clearAllFavorites,
  getFavoritesByCategory,
  getRecentFavorites
} = require('../../../controllers/api/v1/public/favoriteController');

const { protect: authenticate } = require('../../../middlewares/auth');

/**
 * @swagger
 * /api/v1/favorites:
 *   get:
 *     summary: Get user's favorite products
 *     description: Retrieve all favorite products for the authenticated user with pagination and filtering
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Favorite products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         products:
 *                           type: array
 *                           items:
 *                             allOf:
 *                               - $ref: '#/components/schemas/Product'
 *                               - type: object
 *                                 properties:
 *                                   favoriteId:
 *                                     type: integer
 *                                     example: 123
 *                                   addedToFavoritesAt:
 *                                     type: string
 *                                     format: date-time
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             total: { type: integer }
 *                             page: { type: integer }
 *                             pages: { type: integer }
 *                             limit: { type: integer }
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', authenticate, getUserFavorites);

/**
 * @swagger
 * /api/v1/favorites/{productId}:
 *   post:
 *     summary: Add product to favorites
 *     description: Add a product to the authenticated user's favorites/wishlist
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID to add to favorites
 *         example: 1
 *     responses:
 *       201:
 *         description: Product added to favorites successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         user_id: { type: integer }
 *                         product_id: { type: integer }
 *                         createdAt: { type: string, format: date-time }
 *                         product: { $ref: '#/components/schemas/Product' }
 *       400:
 *         description: Product already in favorites
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found or not available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:productId', authenticate, addToFavorites);

/**
 * @swagger
 * /api/v1/favorites/{productId}:
 *   delete:
 *     summary: Remove product from favorites
 *     description: Remove a product from the authenticated user's favorites/wishlist
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID to remove from favorites
 *         example: 1
 *     responses:
 *       200:
 *         description: Product removed from favorites successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found in favorites
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:productId', authenticate, removeFromFavorites);

/**
 * @swagger
 * /api/v1/favorites/{productId}/status:
 *   get:
 *     summary: Check if product is in favorites
 *     description: Check whether a specific product is in the authenticated user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID to check
 *         example: 1
 *     responses:
 *       200:
 *         description: Favorite status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         isFavorite:
 *                           type: boolean
 *                           example: true
 *                         favoriteId:
 *                           type: integer
 *                           nullable: true
 *                           example: 123
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:productId/status', authenticate, checkFavoriteStatus);

/**
 * @swagger
 * /api/v1/favorites/count:
 *   get:
 *     summary: Get favorites count
 *     description: Get the total number of products in the authenticated user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorites count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                           example: 8
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/count', authenticate, getFavoritesCount);

/**
 * @swagger
 * /api/v1/favorites/clear:
 *   delete:
 *     summary: Clear all favorites
 *     description: Remove all products from the authenticated user's favorites/wishlist
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All favorites cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         deletedCount:
 *                           type: integer
 *                           example: 8
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/clear', authenticate, clearAllFavorites);

/**
 * @swagger
 * /api/v1/favorites/by-category:
 *   get:
 *     summary: Get favorites grouped by category
 *     description: Retrieve favorite products organized by category
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorites grouped by category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         favoritesByCategory:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               category:
 *                                 type: object
 *                                 properties:
 *                                   id: { type: integer }
 *                                   name: { type: string }
 *                                   slug: { type: string }
 *                               products:
 *                                 type: array
 *                                 items:
 *                                   $ref: '#/components/schemas/Product'
 *                         totalFavorites:
 *                           type: integer
 *                           example: 8
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/by-category', authenticate, getFavoritesByCategory);

/**
 * @swagger
 * /api/v1/favorites/recent:
 *   get:
 *     summary: Get recently added favorites
 *     description: Retrieve the most recently added favorite products
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Number of recent favorites to return
 *     responses:
 *       200:
 *         description: Recent favorites retrieved successfully
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
 *                         allOf:
 *                           - type: object
 *                             properties:
 *                               id: { type: integer }
 *                               name: { type: string }
 *                               price: { type: number }
 *                               image: { type: string }
 *                               slug: { type: string }
 *                               rating: { type: number }
 *                               favoriteId: { type: integer }
 *                               addedToFavoritesAt: { type: string, format: date-time }
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/recent', authenticate, getRecentFavorites);

module.exports = router;