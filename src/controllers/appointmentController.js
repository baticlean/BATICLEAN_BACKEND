const appointmentService = require('../services/appointmentService');
const { sendSuccess } = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../constants/httpCodes');

const getAvailability = async (req, res, next) => {
  try {
    const slots = await appointmentService.checkAvailability(req.query.date);
    return sendSuccess(res, { slots });
  } catch (error) {
    return next(error);
  }
};

const requestAppointment = async (req, res, next) => {
  try {
    const result = await appointmentService.createAppointment(req.body);
    return sendSuccess(res, result, HTTP_STATUS.CREATED);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAvailability,
  requestAppointment,
};
