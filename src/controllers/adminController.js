const adminService = require('../services/adminService');
const catalogService = require('../services/catalogService');
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

const getProjects = async (req, res, next) => {
  try {
    const projects = await adminService.getAllAdminProjects();
    return sendSuccess(res, projects);
  } catch (error) {
    return next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const project = await adminService.createAdminProject(req.body);
    return sendSuccess(res, project, 201);
  } catch (error) {
    return next(error);
  }
};

const toggleProjectPublication = async (req, res, next) => {
  try {
    const project = await adminService.toggleProjectPublication(req.params.id);
    return sendSuccess(res, project);
  } catch (error) {
    return next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    await adminService.deleteAdminProject(req.params.id);
    return sendSuccess(res, { message: 'Projet supprimé avec succès.' });
  } catch (error) {
    return next(error);
  }
};

const getPartners = async (req, res, next) => {
  try {
    const partners = await adminService.getAllAdminPartners();
    return sendSuccess(res, partners);
  } catch (error) {
    return next(error);
  }
};

const createPartner = async (req, res, next) => {
  try {
    const partner = await adminService.createAdminPartner(req.body);
    return sendSuccess(res, partner, 201);
  } catch (error) {
    return next(error);
  }
};

const togglePartnerPublication = async (req, res, next) => {
  try {
    const partner = await adminService.togglePartnerPublication(req.params.id);
    return sendSuccess(res, partner);
  } catch (error) {
    return next(error);
  }
};

const deletePartner = async (req, res, next) => {
  try {
    await adminService.deleteAdminPartner(req.params.id);
    return sendSuccess(res, { message: 'Partenaire supprimé avec succès.' });
  } catch (error) {
    return next(error);
  }
};

const updateHeroMedia = async (req, res, next) => {
  try {
    const heroMedia = await catalogService.updateHeroMedia(req.body);
    return sendSuccess(res, heroMedia);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDashboardStats,
  getQuoteRequests,
  updateQuoteRequestStatus,
  convertToProject,
  getProjects,
  createProject,
  toggleProjectPublication,
  deleteProject,
  getPartners,
  createPartner,
  togglePartnerPublication,
  deletePartner,
  updateHeroMedia,
};
