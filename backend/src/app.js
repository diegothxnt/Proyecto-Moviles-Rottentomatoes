const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');
const ApiError = require('./utils/ApiError');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize());  
app.use(xss());            
app.use(compression());

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));


app.use('/api', routes);


app.use((_req, _res, next) => next(new ApiError(404, 'Ruta no encontrada')));

app.use(errorMiddleware);

module.exports = app;