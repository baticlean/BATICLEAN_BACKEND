const express = require('express');
const authRoutes = require('./authRoutes');
const quoteRequestRoutes = require('./quoteRequestRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const publicRoutes = require('./publicRoutes');
const contactRoutes = require('./contactRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.use('/auth', authRoutes);

// Devis (Quote Requests) : accessible sous /quote-requests ET /public/quote-requests
router.use('/quote-requests', quoteRequestRoutes);
router.use('/public/quote-requests', quoteRequestRoutes);

// Rendez-vous (Appointments) : accessible sous /appointments ET /public/appointments
router.use('/appointments', appointmentRoutes);
router.use('/public/appointments', appointmentRoutes);

// Contact : accessible sous /contact ET /public/contact
router.use('/contact', contactRoutes);
router.use('/public/contact', contactRoutes);

// Administration
router.use('/admin', adminRoutes);

// Routes publiques générales (Services, Bâtiments, Partenaires, Projets, Stats, Hero Média, Partner Requests)
router.use('/public', publicRoutes);
router.use('/', publicRoutes);

module.exports = router;
