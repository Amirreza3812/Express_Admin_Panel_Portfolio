// فایل: controllers/adminController.js
const User = require("../models/entities/User");
const bcrypt = require("bcrypt");

// GET /api/admins
const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { role: 'admin' },
      attributes: ["id", "name", "email"]
    });
    res.json(admins);
  } catch (error) {
    console.error("Get Admins Error:", error);
    res.status(500).json({ message: "خطا در دریافت ادمین‌ها" });
  }
};

// DELETE /api/admins/:id
const deleteAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await User.destroy({ where: { id, role: 'admin' } });
    if (!deleted) return res.status(404).json({ message: "ادمین پیدا نشد" });
    res.json({ message: "ادمین حذف شد" });
  } catch (error) {
    console.error("Delete Admin Error:", error);
    res.status(500).json({ message: "خطا در حذف ادمین" });
  }
};

// PATCH /api/admins/:id/password
const changeAdminPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await User.update(
      { password: hashedPassword },
      { where: { id, role: 'admin' } }
    );

    if (!updated[0]) return res.status(404).json({ message: "ادمین پیدا نشد" });

    res.json({ message: "رمز عبور با موفقیت تغییر کرد" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "خطا در تغییر رمز عبور" });
  }
};

module.exports = {
  getAllAdmins,
  deleteAdmin,
  changeAdminPassword,
};
