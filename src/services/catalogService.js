const Service = require('../models/Service');
const BuildingType = require('../models/BuildingType');
const Partner = require('../models/Partner');
const Testimonial = require('../models/Testimonial');
const Project = require('../models/Project');
const QuoteRequest = require('../models/QuoteRequest');
const Appointment = require('../models/Appointment');
const Settings = require('../models/Settings');
const { emitEvent } = require('../config/socket');

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

  emitEvent('hero_media_updated', settings.heroMedia);
  emitEvent('data_updated', { type: 'HERO_MEDIA' });

  return settings.heroMedia;
};

const getCompanySettings = async () => {
  let settings = await Settings.findOne({ key: 'GENERAL' }).lean();
  if (!settings) {
    const created = await Settings.create({ key: 'GENERAL' });
    settings = created.toObject();
  }

  return {
    companyName: settings.companyName || "Baticlean Côte d'Ivoire",
    officialPhone: settings.officialPhone || '+225 07 68 38 87 79',
    phoneSecondary: settings.phoneSecondary || '+225 01 02 03 04 05',
    officialWhatsapp: settings.officialWhatsapp || '+2250768388779',
    officialEmail: settings.officialEmail || 'contact@baticlean.ci',
    emailDevis: settings.emailDevis || 'devis@baticlean.ci',
    officialAddress: settings.officialAddress || "Abidjan, Côte d'Ivoire - Cocody Angré 8ème Tranche",
    openingHoursWeek: settings.openingHoursWeek || 'Lundi - Samedi : 07h30 - 18h30',
    openingHoursWeekend: settings.openingHoursWeekend || 'Dimanche : Sur rendez-vous uniquement',
    googleMapsUrl: settings.googleMapsUrl || '',
  };
};

const updateCompanySettings = async (data) => {
  let settings = await Settings.findOne({ key: 'GENERAL' });
  if (!settings) {
    settings = new Settings({ key: 'GENERAL' });
  }

  if (data.companyName) settings.companyName = data.companyName;
  if (data.officialPhone) settings.officialPhone = data.officialPhone;
  if (data.phoneSecondary) settings.phoneSecondary = data.phoneSecondary;
  if (data.officialWhatsapp) settings.officialWhatsapp = data.officialWhatsapp;
  if (data.officialEmail) settings.officialEmail = data.officialEmail;
  if (data.emailDevis) settings.emailDevis = data.emailDevis;
  if (data.officialAddress) settings.officialAddress = data.officialAddress;
  if (data.openingHoursWeek) settings.openingHoursWeek = data.openingHoursWeek;
  if (data.openingHoursWeekend) settings.openingHoursWeekend = data.openingHoursWeekend;
  if (data.googleMapsUrl !== undefined) settings.googleMapsUrl = data.googleMapsUrl;

  await settings.save();

  const result = {
    companyName: settings.companyName,
    officialPhone: settings.officialPhone,
    phoneSecondary: settings.phoneSecondary,
    officialWhatsapp: settings.officialWhatsapp,
    officialEmail: settings.officialEmail,
    emailDevis: settings.emailDevis,
    officialAddress: settings.officialAddress,
    openingHoursWeek: settings.openingHoursWeek,
    openingHoursWeekend: settings.openingHoursWeekend,
    googleMapsUrl: settings.googleMapsUrl,
  };

  emitEvent('company_settings_updated', result);
  emitEvent('data_updated', { type: 'COMPANY_SETTINGS' });

  return result;
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
  getCompanySettings,
  updateCompanySettings,
};
