const express = require("express");
const router = express.Router();
const {
  getAllProjects,
  deleteAllProjects,
} = require("../controllers/projectController");
const authenticate = require("../middlewares/authMiddleware");

// GET /api/projects → نمایش همه پروژه‌ها
router.get("/", getAllProjects);
/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: گرفتن تمام پروژه ها
 *     tags: [Get All Projects(Public)]
 *     responses:
 *       500:
 *         description: خطا در گرفتن پروژه ها
 *       200:
 *         description: پروژه هار با موفقیت گرفتی
 */

router.delete("/all", authenticate, deleteAllProjects);

/**
 * @swagger
 * /api/projects/all:
 *   delete:
 *     summary: حذف تمام پروژه‌ها
 *     tags: [Admin Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: همه پروژه‌ها حذف شدند
 *       401:
 *         description: نیاز به احراز هویت
 *       500:
 *         description: خطا در سرور
 */

module.exports = router;
