const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Order = sequelize.define("Order", {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  order_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique order identifier for customers'
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  final_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending',
    allowNull: false
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'card', 'digital_wallet', 'bank_transfer'),
    allowNull: true
  },
  order_type: {
    type: DataTypes.ENUM('dine_in', 'takeaway', 'delivery'),
    defaultValue: 'dine_in',
    allowNull: false
  },
  table_number: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'For dine-in orders'
  },
  customer_name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'For guest orders'
  },
  customer_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Special instructions'
  },
  estimated_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Preparation time in minutes'
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'orders',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['order_number'] },
    { fields: ['status'] },
    { fields: ['payment_status'] },
    { fields: ['order_type'] },
    { fields: ['createdAt'] }, // For monthly reports
    { fields: ['completed_at'] }
  ]
});

module.exports = Order;