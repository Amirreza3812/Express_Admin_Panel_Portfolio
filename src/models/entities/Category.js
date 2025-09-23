const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Category = sequelize.define("Category", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
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
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Display order in frontend'
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'URL friendly name'
  }
}, {
  timestamps: true,
  tableName: 'categories',
  indexes: [
    { fields: ['status'] },
    { fields: ['sort_order'] },
    { fields: ['slug'] }
  ]
});

module.exports = Category;