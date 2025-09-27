const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../../models/associations');
const ApiResponse = require('../../../utils/apiResponse');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const crypto = require('crypto');

// Generate JWT Token for admin
const signToken = (id, tokenVersion, role) => {
  return jwt.sign(
    {
      id,
      tokenVersion: tokenVersion || 1,
      role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

// Send token response for admin
const createSendToken = (user, statusCode, res, message) => {
  const token = signToken(user.id, user.token_version, user.role);

  // Remove password from output
  user.password = undefined;

  ApiResponse.success(
    res,
    {
      token,
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        lastLogin: new Date()
      }
    },
    message,
    statusCode
  );
};

// @desc    Register new admin
// @route   POST /api/v1/admin/auth/register
// @access  Super Admin only
const registerAdmin = catchAsync(async (req, res, next) => {
  const { name, email, password, phone, role = 'admin' } = req.body;

  // Only super_admin can create other admins
  if (req.user.role !== 'super_admin') {
    return next(new AppError('Only super administrators can create admin accounts', 403));
  }

  // Validate role
  if (!['admin', 'super_admin'].includes(role)) {
    return next(new AppError('Invalid role. Must be admin or super_admin', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create admin user
  const newAdmin = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    role,
    status: 'active'
  });

  createSendToken(newAdmin, 201, res, `${role} account created successfully`);
});

// @desc    Admin login
// @route   POST /api/v1/admin/auth/login
// @access  Public (admin only)
const adminLogin = catchAsync(async (req, res, next) => {
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

  // Check if user has admin privileges
  if (!['admin', 'super_admin'].includes(user.role)) {
    return next(new AppError('Access denied. Admin privileges required.', 403));
  }

  // Check if user is active
  if (user.status !== 'active') {
    return next(new AppError('Your account has been deactivated. Please contact support.', 401));
  }

  createSendToken(user, 200, res, 'Admin login successful');
});

// @desc    Get current admin profile
// @route   GET /api/v1/admin/auth/me
// @access  Private (Admin)
const getAdminProfile = catchAsync(async (req, res, next) => {
  const admin = await User.findByPk(req.user.id, {
    attributes: ['id', 'name', 'email', 'phone', 'role', 'status', 'avatar', 'createdAt', 'updatedAt']
  });

  ApiResponse.success(res, admin, 'Admin profile retrieved successfully');
});

// @desc    Update admin profile
// @route   PUT /api/v1/admin/auth/me
// @access  Private (Admin)
const updateAdminProfile = catchAsync(async (req, res, next) => {
  // Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError('This route is not for password updates. Please use /updatePassword.', 400)
    );
  }

  // Filter out unwanted field names that are not allowed to be updated
  const allowedFields = ['name', 'phone'];
  const filteredBody = {};
  Object.keys(req.body).forEach(el => {
    if (allowedFields.includes(el)) filteredBody[el] = req.body[el];
  });

  // Update admin document
  await User.update(filteredBody, {
    where: { id: req.user.id }
  });

  const updatedAdmin = await User.findByPk(req.user.id, {
    attributes: ['id', 'name', 'email', 'phone', 'role', 'status', 'avatar']
  });

  ApiResponse.success(res, updatedAdmin, 'Admin profile updated successfully');
});

// @desc    Update admin password
// @route   PUT /api/v1/admin/auth/updatePassword
// @access  Private (Admin)
const updateAdminPassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Validate required fields
  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide both current password and new password', 400));
  }

  // Get user from database
  const user = await User.findByPk(req.user.id);

  if (!user) {
    return next(new AppError('Admin not found', 404));
  }

  // Check if current password is correct
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Validate new password strength
  if (newPassword.length < 8) {
    return next(new AppError('New password must be at least 8 characters long', 400));
  }

  // Check if new password is different from current
  if (await bcrypt.compare(newPassword, user.password)) {
    return next(new AppError('New password must be different from current password', 400));
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

  createSendToken(updatedUser, 200, res, 'Password updated successfully. All sessions logged out for security.');
});

// @desc    Admin forgot password - send reset email
// @route   POST /api/v1/admin/auth/forgotPassword
// @access  Public
const adminForgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Please provide email address', 400));
  }

  // Get admin based on POSTed email
  const admin = await User.findOne({ where: { email } });

  if (!admin) {
    return next(new AppError('No admin found with that email address', 404));
  }

  // Check if user has admin privileges
  if (!['admin', 'super_admin'].includes(admin.role)) {
    return next(new AppError('Account is not an admin account', 403));
  }

  // Generate random reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Create password reset token (expires in 10 minutes)
  const passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store reset token in database (you might want to create a separate table for this)
  await User.update(
    {
      // Note: You'll need to add these fields to your User model
      passwordResetToken,
      passwordResetExpires
    },
    { where: { id: admin.id } }
  );

  // TODO: Send email with reset token
  // For now, we'll return the token in response (REMOVE IN PRODUCTION)
  ApiResponse.success(
    res,
    {
      resetToken: resetToken, // REMOVE THIS IN PRODUCTION - only for testing
      message: 'Password reset token generated'
    },
    'Password reset instructions sent to email',
    200
  );
});

// @desc    Reset admin password
// @route   PATCH /api/v1/admin/auth/resetPassword/:token
// @access  Public
const resetAdminPassword = catchAsync(async (req, res, next) => {
  // Get admin based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const admin = await User.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        [require('sequelize').Op.gt]: new Date()
      }
    }
  });

  // If token has not expired, and there is an admin, set new password
  if (!admin) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // Check if user has admin privileges
  if (!['admin', 'super_admin'].includes(admin.role)) {
    return next(new AppError('Access denied', 403));
  }

  const { password } = req.body;

  if (!password || password.length < 8) {
    return next(new AppError('Password must be at least 8 characters long', 400));
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Update password and remove reset token fields
  await User.update(
    {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      token_version: admin.token_version + 1
    },
    { where: { id: admin.id } }
  );

  // Get updated admin
  const updatedAdmin = await User.findByPk(admin.id);

  createSendToken(updatedAdmin, 200, res, 'Password reset successful');
});

module.exports = {
  registerAdmin,
  adminLogin,
  getAdminProfile,
  updateAdminProfile,
  updateAdminPassword,
  adminForgotPassword,
  resetAdminPassword
};