const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, unique: true, index: true },
    source: { type: String, enum: ['omdb', 'tmdb'], default: 'omdb' },
    type: { type: String, enum: ['movie', 'tv'], default: 'movie' },
    title: { type: String, required: true, trim: true },
    originalTitle: { type: String, default: '' },
    overview: { type: String, default: '' },
    releaseDate: { type: Date, index: true },
    genres: [{ type: String, index: true }],
    posterPath: { type: String, default: '' },
    backdropPath: { type: String, default: '' },
    cast: [{ type: String }],
    externalRating: { type: Number, default: 0 },
    runtime: { type: Number, default: 0 },
    tagline: { type: String, default: '' },
    trailerUrl: { type: String, default: '' },
    fullDetailsFetched: { type: Boolean, default: false },
    syncAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);



movieSchema.index({ title: 'text', overview: 'text' });

movieSchema.index({ title: 1 });
movieSchema.index({ externalRating: -1 });
movieSchema.index({ releaseDate: -1 });

movieSchema.index({ type: 1, title: 1 });
movieSchema.index({ type: 1, externalRating: -1 });
movieSchema.index({ type: 1, releaseDate: -1 });

movieSchema.index({ type: 1, genres: 1, releaseDate: -1 });
movieSchema.index({ type: 1, genres: 1, externalRating: -1 });

module.exports = mongoose.model('Movie', movieSchema);