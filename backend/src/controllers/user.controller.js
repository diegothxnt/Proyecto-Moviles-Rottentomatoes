const User = require('../models/User');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('likedMovies', 'title posterPath _id type')
      .populate('dislikedMovies', 'title posterPath _id type');
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

const updateMe = async (req, res, next) => {
  try {
    const allowed = ['name', 'avatar', 'bio', 'country', 'favoriteGenre', 'website'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('likedMovies', 'title posterPath _id type')
      .populate('dislikedMovies', 'title posterPath _id type');
      
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

const toggleMoviePreference = async (req, res, next) => {
  try {
    const { movieId, action } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, 'Usuario no encontrado');

    if (action === 'like') {
      if (!user.likedMovies.includes(movieId)) user.likedMovies.push(movieId);
      user.dislikedMovies = user.dislikedMovies.filter(id => id.toString() !== movieId);
    } else if (action === 'dislike') {
      if (!user.dislikedMovies.includes(movieId)) user.dislikedMovies.push(movieId);
      user.likedMovies = user.likedMovies.filter(id => id.toString() !== movieId);
    }

    await user.save();
    res.json({ success: true });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new ApiError(400, 'Contraseña actual y nueva son requeridas');
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) throw new ApiError(404, 'Usuario no encontrado');

    const ok = await user.comparePassword(currentPassword);
    if (!ok) throw new ApiError(401, 'Contraseña actual incorrecta');

    if (currentPassword === newPassword) {
      throw new ApiError(400, 'La nueva contraseña debe ser diferente');
    }

    user.password = newPassword;
    user.refreshTokens = []; 
    await user.save();

    res.json({ success: true, message: 'Contraseña actualizada. Vuelve a iniciar sesión.' });
  } catch (err) { next(err); }
};

const deleteMe = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Contraseña incorrecta');
    }
    
    user.isActive = false;
    user.refreshTokens = [];
    await user.save();
    
    res.json({ success: true, message: 'Cuenta desactivada correctamente. Un administrador puede reactivarla.' });
  } catch (err) { next(err); }
};

module.exports = { getMe, updateMe, changePassword, deleteMe, toggleMoviePreference };