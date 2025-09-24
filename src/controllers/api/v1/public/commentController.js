const catchAsync = require('../../../../utils/catchAsync');
const AppError = require('../../../../utils/AppError');
const Comment = require('../../../../models/entities/Comment');
const Product = require('../../../../models/entities/Product');
const User = require('../../../../models/entities/User');
const { Op } = require('sequelize');

// Get all comments for a product
const getProductComments = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10, rating, sortBy = 'newest' } = req.query;
  const offset = (page - 1) * limit;

  // Check if product exists
  const product = await Product.findByPk(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Build where conditions
  const where = {
    product_id: productId,
    status: 'approved'
  };

  if (rating) {
    where.rating = rating;
  }

  // Build order conditions
  let order = [['createdAt', 'DESC']]; // default: newest
  switch (sortBy) {
    case 'oldest':
      order = [['createdAt', 'ASC']];
      break;
    case 'rating_high':
      order = [['rating', 'DESC'], ['createdAt', 'DESC']];
      break;
    case 'rating_low':
      order = [['rating', 'ASC'], ['createdAt', 'DESC']];
      break;
    case 'helpful':
      order = [['helpful_count', 'DESC'], ['createdAt', 'DESC']];
      break;
  }

  const { count, rows: comments } = await Comment.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order
  });

  // Calculate rating distribution
  const ratingStats = await Comment.findAll({
    where: { product_id: productId, status: 'approved' },
    attributes: [
      'rating',
      [Comment.sequelize.fn('COUNT', Comment.sequelize.col('rating')), 'count']
    ],
    group: ['rating'],
    order: [['rating', 'DESC']]
  });

  const ratingDistribution = {
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  };

  ratingStats.forEach(stat => {
    ratingDistribution[stat.rating] = parseInt(stat.get('count'));
  });

  const totalReviews = Object.values(ratingDistribution).reduce((sum, count) => sum + count, 0);
  const averageRating = totalReviews > 0
    ? Object.entries(ratingDistribution).reduce((sum, [rating, count]) => sum + (rating * count), 0) / totalReviews
    : 0;

  res.json({
    success: true,
    data: {
      comments,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      },
      statistics: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution
      }
    }
  });
});

// Create a new comment (requires authentication)
const createComment = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const { comment, rating } = req.body;
  const userId = req.user.id;

  // Check if product exists
  const product = await Product.findByPk(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check if user already commented on this product
  const existingComment = await Comment.findOne({
    where: {
      user_id: userId,
      product_id: productId
    }
  });

  if (existingComment) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this product'
    });
  }

  // Create comment
  const newComment = await Comment.create({
    user_id: userId,
    product_id: productId,
    comment,
    rating: parseInt(rating),
    status: 'approved', // Auto-approve for now, can be changed to 'pending'
    helpful_count: 0
  });

  // Get the created comment with user info
  const commentWithUser = await Comment.findByPk(newComment.id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }
    ]
  });

  // Update product rating
  await updateProductRating(productId);

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: commentWithUser
  });
});

// Update comment (only by the author)
const updateComment = catchAsync(async (req, res) => {
  const { commentId } = req.params;
  const { comment, rating } = req.body;
  const userId = req.user.id;

  const existingComment = await Comment.findByPk(commentId);

  if (!existingComment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found'
    });
  }

  // Check if user owns this comment
  if (existingComment.user_id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'You can only edit your own reviews'
    });
  }

  await existingComment.update({
    comment: comment || existingComment.comment,
    rating: rating ? parseInt(rating) : existingComment.rating,
    status: 'approved' // Reset to approved after edit
  });

  // Get updated comment with user info
  const updatedComment = await Comment.findByPk(commentId, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }
    ]
  });

  // Update product rating
  await updateProductRating(existingComment.product_id);

  res.json({
    success: true,
    message: 'Review updated successfully',
    data: updatedComment
  });
});

// Delete comment (only by the author)
const deleteComment = catchAsync(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  const comment = await Comment.findByPk(commentId);

  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found'
    });
  }

  // Check if user owns this comment
  if (comment.user_id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own reviews'
    });
  }

  const productId = comment.product_id;
  await comment.destroy();

  // Update product rating
  await updateProductRating(productId);

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
});

// Mark comment as helpful
const markCommentHelpful = catchAsync(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findByPk(commentId);

  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found'
    });
  }

  await comment.update({
    helpful_count: comment.helpful_count + 1
  });

  res.json({
    success: true,
    message: 'Comment marked as helpful',
    data: {
      helpful_count: comment.helpful_count
    }
  });
});

// Helper function to update product rating
const updateProductRating = async (productId) => {
  const stats = await Comment.findAll({
    where: {
      product_id: productId,
      status: 'approved'
    },
    attributes: [
      [Comment.sequelize.fn('AVG', Comment.sequelize.col('rating')), 'avgRating'],
      [Comment.sequelize.fn('COUNT', Comment.sequelize.col('id')), 'totalReviews']
    ]
  });

  if (stats.length > 0) {
    const avgRating = parseFloat(stats[0].get('avgRating')) || 0;
    const totalReviews = parseInt(stats[0].get('totalReviews')) || 0;

    await Product.update(
      {
        rating: Math.round(avgRating * 10) / 10,
        total_reviews: totalReviews
      },
      { where: { id: productId } }
    );
  }
};

// Get user's comments
const getUserComments = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows: comments } = await Comment.findAndCountAll({
    where: { user_id: userId },
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'image', 'slug']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      comments,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    }
  });
});

module.exports = {
  getProductComments,
  createComment,
  updateComment,
  deleteComment,
  markCommentHelpful,
  getUserComments
};