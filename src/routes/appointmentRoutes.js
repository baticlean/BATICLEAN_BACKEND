const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const { formSubmissionLimiter } = require('../middlewares/rateLimiterMiddleware');

const router = express.Router();

router.get('/availability', appointmentController.getAvailability);

router.post(
  '/',
  formSubmissionLimiter,
  appointmentController.requestAppointment
);

module.exports = router;
