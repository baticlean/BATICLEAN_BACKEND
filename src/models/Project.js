const mongoose = require('mongoose');
const { BUILDING_TYPES, PROJECT_STATUS } = require('../constants/enums');

const projectSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Le nom du projet est obligatoire.'],
      trim: true,
    },
    slug: {
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
    buildingType: {
      type: String,
      enum: Object.values(BUILDING_TYPES),
      required: true,
    },
    city: { type: String, required: true, trim: true },
    commune: { type: String, required: true, trim: true },
    neighborhood: { type: String, trim: true },
    address: { type: String, required: true, trim: true },

    surface: { type: Number },
    surfaceUnit: { type: String, default: 'm²' },

    description: { type: String, trim: true },

    plannedStartDate: { type: Date },
    startDate: { type: Date },
    endDate: { type: Date },

    status: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: PROJECT_STATUS.PLANNED,
      index: true,
    },

    assignedTeam: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    quoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
    },

    isPublishedPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Project', projectSchema);
