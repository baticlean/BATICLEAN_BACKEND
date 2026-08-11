const rateLimit = require('express-rate-limit');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpCodes');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Nombre maximal de requêtes atteint. Veuillez réessayer dans 15 minutes.',
      details: [],
    },
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Trop de tentatives de connexion. Veuillez réessayer après 15 minutes.',
      details: [],
    },
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

const formSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Nombre maximal de soumissions atteint pour cette heure. Veuillez réessayer plus tard.',
      details: [],
    },
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

module.exports = {
  globalLimiter,
  authLimiter,
  formSubmissionLimiter,
};
