const router = require('express').Router();

router.use('/auth',    require('./auth.routes'));
router.use('/users',   require('./user.routes'));
router.use('/movies',  require('./movie.routes'));
router.use('/reviews', require('./review.routes'));
router.use('/admin',   require('./admin.routes')); 

module.exports = router;