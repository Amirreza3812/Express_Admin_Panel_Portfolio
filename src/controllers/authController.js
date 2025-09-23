const User = require("../models/entities/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ✅ ثبت‌نام ادمین
const registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // بررسی تکراری نبودن ایمیل
    const existingAdmin = await User.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({ message: "ایمیل قبلاً ثبت شده است." });
    }

    // هش کردن رمز عبور
    const hashedPassword = await bcrypt.hash(password, 10);

    // ساخت ادمین جدید
    const newAdmin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin'
    });

    res.status(201).json({
      message: "ادمین با موفقیت ثبت شد",
      admin: { id: newAdmin.id, name: newAdmin.name, email: newAdmin.email },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "خطا در ثبت‌نام" });
  }
};

// ✅ ورود ادمین
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // یافتن ادمین از روی ایمیل
    const admin = await User.findOne({
      where: { email, role: 'admin' }
    });
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
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "ورود موفق",
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "خطا در ورود" });
  }
};

module.exports = { registerAdmin, loginAdmin };
