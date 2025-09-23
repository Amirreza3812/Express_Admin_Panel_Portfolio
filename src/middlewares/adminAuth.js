const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/entities/User');

// Verify JWT token and check if user is authenticated
const authenticate = catchAsync(async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'role', 'status']
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid. User not found.'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active. Please contact administrator.'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token is not valid.'
    });
  }
});

// Check if user has admin role
const requireAdmin = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }

  next();
});

// Flexible role checker - can accept multiple roles
const requireRole = (...roles) => {
  return catchAsync(async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  });
};

// Check if user owns the resource or is admin
const requireOwnershipOrAdmin = (resourceUserIdField = 'user_id') => {
  return catchAsync(async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check ownership - user ID from URL params
    const resourceUserId = req.params.userId || req.params.id;
    if (resourceUserId && req.user.id.toString() === resourceUserId.toString()) {
      return next();
    }

    // Check ownership - user ID from request body
    if (req.body[resourceUserIdField] && req.user.id.toString() === req.body[resourceUserIdField].toString()) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  });
};

// Rate limiting for admin actions
const adminRateLimit = catchAsync(async (req, res, next) => {
  // This is a basic implementation - in production, use Redis or similar
  const key = `admin_rate_limit:${req.user.id}`;
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // Max 100 admin actions per 15 minutes

  // In a real app, you'd store this in Redis or similar
  // For now, we'll just continue
  next();
});

// Log admin actions for audit trail
const auditLog = (action) => {
  return catchAsync(async (req, res, next) => {
    // Log admin action
    console.log(`[AUDIT] Admin ${req.user.id} (${req.user.email}) performed action: ${action}`, {
      timestamp: new Date().toISOString(),
      userId: req.user.id,
      userEmail: req.user.email,
      action,
      resource: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.method !== 'GET' ? req.body : undefined
    });

    next();
  });
};

// Combine auth + admin + audit for easy use
const adminOnly = [authenticate, requireAdmin];
const adminWithAudit = (action) => [authenticate, requireAdmin, auditLog(action)];

module.exports = {
  authenticate,
  requireAdmin,
  requireRole,
  requireOwnershipOrAdmin,
  adminRateLimit,
  auditLog,
  adminOnly,
  adminWithAudit
};