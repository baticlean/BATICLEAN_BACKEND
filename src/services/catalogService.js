const Service = require('../models/Service');
const BuildingType = require('../models/BuildingType');
const Partner = require('../models/Partner');
const Testimonial = require('../models/Testimonial');
const Project = require('../models/Project');
const QuoteRequest = require('../models/QuoteRequest');
const Appointment = require('../models/Appointment');
const Settings = require('../models/Settings');

const getPublishedServices = async () => {
  return await Service.find({ isPublishedPublic: true }).sort({ displayOrder: 1 });
};

const getServiceBySlug = async (slug) => {
  return await Service.findOne({ slug, isPublishedPublic: true });
};

const getPublishedBuildingTypes = async () => {
  return await BuildingType.find({ isPublishedPublic: true }).sort({ displayOrder: 1 });
};

const getBuildingTypeBySlug = async (slug) => {
  return await BuildingType.findOne({ slug, isPublishedPublic: true });
};

const getPublishedPartners = async () => {
  return await Partner.find({ isPublished: true }).sort({ createdAt: -1 });
};

const getPublishedTestimonials = async () => {
  return await Testimonial.find({ isPublished: true }).sort({ createdAt: -1 });
};

const getPublicProjects = async (filter = {}) => {
  const query = { isPublishedPublic: true };
  if (filter.buildingType) query.buildingType = filter.buildingType;
  if (filter.city) query.city = filter.city;

  return await Project.find(query).sort({ createdAt: -1 });
};

const getPublicStats = async () => {
  const [completedQuotes, completedAppointments] = await Promise.all([
    QuoteRequest.countDocuments({ status: 'COMPLETED' }),
    Appointment.countDocuments({ status: 'COMPLETED' }),
  ]);

  return {
    deliveredProjects: completedQuotes + completedAppointments,
    conformityRate: 100,
    avgQuoteTimeHours: 24,
  };
};

const getHeroMedia = async () => {
  let settings = await Settings.findOne({ key: 'GENERAL' }).lean();
  if (!settings) {
    const created = await Settings.create({ key: 'GENERAL' });
    settings = created.toObject();
  }
  return settings.heroMedia || {
    mediaType: 'IMAGE',
    mediaUrl: '/logo.png',
    videoUrl: '',
    carouselImages: ['/logo.png'],
  };
};

const updateHeroMedia = async (heroMediaData) => {
  let settings = await Settings.findOne({ key: 'GENERAL' });
  if (!settings) {
    settings = new Settings({ key: 'GENERAL' });
  }

  const mediaUrl = (heroMediaData.mediaUrl && heroMediaData.mediaUrl.trim()) 
    ? heroMediaData.mediaUrl.trim() 
    : '/logo.png';

  settings.heroMedia = {
    mediaType: heroMediaData.mediaType || 'IMAGE',
    mediaUrl,
    videoUrl: heroMediaData.videoUrl || '',
    carouselImages: Array.isArray(heroMediaData.carouselImages) && heroMediaData.carouselImages.length > 0
      ? heroMediaData.carouselImages
      : [mediaUrl],
  };

  settings.markModified('heroMedia');
  await settings.save();
  return settings.heroMedia;
};

module.exports = {
  getPublishedServices,
  getServiceBySlug,
  getPublishedBuildingTypes,
  getBuildingTypeBySlug,
  getPublishedPartners,
  getPublishedTestimonials,
  getPublicProjects,
  getPublicStats,
  getHeroMedia,
  updateHeroMedia,
};
