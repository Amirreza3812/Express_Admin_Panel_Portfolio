const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Product = sequelize.define("Product", {
  subcategory_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'subcategories',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  cost_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Cost for profit calculation'
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Product image URL'
  },
  gallery: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional product images'
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  min_stock: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    comment: 'Low stock alert threshold'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'out_of_stock'),
    defaultValue: 'active',
    allowNull: false
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Show in featured products'
  },
  preparation_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Preparation time in minutes'
  },
  ingredients: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Product ingredients list'
  },
  calories: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  allergens: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'List of allergens'
  },
  sizes: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Available sizes with prices'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 5
    }
  },
  total_reviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
}, {
  timestamps: true,
  tableName: 'products',
  indexes: [
    { fields: ['subcategory_id'] },
    { fields: ['status'] },
    { fields: ['is_featured'] },
    { unique: true, fields: ['name'] }
  ]
});

module.exports = Product;