const jwt = require('jsonwebtoken');
const { User } = require('../models/associations');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Protect routes - require authentication
const protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // 2) Verification token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findByPk(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  // 4) Check if user is active
  if (currentUser.status !== 'active') {
    return next(new AppError('Your account has been deactivated. Please contact support.', 401));
  }

  // 5) Check if token version is still valid (token invalidation)
  if (decoded.tokenVersion !== currentUser.token_version) {
    return next(new AppError('Your session has been invalidated. Please log in again.', 401));
  }

  // Grant access to protected route
  req.user = currentUser;
  next();
});

// Restrict to certain roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

// Optional authentication (for routes that work with/without login)
const optionalAuth = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentUser = await User.findByPk(decoded.id);

      if (currentUser &&
          currentUser.status === 'active' &&
          decoded.tokenVersion === currentUser.token_version) {
        req.user = currentUser;
      } else {
        req.user = null;
      }
    } catch (error) {
      // Token invalid, but that's okay for optional auth
      req.user = null;
    }
  }

  next();
});

module.exports = {
  protect,
  restrictTo,
  optionalAuth
};