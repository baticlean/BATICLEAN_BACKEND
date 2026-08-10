const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/appError');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpCodes');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(
        new AppError(
          "Authentification requise. Veuillez vous connecter.",
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.AUTHENTICATION_ERROR
        )
      );
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash').lean();

    if (!user) {
      return next(
        new AppError(
          "Utilisateur introuvable ou compte désactivé.",
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.AUTHENTICATION_ERROR
        )
      );
    }

    if (!user.isActive) {
      return next(
        new AppError(
          "Votre compte administrateur a été désactivé.",
          HTTP_STATUS.FORBIDDEN,
          ERROR_CODES.AUTHORIZATION_ERROR
        )
      );
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(
        new AppError(
          "Session expirée. Veuillez renouveler votre jeton.",
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.TOKEN_EXPIRED
        )
      );
    }
    return next(
      new AppError(
        "Jeton d'authentification invalide.",
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.INVALID_TOKEN
      )
    );
  }
};

module.exports = authenticate;
