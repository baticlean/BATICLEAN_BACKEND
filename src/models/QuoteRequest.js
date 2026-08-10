const mongoose = require('mongoose');
const {
  CLIENT_TYPES,
  BUILDING_TYPES,
  CONSTRUCTION_STATUS,
  DIRT_LEVELS,
  QUOTE_REQUEST_STATUS,
} = require('../constants/enums');

const quoteRequestSchema = new mongoose.Schema(
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
    requesterType: {
      type: String,
      enum: Object.values(CLIENT_TYPES),
      required: true,
    },
    buildingType: {
      type: String,
      enum: Object.values(BUILDING_TYPES),
      required: true,
      index: true,
    },
    city: { type: String, required: true, trim: true },
    commune: { type: String, required: true, trim: true },
    neighborhood: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },

    estimatedSurface: { type: Number },
    surfaceUnit: { type: String, default: 'm²' },

    numberOfLevels: { type: Number, default: 1 },
    numberOfRooms: { type: Number },

    constructionStatus: {
      type: String,
      enum: Object.values(CONSTRUCTION_STATUS),
      required: true,
    },
    dirtLevel: {
      type: String,
      enum: Object.values(DIRT_LEVELS),
      required: true,
    },

    requestedServices: [{ type: String }],
    otherNeeds: { type: String, trim: true },

    preferredTiming: { type: String },
    preferredDate: { type: Date },

    description: { type: String, trim: true },

    mediaUrls: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
        fileName: { type: String },
      },
    ],

    visitRequested: { type: Boolean, default: false },

    status: {
      type: String,
      enum: Object.values(QUOTE_REQUEST_STATUS),
      default: QUOTE_REQUEST_STATUS.NEW,
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    internalNotes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('QuoteRequest', quoteRequestSchema);
