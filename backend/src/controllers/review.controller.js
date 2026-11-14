const Review = require('../models/Review');
const Movie = require('../models/Movie');
const ApiError = require('../utils/ApiError');

const USER_FIELDS = 'name avatar role bio createdAt country favoriteGenre website';

const listByMovie = async (req, res, next) => {
  try {
    const reviews = await Review.find({ movie: req.params.movieId })
      .populate('user', USER_FIELDS)
    
      .populate({
        path: 'parent',
        select: 'user',
        populate: { path: 'user', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .lean();


    const mappedReviews = reviews.map((r) => ({
      ...r,
      parentUser: r.parent?.user?.name || null
    }));

    res.json({ success: true, data: mappedReviews });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { movieId, rating, comment, parent } = req.body;
    if (!(await Movie.findById(movieId))) throw new ApiError(404, 'Película no encontrada');

    if (parent) {
      const parentReview = await Review.findById(parent);
      if (!parentReview) throw new ApiError(404, 'Comentario original no encontrado');
    } else {
      if (await Review.findOne({ user: req.user._id, movie: movieId, parent: null })) {
        throw new ApiError(409, 'Ya dejaste una reseña para esta película');
      }
    }

    const review = await Review.create({
      user: req.user._id,
      movie: movieId,
      rating: rating || 0,
      comment,
      parent: parent || null
    });
    
    await review.populate('user', USER_FIELDS);
    res.status(201).json({ success: true, data: review });
  } catch (err) { 
    console.error(' Error creando reseña:', err);
    next(err); 
  }
};

const update = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) throw new ApiError(404, 'Reseña no encontrada');
    if (String(review.user) !== String(req.user._id) && req.user.role !== 'admin') {
      throw new ApiError(403, 'No autorizado');
    }
    
    if (req.body.rating !== undefined) review.rating = req.body.rating;
    if (req.body.comment !== undefined) review.comment = req.body.comment;
    
    await review.save();
    await review.populate('user', USER_FIELDS);
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) throw new ApiError(404, 'Reseña no encontrada');
    if (String(review.user) !== String(req.user._id) && req.user.role !== 'admin') {
      throw new ApiError(403, 'No autorizado');
    }
    await Review.deleteMany({ parent: review._id });
    await review.deleteOne();
    res.json({ success: true, message: 'Reseña eliminada' });
  } catch (err) { next(err); }
};

const listMine = async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.user._id, parent: null })
      .populate('movie', 'title posterPath releaseDate type')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
};

const toggleLike = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) throw new ApiError(404, 'Reseña no encontrada');
    
    const userId = req.user._id;
    const index = review.likes.indexOf(userId);
    
    if (index === -1) review.likes.push(userId);
    else review.likes.splice(index, 1);
    
    await review.save();
    await review.populate('user', USER_FIELDS);
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
};

module.exports = { listByMovie, create, update, remove, listMine, toggleLike };