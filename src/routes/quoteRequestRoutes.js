const express = require('express');
const multer = require('multer');
const quoteRequestController = require('../controllers/quoteRequestController');
const { formSubmissionLimiter } = require('../middlewares/rateLimiterMiddleware');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post(
  '/',
  formSubmissionLimiter,
  upload.array('media', 5),
  quoteRequestController.submitQuoteRequest
);

module.exports = router;
