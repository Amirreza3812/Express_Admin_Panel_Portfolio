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
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Hashed password reset token'
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Password reset token expiration time'
  }
}, {
  timestamps: true,
  tableName: 'users',
  indexes: [
    { unique: true, fields: ['email'] },
    { fields: ['role'] }
  ]
});

module.exports = User;