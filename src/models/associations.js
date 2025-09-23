// Model Associations - Define relationships between all models
const User = require('./entities/User');
const Category = require('./entities/Category');
const SubCategory = require('./entities/SubCategory');
const Product = require('./entities/Product');
const Comment = require('./entities/Comment');
const Favorite = require('./entities/Favorite');
const Order = require('./entities/Order');
const OrderItem = require('./entities/OrderItem');

// Category -> SubCategory (1:Many)
Category.hasMany(SubCategory, {
  foreignKey: 'category_id',
  as: 'subcategories',
  onDelete: 'CASCADE'
});
SubCategory.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
});

// SubCategory -> Product (1:Many)
SubCategory.hasMany(Product, {
  foreignKey: 'subcategory_id',
  as: 'products',
  onDelete: 'CASCADE'
});
Product.belongsTo(SubCategory, {
  foreignKey: 'subcategory_id',
  as: 'subcategory'
});

// User -> Comment (1:Many)
User.hasMany(Comment, {
  foreignKey: 'user_id',
  as: 'comments',
  onDelete: 'CASCADE'
});
Comment.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Product -> Comment (1:Many)
Product.hasMany(Comment, {
  foreignKey: 'product_id',
  as: 'comments',
  onDelete: 'CASCADE'
});
Comment.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// User -> Favorite (1:Many)
User.hasMany(Favorite, {
  foreignKey: 'user_id',
  as: 'favorites',
  onDelete: 'CASCADE'
});
Favorite.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Product -> Favorite (1:Many)
Product.hasMany(Favorite, {
  foreignKey: 'product_id',
  as: 'favorites',
  onDelete: 'CASCADE'
});
Favorite.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// User -> Order (1:Many)
User.hasMany(Order, {
  foreignKey: 'user_id',
  as: 'orders',
  onDelete: 'CASCADE'
});
Order.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Order -> OrderItem (1:Many)
Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'orderItems',
  onDelete: 'CASCADE'
});
OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order'
});

// Product -> OrderItem (1:Many)
Product.hasMany(OrderItem, {
  foreignKey: 'product_id',
  as: 'order_items'
});
OrderItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// Many-to-Many: User <-> Product (through Favorites)
User.belongsToMany(Product, {
  through: Favorite,
  foreignKey: 'user_id',
  otherKey: 'product_id',
  as: 'favoriteProducts'
});
Product.belongsToMany(User, {
  through: Favorite,
  foreignKey: 'product_id',
  otherKey: 'user_id',
  as: 'favoritedByUsers'
});

module.exports = {
  User,
  Category,
  SubCategory,
  Product,
  Comment,
  Favorite,
  Order,
  OrderItem
};