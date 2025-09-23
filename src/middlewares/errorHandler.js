const AppError = require('../utils/AppError');

// Handle Sequelize Validation Errors
const handleSequelizeValidationError = (err) => {
  const errors = err.errors.map(error => ({
    field: error.path,
    message: error.message
  }));

  const message = `Validation failed: ${errors.map(e => e.message).join('. ')}`;
  return new AppError(message, 400);
};

// Handle Sequelize Unique Constraint Errors
const handleSequelizeUniqueError = (err) => {
  const field = err.errors[0].path;
  const message = `${field} already exists. Please use another value.`;
  return new AppError(message, 400);
};

// Handle JWT Errors
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

// Send Error in Development
const sendErrorDev = (err, res) => {
  const response = {
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  };

  // Include validation errors if they exist
  if (err.errors) {
    response.errors = err.errors;
  }

  res.status(err.statusCode).json(response);
};

// Send Error in Production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const response = {
      status: err.status,
      message: err.message
    };

    // Include validation errors if they exist
    if (err.errors) {
      response.errors = err.errors;
    }

    res.status(err.statusCode).json(response);
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

// Global Error Handler Middleware
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === 'SequelizeValidationError') error = handleSequelizeValidationError(error);
    if (err.name === 'SequelizeUniqueConstraintError') error = handleSequelizeUniqueError(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

module.exports = globalErrorHandler;