const express = require('express');
const authRoutes = require('./authRoutes');
const quoteRequestRoutes = require('./quoteRequestRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const publicRoutes = require('./publicRoutes');
const contactRoutes = require('./contactRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/quote-requests', quoteRequestRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/contact', contactRoutes);
router.use('/admin', adminRoutes);
router.use('/', publicRoutes);

module.exports = router;
