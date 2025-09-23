const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const User = sequelize.define("User", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 50]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100]
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [10, 15]
    }
  },
  role: {
    type: DataTypes.ENUM('customer', 'admin', 'super_admin'),
    defaultValue: 'customer',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'banned'),
    defaultValue: 'active',
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Profile picture URL'
  },
  email_verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  token_version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
    comment: 'Incremented on password change to invalidate old tokens'
  }
}, {
  timestamps: true,
  tableName: 'users',
  indexes: [
    { fields: ['email'] },
    { fields: ['role'] },
    { fields: ['status'] }
  ]
});

module.exports = User;