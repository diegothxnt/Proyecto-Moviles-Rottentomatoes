const { query, param } = require('express-validator');

const searchMovieValidator = [
  query('q').optional().trim().isLength({ max: 100 }),
  query('genre').optional().isString(),
  query('type').optional().isIn(['movie', 'tv']),
  query('sort').optional().isIn(['releaseDate', 'rating', 'title']),
  query('order').optional().isIn(['asc', 'desc']),
  query('year').optional().isInt({ min: 1800, max: 2100 }).withMessage('Año inválido'), 
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
];

const movieIdValidator = [param('id').isMongoId().withMessage('ID inválido')];

module.exports = { searchMovieValidator, movieIdValidator };