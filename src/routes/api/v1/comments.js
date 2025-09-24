const express = require('express');
const router = express.Router();
const {
  getProductComments,
  createComment,
  updateComment,
  deleteComment,
  markCommentHelpful,
  getUserComments
} = require('../../../controllers/api/v1/public/commentController');

const { protect: authenticate } = require('../../../middlewares/auth');
const { validateComment } = require('../../../middlewares/validation');

/**
 * @swagger
 * /api/v1/comments/products/{productId}:
 *   get:
 *     summary: Get all comments for a product
 *     description: Retrieve all approved comments/reviews for a specific product with pagination and filtering
 *     tags: [Comments & Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *         example: 1
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
 *           default: 10
 *         description: Number of comments per page
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by rating
 *         example: 5
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, oldest, rating_high, rating_low, helpful]
 *           default: newest
 *         description: Sort comments by criteria
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
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
 *                         comments:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Comment'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             total: { type: integer }
 *                             page: { type: integer }
 *                             pages: { type: integer }
 *                             limit: { type: integer }
 *                         statistics:
 *                           type: object
 *                           properties:
 *                             totalReviews: { type: integer, example: 127 }
 *                             averageRating: { type: number, example: 4.5 }
 *                             ratingDistribution:
 *                               type: object
 *                               properties:
 *                                 "5": { type: integer, example: 65 }
 *                                 "4": { type: integer, example: 35 }
 *                                 "3": { type: integer, example: 15 }
 *                                 "2": { type: integer, example: 8 }
 *                                 "1": { type: integer, example: 4 }
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/products/:productId', getProductComments);

/**
 * @swagger
 * /api/v1/comments/products/{productId}:
 *   post:
 *     summary: Create a new comment/review
 *     description: Submit a review for a product (requires authentication)
 *     tags: [Comments & Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *               - rating
 *             properties:
 *               comment:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: Review comment text
 *                 example: "Amazing coffee! Perfect for morning energy boost. Great taste and quality."
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5 stars
 *                 example: 5
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request (already reviewed or validation error)
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
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/products/:productId', authenticate, validateComment, createComment);

/**
 * @swagger
 * /api/v1/comments/{commentId}:
 *   put:
 *     summary: Update a comment/review
 *     description: Update your own comment/review (requires authentication)
 *     tags: [Comments & Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: Updated review comment text
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Updated rating from 1 to 5 stars
 *     responses:
 *       200:
 *         description: Review updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Comment'
 *       403:
 *         description: Forbidden - can only edit your own reviews
 *       404:
 *         description: Comment not found
 */
router.put('/:commentId', authenticate, validateComment, updateComment);

/**
 * @swagger
 * /api/v1/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment/review
 *     description: Delete your own comment/review (requires authentication)
 *     tags: [Comments & Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         description: Forbidden - can only delete your own reviews
 *       404:
 *         description: Comment not found
 */
router.delete('/:commentId', authenticate, deleteComment);

/**
 * @swagger
 * /api/v1/comments/{commentId}/helpful:
 *   post:
 *     summary: Mark comment as helpful
 *     description: Mark a comment/review as helpful (increases helpful count)
 *     tags: [Comments & Reviews]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Comment marked as helpful
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
 *                         helpful_count:
 *                           type: integer
 *                           example: 13
 *       404:
 *         description: Comment not found
 */
router.post('/:commentId/helpful', markCommentHelpful);

/**
 * @swagger
 * /api/v1/comments/my-reviews:
 *   get:
 *     summary: Get user's comments/reviews
 *     description: Retrieve all comments/reviews submitted by the authenticated user
 *     tags: [Comments & Reviews]
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
 *           default: 10
 *         description: Number of comments per page
 *     responses:
 *       200:
 *         description: User's reviews retrieved successfully
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
 *                         comments:
 *                           type: array
 *                           items:
 *                             allOf:
 *                               - $ref: '#/components/schemas/Comment'
 *                               - type: object
 *                                 properties:
 *                                   product:
 *                                     type: object
 *                                     properties:
 *                                       id: { type: integer }
 *                                       name: { type: string }
 *                                       image: { type: string }
 *                                       slug: { type: string }
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             total: { type: integer }
 *                             page: { type: integer }
 *                             pages: { type: integer }
 *                             limit: { type: integer }
 *       401:
 *         description: Unauthorized - authentication required
 */
router.get('/my-reviews', authenticate, getUserComments);

module.exports = router;