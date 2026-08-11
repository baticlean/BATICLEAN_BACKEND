const partnerRequestService = require('../services/partnerRequestService');
const { sendSuccess } = require('../utils/responseHandler');

const createPartnerRequest = async (req, res, next) => {
  try {
    const request = await partnerRequestService.createPartnerRequest(req.body);
    return sendSuccess(res, request, 201);
  } catch (error) {
    return next(error);
  }
};

const getPartnerRequests = async (req, res, next) => {
  try {
    const requests = await partnerRequestService.getPartnerRequests();
    return sendSuccess(res, requests);
  } catch (error) {
    return next(error);
  }
};

const respondToPartnerRequest = async (req, res, next) => {
  try {
    const { status, responseNotes } = req.body;
    const request = await partnerRequestService.respondToPartnerRequest(req.params.id, status, responseNotes);
    return sendSuccess(res, request);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPartnerRequest,
  getPartnerRequests,
  respondToPartnerRequest,
};
