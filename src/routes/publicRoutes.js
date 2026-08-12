const express = require('express');
const catalogController = require('../controllers/catalogController');
const partnerRequestController = require('../controllers/partnerRequestController');

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

// Route publique de demande de partenariat
router.post('/partner-requests', partnerRequestController.createPartnerRequest);

module.exports = router;
