const QuoteRequest = require('../models/QuoteRequest');
const clientService = require('./clientService');
const { generateReference } = require('../utils/referenceGenerator');
const { uploadToCloudinary } = require('../integrations/cloudinary');
const { sendTransactionalEmail } = require('../integrations/brevo');
const env = require('../config/env');

const createQuoteRequest = async (payload, files = []) => {
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
    otherNeeds: payload.otherNeeds,
    preferredTiming: payload.preferredTiming,
    preferredDate: payload.preferredDate ? new Date(payload.preferredDate) : null,
    description: payload.description,
    mediaUrls,
    visitRequested: payload.visitRequested || false,
  });

  const htmlClient = `
    <h2>Demande de devis bien reçue</h2>
    <p>Bonjour ${client.contactName},</p>
    <p>Votre demande de devis pour le nettoyage de fin de chantier a bien été enregistrée sous la référence <strong>${reference}</strong>.</p>
    <p>Notre équipe étudie actuellement vos informations et reviendra vers vous sous 24 à 48h.</p>
    <br/>
    <p>L'équipe Baticlean</p>
  `;

  await sendTransactionalEmail({
    toEmail: client.email,
    toName: client.contactName,
    subject: `Confirmation de votre demande de devis Baticlean [${reference}]`,
    htmlContent: htmlClient,
  });

  const htmlAdmin = `
    <h2>Nouvelle demande de devis enregistrée</h2>
    <p><strong>Référence :</strong> ${reference}</p>
    <p><strong>Client :</strong> ${client.contactName} (${client.email} - ${client.phone})</p>
    <p><strong>Bâtiment :</strong> ${payload.buildingType} à ${payload.city}, ${payload.commune}</p>
    <p>Veuillez consulter votre tableau de bord pour traiter cette demande.</p>
  `;

  await sendTransactionalEmail({
    toEmail: env.ADMIN_NOTIFICATION_EMAIL,
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
