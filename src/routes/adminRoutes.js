const express = require('express');
const adminController = require('../controllers/adminController');
const partnerRequestController = require('../controllers/partnerRequestController');
const faqController = require('../controllers/faqController');
const testimonialController = require('../controllers/testimonialController');
const serviceController = require('../controllers/serviceController');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { updateQuoteRequestStatusSchema, adminQuerySchema } = require('../validators/adminValidator');
const { USER_ROLES } = require('../constants/enums');

const router = express.Router();

router.use(authenticate);
router.use(authorize(USER_ROLES.ADMIN, USER_ROLES.TEAM));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/quote-requests', validate(adminQuerySchema), adminController.getQuoteRequests);
router.patch(
  '/quote-requests/:id/status',
  validate(updateQuoteRequestStatusSchema),
  adminController.updateQuoteRequestStatus
);
router.delete('/quote-requests/:id', adminController.deleteQuoteRequest);
router.post('/quote-requests/:id/convert-project', adminController.convertToProject);

// Routes Devis PDF BTP
router.post('/quote-requests/:id/pdf/generate', adminController.generateQuotePdf);
router.post('/quote-requests/:id/pdf/upload', adminController.uploadCustomQuotePdf);
router.post('/quote-requests/:id/pdf/send', adminController.sendQuotePdfToClient);

// Express routes for Services Catalog management
router.get('/services', serviceController.getAdminServices);
router.post('/services', serviceController.createService);
router.put('/services/:id', serviceController.updateService);
router.patch('/services/:id/toggle-publish', serviceController.toggleServicePublication);
router.delete('/services/:id', serviceController.deleteService);

// Express routes for Projects management
router.get('/projects', adminController.getProjects);
router.post('/projects', adminController.createProject);
router.patch('/projects/:id/toggle-publish', adminController.toggleProjectPublication);
router.delete('/projects/:id', adminController.deleteProject);

// Express routes for Partners management
router.get('/partners', adminController.getPartners);
router.post('/partners', adminController.createPartner);
router.put('/partners/:id', adminController.updatePartner);
router.patch('/partners/:id/toggle-publish', adminController.togglePartnerPublication);
router.delete('/partners/:id', adminController.deletePartner);

// Express routes for Partner Requests management
router.get('/partner-requests', partnerRequestController.getPartnerRequests);
router.patch('/partner-requests/:id/respond', partnerRequestController.respondToPartnerRequest);
router.delete('/partner-requests/:id', partnerRequestController.deletePartnerRequest);

// Express routes for FAQ management
router.get('/faqs', faqController.getAdminFaqs);
router.post('/faqs', faqController.createFaq);
router.put('/faqs/:id', faqController.updateFaq);
router.patch('/faqs/:id/toggle-publish', faqController.toggleFaqPublication);
router.delete('/faqs/:id', faqController.deleteFaq);

// Express routes for Testimonials / Reviews management
router.get('/testimonials', testimonialController.getAdminTestimonials);
router.post('/testimonials', testimonialController.createAdminTestimonial);
router.patch('/testimonials/:id/status', testimonialController.updateTestimonialStatus);
router.delete('/testimonials/:id', testimonialController.deleteTestimonial);

// Express route for Hero Media Settings
router.put('/hero-media', adminController.updateHeroMedia);

// Express route for Company Settings (Contact & Opening Hours)
router.put('/company-settings', adminController.updateCompanySettings);

module.exports = router;
