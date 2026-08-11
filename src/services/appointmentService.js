const Appointment = require('../models/Appointment');
const Settings = require('../models/Settings');
const clientService = require('./clientService');
const { generateReference } = require('../utils/referenceGenerator');
const { sendTransactionalEmail } = require('../integrations/brevo');
const { APPOINTMENT_REASONS } = require('../constants/enums');
const AppError = require('../utils/appError');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpCodes');
const env = require('../config/env');

const normalizeAppointmentPayload = (raw) => {
  const contactName = raw.contactName || `${raw.firstName || ''} ${raw.lastName || ''}`.trim() || 'Client Baticlean';
  const email = raw.email || 'client@baticlean.ci';
  const phone = raw.phone || '+225 0000000000';
  
  let reason = raw.reason;
  if (!Object.values(APPOINTMENT_REASONS).includes(reason)) {
    reason = APPOINTMENT_REASONS.SITE_VISIT;
  }

  const location = raw.location || `${raw.city || 'Abidjan'}, ${raw.district || raw.siteAddress || 'Abidjan'}`.trim();
  const dateStr = raw.date || raw.appointmentDate || new Date().toISOString().split('T')[0];

  let startTime = raw.startTime;
  let endTime = raw.endTime;

  if (!startTime && raw.timeSlot) {
    const parts = raw.timeSlot.split('-').map((s) => s.trim());
    if (parts.length === 2) {
      startTime = parts[0];
      endTime = parts[1];
    }
  }

  if (!startTime) startTime = '08:30';
  if (!endTime) endTime = '10:00';

  return {
    ...raw,
    contactName,
    email,
    phone,
    reason,
    location,
    dateStr,
    startTime,
    endTime,
  };
};

const checkAvailability = async (dateString) => {
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const existingAppointments = await Appointment.find({
    date: { $gte: targetDate, $lt: nextDay },
    status: { $ne: 'CANCELLED' },
  }).select('startTime endTime');

  let settings = await Settings.findOne({ key: 'GENERAL' });
  const defaultSlots = settings?.appointmentTimeSlots || [
    { startTime: '08:30', endTime: '10:00', isActive: true },
    { startTime: '10:00', endTime: '11:30', isActive: true },
    { startTime: '11:30', endTime: '13:00', isActive: true },
    { startTime: '14:00', endTime: '15:30', isActive: true },
    { startTime: '15:30', endTime: '17:00', isActive: true },
    { startTime: '17:00', endTime: '18:30', isActive: true },
  ];

  const bookedTimes = existingAppointments.map((a) => a.startTime);

  return defaultSlots.map((slot) => ({
    startTime: slot.startTime,
    endTime: slot.endTime,
    isAvailable: slot.isActive && !bookedTimes.includes(slot.startTime),
  }));
};

const createAppointment = async (rawPayload) => {
  const payload = normalizeAppointmentPayload(rawPayload);

  const appointmentDate = new Date(payload.dateStr);
  appointmentDate.setHours(0, 0, 0, 0);

  const isExisting = await Appointment.findOne({
    date: appointmentDate,
    startTime: payload.startTime,
    status: { $ne: 'CANCELLED' },
  });

  if (isExisting) {
    throw new AppError(
      'Ce créneau horaire est déjà réservé pour cette date. Veuillez choisir un autre créneau.',
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.DUPLICATE_RESOURCE
    );
  }

  const client = await clientService.findOrCreateClient({
    email: payload.email,
    phone: payload.phone,
    contactName: payload.contactName,
    requesterType: 'INDIVIDUAL',
    city: payload.city || 'Abidjan',
    commune: payload.district || 'Abidjan',
  });

  const count = await Appointment.countDocuments();
  const reference = generateReference('RDV', count + 1);

  const appointment = await Appointment.create({
    reference,
    clientId: client._id,
    quoteRequestId: payload.quoteRequestId || null,
    reason: payload.reason,
    location: payload.location,
    date: appointmentDate,
    startTime: payload.startTime,
    endTime: payload.endTime,
    notes: payload.notes || '',
  });

  const htmlClient = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
      <h2 style="color: #195D9B; margin-top: 0;">Confirmation de votre demande de visite Baticlean</h2>
      <p>Bonjour <strong>${client.contactName}</strong>,</p>
      <p>Votre rendez-vous a bien été enregistré sous la référence <strong>${reference}</strong> pour le <strong>${payload.dateStr} à ${payload.startTime}</strong>.</p>
      <p><strong>Lieu de rendez-vous :</strong> ${payload.location}</p>
      <p>Notre équipe technique vous recontactera 24h avant la visite pour confirmer l'accès au site.</p>
      <br/>
      <p>Cordialement,<br/><strong>L'Équipe Baticlean Côte d'Ivoire</strong><br/><a href="https://baticlean.ci" style="color: #195D9B;">www.baticlean.ci</a></p>
    </div>
  `;

  await sendTransactionalEmail({
    toEmail: client.email,
    toName: client.contactName,
    subject: `Demande de rendez-vous Baticlean [${reference}]`,
    htmlContent: htmlClient,
  });

  const htmlAdmin = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
      <h2 style="color: #EF9437; margin-top: 0;">📅 Demande de visite de chantier enregistrée</h2>
      <p><strong>Référence :</strong> ${reference}</p>
      <p><strong>Client :</strong> ${client.contactName} (${client.email} - ${client.phone})</p>
      <p><strong>Date & Créneau :</strong> ${payload.dateStr} de ${payload.startTime} à ${payload.endTime}</p>
      <p><strong>Lieu :</strong> ${payload.location}</p>
      <p>Consultez votre tableau de bord administrateur pour valider la visite.</p>
    </div>
  `;

  await sendTransactionalEmail({
    toEmail: env.ADMIN_NOTIFICATION_EMAIL || 'baticlean225@gmail.com',
    toName: 'Admin Baticlean',
    subject: `ALERTE : Demande de rendez-vous [${reference}]`,
    htmlContent: htmlAdmin,
  });

  return {
    reference: appointment.reference,
    appointmentId: appointment._id,
    date: appointment.date,
    startTime: appointment.startTime,
    status: appointment.status,
  };
};

module.exports = {
  checkAvailability,
  createAppointment,
};
