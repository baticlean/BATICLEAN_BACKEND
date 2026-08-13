const Service = require('../models/Service');
const { emitEvent } = require('../config/socket');
const AppError = require('../utils/appError');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpCodes');

const defaultServices = [
  {
    name: 'Nettoyage de Fin de Chantier',
    slug: 'nettoyage-fin-de-chantier',
    category: 'Gros Œuvre & Second Œuvre',
    shortDescription: 'Élimination complète des poussières de ciment, résidus de mortier, traces de peinture, colle et plâtre sur toutes les surfaces neuves.',
    description: 'Prestation complète de remise en état comprenant le brossage et décapage mécanique des sols, le dépoussiérage des conduits et plinthes, le lavage des baies vitrées et la désinfection intégrale des sanitaires avant la livraison du bâtiment.',
    features: [
      'Brossage et décapage mécanique des sols',
      'Nettoyage approfondi des vitres et encadrements',
      'Dépoussiérage des conduits, plinthes et luminaires',
      'Désinfection des sanitaires et pièces d’eau',
    ],
    highlight: 'Idéal avant remise des clés',
    isPublished: true,
    displayOrder: 1,
  },
  {
    name: 'Remise en État avant Aménagement',
    slug: 'remise-en-etat-avant-amenagement',
    category: 'Finition & Livraison',
    shortDescription: 'Nettoyage de haute précision pour préparer l’arrivée du mobilier, du matériel informatique ou l’emménagement des résidents.',
    description: 'Intervention soignée avec lavage hygiénique des sols délicats, dépoussiérage fin, finition des menuiseries et astiquage des robinetteries pour assurer une mise en service immédiate du bâtiment.',
    features: [
      'Lavage et lustrage des sols délicats',
      'Nettoyage hygiénique des cuisines et sanitaires',
      'Nettoyage des baies vitrées et verrières',
      'Élimination des micro-poussières en suspension',
    ],
    highlight: "Prêt à l'emploi immédiat",
    isPublished: true,
    displayOrder: 2,
  },
  {
    name: 'Nettoyage de Façades & Vitrerie Spécialisée',
    slug: 'nettoyage-vitrerie-facades-specialisee',
    category: 'Extérieurs & Façades',
    shortDescription: 'Lavage haute pression et nettoyage à la perche télescopique des vitres, baies et bardages extérieurs.',
    description: 'Intervention spécialisée en hauteur pour le grattage des bavures de peinture/silicone, le lavage des vitres inaccessibles, le dépoussiérage des grilles de ventilation et la mise en valeur de vos façades.',
    features: [
      'Nettoyage des vitres en hauteur',
      'Dépoussiérage des grilles de ventilation',
      'Nettoyage des coursives, balcons et verrières',
    ],
    highlight: 'Sécurité et matériel adapté',
    isPublished: true,
    displayOrder: 3,
  },
];

// Fonction d'auto-migration pour s'assurer qu'aucun service initial n'est perdu
const ensureDefaultServicesSeeded = async () => {
  try {
    for (const ds of defaultServices) {
      const exists = await Service.findOne({ slug: ds.slug });
      if (!exists) {
        await Service.create(ds);
        console.log(`[Service Module] Service par défaut "${ds.name}" créé avec succès.`);
      }
    }
  } catch (error) {
    console.warn('[Service Module] Avertissement lors du seed auto :', error.message);
  }
};

const getPublicServices = async () => {
  await ensureDefaultServicesSeeded();
  return await Service.find({ isPublished: true }).sort({ displayOrder: 1, createdAt: 1 });
};

const getAdminServices = async () => {
  await ensureDefaultServicesSeeded();
  return await Service.find().sort({ displayOrder: 1, createdAt: 1 });
};

const createService = async (serviceData) => {
  const baseSlug = serviceData.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const slug = serviceData.slug || `${baseSlug}-${Date.now().toString().slice(-4)}`;

  const features = Array.isArray(serviceData.features)
    ? serviceData.features
    : typeof serviceData.features === 'string'
    ? serviceData.features.split('\n').map((f) => f.trim()).filter(Boolean)
    : [];

  const created = await Service.create({
    name: serviceData.name,
    slug,
    category: serviceData.category || 'Prestation BTP',
    shortDescription: serviceData.shortDescription || serviceData.description,
    description: serviceData.description,
    features,
    highlight: serviceData.highlight || '',
    imageUrl: serviceData.imageUrl || '',
    isPublished: serviceData.isPublished !== false,
    displayOrder: Number(serviceData.displayOrder || 0),
  });

  emitEvent('service_created', created);
  emitEvent('data_updated', { type: 'SERVICE' });

  return created;
};

const updateService = async (id, serviceData) => {
  const service = await Service.findById(id);
  if (!service) {
    throw new AppError('Prestation introuvable.', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  if (serviceData.name) service.name = serviceData.name;
  if (serviceData.category) service.category = serviceData.category;
  if (serviceData.shortDescription !== undefined) service.shortDescription = serviceData.shortDescription;
  if (serviceData.description) service.description = serviceData.description;
  if (serviceData.highlight !== undefined) service.highlight = serviceData.highlight;
  if (serviceData.imageUrl !== undefined) service.imageUrl = serviceData.imageUrl;
  if (serviceData.isPublished !== undefined) service.isPublished = serviceData.isPublished;
  if (serviceData.displayOrder !== undefined) service.displayOrder = Number(serviceData.displayOrder);

  if (serviceData.features !== undefined) {
    service.features = Array.isArray(serviceData.features)
      ? serviceData.features
      : typeof serviceData.features === 'string'
      ? serviceData.features.split('\n').map((f) => f.trim()).filter(Boolean)
      : service.features;
  }

  await service.save();

  emitEvent('service_updated', service);
  emitEvent('data_updated', { type: 'SERVICE' });

  return service;
};

const toggleServicePublication = async (id) => {
  const service = await Service.findById(id);
  if (!service) {
    throw new AppError('Prestation introuvable.', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  service.isPublished = !service.isPublished;
  await service.save();

  emitEvent('service_updated', service);
  emitEvent('data_updated', { type: 'SERVICE' });

  return service;
};

const deleteService = async (id) => {
  const deleted = await Service.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError('Prestation introuvable.', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  emitEvent('service_deleted', { id });
  emitEvent('data_updated', { type: 'SERVICE' });

  return deleted;
};

module.exports = {
  getPublicServices,
  getAdminServices,
  createService,
  updateService,
  toggleServicePublication,
  deleteService,
};
