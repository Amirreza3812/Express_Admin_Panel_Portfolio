const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Category = sequelize.define("Category", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 50]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Category image URL'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'categories',
  indexes: [
    { unique: true, fields: ['name'] },
    { fields: ['status'] }
  ]
});

module.exports = Category;