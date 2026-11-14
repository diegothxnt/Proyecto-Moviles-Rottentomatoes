const router = require('express').Router();
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const ctrl = require('../controllers/review.controller');
const {
  createReviewValidator, updateReviewValidator, reviewIdValidator,
} = require('../validators/review.validator');
const { writeLimiter } = require('../middlewares/rateLimit.middleware');

router.use(authenticate);
router.get('/mine', ctrl.listMine);
router.get('/movie/:movieId', ctrl.listByMovie);
router.post('/', writeLimiter, createReviewValidator, validate, ctrl.create);
router.patch('/:id', writeLimiter, updateReviewValidator, validate, ctrl.update);
router.delete('/:id', reviewIdValidator, validate, ctrl.remove);
router.post('/:id/like', ctrl.toggleLike);

module.exports = router;