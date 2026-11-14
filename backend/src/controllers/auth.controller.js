const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../services/token.service');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) {
      throw new ApiError(409, 'El email ya está registrado');
    }
    const user = await User.create({ name, email, password });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: { token: refreshToken } },
    });

    res.status(201).json({ success: true, data: { user, accessToken, refreshToken } });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Credenciales inválidas');
    }


    if (!user.isActive) {
      throw new ApiError(403, 'Tu cuenta ha sido suspendida. Contacta al administrador.');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    await User.findByIdAndUpdate(user._id, {
      $push: { 
        refreshTokens: { 
          $each: [{ token: refreshToken }],
          $slice: -5
        } 
      },
    });

    res.json({
      success: true,
      data: { user: user.toJSON(), accessToken, refreshToken },
    });
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ApiError(400, 'Refresh token requerido');

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, 'Refresh token inválido o expirado');
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.some((t) => t.token === refreshToken) || !user.isActive) {
      throw new ApiError(401, 'Refresh token revocado');
    }

    const newAccess = generateAccessToken(user);
    const newRefresh = generateRefreshToken(user);

    await User.findByIdAndUpdate(user._id, { $pull: { refreshTokens: { token: refreshToken } } });
    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: { token: newRefresh } } });

    res.json({ success: true, data: { accessToken: newAccess, refreshToken: newRefresh } });
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { refreshTokens: { token: refreshToken } } });
    }
    res.json({ success: true, message: 'Sesión cerrada' });
  } catch (err) { next(err); }
};

module.exports = { register, login, refresh, logout };