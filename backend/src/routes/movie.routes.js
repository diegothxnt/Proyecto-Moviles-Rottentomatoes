const router = require('express').Router();
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const ctrl = require('../controllers/movie.controller');
const { searchMovieValidator, movieIdValidator } = require('../validators/movie.validator');

router.use(authenticate);

router.get('/', searchMovieValidator, validate, ctrl.search);
router.get('/genres', ctrl.getGenres);
router.get('/oldest', ctrl.getOldestYear); 
router.get('/sync/:externalId', ctrl.syncByExternalId);
router.get('/:id', movieIdValidator, validate, ctrl.getById);

module.exports = router;