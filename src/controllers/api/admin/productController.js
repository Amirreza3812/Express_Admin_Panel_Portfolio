const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const Product = require('../../../models/entities/Product');
const Category = require('../../../models/entities/Category');
const SubCategory = require('../../../models/entities/SubCategory');

// Get all products with filtering and pagination
const getAllProducts = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, category, subcategory, status } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;

  const include = [
    {
      model: SubCategory,
      as: 'subcategory',
      include: [{ model: Category, as: 'category' }]
    }
  ];

  if (category) {
    include[0].include[0].where = { id: category };
  }
  if (subcategory) {
    include[0].where = { id: subcategory };
  }

  const { count, rows: products } = await Product.findAndCountAll({
    where,
    include,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    }
  });
});

// Get single product
const getProduct = catchAsync(async (req, res) => {
  const product = await Product.findByPk(req.params.id, {
    include: [
      {
        model: SubCategory,
        as: 'subcategory',
        include: [{ model: Category, as: 'category' }]
      }
    ]
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  res.json({
    success: true,
    data: product
  });
});

// Create new product
const createProduct = catchAsync(async (req, res) => {
  const {
    subcategory_id,
    name,
    price,
    description,
    ingredients,
    stock
  } = req.body;

  // Check if subcategory exists
  const subcategory = await SubCategory.findByPk(subcategory_id);
  if (!subcategory) {
    return res.status(400).json({
      success: false,
      message: 'Invalid subcategory ID'
    });
  }

  // Handle image upload
  let image = null;
  if (req.file) {
    image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  const product = await Product.create({
    subcategory_id,
    name,
    price,
    description,
    image,
    ingredients,
    stock: stock || 0,
    status: 'active'
  });

  const newProduct = await Product.findByPk(product.id, {
    include: [
      {
        model: SubCategory,
        as: 'subcategory',
        include: [{ model: Category, as: 'category' }]
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: newProduct
  });
});

// Update product
const updateProduct = catchAsync(async (req, res) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  const {
    subcategory_id,
    name,
    price,
    description,
    ingredients,
    stock,
    status
  } = req.body;

  // Handle image upload
  let image = product.image;
  if (req.file) {
    image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  await product.update({
    subcategory_id: subcategory_id || product.subcategory_id,
    name: name || product.name,
    price: price || product.price,
    description: description || product.description,
    image,
    ingredients: ingredients || product.ingredients,
    stock: stock !== undefined ? stock : product.stock,
    status: status || product.status
  });

  const updatedProduct = await Product.findByPk(product.id, {
    include: [
      {
        model: SubCategory,
        as: 'subcategory',
        include: [{ model: Category, as: 'category' }]
      }
    ]
  });

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: updatedProduct
  });
});

// Delete product
const deleteProduct = catchAsync(async (req, res) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  await product.destroy();

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// Toggle product status
const toggleProductStatus = catchAsync(async (req, res) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  const newStatus = product.status === 'active' ? 'inactive' : 'active';
  await product.update({ status: newStatus });

  res.json({
    success: true,
    message: `Product ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
    data: { status: newStatus }
  });
});

module.exports = {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus
};