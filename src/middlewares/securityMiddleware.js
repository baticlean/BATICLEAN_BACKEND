const helmet = require('helmet');
const cors = require('cors');
const env = require('../config/env');

const helmetMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = (env.CORS_ORIGIN || '').split(',').map((o) => o.trim());
    
    // Autoriser les requêtes sans origin (mobile apps, Postman), les origins dans la liste, tous les domaines vercel.app et le dev
    const isVercelDomain = origin && (origin.endsWith('.vercel.app') || origin.includes('vercel.app'));
    const isAllowed = !origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || isVercelDomain || env.NODE_ENV === 'development';

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Accès refusé par la politique de sécurité CORS."));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

const corsMiddleware = cors(corsOptions);

const sanitizeNoSql = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  sanitizeNoSql,
};
