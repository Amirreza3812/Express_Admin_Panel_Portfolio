const express = require("express");
const router = express.Router();
const {
  getAllAdmins,
  deleteAdmin,
  changeAdminPassword,
} = require("../controllers/adminController");

const authenticate = require("../middlewares/authMiddleware");

// گرفتن همه ادمین‌ها
router.get("/", authenticate, getAllAdmins);

// حذف ادمین خاص
router.delete("/:id", authenticate, deleteAdmin);

// تغییر رمز عبور ادمین
router.patch("/:id/password", authenticate, changeAdminPassword);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: مدیریت ادمین‌ها
 */

/**
 * @swagger
 * /api/admins:
 *   get:
 *     summary: دریافت لیست ادمین‌ها
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: لیست همه ادمین‌ها
 *       500:
 *         description: خطا در سرور
 */

/**
 * @swagger
 * /api/admins/{id}:
 *   delete:
 *     summary: حذف یک ادمین
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: آیدی ادمین برای حذف
 *     responses:
 *       200:
 *         description: ادمین حذف شد
 *       404:
 *         description: ادمین پیدا نشد
 *       500:
 *         description: خطا در سرور
 */

/**
 * @swagger
 * /api/admins/{id}/password:
 *   patch:
 *     summary: تغییر رمز عبور ادمین
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: آیدی ادمین
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: رمز عبور با موفقیت تغییر کرد
 *       404:
 *         description: ادمین پیدا نشد
 *       500:
 *         description: خطا در سرور
 */

module.exports = router;
