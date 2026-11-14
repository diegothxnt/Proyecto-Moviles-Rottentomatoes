const router = require('express').Router();
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const ctrl = require('../controllers/user.controller');
const { updateProfileValidator } = require('../validators/user.validator');
const { body } = require('express-validator');
const { authLimiter } = require('../middlewares/rateLimit.middleware');

router.use(authenticate);

router.get('/me', ctrl.getMe);
router.patch('/me', updateProfileValidator, validate, ctrl.updateMe);
router.delete('/me', ctrl.deleteMe);

router.patch(
  '/me/password',
  authLimiter,
  [
    body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
    body('newPassword')
      .isLength({ min: 8, max: 64 })
      .withMessage('Nueva contraseña: entre 8 y 64 caracteres')
      .matches(/[a-z]/).withMessage('Debe incluir minúscula')
      .matches(/[A-Z]/).withMessage('Debe incluir mayúscula')
      .matches(/\d/).withMessage('Debe incluir número'),
  ],
  validate,
  ctrl.changePassword
);

router.post('/me/preference', ctrl.toggleMoviePreference);

module.exports = router;