const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { success: false, message: 'Demasiados intentos. Intenta en 15 min.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: 'Demasiadas peticiones. Espera un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, writeLimiter };