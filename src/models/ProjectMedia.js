const mongoose = require('mongoose');
const { MEDIA_CATEGORIES, MEDIA_TYPES } = require('../constants/enums');

const projectMediaSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(MEDIA_TYPES),
      default: MEDIA_TYPES.IMAGE,
    },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    publicId: { type: String },
    category: {
      type: String,
      enum: Object.values(MEDIA_CATEGORIES),
      default: MEDIA_CATEGORIES.GENERAL,
      index: true,
    },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ProjectMedia', projectMediaSchema);
