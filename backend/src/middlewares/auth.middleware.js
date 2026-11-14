const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const { verifyAccessToken } = require('../services/token.service');

const authenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Token no proporcionado');
    }
    const token = header.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(401, 'Usuario no encontrado');
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(new ApiError(401, 'Token expirado'));
    if (err.name === 'JsonWebTokenError') return next(new ApiError(401, 'Token inválido'));
    next(err);
  }
};

module.exports = authenticate;