const serviceService = require('../services/serviceService');
const { sendSuccess } = require('../utils/responseHandler');

const getPublicServices = async (req, res, next) => {
  try {
    const services = await serviceService.getPublicServices();
    return sendSuccess(res, services);
  } catch (error) {
    return next(error);
  }
};

const getAdminServices = async (req, res, next) => {
  try {
    const services = await serviceService.getAdminServices();
    return sendSuccess(res, services);
  } catch (error) {
    return next(error);
  }
};

const createService = async (req, res, next) => {
  try {
    const service = await serviceService.createService(req.body);
    return sendSuccess(res, service, 201);
  } catch (error) {
    return next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const service = await serviceService.updateService(req.params.id, req.body);
    return sendSuccess(res, service);
  } catch (error) {
    return next(error);
  }
};

const toggleServicePublication = async (req, res, next) => {
  try {
    const service = await serviceService.toggleServicePublication(req.params.id);
    return sendSuccess(res, service);
  } catch (error) {
    return next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    await serviceService.deleteService(req.params.id);
    return sendSuccess(res, { message: 'Prestation supprimée avec succès.' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPublicServices,
  getAdminServices,
  createService,
  updateService,
  toggleServicePublication,
  deleteService,
};
