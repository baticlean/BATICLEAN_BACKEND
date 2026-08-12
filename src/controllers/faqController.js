const faqService = require('../services/faqService');
const { sendSuccess } = require('../utils/responseHandler');

const getPublicFaqs = async (req, res, next) => {
  try {
    const faqs = await faqService.getPublicFaqs();
    return sendSuccess(res, faqs);
  } catch (error) {
    return next(error);
  }
};

const getAdminFaqs = async (req, res, next) => {
  try {
    const faqs = await faqService.getAdminFaqs();
    return sendSuccess(res, faqs);
  } catch (error) {
    return next(error);
  }
};

const createFaq = async (req, res, next) => {
  try {
    const faq = await faqService.createFaq(req.body);
    return sendSuccess(res, faq, 201);
  } catch (error) {
    return next(error);
  }
};

const updateFaq = async (req, res, next) => {
  try {
    const faq = await faqService.updateFaq(req.params.id, req.body);
    return sendSuccess(res, faq);
  } catch (error) {
    return next(error);
  }
};

const toggleFaqPublication = async (req, res, next) => {
  try {
    const faq = await faqService.toggleFaqPublication(req.params.id);
    return sendSuccess(res, faq);
  } catch (error) {
    return next(error);
  }
};

const deleteFaq = async (req, res, next) => {
  try {
    await faqService.deleteFaq(req.params.id);
    return sendSuccess(res, { message: 'FAQ supprimée avec succès.' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPublicFaqs,
  getAdminFaqs,
  createFaq,
  updateFaq,
  toggleFaqPublication,
  deleteFaq,
};
