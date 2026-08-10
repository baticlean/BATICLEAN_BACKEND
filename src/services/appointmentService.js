const Appointment = require('../models/Appointment');
const Settings = require('../models/Settings');
const clientService = require('./clientService');
const { generateReference } = require('../utils/referenceGenerator');
const { sendTransactionalEmail } = require('../integrations/brevo');
const AppError = require('../utils/appError');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpCodes');
const env = require('../config/env');

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
    { startTime: '08:00', endTime: '10:00', isActive: true },
    { startTime: '10:00', endTime: '12:00', isActive: true },
    { startTime: '14:00', endTime: '16:00', isActive: true },
    { startTime: '16:00', endTime: '18:00', isActive: true },
  ];

  const bookedTimes = existingAppointments.map((a) => a.startTime);

  return defaultSlots.map((slot) => ({
    startTime: slot.startTime,
    endTime: slot.endTime,
    isAvailable: slot.isActive && !bookedTimes.includes(slot.startTime),
  }));
};

const createAppointment = async (payload) => {
  const appointmentDate = new Date(payload.date);
  appointmentDate.setHours(0, 0, 0, 0);

  const isExisting = await Appointment.findOne({
    date: appointmentDate,
    startTime: payload.startTime,
    status: { $ne: 'CANCELLED' },
  });

  if (isExisting) {
    throw new AppError(
      'Ce créneau horaire est déjà réservé. Veuillez choisir un autre créneau.',
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.DUPLICATE_RESOURCE
    );
  }

  const client = await clientService.findOrCreateClient({
    email: payload.email,
    phone: payload.phone,
    contactName: payload.contactName,
    requesterType: 'OTHER',
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
    notes: payload.notes,
  });

  const htmlClient = `
    <h2>Demande de rendez-vous enregistrée</h2>
    <p>Bonjour ${client.contactName},</p>
    <p>Votre rendez-vous a bien été demandé sous la référence <strong>${reference}</strong> pour le <strong>${payload.date} à ${payload.startTime}</strong>.</p>
    <p>Lieu : ${payload.location}</p>
    <p>Notre équipe vous contactera pour la confirmation définitive.</p>
  `;

  await sendTransactionalEmail({
    toEmail: client.email,
    toName: client.contactName,
    subject: `Demande de rendez-vous Baticlean [${reference}]`,
    htmlContent: htmlClient,
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
