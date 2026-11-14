const { body } = require('express-validator');

const updateProfileValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 60 }),
  body('avatar').optional().isURL().withMessage('Debe ser una URL válida'),
  body('bio').optional().isLength({ max: 300 }),
];

module.exports = { updateProfileValidator };