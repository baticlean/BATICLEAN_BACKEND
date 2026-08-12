const testimonialService = require('../services/testimonialService');
const { sendSuccess } = require('../utils/responseHandler');

const submitPublicTestimonial = async (req, res, next) => {
  try {
    const testimonial = await testimonialService.submitPublicTestimonial(req.body);
    return sendSuccess(res, testimonial, 201);
  } catch (error) {
    return next(error);
  }
};

const getPublicTestimonials = async (req, res, next) => {
  try {
    const testimonials = await testimonialService.getPublicTestimonials();
    return sendSuccess(res, testimonials);
  } catch (error) {
    return next(error);
  }
};

const getAdminTestimonials = async (req, res, next) => {
  try {
    const testimonials = await testimonialService.getAdminTestimonials();
    return sendSuccess(res, testimonials);
  } catch (error) {
    return next(error);
  }
};

const createAdminTestimonial = async (req, res, next) => {
  try {
    const testimonial = await testimonialService.createAdminTestimonial(req.body);
    return sendSuccess(res, testimonial, 201);
  } catch (error) {
    return next(error);
  }
};

const updateTestimonialStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const testimonial = await testimonialService.updateTestimonialStatus(req.params.id, status);
    return sendSuccess(res, testimonial);
  } catch (error) {
    return next(error);
  }
};

const deleteTestimonial = async (req, res, next) => {
  try {
    await testimonialService.deleteTestimonial(req.params.id);
    return sendSuccess(res, { message: 'Avis client supprimé avec succès.' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  submitPublicTestimonial,
  getPublicTestimonials,
  getAdminTestimonials,
  createAdminTestimonial,
  updateTestimonialStatus,
  deleteTestimonial,
};
