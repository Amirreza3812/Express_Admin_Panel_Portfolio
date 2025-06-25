const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Project = sequelize.define("Project", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING, // URL یا نام فایل عکس
    allowNull: true,
  },
  githubLink: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  projectLink: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Project;
