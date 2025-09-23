const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Comment = sequelize.define("Comment", {
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
  comment: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [5, 1000]
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  admin_reply: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Admin response to the comment'
  },
  helpful_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'How many users found this helpful'
  }
}, {
  timestamps: true,
  tableName: 'comments',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['product_id'] },
    { fields: ['status'] },
    { fields: ['rating'] },
    { unique: true, fields: ['user_id', 'product_id'] } // One review per user per product
  ]
});

module.exports = Comment;