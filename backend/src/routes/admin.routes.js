const router = require('express').Router();
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const ctrl = require('../controllers/admin.controller');

router.use(authenticate, authorize('admin'));

router.get('/users', ctrl.getAllUsers);
router.patch('/users/:userId/role', ctrl.updateUserRole);
router.patch('/users/:userId/status', ctrl.toggleUserStatus);
router.delete('/users/:userId', ctrl.deleteUser); 

module.exports = router;