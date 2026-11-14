const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const validate = require('../middlewares/validate.middleware');
const authenticate = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimit.middleware');

router.post('/register', authLimiter, registerValidator, validate, ctrl.register);
router.post('/login',    authLimiter, loginValidator, validate, ctrl.login);
router.post('/refresh',  ctrl.refresh);
router.post('/logout',   authenticate, ctrl.logout);

module.exports = router;