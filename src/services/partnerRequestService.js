const PartnerRequest = require('../models/PartnerRequest');
const { sendTransactionalEmail } = require('../integrations/brevo');
const { generateReference } = require('../utils/referenceGenerator');
const AppError = require('../utils/appError');
const env = require('../config/env');

const createPartnerRequest = async (data) => {
  const count = await PartnerRequest.countDocuments();
  const reference = generateReference('PAR', count + 1);

  const request = await PartnerRequest.create({
    reference,
    companyName: data.companyName,
    activitySector: data.activitySector,
    contactName: data.contactName,
    email: data.email,
    phone: data.phone,
    city: data.city || 'Abidjan',
    website: data.website || '',
    message: data.message,
  });

  // Email 1 : Notification envoyée à l'équipe Baticlean
  const adminSubject = `[NOUVELLE DEMANDE DE PARTENARIAT] - ${data.companyName} (${reference})`;
  const adminHtml = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
      <h2 style="color: #195D9B; margin-top: 0;">🤝 Demande de Partenariat Reçue</h2>
      <p>Une nouvelle demande de partenariat BTP a été soumise sur la plateforme Baticlean :</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 35%;">Référence :</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${reference}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Société / Entreprise :</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.companyName}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Secteur d'activité :</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.activitySector}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Contact responsable :</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.contactName}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email :</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.email}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Téléphone :</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.phone}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Ville / Zone :</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.city || 'Abidjan'}</td></tr>
        ${data.website ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Site Web :</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.website}</td></tr>` : ''}
      </table>
      
      <p><strong>Message / Synergie proposée :</strong></p>
      <div style="background-color: #f9f9f9; padding: 12px; border-left: 4px solid #EF9437; border-radius: 4px; font-style: italic;">
        "${data.message}"
      </div>
      
      <p style="margin-top: 20px; font-size: 12px; color: #777;">
        Connectez-vous au tableau de bord administrateur Baticlean pour valider ou refuser cette demande.
      </p>
    </div>
  `;

  await sendTransactionalEmail({
    toEmail: env.ADMIN_NOTIFICATION_EMAIL || 'baticlean225@gmail.com',
    subject: adminSubject,
    htmlContent: adminHtml,
  });

  return request;
};

const getPartnerRequests = async () => {
  return await PartnerRequest.find().sort({ createdAt: -1 }).lean();
};

const respondToPartnerRequest = async (id, status, responseNotes) => {
  const request = await PartnerRequest.findById(id);
  if (!request) {
    throw new AppError('Demande de partenariat introuvable.', 404);
  }

  request.status = status;
  if (responseNotes) request.responseNotes = responseNotes;
  await request.save();

  // Email 2 : Notification de décision envoyée au demandeur (Accepter ou Refuser)
  const isAccepted = status === 'ACCEPTED';
  const emailSubject = isAccepted
    ? `[BATICLEAN] Validation de votre demande de partenariat (${request.reference})`
    : `[BATICLEAN] Suite à votre demande de partenariat (${request.reference})`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
      <h2 style="color: ${isAccepted ? '#195D9B' : '#555'}; margin-top: 0;">
        ${isAccepted ? '🎉 Partenariat Accepté - Baticlean' : 'Information Demande de Partenariat'}
      </h2>
      <p>Bonjour <strong>${request.contactName}</strong> (${request.companyName}),</p>
      
      ${
        isAccepted
          ? `<p>Nous avons le plaisir de vous informer que votre demande de partenariat <strong>${request.reference}</strong> a été <strong>ACCEPTÉE</strong> par la direction de Baticlean Côte d'Ivoire !</p>
             <p>Notre responsable des partenariats BTP prendra directement contact avec vous par téléphone ou email pour formaliser notre convention de synergie.</p>`
          : `<p>Nous avons bien étudié votre demande de partenariat <strong>${request.reference}</strong> pour la société <strong>${request.companyName}</strong>.</p>
             <p>Après étude par notre équipe, nous ne sommes pas en mesure de donner une suite favorable à votre demande à ce jour.</p>`
      }

      ${
        responseNotes
          ? `<div style="background-color: #f4f6f9; padding: 14px; border-left: 4px solid ${isAccepted ? '#195D9B' : '#777'}; border-radius: 4px; margin: 15px 0;">
               <p style="margin: 0; font-size: 13px; font-weight: bold; color: #555;">Note de la direction :</p>
               <p style="margin: 5px 0 0 0; font-size: 14px;">"${responseNotes}"</p>
             </div>`
          : ''
      }

      <p style="margin-top: 25px;">Cordialement,<br /><strong>L'Équipe Partenariats Baticlean</strong><br /><a href="https://baticlean.ci" style="color: #195D9B;">www.baticlean.ci</a></p>
    </div>
  `;

  await sendTransactionalEmail({
    toEmail: request.email,
    toName: request.contactName,
    subject: emailSubject,
    htmlContent: emailHtml,
  });

  return request;
};

module.exports = {
  createPartnerRequest,
  getPartnerRequests,
  respondToPartnerRequest,
};
