const Project = require("../models/Project");

// گرفتن همه پروژه‌ها
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll();
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "خطا در گرفتن پروژه‌ها", error });
  }
};

// DELETE /api/projects/all
const deleteAllProjects = async (req, res) => {
  try {
    await Project.destroy({ where: {} }); // حذف همه رکوردها
    res.json({ message: "همه پروژه‌ها پاک شدند" });
  } catch (error) {
    console.error("Delete All Error:", error);
    res.status(500).json({ message: "خطا در پاک کردن پروژه‌ها" });
  }
};

module.exports = {
  getAllProjects,
  deleteAllProjects,
};
