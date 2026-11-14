const ApiError = require('../utils/ApiError');

const errorMiddleware = (err, _req, res, _next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    error = new ApiError(statusCode, error.message || 'Internal Server Error');
  }

  if (process.env.NODE_ENV === 'development') console.error('', err);

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;