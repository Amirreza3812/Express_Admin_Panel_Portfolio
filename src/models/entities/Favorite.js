const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Favorite = sequelize.define("Favorite", {
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
  }
}, {
  timestamps: true,
  tableName: 'favorites',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['product_id'] },
    { unique: true, fields: ['user_id', 'product_id'] } // Prevent duplicate favorites
  ]
});

module.exports = Favorite;