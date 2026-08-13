const express = require('express');
const cookieParser = require('cookie-parser');
const { helmetMiddleware, corsMiddleware, sanitizeNoSql } = require('./middlewares/securityMiddleware');
const { globalLimiter } = require('./middlewares/rateLimiterMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');
const routes = require('./routes');
const authRoutes = require('./routes/authRoutes');
const AppError = require('./utils/appError');
const { HTTP_STATUS, ERROR_CODES } = require('./constants/httpCodes');

const app = express();

// Activer le mode proxy de confiance pour les reverse-proxies Render / Cloudflare
app.set('trust proxy', 1);

app.use(helmetMiddleware);
app.use(corsMiddleware);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(sanitizeNoSql);

app.use('/api/', globalLimiter);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Bienvenue sur l'API REST Baticlean - Service Opérationnel",
    version: '1.0.0',
    health: '/health',
  });
});

app.head('/', (req, res) => {
  res.status(200).end();
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Baticlean API Backend',
    timestamp: new Date().toISOString(),
  });
});

// Alias directs pour garantir qu'aucune requête d'authentification ou d'API ne soit bloquée
app.use('/auth', authRoutes);
app.use('/api/v1', routes);
app.use('/api', routes);

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
