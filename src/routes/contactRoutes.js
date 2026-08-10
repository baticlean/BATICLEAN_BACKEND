const express = require('express');
const contactController = require('../controllers/contactController');
const validate = require('../middlewares/validateMiddleware');
const { contactMessageSchema } = require('../validators/contactValidator');
const { formSubmissionLimiter } = require('../middlewares/rateLimiterMiddleware');

const router = express.Router();

router.post(
  '/',
  formSubmissionLimiter,
  validate(contactMessageSchema),
  contactController.submitContactMessage
);

module.exports = router;
