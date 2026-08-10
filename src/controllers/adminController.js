const adminService = require('../services/adminService');
const { sendSuccess } = require('../utils/responseHandler');

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    return sendSuccess(res, stats);
  } catch (error) {
    return next(error);
  }
};

const getQuoteRequests = async (req, res, next) => {
  try {
    const { page, limit, status, search } = req.query;
    const result = await adminService.getQuoteRequests({ page, limit, status, search });
    return sendSuccess(res, result.requests, 200, result.pagination);
  } catch (error) {
    return next(error);
  }
};

const updateQuoteRequestStatus = async (req, res, next) => {
  try {
    const { status, internalNotes } = req.body;
    const updated = await adminService.updateQuoteRequestStatus(
      req.params.id,
      status,
      internalNotes,
      req.user._id
    );
    return sendSuccess(res, updated);
  } catch (error) {
    return next(error);
  }
};

const convertToProject = async (req, res, next) => {
  try {
    const project = await adminService.convertToProject(req.params.id, req.user._id);
    return sendSuccess(res, project, 201);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDashboardStats,
  getQuoteRequests,
  updateQuoteRequestStatus,
  convertToProject,
};
