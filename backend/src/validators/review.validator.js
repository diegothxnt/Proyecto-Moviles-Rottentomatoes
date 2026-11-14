const { body, param } = require('express-validator');

const hasUnsafeChars = (v) => /[<>]/.test(v);

const createReviewValidator = [
  body('movieId').isMongoId().withMessage('ID de película inválido'),
  body('parent').optional().isString().withMessage('ID de comentario padre inválido'),
  body('rating').optional().isFloat({ min: 0, max: 10 }),
  body('comment')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comentario permitido de 1 a 500 caracteres')
    .custom((v) => !hasUnsafeChars(v))
    .withMessage('El comentario no puede contener < ni >')
    .escape(),
];

const updateReviewValidator = [
  param('id').isMongoId(),
  body('rating').optional().isFloat({ min: 0, max: 10 }),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comentario permitido de 1 a 500 caracteres')
    .custom((v) => !hasUnsafeChars(v))
    .withMessage('El comentario no puede contener < ni >')
    .escape(),
];

const reviewIdValidator = [param('id').isMongoId()];
module.exports = { createReviewValidator, updateReviewValidator, reviewIdValidator };