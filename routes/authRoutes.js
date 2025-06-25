const express = require("express");
const router = express.Router();
const { registerAdmin, loginAdmin } = require("../controllers/authController");

router.post("/register", registerAdmin);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: تعریف ادمین
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       400:
 *         description: نام کاربری قبلا ثبت شده است.
 *       201:
 *         description: ادمین با موفقیت ثبت شد
 *       500:
 *         description: خطا در سرور
 */

router.post("/login", loginAdmin);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: ورود ادمین
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: موفقیت آمیز، توکن برمی‌گردد
 *       401:
 *         description: نام کاربری یا رمز عبور اشتباه
 */

module.exports = router;
