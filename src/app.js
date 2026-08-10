const express = require('express');
const cookieParser = require('cookie-parser');
const { helmetMiddleware, corsMiddleware, sanitizeNoSql } = require('./middlewares/securityMiddleware');
const { globalLimiter } = require('./middlewares/rateLimiterMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');
const routes = require('./routes');
const AppError = require('./utils/appError');
const { HTTP_STATUS, ERROR_CODES } = require('./constants/httpCodes');

const app = express();

app.use(helmetMiddleware);
app.use(corsMiddleware);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(sanitizeNoSql);

app.use('/api/', globalLimiter);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Baticlean API Backend',
    timestamp: new Date().toISOString(),
  });
});

app.use('/admin*', (req, res, next) => {
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Ressource non trouvée.',
    },
  });
});

app.use('/api/v1', routes);

app.use('*', (req, res, next) => {
  next(
    new AppError(
      `La route ${req.originalUrl} n'existe pas sur le serveur API.`,
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    )
  );
});

app.use(errorMiddleware);

module.exports = app;
