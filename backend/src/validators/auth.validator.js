const { body } = require('express-validator');

const LETTERS_AND_SPACES = /^[a-zA-Z\s]+$/;


const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const registerValidator = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nombre: entre 2 y 50 caracteres')
    .matches(LETTERS_AND_SPACES)
    .withMessage('El nombre solo puede contener letras sin tildes y espacios')
    .escape(),

  body('email')
    .trim()
    .toLowerCase()
    .matches(EMAIL_REGEX)
    .withMessage('Formato de correo inválido. Ej: jose.perez@gmail.com')
    .custom((value) => {
      
      if (value.endsWith('@example.com') || value.endsWith('.test')) {
        throw new Error('Dominios de prueba no permitidos');
      }
      
      if (value.includes('..')) {
        throw new Error('El correo no puede tener dos puntos seguidos');
      }
      return true;
    }),

  body('password')
    .isLength({ min: 8, max: 64 })
    .withMessage('Contraseña: entre 8 y 64 caracteres')
    .matches(/[a-z]/).withMessage('Debe incluir al menos una minúscula')
    .matches(/[A-Z]/).withMessage('Debe incluir al menos una mayúscula')
    .matches(/\d/).withMessage('Debe incluir al menos un número'),
];

const loginValidator = [
  body('email').trim().toLowerCase().isEmail().withMessage('Correo inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
];

module.exports = { registerValidator, loginValidator };