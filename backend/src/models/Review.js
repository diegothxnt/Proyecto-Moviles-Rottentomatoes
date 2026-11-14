const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', default: null }, 
    rating: { type: Number, required: true, min: 0, max: 10, default: 0 },
    comment: { type: String, required: true, trim: true, maxlength: 500 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);


reviewSchema.index({ user: 1, movie: 1, parent: 1 }, { unique: true, partialFilterExpression: { parent: null } });
reviewSchema.index({ movie: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);