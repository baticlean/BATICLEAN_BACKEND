const mongoose = require('mongoose');

const partnerRequestSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, 'Le nom de la société est obligatoire.'],
      trim: true,
    },
    activitySector: {
      type: String,
      required: [true, "Le secteur d'activité est obligatoire."],
      trim: true,
    },
    contactName: {
      type: String,
      required: [true, 'Le nom du contact est obligatoire.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'adresse email est obligatoire."],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Le numéro de téléphone est obligatoire.'],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      default: 'Abidjan',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      required: [true, 'La présentation/message de partenariat est obligatoire.'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    responseNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PartnerRequest', partnerRequestSchema);
