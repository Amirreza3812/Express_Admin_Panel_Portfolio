const express = require("express");
const router = express.Router();
const {
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/adminController");

const {
  projectValidationRules,
  validateProject,
} = require("../middlewares/validateProject");
const authenticate = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

router.post(
  "/",
  authenticate,
  upload.single("image"), // این اضافه میشه
  [...projectValidationRules, validateProject],
  createProject
);
router.put(
  "/:id",
  authenticate,
  upload.single("image"), // این اضافه میشه
  [...projectValidationRules, validateProject],
  updateProject
);
router.delete("/:id", authenticate, deleteProject);
router.get("/:id", authenticate, getProjectById);

/**
 * @swagger
 * tags:
 *   name: Admin Projects
 *   description: عملیات مربوط به مدیریت پروژه‌ها توسط ادمین
 */

/**
 * @swagger
 * /api/admin/projects:
 *   post:
 *     summary: ایجاد یک پروژه جدید
 *     tags: [Admin Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 description: عنوان پروژه
 *               description:
 *                 type: string
 *                 description: توضیحات پروژه
 *               githubLink:
 *                 type: string
 *                 format: uri
 *                 description: لینک گیت‌هاب (اختیاری)
 *               projectLink:
 *                 type: string
 *                 format: uri
 *                 description: لینک اجرای پروژه (اختیاری)
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: تصویر پروژه (فایل)
 *     responses:
 *       201:
 *         description: پروژه با موفقیت ایجاد شد
 *       400:
 *         description: اطلاعات ارسالی نادرست است
 *       401:
 *         description: عدم احراز هویت
 *       500:
 *         description: خطای داخلی سرور
 */

/**
 * @swagger
 * /api/admin/projects/{id}:
 *   delete:
 *     summary: حذف یک پروژه با شناسه
 *     tags: [Admin Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: شناسه پروژه‌ای که باید حذف شود
 *     responses:
 *       200:
 *         description: پروژه با موفقیت حذف شد
 *       404:
 *         description: پروژه پیدا نشد
 *       500:
 *         description: خطای سرور
 */

/**
 * @swagger
 * /api/admin/projects/{id}:
 *   get:
 *     summary: دریافت یک پروژه‌ (ادمین)
 *     tags: [Admin Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: لیست پروژه‌ها دریافت شد
 *       401:
 *         description: دسترسی غیرمجاز
 *       500:
 *         description: خطای سرور
 */

/**
 * @swagger
 * /api/admin/projects/{id}:
 *   put:
 *     summary: ادیت اطلاعات پروژه
 *     tags: [Admin Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 description: عنوان پروژه
 *               description:
 *                 type: string
 *                 description: توضیحات پروژه
 *               githubLink:
 *                 type: string
 *                 format: uri
 *                 description: لینک گیت‌هاب (اختیاری)
 *               projectLink:
 *                 type: string
 *                 format: uri
 *                 description: لینک اجرای پروژه (اختیاری)
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: تصویر پروژه (فایل)
 *     responses:
 *       200:
 *         description: پروژه با موفقیت به‌روزرسانی شد
 *       404:
 *         description: پروژه یافت نشد
 *       500:
 *         description: خطای سرور
 */

module.exports = router;
