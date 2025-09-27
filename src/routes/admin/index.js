const express = require('express');
const router = express.Router();

// Import all admin route modules
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const categoryRoutes = require('./categoryRoutes');
const subcategoryRoutes = require('./subcategoryRoutes');
const orderRoutes = require('./orderRoutes');
const userRoutes = require('./userRoutes');
const customerRoutes = require('./customerRoutes');
const priceRoutes = require('./priceRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const reportsRoutes = require('./reportsRoutes');

// Admin routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.use('/customers', customerRoutes);
router.use('/prices', priceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);

module.exports = router;