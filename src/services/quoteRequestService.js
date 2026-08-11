const QuoteRequest = require('../models/QuoteRequest');
const clientService = require('./clientService');
const { generateReference } = require('../utils/referenceGenerator');
const { uploadToCloudinary } = require('../integrations/cloudinary');
const { sendTransactionalEmail } = require('../integrations/brevo');
const { CLIENT_TYPES, BUILDING_TYPES, CONSTRUCTION_STATUS, DIRT_LEVELS } = require('../constants/enums');
const env = require('../config/env');

const normalizePayload = (raw) => {
  const contactName = raw.contactName || `${raw.firstName || ''} ${raw.lastName || ''}`.trim() || 'Client Baticlean';
  
  // RequesterType Enum Check
  let requesterType = raw.requesterType;
  if (!Object.values(CLIENT_TYPES).includes(requesterType)) {
    requesterType = raw.clientType === 'PROFESSIONNEL' ? CLIENT_TYPES.COMPANY : CLIENT_TYPES.INDIVIDUAL;
  }

  // BuildingType Enum Check
  let buildingType = raw.buildingType;
  if (!Object.values(BUILDING_TYPES).includes(buildingType)) {
    buildingType = BUILDING_TYPES.APARTMENT;
  }

  // ConstructionStatus Enum Check
  let constructionStatus = raw.constructionStatus;
  if (!Object.values(CONSTRUCTION_STATUS).includes(constructionStatus)) {
    constructionStatus = CONSTRUCTION_STATUS.FINISHED;
  }

  // DirtLevel Enum Check
  let dirtLevel = raw.dirtLevel;
  if (!Object.values(DIRT_LEVELS).includes(dirtLevel)) {
    dirtLevel = DIRT_LEVELS.HEAVY;
  }

  const city = raw.city || 'Abidjan';
  const commune = raw.commune || raw.district || 'Abidjan';
  const neighborhood = raw.neighborhood || raw.locationLandmark || raw.district || 'Abidjan';
  const address = raw.address || raw.district || raw.city || 'Abidjan';
  const requestedServices = raw.requestedServices || raw.servicesRequested || ['NETTOYAGE_FIN_CHANTIER'];
  const description = raw.description || raw.specificNeeds || raw.otherNeeds || '';
  const preferredDate = raw.preferredDate || raw.desiredInterventionDate || null;
  const visitRequested = raw.visitRequested ?? raw.requestSiteVisit ?? false;
  const estimatedSurface = raw.estimatedSurface ? Number(raw.estimatedSurface) : 0;
  const numberOfLevels = raw.numberOfLevels || raw.numberOfFloors || 1;

  return {
    ...raw,
    contactName,
    requesterType,
    city,
    commune,
    neighborhood,
    address,
    buildingType,
    constructionStatus,
    dirtLevel,
    requestedServices,
    description,
    preferredDate,
    visitRequested,
    estimatedSurface,
    numberOfLevels,
  };
};

const createQuoteRequest = async (rawPayload, files = []) => {
  const payload = normalizePayload(rawPayload);
  const client = await clientService.findOrCreateClient(payload);

  const count = await QuoteRequest.countDocuments();
  const reference = generateReference('DEV', count + 1);

  const mediaUrls = [];
  if (files && files.length > 0) {
    for (const file of files) {
      const uploaded = await uploadToCloudinary(file.buffer, 'quote-requests');
      mediaUrls.push({
        url: uploaded.url,
        publicId: uploaded.publicId,
        fileName: file.originalname,
      });
    }
  }

  const quoteRequest = await QuoteRequest.create({
    reference,
    clientId: client._id,
    requesterType: payload.requesterType,
    buildingType: payload.buildingType,
    city: payload.city,
    commune: payload.commune,
    neighborhood: payload.neighborhood,
    address: payload.address,
    estimatedSurface: payload.estimatedSurface,
    surfaceUnit: payload.surfaceUnit || 'm²',
    numberOfLevels: payload.numberOfLevels || 1,
    numberOfRooms: payload.numberOfRooms,
    constructionStatus: payload.constructionStatus,
    dirtLevel: payload.dirtLevel,
    requestedServices: payload.requestedServices || [],
    otherNeeds: payload.otherNeeds || payload.description,
    preferredTiming: payload.preferredTiming,
    preferredDate: payload.preferredDate ? new Date(payload.preferredDate) : null,
    description: payload.description,
    mediaUrls,
    visitRequested: payload.visitRequested || false,
  });

  const htmlClient = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
      <h2 style="color: #195D9B; margin-top: 0;">Confirmation de votre demande de devis Baticlean</h2>
      <p>Bonjour <strong>${client.contactName}</strong>,</p>
      <p>Votre demande de devis de nettoyage de fin de chantier a bien été enregistrée sous la référence <strong>${reference}</strong>.</p>
      <p>Notre équipe commerciale étudie vos informations et vous transmettra une estimation personnalisée sous 24h.</p>
      <br/>
      <p>Cordialement,<br/><strong>L'Équipe Baticlean Côte d'Ivoire</strong><br/><a href="https://baticlean.ci" style="color: #195D9B;">www.baticlean.ci</a></p>
    </div>
  `;

  await sendTransactionalEmail({
    toEmail: client.email,
    toName: client.contactName,
    subject: `Confirmation de votre demande de devis Baticlean [${reference}]`,
    htmlContent: htmlClient,
  });

  const htmlAdmin = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
      <h2 style="color: #EF9437; margin-top: 0;">📋 Nouvelle demande de devis reçue</h2>
      <p><strong>Référence :</strong> ${reference}</p>
      <p><strong>Client :</strong> ${client.contactName} (${client.email} - ${client.phone})</p>
      <p><strong>Localisation :</strong> ${payload.city}, ${payload.commune}</p>
      <p><strong>Bâtiment :</strong> ${payload.buildingType} (${payload.estimatedSurface} m²)</p>
      <p>Veuillez vous connecter à votre tableau de bord administrateur pour traiter cette demande.</p>
    </div>
  `;

  await sendTransactionalEmail({
    toEmail: env.ADMIN_NOTIFICATION_EMAIL || 'baticlean225@gmail.com',
    toName: 'Admin Baticlean',
    subject: `ALERTE : Nouvelle demande de devis [${reference}]`,
    htmlContent: htmlAdmin,
  });

  return {
    reference: quoteRequest.reference,
    quoteRequestId: quoteRequest._id,
    visitRequested: quoteRequest.visitRequested,
  };
};

module.exports = {
  createQuoteRequest,
};
