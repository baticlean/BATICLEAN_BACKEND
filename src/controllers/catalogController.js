const catalogService = require('../services/catalogService');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpCodes');

const getServices = async (req, res, next) => {
  try {
    const services = await catalogService.getPublishedServices();
    return sendSuccess(res, services);
  } catch (error) {
    return next(error);
  }
};

const getServiceBySlug = async (req, res, next) => {
  try {
    const service = await catalogService.getServiceBySlug(req.params.slug);
    if (!service) {
      return sendError(res, 'Prestation introuvable.', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
    }
    return sendSuccess(res, service);
  } catch (error) {
    return next(error);
  }
};

const getBuildingTypes = async (req, res, next) => {
  try {
    const buildingTypes = await catalogService.getPublishedBuildingTypes();
    return sendSuccess(res, buildingTypes);
  } catch (error) {
    return next(error);
  }
};

const getPartners = async (req, res, next) => {
  try {
    const partners = await catalogService.getPublishedPartners();
    return sendSuccess(res, partners);
  } catch (error) {
    return next(error);
  }
};

const getTestimonials = async (req, res, next) => {
  try {
    const testimonials = await catalogService.getPublishedTestimonials();
    return sendSuccess(res, testimonials);
  } catch (error) {
    return next(error);
  }
};

const getPublicProjects = async (req, res, next) => {
  try {
    const { page, limit, category } = req.query;
    const result = await catalogService.getPublicProjects(page, limit, category);
    return sendSuccess(res, result.projects, HTTP_STATUS.OK, result.pagination);
  } catch (error) {
    return next(error);
  }
};

const getPublicStats = async (req, res, next) => {
  try {
    const stats = await catalogService.getPublicStats();
    return sendSuccess(res, stats);
  } catch (error) {
    return next(error);
  }
};

const getHeroMedia = async (req, res, next) => {
  try {
    const heroMedia = await catalogService.getHeroMedia();
    return sendSuccess(res, heroMedia);
  } catch (error) {
    return next(error);
  }
};

const getCompanySettings = async (req, res, next) => {
  try {
    const companySettings = await catalogService.getCompanySettings();
    return sendSuccess(res, companySettings);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getServices,
  getServiceBySlug,
  getBuildingTypes,
  getPartners,
  getTestimonials,
  getPublicProjects,
  getPublicStats,
  getHeroMedia,
  getCompanySettings,
};
