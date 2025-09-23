const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../../models/associations');
const ApiResponse = require('../../../utils/apiResponse');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

// Generate JWT Token
const signToken = (id, tokenVersion) => {
  return jwt.sign(
    {
      id,
      tokenVersion: tokenVersion || 1
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

// Send token response
const createSendToken = (user, statusCode, res, message) => {
  const token = signToken(user.id, user.token_version);

  // Remove password from output
  user.password = undefined;

  ApiResponse.success(
    res,
    {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatar: user.avatar
      }
    },
    message,
    statusCode
  );
};

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = catchAsync(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    role: 'customer',
    status: 'active'
  });

  createSendToken(newUser, 201, res, 'User registered successfully');
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Check if user exists and password is correct
  const user = await User.findOne({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // Check if user is active
  if (user.status !== 'active') {
    return next(new AppError('Your account has been deactivated. Please contact support.', 401));
  }

  createSendToken(user, 200, res, 'Login successful');
});

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'name', 'email', 'phone', 'role', 'status', 'avatar', 'createdAt']
  });

  ApiResponse.success(res, user, 'User profile retrieved successfully');
});

// @desc    Update user profile
// @route   PUT /api/v1/auth/me
// @access  Private
const updateMe = catchAsync(async (req, res, next) => {
  // Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError('This route is not for password updates. Please use /updateMyPassword.', 400)
    );
  }

  // Filter out unwanted field names that are not allowed to be updated
  const allowedFields = ['name', 'phone'];
  const filteredBody = {};
  Object.keys(req.body).forEach(el => {
    if (allowedFields.includes(el)) filteredBody[el] = req.body[el];
  });

  // Update user document
  await User.update(filteredBody, {
    where: { id: req.user.id }
  });

  const updatedUser = await User.findByPk(req.user.id, {
    attributes: ['id', 'name', 'email', 'phone', 'role', 'status', 'avatar']
  });

  ApiResponse.success(res, updatedUser, 'Profile updated successfully');
});

// @desc    Update password
// @route   PUT /api/v1/auth/updatePassword
// @access  Private
const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Validate required fields
  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide both current password and new password', 400));
  }

  // Get user from database
  const user = await User.findByPk(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if current password is correct
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return next(new AppError('Current password is incorrect. Please check your current password and try again.', 401));
  }

  // Validate new password strength
  if (newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters long', 400));
  }

  // Check if new password is different from current
  if (await bcrypt.compare(newPassword, user.password)) {
    return next(new AppError('New password must be different from your current password', 400));
  }

  // Hash new password and update with incremented token version
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await User.update(
    {
      password: hashedPassword,
      token_version: user.token_version + 1 // Invalidate all existing tokens
    },
    { where: { id: req.user.id } }
  );

  // Get updated user with new token_version
  const updatedUser = await User.findByPk(req.user.id);

  createSendToken(updatedUser, 200, res, 'Password updated successfully. All other sessions have been logged out for security.');
});

// @desc    Forgot password (placeholder)
// @route   POST /api/v1/auth/forgotPassword
// @access  Public
const forgotPassword = catchAsync(async (req, res, next) => {
  // TODO: Implement email sending functionality
  ApiResponse.success(
    res,
    null,
    'Password reset functionality will be implemented in future updates',
    200
  );
});

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  updatePassword,
  forgotPassword
};