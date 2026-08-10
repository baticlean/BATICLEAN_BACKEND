const express = require('express');
const catalogController = require('../controllers/catalogController');

const router = express.Router();

router.get('/services', catalogController.getServices);
router.get('/services/:slug', catalogController.getServiceBySlug);
router.get('/building-types', catalogController.getBuildingTypes);
router.get('/partners', catalogController.getPartners);
router.get('/testimonials', catalogController.getTestimonials);
router.get('/projects/public', catalogController.getPublicProjects);

module.exports = router;
