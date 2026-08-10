const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpCodes');

class AppError extends Error {
  constructor(
    message,
    statusCode = HTTP_STATUS.BAD_REQUEST,
    code = ERROR_CODES.VALIDATION_ERROR,
    details = []
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
