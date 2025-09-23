const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const OrderItem = sequelize.define("OrderItem", {
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  product_name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Store product name at time of order'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Price per unit at time of order'
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'quantity * unit_price'
  },
  size: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Small, Medium, Large, etc.'
  },
  customizations: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Extra shot, sugar level, milk type, etc.'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Special instructions for this item'
  }
}, {
  timestamps: true,
  tableName: 'order_items',
  indexes: [
    { fields: ['order_id'] },
    { fields: ['product_id'] },
    { fields: ['createdAt'] } // For sales reports
  ]
});

module.exports = OrderItem;