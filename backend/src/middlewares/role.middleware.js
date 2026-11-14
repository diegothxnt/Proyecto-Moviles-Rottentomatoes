const ApiError = require('../utils/ApiError');

const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'No autenticado'));
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'No tienes permisos para esta acción'));
  }
  next();
};

module.exports = authorize;