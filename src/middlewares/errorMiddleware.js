const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpCodes');
const logger = require('../utils/logger');
const env = require('../config/env');

const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Une erreur interne du serveur est survenue.';
  let code = err.code || ERROR_CODES.INTERNAL_ERROR;
  let details = err.details || [];

  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = `Ressource introuvable. Identifiant invalide : ${err.value}`;
    code = ERROR_CODES.RESOURCE_NOT_FOUND;
  }

  if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    const field = Object.keys(err.keyValue || {})[0] || 'champ';
    message = `La valeur saisie pour le champ '${field}' existe déjà.`;
    code = ERROR_CODES.DUPLICATE_RESOURCE;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Jeton de sécurité invalide.';
    code = ERROR_CODES.INVALID_TOKEN;
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Le jeton de session a expiré.';
    code = ERROR_CODES.TOKEN_EXPIRED;
  }

  if (statusCode >= 500) {
    logger.error(`[Erreur Serveur] ${req.method} ${req.originalUrl} - ${err.stack || err.message}`);
  } else {
    logger.warn(`[Erreur Client] ${req.method} ${req.originalUrl} - ${message}`);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

module.exports = errorMiddleware;
