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
      default: "Baticlean Côte d'Ivoire",
    },
    officialPhone: {
      type: String,
      default: '+225 07 68 38 87 79',
    },
    phoneSecondary: {
      type: String,
      default: '+225 01 02 03 04 05',
    },
    officialWhatsapp: {
      type: String,
      default: '+2250768388779',
    },
    officialEmail: {
      type: String,
      default: 'contact@baticlean.ci',
    },
    emailDevis: {
      type: String,
      default: 'devis@baticlean.ci',
    },
    officialAddress: {
      type: String,
      default: "Abidjan, Côte d'Ivoire - Cocody Angré 8ème Tranche",
    },
    openingHoursWeek: {
      type: String,
      default: 'Lundi - Samedi : 07h30 - 18h30',
    },
    openingHoursWeekend: {
      type: String,
      default: 'Dimanche : Sur rendez-vous uniquement',
    },
    googleMapsUrl: {
      type: String,
      default: '',
    },
    appointmentTimeSlots: [
      {
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        isActive: { type: Boolean, default: true },
      },
    ],
    heroMedia: {
      mediaType: {
        type: String,
        enum: ['IMAGE', 'VIDEO', 'CAROUSEL'],
        default: 'IMAGE',
      },
      mediaUrl: {
        type: String,
        default: '/logo.png',
      },
      videoUrl: {
        type: String,
        default: '',
      },
      carouselImages: {
        type: [String],
        default: ['/logo.png'],
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settings', settingsSchema);
