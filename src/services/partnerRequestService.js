const PartnerRequest = require('../models/PartnerRequest');
const { sendTransactionalEmail } = require('../integrations/brevo');
const { generateReference } = require('../utils/referenceGenerator');
const { createBaseEmailTemplate } = require('../utils/emailTemplates');
const { emitEvent } = require('../config/socket');
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

  emitEvent('partner_request_created', request);
  emitEvent('data_updated', { type: 'PARTNER_REQUEST' });

  // Email Notification Admin sans emoji et sans www.baticlean.ci
  const adminSubject = `[DEMANDE DE PARTENARIAT] - ${data.companyName} (${reference})`;
  const adminHtml = createBaseEmailTemplate({
    title: adminSubject,
    preheader: `Nouvelle demande de partenariat reçue de ${data.companyName}`,
    contentHtml: `
      <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0F172A;">Nouvelle Demande de Partenariat</h1>
      <p style="margin: 0 0 20px 0; font-size: 14px; color: #334155;">Une nouvelle candidature partenaire a été enregistrée :</p>
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; padding: 20px; margin-bottom: 20px;">
        <tr><td style="padding-bottom: 8px; font-size: 13px; font-weight: 700; color: #475569; width: 40%;">Référence :</td><td style="padding-bottom: 8px; font-size: 13px; font-weight: 700; color: #195D9B;">${reference}</td></tr>
        <tr><td style="padding-bottom: 8px; font-size: 13px; font-weight: 700; color: #475569;">Entreprise :</td><td style="padding-bottom: 8px; font-size: 13px; font-weight: 700; color: #0F172A;">${data.companyName}</td></tr>
        <tr><td style="padding-bottom: 8px; font-size: 13px; font-weight: 700; color: #475569;">Secteur :</td><td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #0F172A;">${data.activitySector}</td></tr>
        <tr><td style="padding-bottom: 8px; font-size: 13px; font-weight: 700; color: #475569;">Contact :</td><td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #0F172A;">${data.contactName} (${data.phone})</td></tr>
        <tr><td style="font-size: 13px; font-weight: 700; color: #475569;">Email :</td><td style="font-size: 13px; font-weight: 600; color: #195D9B;">${data.email}</td></tr>
      </table>

      <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #0F172A;">Message / Proposition :</p>
      <div style="background-color: #F1F5F9; padding: 14px; border-left: 4px solid #195D9B; border-radius: 8px; font-size: 13px; color: #334155;">
        "${data.message}"
      </div>
    `,
  });

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

  emitEvent('partner_request_updated', request);
  emitEvent('data_updated', { type: 'PARTNER_REQUEST' });

  const isAccepted = status === 'ACCEPTED';
  const emailSubject = isAccepted
    ? `Validation de votre demande de partenariat [${request.reference}]`
    : `Mise à jour concernant votre demande de partenariat [${request.reference}]`;

  const emailHtml = createBaseEmailTemplate({
    title: emailSubject,
    preheader: isAccepted ? `Votre demande de partenariat ${request.reference} est validée` : `Mise à jour concernant le dossier ${request.reference}`,
    contentHtml: `
      <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0F172A;">
        ${isAccepted ? 'Partenariat Validé' : 'Décision concernant votre demande'}
      </h1>
      <p style="margin: 0 0 20px 0; font-size: 14px; color: #334155; line-height: 1.6;">
        Bonjour <strong>${request.contactName}</strong> (${request.companyName}),
      </p>
      
      ${
        isAccepted
          ? `<p style="margin: 0 0 20px 0; font-size: 14px; color: #334155; line-height: 1.6;">
               Nous avons le plaisir de vous informer que votre demande de partenariat référence <strong>${request.reference}</strong> a été validée par la direction de Baticlean Côte d'Ivoire.
             </p>
             <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.6;">
               Notre équipe responsable des partenariats BTP prendra directement contact avec vous par téléphone ou email afin de finaliser la convention de synergie.
             </p>`
          : `<p style="margin: 0 0 20px 0; font-size: 14px; color: #334155; line-height: 1.6;">
               Nous avons bien étudié votre demande de partenariat référence <strong>${request.reference}</strong> pour la structure <strong>${request.companyName}</strong>.
             </p>
             <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.6;">
               Après examen par notre comité, nous ne sommes malheureusement pas en mesure de donner une suite favorable à votre demande actuellement.
             </p>`
      }

      ${
        responseNotes
          ? `<div style="background-color: #F8FAFC; padding: 14px; border-left: 4px solid ${isAccepted ? '#195D9B' : '#64748B'}; border-radius: 8px; margin: 20px 0;">
               <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #475569;">Note de la direction :</p>
               <p style="margin: 0; font-size: 13px; color: #0F172A;">"${responseNotes}"</p>
             </div>`
          : ''
      }

      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
        <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0F172A;">L'Équipe Partenariats Baticlean</p>
      </div>
    `,
  });

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
