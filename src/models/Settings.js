const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: 'GENERAL',
    },
    companyName: {
      type: String,
      default: 'Baticlean',
    },
    officialPhone: {
      type: String,
      default: 'TODO_CONFIG_OFFICIAL_PHONE',
    },
    officialWhatsapp: {
      type: String,
      default: 'TODO_CONFIG_OFFICIAL_WHATSAPP',
    },
    officialEmail: {
      type: String,
      default: 'TODO_CONFIG_OFFICIAL_EMAIL',
    },
    officialAddress: {
      type: String,
      default: 'TODO_CONFIG_OFFICIAL_ADDRESS',
    },
    openingHours: {
      type: String,
      default: 'Du lundi au samedi : 08h00 - 18h00',
    },
    appointmentTimeSlots: [
      {
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        isActive: { type: Boolean, default: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settings', settingsSchema);
