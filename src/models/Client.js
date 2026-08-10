const mongoose = require('mongoose');
const { CLIENT_TYPES } = require('../constants/enums');

const clientSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(CLIENT_TYPES),
      default: CLIENT_TYPES.INDIVIDUAL,
      required: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    contactName: {
      type: String,
      required: [true, 'Le nom du responsable ou contact est obligatoire.'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Le numéro de téléphone est obligatoire.'],
      trim: true,
      index: true,
    },
    whatsapp: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'adresse email est obligatoire."],
      lowercase: true,
      trim: true,
      index: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    commune: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

clientSchema.index({ email: 1, phone: 1 });

module.exports = mongoose.model('Client', clientSchema);
