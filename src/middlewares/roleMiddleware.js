const AppError = require('../utils/appError');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpCodes');

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(
      new AppError(
        "Utilisateur non authentifié.",
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.AUTHENTICATION_ERROR
      )
    );
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(
      new AppError(
        "Vous ne possédez pas les autorisations nécessaires pour exécuter cette action.",
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.AUTHORIZATION_ERROR
      )
    );
  }

  return next();
};

module.exports = authorize;
