const { HTTP_STATUS } = require('../constants/httpCodes');

const sendSuccess = (res, data = {}, statusCode = HTTP_STATUS.OK, pagination = null) => {
  const responsePayload = {
    success: true,
    data,
  };

  if (pagination) {
    responsePayload.pagination = pagination;
  }

  return res.status(statusCode).json(responsePayload);
};

const sendError = (res, message, statusCode = HTTP_STATUS.BAD_REQUEST, code = 'ERROR', details = []) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
