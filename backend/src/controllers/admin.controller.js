const User = require('../models/User');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'critic', 'admin'].includes(role)) throw new ApiError(400, 'Rol inválido');
    
    const user = await User.findByIdAndUpdate(req.params.userId, { role }, { new: true });
    if (!user) throw new ApiError(404, 'Usuario no encontrado');
    
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) throw new ApiError(404, 'Usuario no encontrado');
    
    if (user._id.toString() === req.user._id.toString()) {
      throw new ApiError(400, 'No puedes desactivar tu propia cuenta');
    }

    user.isActive = !user.isActive;
    if (!user.isActive) user.refreshTokens = [];
    await user.save();
    
    res.json({ success: true, data: user, message: `Usuario ${user.isActive ? 'activado' : 'suspendido'}` });
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) throw new ApiError(404, 'Usuario no encontrado');
    
    if (user._id.toString() === req.user._id.toString()) {
      throw new ApiError(400, 'No puedes eliminar tu propia cuenta desde aquí');
    }

    await Review.deleteMany({ user: user._id });
    await user.deleteOne();
    
    res.json({ success: true, message: 'Usuario eliminado permanentemente' });
  } catch (err) { next(err); }
};

module.exports = { getAllUsers, updateUserRole, toggleUserStatus, deleteUser };