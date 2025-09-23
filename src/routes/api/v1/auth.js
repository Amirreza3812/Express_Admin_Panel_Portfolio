const express = require('express');
const authController = require('../../../controllers/api/v1/authController');
const { protect } = require('../../../middlewares/auth');
const {
  validateUserRegistration,
  validateUserLogin
} = require('../../../middlewares/validation');

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register new customer account
 *     description: Create a new customer account with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "John Doe"
 *                 description: Full name of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *                 description: Valid email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "Password123"
 *                 description: Password (min 6 chars, must contain uppercase, lowercase, and number)
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *                 description: Phone number (optional)
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                         token:
 *                           type: string
 *                           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                           description: JWT authentication token
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', validateUserRegistration, authController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login to customer account
 *     description: Authenticate user and return JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 example: "Password123"
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
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
 *                         token:
 *                           type: string
 *                           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                           description: JWT authentication token
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials or account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', validateUserLogin, authController.login);

/**
 * @swagger
 * /api/v1/auth/forgotPassword:
 *   post:
 *     summary: Request password reset
 *     description: Send password reset email (placeholder endpoint)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: Password reset instructions sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/forgotPassword', authController.forgotPassword);

// Protected routes (require authentication)
router.use(protect); // All routes after this middleware are protected

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', authController.getMe);

/**
 * @swagger
 * /api/v1/auth/me:
 *   put:
 *     summary: Update user profile
 *     description: Update authenticated user's profile information (name, phone)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "John Smith"
 *                 description: Updated full name
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *                 description: Updated phone number
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or password fields not allowed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/me', authController.updateMe);

/**
 * @swagger
 * /api/v1/auth/updatePassword:
 *   put:
 *     summary: Update user password
 *     description: Change authenticated user's password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "CurrentPassword123"
 *                 description: User's current password
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewPassword456"
 *                 description: New password (min 6 chars, must contain uppercase, lowercase, and number)
 *     responses:
 *       200:
 *         description: Password updated successfully
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
 *                         token:
 *                           type: string
 *                           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                           description: New JWT authentication token
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       401:
 *         description: Current password incorrect or authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/updatePassword', authController.updatePassword);

module.exports = router;