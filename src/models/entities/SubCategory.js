const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const SubCategory = sequelize.define("SubCategory", {
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
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
    comment: 'SubCategory image URL'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    allowNull: false
  },
}, {
  timestamps: true,
  tableName: 'subcategories',
  indexes: [
    { fields: ['category_id'] },
    { fields: ['status'] },
    { unique: true, fields: ['category_id', 'name'] }
  ]
});

module.exports = SubCategory;