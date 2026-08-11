const Service = require('../models/Service');
const BuildingType = require('../models/BuildingType');
const Partner = require('../models/Partner');
const Testimonial = require('../models/Testimonial');
const Project = require('../models/Project');
const ProjectMedia = require('../models/ProjectMedia');
const QuoteRequest = require('../models/QuoteRequest');
const Appointment = require('../models/Appointment');
const Settings = require('../models/Settings');

const getPublishedServices = async () => {
  return await Service.find({ isPublished: true }).sort({ order: 1 }).lean();
};

const getServiceBySlug = async (slug) => {
  return await Service.findOne({ slug, isPublished: true }).lean();
};

const getPublishedBuildingTypes = async () => {
  return await BuildingType.find({ isPublished: true }).sort({ order: 1 }).lean();
};

const getBuildingTypeBySlug = async (slug) => {
  return await BuildingType.findOne({ slug, isPublished: true }).lean();
};

const getPublishedPartners = async () => {
  return await Partner.find({ isPublished: true }).sort({ order: 1 }).lean();
};

const getPublishedTestimonials = async () => {
  return await Testimonial.find({ isPublished: true }).sort({ order: 1 }).lean();
};

const getPublicProjects = async (page = 1, limit = 10, category = null) => {
  const skip = (page - 1) * limit;
  const query = { isPublishedPublic: true };
  if (category) {
    query.buildingType = category;
  }

  const [projects, total] = await Promise.all([
    Project.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Project.countDocuments(query),
  ]);

  const projectIds = projects.map((p) => p._id);
  const mediaList = await ProjectMedia.find({
    projectId: { $in: projectIds },
    isPublished: true,
  })
    .sort({ order: 1 })
    .lean();

  const projectsWithMedia = projects.map((project) => ({
    ...project,
    media: mediaList.filter((m) => m.projectId.toString() === project._id.toString()),
  }));

  return {
    projects: projectsWithMedia,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getPublicStats = async () => {
  const [completedQuotes, completedAppointments] = await Promise.all([
    QuoteRequest.countDocuments({ status: { $in: ['COMPLETED', 'LIVRE', 'TERMINATED', 'TERMINE'] } }),
    Appointment.countDocuments({ status: { $in: ['COMPLETED', 'HONORE', 'TERMINATED', 'TERMINE'] } }),
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
  settings.heroMedia = {
    mediaType: heroMediaData.mediaType || 'IMAGE',
    mediaUrl: heroMediaData.mediaUrl || '/logo.png',
    videoUrl: heroMediaData.videoUrl || '',
    carouselImages: Array.isArray(heroMediaData.carouselImages) && heroMediaData.carouselImages.length > 0
      ? heroMediaData.carouselImages
      : ['/logo.png'],
  };
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
