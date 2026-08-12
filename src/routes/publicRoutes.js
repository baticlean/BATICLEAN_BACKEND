const express = require('express');
const catalogController = require('../controllers/catalogController');
const partnerRequestController = require('../controllers/partnerRequestController');
const faqController = require('../controllers/faqController');
const testimonialController = require('../controllers/testimonialController');

const router = express.Router();

router.get('/services', catalogController.getServices);
router.get('/services/:slug', catalogController.getServiceBySlug);
router.get('/building-types', catalogController.getBuildingTypes);
router.get('/partners', catalogController.getPartners);
router.get('/testimonials', catalogController.getTestimonials);
router.get('/projects/public', catalogController.getPublicProjects);
router.get('/stats', catalogController.getPublicStats);

// Route publique du média Hero (Image/Vidéo/Carrousel)
router.get('/hero-media', catalogController.getHeroMedia);

// Route publique des coordonnées et horaires de la société
router.get('/company-settings', catalogController.getCompanySettings);

// Route publique de la Foire Aux Questions (FAQ)
router.get('/faqs/public', faqController.getPublicFaqs);

// Routes publiques des Avis & Témoignages Clients BTP
router.get('/testimonials/public', testimonialController.getPublicTestimonials);
router.post('/testimonials/submit', testimonialController.submitPublicTestimonial);

// Route publique de demande de partenariat
router.post('/partner-requests', partnerRequestController.createPartnerRequest);

module.exports = router;
