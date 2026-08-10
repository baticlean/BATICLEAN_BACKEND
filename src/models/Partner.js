const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du partenaire est obligatoire.'],
      trim: true,
    },
    logoUrl: {
      type: String,
      required: [true, 'Le logo du partenaire est obligatoire.'],
    },
    description: {
      type: String,
      trim: true,
    },
    websiteUrl: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      default: 'BTP & Construction',
    },
    order: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Partner', partnerSchema);
