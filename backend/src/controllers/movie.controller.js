const Movie = require('../models/Movie');
const Review = require('../models/Review');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const omdb = require('../services/omdb.service');

const SEED_QUERIES = {
  movie: ['Avengers', 'Inception', 'Batman', 'Interstellar', 'The Conjuring', 'John Wick'],
  tv: ['Breaking Bad', 'Stranger Things', 'Game of Thrones', 'The Office', 'Dark', 'The Mandalorian']
};

const GENRE_MAP = {
  'acción': 'Action', 'aventura': 'Adventure', 'animación': 'Animation',
  'biografía': 'Biography', 'comedia': 'Comedy', 'crimen': 'Crime',
  'documental': 'Documentary', 'drama': 'Drama', 'familia': 'Family',
  'fantasía': 'Fantasy', 'historia': 'History', 'terror': 'Horror',
  'música': 'Music', 'musical': 'Musical', 'misterio': 'Mystery',
  'romance': 'Romance', 'ciencia ficción': 'Sci-Fi', 'deporte': 'Sport',
  'suspenso': 'Thriller', 'guerra': 'War', 'western': 'Western',
};

const attachRatings = async (movies) => {
  if (!movies.length) return movies;
  const ids = movies.map((m) => m._id);

  const agg = await Review.aggregate([
    { $match: { movie: { $in: ids }, $or: [{ parent: { $exists: false } }, { parent: null }] } },
    { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'u' } },
    { $unwind: '$u' },
    {
      $group: {
        _id: '$movie',
        publicAvg: { $avg: { $cond: [{ $eq: ['$u.role', 'critic'] }, null, '$rating'] } },
        criticAvg: { $avg: { $cond: [{ $eq: ['$u.role', 'critic'] }, '$rating', null] } },
        globalAvg: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        publicCount: { $sum: { $cond: [{ $eq: ['$u.role', 'critic'] }, 0, 1] } },
        criticCount: { $sum: { $cond: [{ $eq: ['$u.role', 'critic'] }, 1, 0] } },
      },
    },
  ]);

  const map = new Map(agg.map((r) => [String(r._id), r]));
  return movies.map((m) => {
    const r = map.get(String(m._id)) || {};
    const pub = r.publicAvg ? Number(r.publicAvg.toFixed(1)) : 0;
    const crit = r.criticAvg ? Number(r.criticAvg.toFixed(1)) : 0;
    const globalAvg = r.globalAvg ? Number(r.globalAvg.toFixed(1)) : 0;
    const mObj = typeof m.toObject === 'function' ? m.toObject() : m;
    return {
      ...mObj,
      ratings: {
        publicAverage: pub, publicCount: r.publicCount || 0,
        criticAverage: crit, criticCount: r.criticCount || 0,
        globalAverage: globalAvg, totalReviews: r.totalReviews || 0,
      },
    };
  });
};

const prefetchDetailsById = (ids, count = 5) => {
  if (!ids.length) return;
  const limited = ids.slice(0, count);
  (async () => {
    for (const id of limited) {
      try {
        const m = await Movie.findById(id);
        if (!m || m.fullDetailsFetched) continue;
        const details = await omdb.getMovieDetails(m.externalId);
        Object.assign(m, omdb.mapOmdbToMovie(details));
        await m.save();
      } catch (err) {}
    }
  })();
};

const bulkSyncFromSearch = async (query, type, year) => {
  let allResults = [];
  for (let page = 1; page <= 10; page++) {
    const results = await omdb.searchMovie(query, type, page, year);
    allResults = [...allResults, ...results];
  }

  if (!allResults.length) return 0;

  const shallow = allResults.slice(0, 100).map(omdb.mapSearchResultToMovie);
  const existingIds = await Movie.find({
    externalId: { $in: shallow.map((m) => m.externalId) },
  }).distinct('externalId');

  const toInsert = shallow.filter((m) => !existingIds.includes(m.externalId));
  if (!toInsert.length) return 0;

  try {
    const inserted = await Movie.insertMany(toInsert, { ordered: false });
    prefetchDetailsById(inserted.map((m) => m._id), 5);
    return inserted.length;
  } catch (err) { return 0; }
};

const search = async (req, res, next) => {
  try {
    const { q, genre, type, sort = 'releaseDate', order = 'desc', minRating, year } = req.query;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);

    const englishGenre = genre && GENRE_MAP[genre.toLowerCase()] ? GENRE_MAP[genre.toLowerCase()] : genre;

    const filter = {};
    if (q) filter.title = { $regex: q, $options: 'i' };
    if (englishGenre) filter.genres = { $regex: new RegExp(englishGenre, 'i') };
    if (type) filter.type = type;
    if (minRating && Number(minRating) > 0) filter.externalRating = { $gte: Number(minRating) };

    if (year) {
      filter.$expr = {
        $eq: [{ $year: '$releaseDate' }, Number(year)]
      };
    }

    const sortField = sort === 'rating' ? 'externalRating' : 'releaseDate';
    const sortObj = { [sortField]: order === 'asc' ? 1 : -1 };

    let movies = await Movie.find(filter).sort(sortObj).skip((page - 1) * limit).limit(limit).lean();

    
    if (!q && !englishGenre && movies.length < 5) {
      const count = await Movie.countDocuments({ type: type || 'movie' });
      
      if (count < 50) {
        console.log(` Auto-seed ${type}: solo hay ${count}, trayendo más...`);
        const seeds = SEED_QUERIES[type || 'movie'] || ['Avengers'];
        for (const seedQuery of seeds) {
          await bulkSyncFromSearch(seedQuery, type || 'movie');
        }
        movies = await Movie.find(filter).sort(sortObj).skip((page - 1) * limit).limit(limit).lean();
      }
    }

    
    if (q && q.trim().length >= 3 && movies.length < 5) {
      await bulkSyncFromSearch(q, type || 'movie', year);
      movies = await Movie.find(filter).sort(sortObj).skip((page - 1) * limit).limit(limit).lean();
    }

    else if (!q && englishGenre && movies.length < 10) {
      await bulkSyncFromSearch(englishGenre, type || 'movie', year);
      movies = await Movie.find(filter).sort(sortObj).skip((page - 1) * limit).limit(limit).lean();
    }
    
    else if (!q && !englishGenre && year && movies.length < 5) {
      console.log(` Buscando más contenido de ${year}...`);
      // Estrategia: buscar años populares de ese año
      const yearSeeds = [`${year} movie`, `${year} film`, `best of ${year}`];
      for (const seedQuery of yearSeeds) {
        await bulkSyncFromSearch(seedQuery, type || 'movie', year);
      }
      movies = await Movie.find(filter).sort(sortObj).skip((page - 1) * limit).limit(limit).lean();
    }

    const enriched = await attachRatings(movies);
    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) throw new ApiError(404, 'Película no encontrada');

    if (!movie.fullDetailsFetched) {
      try {
        const details = await omdb.getMovieDetails(movie.externalId);
        Object.assign(movie, omdb.mapOmdbToMovie(details));
        await movie.save();
      } catch (syncErr) {}
    }

    const [enriched] = await attachRatings([movie]);

    const reviews = await Review.find({ movie: movie._id })
      .populate({
        path: 'user',
        select: 'name avatar role bio createdAt country favoriteGenre website likedMovies dislikedMovies',
        populate: [
          { path: 'likedMovies', select: 'title posterPath type _id' },
          { path: 'dislikedMovies', select: 'title posterPath type _id' }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    let userPreference = null;
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        if (user.likedMovies.includes(movie._id)) userPreference = 'like';
        else if (user.dislikedMovies.includes(movie._id)) userPreference = 'dislike';
      }
    }

    res.json({ success: true, data: { ...enriched, reviews, userPreference } });
  } catch (err) { next(err); }
};

const getGenres = async (req, res, next) => {
  try {
    const type = req.query.type;
    const filter = type ? { type } : {};
    const genres = await Movie.distinct('genres', filter);
    const cleaned = genres.filter((g) => g && g.trim().length > 0).sort((a, b) => a.localeCompare(b));
    res.json({ success: true, data: cleaned });
  } catch (err) { next(err); }
};

const syncByExternalId = async (req, res, next) => {
  try {
    const { externalId } = req.params;
    const details = await omdb.getMovieDetails(externalId);
    const mapped = omdb.mapOmdbToMovie(details);
    const movie = await Movie.findOneAndUpdate({ externalId: mapped.externalId }, mapped, { new: true, upsert: true });
    const [enriched] = await attachRatings([movie]);
    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
};

const getOldestYear = async (req, res, next) => {
  try {
    const type = req.query.type;
    const filter = type ? { type, releaseDate: { $ne: null } } : { releaseDate: { $ne: null } };
    const oldest = await Movie.findOne(filter).sort({ releaseDate: 1 });
    const year = oldest?.releaseDate ? new Date(oldest.releaseDate).getFullYear() : 1888;
    res.json({ success: true, data: year });
  } catch (err) { next(err); }
};

module.exports = { search, getById, syncByExternalId, getGenres, getOldestYear };