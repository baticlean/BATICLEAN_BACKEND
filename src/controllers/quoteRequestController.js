const quoteRequestService = require('../services/quoteRequestService');
const { sendSuccess } = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../constants/httpCodes');

const submitQuoteRequest = async (req, res, next) => {
  try {
    const result = await quoteRequestService.createQuoteRequest(req.body, req.files);
    return sendSuccess(res, result, HTTP_STATUS.CREATED);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  submitQuoteRequest,
};
