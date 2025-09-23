// فایل: controllers/adminController.js
const Project = require("../models/entities/Project");
const Admin = require("../models/entities/Admin");
const bcrypt = require("bcrypt");

// 👉 ساخت پروژه جدید
const createProject = async (req, res) => {
  try {
    const { title, description, githubLink, projectLink } = req.body;

    // اگر فایلی آپلود شده، مسیرشو بردار، در غیر این صورت مقدار null بده یا یه مقدار پیش‌فرض
    let imageUrl = `${req.protocol}://${req.get("host")}/uploads/Cube.svg`;
    // let imageUrl = null;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
        req.file.filename
      }`;
    }

    const newProject = await Project.create({
      title,
      description,
      githubLink,
      projectLink,
      imageUrl,
    });

    res.status(201).json(newProject);
  } catch (err) {
    console.error("Project Creation Error:", err);
    res.status(500).json({ error: "خطا در ساخت پروژه" });
  }
};

// گرفتن پروژه بر اساس id
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({ error: "پروژه پیدا نشد" });
    }

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطا در دریافت پروژه" });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, githubLink, projectLink } = req.body;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({ error: "پروژه پیدا نشد" });
    }
    // اگر تصویر جدید ارسال شده بود
    let imageUrl = project.imageUrl;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
        req.file.filename
      }`;
    }

    // بروزرسانی پروژه
    project.title = title || project.title;
    project.description = description || project.description;
    project.githubLink = githubLink || project.githubLink;
    project.projectLink = projectLink || project.projectLink;
    project.imageUrl = imageUrl;

    await project.save();
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطا در بروزرسانی پروژه" });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: "پروژه پیدا نشد" });
    }

    await project.destroy();
    res.json({ message: "پروژه با موفقیت حذف شد" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطا در حذف پروژه" });
  }
};

// GET /api/admins
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.findAll({ attributes: ["id", "username"] });
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
    const deleted = await Admin.destroy({ where: { id } });
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
    const updated = await Admin.update(
      { password: hashedPassword },
      { where: { id } }
    );

    if (!updated[0]) return res.status(404).json({ message: "ادمین پیدا نشد" });

    res.json({ message: "رمز عبور با موفقیت تغییر کرد" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "خطا در تغییر رمز عبور" });
  }
};

module.exports = {
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  getAllAdmins,
  deleteAdmin,
  changeAdminPassword,
};
