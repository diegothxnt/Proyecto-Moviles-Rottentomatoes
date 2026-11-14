const axios = require('axios');
const ApiError = require('../utils/ApiError');

const omdbClient = axios.create({
  baseURL: 'https://www.omdbapi.com/',
  timeout: 15000,
  params: {
    apikey: process.env.OMDB_API_KEY,
    plot: 'full',
  },
});

const mapTypeToOmdb = (type) => (type === 'tv' || type === 'series') ? 'series' : 'movie';
const mapTypeFromOmdb = (omdbType) => (omdbType === 'series' ? 'tv' : 'movie');

const searchMovie = async (query, type = 'movie', page = 1, year = '') => {
  try {
    if (!query || query.trim().length < 3) return [];
    const params = { s: query.trim(), page: page };
    if (type) params.type = mapTypeToOmdb(type);
    if (year) params.y = year; 

    const { data } = await omdbClient.get('/', { params });
    
    if (data.Response === 'False') return [];
    return data.Search || [];
  } catch (err) {
    return [];
  }
};

const getMovieDetails = async (imdbId) => {
  try {
    const { data } = await omdbClient.get('/', { params: { i: imdbId } });
    if (data.Response === 'False') throw new ApiError(404, 'No encontrada en OMDb');
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(404, 'No se pudo obtener de OMDb');
  }
};

const parseRuntime = (runtime) => {
  if (!runtime || runtime === 'N/A') return 0;
  const m = runtime.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
};

const parseReleaseDate = (released) => {
  if (!released || released === 'N/A') return null;
  const d = new Date(released);
  return isNaN(d.getTime()) ? null : d;
};

const mapOmdbToMovie = (omdbData) => ({
  externalId: omdbData.imdbID,
  source: 'omdb',
  type: mapTypeFromOmdb(omdbData.Type),
  title: omdbData.Title,
  originalTitle: omdbData.Title,
  overview: (omdbData.Plot && omdbData.Plot !== 'N/A') ? omdbData.Plot : 'Sinopsis no disponible por el momento.',
  releaseDate: parseReleaseDate(omdbData.Released),
  genres: (omdbData.Genre || '').split(', ').filter((g) => g && g !== 'N/A'),
  posterPath: omdbData.Poster !== 'N/A' ? omdbData.Poster : '',
  backdropPath: '',
  cast: (omdbData.Actors || '').split(', ').filter((a) => a && a !== 'N/A').slice(0, 10),
  externalRating: parseFloat(omdbData.imdbRating) || 0,
  runtime: parseRuntime(omdbData.Runtime),
  tagline: '',
  trailerUrl: '',
  fullDetailsFetched: true,
  syncAt: new Date(),
});

const mapSearchResultToMovie = (item) => ({
  externalId: item.imdbID,
  source: 'omdb',
  type: mapTypeFromOmdb(item.Type),
  title: item.Title,
  originalTitle: item.Title,
  overview: '',
  releaseDate: item.Year ? new Date(`${item.Year.slice(0, 4)}-01-01`) : null,
  genres: [],
  posterPath: item.Poster !== 'N/A' ? item.Poster : '',
  backdropPath: '',
  cast: [],
  externalRating: 0,
  runtime: 0,
  tagline: '',
  trailerUrl: '',
  fullDetailsFetched: false,
  syncAt: new Date(),
});

module.exports = {
  searchMovie,
  getMovieDetails,
  mapOmdbToMovie,
  mapSearchResultToMovie,
};