const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const validate = require('../middlewares/validateMiddleware');
const { createAppointmentSchema, availabilitySchema } = require('../validators/appointmentValidator');
const { formSubmissionLimiter } = require('../middlewares/rateLimiterMiddleware');

const router = express.Router();

router.get('/availability', validate(availabilitySchema), appointmentController.getAvailability);

router.post(
  '/',
  formSubmissionLimiter,
  validate(createAppointmentSchema),
  appointmentController.requestAppointment
);

module.exports = router;
