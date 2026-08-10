const mongoose = require('mongoose');
const { APPOINTMENT_STATUS, APPOINTMENT_REASONS } = require('../constants/enums');

const appointmentSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    quoteRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuoteRequest',
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    reason: {
      type: String,
      enum: Object.values(APPOINTMENT_REASONS),
      default: APPOINTMENT_REASONS.SITE_VISIT,
      required: true,
    },
    location: {
      type: String,
      required: [true, 'Le lieu du rendez-vous est obligatoire.'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'La date du rendez-vous est obligatoire.'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, "L'heure de début est obligatoire."],
    },
    endTime: {
      type: String,
      required: [true, "L'heure de fin est obligatoire."],
    },
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: APPOINTMENT_STATUS.PENDING,
      index: true,
    },
    notes: { type: String, trim: true },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index({ date: 1, startTime: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
