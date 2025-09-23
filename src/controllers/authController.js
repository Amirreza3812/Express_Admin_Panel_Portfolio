const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ✅ ثبت‌نام ادمین
const registerAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    // بررسی تکراری نبودن نام کاربری
    const existingAdmin = await Admin.findOne({ where: { username } });
    if (existingAdmin) {
      return res.status(400).json({ message: "نام کاربری قبلاً ثبت شده است." });
    }

    // هش کردن رمز عبور
    const hashedPassword = await bcrypt.hash(password, 10);

    // ساخت ادمین جدید
    const newAdmin = await Admin.create({
      username,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "ادمین با موفقیت ثبت شد",
      admin: { id: newAdmin.id, username: newAdmin.username },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "خطا در ثبت‌نام" });
  }
};

// ✅ ورود ادمین
const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    // یافتن ادمین از روی نام کاربری
    const admin = await Admin.findOne({ where: { username } });
    if (!admin) {
      return res.status(404).json({ message: "ادمین یافت نشد" });
    }

    // بررسی صحت رمز عبور
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "رمز عبور اشتباه است" });
    }

    // تولید توکن
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "ورود موفق",
      token,
      admin: { id: admin.id, username: admin.username },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "خطا در ورود" });
  }
};

module.exports = { registerAdmin, loginAdmin };
