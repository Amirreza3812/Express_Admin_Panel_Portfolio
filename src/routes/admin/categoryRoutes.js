const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../../controllers/api/admin/categoryController');

const { adminWithAudit } = require('../../middlewares/adminAuth');
const { validateCategory } = require('../../middlewares/validation');
const upload = require('../../middlewares/upload');

/**
 * @swagger
 * /api/v1/admin/categories:
 *   get:
 *     summary: Get all categories (Admin)
 *     description: Retrieve all categories with subcategories and product counts for admin management
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/',
  ...adminWithAudit('VIEW_CATEGORIES'),
  getAllCategories
);

/**
 * @swagger
 * /api/v1/admin/categories/{id}:
 *   get:
 *     summary: Get single category (Admin)
 *     description: Retrieve a specific category with all details for admin management
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *         example: 1
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
router.get('/:id',
  ...adminWithAudit('VIEW_CATEGORY'),
  getCategory
);

/**
 * @swagger
 * /api/v1/admin/categories:
 *   post:
 *     summary: Create new category (Admin)
 *     description: Create a new product category with image upload
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Coffee"
 *               description:
 *                 type: string
 *                 example: "Various coffee drinks and beverages"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Category image file
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/',
  ...adminWithAudit('CREATE_CATEGORY'),
  upload.single('image'),
  validateCategory,
  createCategory
);

/**
 * @swagger
 * /api/v1/admin/categories/{id}:
 *   put:
 *     summary: Update category (Admin)
 *     description: Update an existing category with optional image upload
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Coffee"
 *               description:
 *                 type: string
 *                 example: "Updated description for coffee category"
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: "active"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New category image file (optional)
 *     responses:
 *       200:
 *         description: Category updated successfully
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
router.put('/:id',
  ...adminWithAudit('UPDATE_CATEGORY'),
  upload.single('image'),
  validateCategory,
  updateCategory
);

/**
 * @swagger
 * /api/v1/admin/categories/{id}:
 *   delete:
 *     summary: Delete category (Admin)
 *     description: Delete a category if it has no subcategories
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Cannot delete category with existing subcategories
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id',
  ...adminWithAudit('DELETE_CATEGORY'),
  deleteCategory
);


module.exports = router;