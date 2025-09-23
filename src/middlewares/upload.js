const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // پوشه‌ای که عکس‌ها توش ذخیره میشن
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // اسم فایل با تاریخ
  },
});

// افزایش محدودیت سایز فایل
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // حداکثر 10 مگابایت
});

module.exports = upload;
