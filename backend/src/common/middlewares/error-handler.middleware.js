import { AppError } from '../helpers/app-error.helper.js';

const errorHandler = (err, req, res, next) => {
  // Nếu đã là AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      status: 'error',
      message: 'File too large. Maximum size is 5MB.'
    });
  }

  if (err.message === 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.') {
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }

  // Validation errors from express-validator
  if (err.array && typeof err.array === 'function') {
    const errors = err.array().map(e => e.msg);
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors
    });
  }

  // Default server error
  console.error('Error:', err);

  return res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;
