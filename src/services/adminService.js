const QuoteRequest = require('../models/QuoteRequest');
const Appointment = require('../models/Appointment');
const Quote = require('../models/Quote');
const Project = require('../models/Project');
const Partner = require('../models/Partner');
const PartnerRequest = require('../models/PartnerRequest');
const Client = require('../models/Client');
const AuditLog = require('../models/AuditLog');
const { generateReference } = require('../utils/referenceGenerator');
const { emitEvent } = require('../config/socket');
const { generateQuotePdfBuffer } = require('../utils/pdfGenerator');
const { sendTransactionalEmail } = require('../integrations/brevo');
const { createBaseEmailTemplate } = require('../utils/emailTemplates');
const AppError = require('../utils/appError');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpCodes');

const getDashboardStats = async () => {
  const [
    totalQuoteRequests,
    newQuoteRequests,
    totalAppointments,
    pendingAppointments,
    totalProjects,
    inProgressProjects,
    totalPartners,
    recentRequests,
  ] = await Promise.all([
    QuoteRequest.countDocuments(),
    QuoteRequest.countDocuments({ status: 'NEW' }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: 'PENDING' }),
    Project.countDocuments(),
    Project.countDocuments({ status: 'IN_PROGRESS' }),
    Partner.countDocuments(),
    QuoteRequest.find().sort({ createdAt: -1 }).limit(5).populate('clientId', 'contactName companyName email phone').lean(),
  ]);

  return {
    totalQuotes: totalQuoteRequests,
    pendingQuotes: newQuoteRequests,
    totalAppointments,
    pendingAppointments,
    totalProjects,
    inProgressProjects,
    totalPartners,
    quoteRequests: { total: totalQuoteRequests, new: newQuoteRequests },
    appointments: { total: totalAppointments, pending: pendingAppointments },
    projects: { total: totalProjects, inProgress: inProgressProjects },
    recentRequests,
  };
};

const getQuoteRequests = async ({ page = 1, limit = 50, status, search }) => {
  const skip = (page - 1) * limit;
  const query = {};

  if (status) query.status = status;
  if (search) {
    query.$or = [
      { reference: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ];
  }

  const [requests, total] = await Promise.all([
    QuoteRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('clientId', 'contactName companyName email phone')
      .lean(),
    QuoteRequest.countDocuments(query),
  ]);

  const formattedRequests = requests.map((r) => ({
    ...r,
    firstName: r.firstName || r.clientId?.contactName?.split(' ')[0] || r.clientId?.contactName || 'Client',
    lastName: r.lastName || r.clientId?.contactName?.split(' ').slice(1).join(' ') || '',
    phone: r.phone || r.clientId?.phone || '',
    email: r.email || r.clientId?.email || '',
  }));

  return {
    requests: formattedRequests,
    quoteRequests: formattedRequests,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateQuoteRequestStatus = async (id, status, internalNotes, userId) => {
  const request = await QuoteRequest.findById(id);
  if (!request) {
    throw new AppError('Demande introuvable.', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  const oldStatus = request.status;
  request.status = status;
  if (internalNotes) request.internalNotes = internalNotes;
  await request.save();

  await AuditLog.create({
    userId,
    action: 'UPDATE_QUOTE_REQUEST_STATUS',
    entityType: 'QuoteRequest',
    entityId: request._id,
    metadata: { oldStatus, newStatus: status },
  });

  emitEvent('quote_request_updated', { id, status, request });
  emitEvent('data_updated', { type: 'QUOTE_REQUEST' });

  return request;
};

const deleteQuoteRequest = async (id) => {
  const deleted = await QuoteRequest.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError('Demande de devis introuvable.', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
  }
  emitEvent('quote_request_deleted', { id });
  emitEvent('data_updated', { type: 'QUOTE_REQUEST' });
  return deleted;
};

// --- SERVICES DEVIS PDF BTP ---
const generateQuotePdf = async (id) => {
  const request = await QuoteRequest.findById(id).populate('clientId', 'contactName companyName email phone').lean();
  if (!request) {
    throw new AppError('Demande introuvable.', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  const pdfBuffer = await generateQuotePdfBuffer(request);
  const pdfBase64 = pdfBuffer.toString('base64');
  const filename = `Devis_Baticlean_${request.reference || 'DEV'}.pdf`;

  await QuoteRequest.findByIdAndUpdate(id, {
    pdfBase64,
    pdfStatus: 'GENERATED',
  });

  emitEvent('quote_request_updated', { id, pdfStatus: 'GENERATED' });
  emitEvent('data_updated', { type: 'QUOTE_REQUEST' });

  return {
    reference: request.reference,
    filename,
    pdfBase64,
    pdfStatus: 'GENERATED',
  };
};

const uploadCustomQuotePdf = async (id, customPdfBase64) => {
  const request = await QuoteRequest.findById(id);
  if (!request) {
    throw new AppError('Demande introuvable.', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  request.pdfBase64 = customPdfBase64;
  request.pdfStatus = 'CUSTOM_UPLOADED';
  await request.save();

  emitEvent('quote_request_updated', { id, pdfStatus: 'CUSTOM_UPLOADED' });
  emitEvent('data_updated', { type: 'QUOTE_REQUEST' });

  return {
    reference: request.reference,
    pdfStatus: 'CUSTOM_UPLOADED',
  };
};

const sendQuotePdfToClient = async (id, customNotes) => {
  const request = await QuoteRequest.findById(id).populate('clientId', 'contactName companyName email phone');
  if (!request) {
    throw new AppError('Demande introuvable.', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  let pdfBase64 = request.pdfBase64;
  if (!pdfBase64) {
    const pdfBuffer = await generateQuotePdfBuffer(request.toObject());
    pdfBase64 = pdfBuffer.toString('base64');
    request.pdfBase64 = pdfBase64;
  }

  const clientName = `${request.firstName || ''} ${request.lastName || ''}`.trim() || request.clientId?.contactName || 'Client';
  const clientEmail = request.email || request.clientId?.email;

  if (!clientEmail) {
    throw new AppError('Adresse email du client introuvable.', HTTP_STATUS.BAD_REQUEST);
  }

  const filename = `Devis_Baticlean_${request.reference}.pdf`;
  const emailSubject = `[BATICLEAN] Votre Devis Officiel de Remise en État [${request.reference}]`;

  const emailHtml = createBaseEmailTemplate({
    title: emailSubject,
    preheader: `Votre devis officiel Baticlean ${request.reference} est disponible en pièce jointe`,
    contentHtml: `
      <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0F172A;">Votre Devis Officiel est Prêt !</h1>
      <p style="margin: 0 0 20px 0; font-size: 14px; color: #334155; line-height: 1.6;">
        Bonjour <strong>${clientName}</strong>,
      </p>
      <p style="margin: 0 0 20px 0; font-size: 14px; color: #334155; line-height: 1.6;">
        Suite à votre demande concernant le nettoyage et la remise en état de votre bâtiment <strong>${request.buildingType}</strong> (${request.estimatedSurface || 0} m² à ${request.city}), nous avons le plaisir de vous transmettre votre devis officiel en pièce jointe (PDF).
      </p>
      
      ${
        customNotes
          ? `<div style="background-color: #F8FAFC; padding: 16px; border-left: 4px solid #195D9B; border-radius: 8px; margin: 20px 0;">
               <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #475569;">Note de notre direction technique :</p>
               <p style="margin: 0; font-size: 13px; color: #0F172A; line-height: 1.5;">"${customNotes}"</p>
             </div>`
          : ''
      }

      <div style="background-color: #EBF4FC; padding: 16px; border-radius: 12px; border: 1px solid #ADD1F3; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #195D9B;">Résumé de la proposition :</p>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #0F172A;">• Référence : <strong>${request.reference}</strong></p>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #0F172A;">• Type de structure : <strong>${request.buildingType}</strong> (${request.estimatedSurface || 0} m²)</p>
        <p style="margin: 0; font-size: 13px; color: #0F172A;">• Validité du devis : <strong>30 jours</strong></p>
      </div>

      <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.6;">
        Pour valider ce devis et planifier la date d'intervention de nos équipes, il vous suffit de répondre directement à cet email ou de nous contacter au <strong>+225 07 68 38 87 79</strong>.
      </p>

      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
        <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0F172A;">L'Équipe commerciale Baticlean CI</p>
      </div>
    `,
  });

  await sendTransactionalEmail({
    toEmail: clientEmail,
    toName: clientName,
    subject: emailSubject,
    htmlContent: emailHtml,
    attachments: [
      {
        name: filename,
        content: pdfBase64,
      },
    ],
  });

  request.status = 'ACCEPTED';
  request.pdfStatus = 'SENT';
  request.sentAt = new Date();
  await request.save();

  emitEvent('quote_request_updated', { id, status: 'ACCEPTED', pdfStatus: 'SENT' });
  emitEvent('data_updated', { type: 'QUOTE_REQUEST' });

  return {
    success: true,
    reference: request.reference,
    sentTo: clientEmail,
    sentAt: request.sentAt,
  };
};

const convertToProject = async (quoteRequestId, userId) => {
  const request = await QuoteRequest.findById(quoteRequestId);
  if (!request) {
    throw new AppError('Demande introuvable.', HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  const projectCount = await Project.countDocuments();
  const reference = generateReference('PRJ', projectCount + 1);
  const slug = `projet-${request.city.toLowerCase()}-${reference.toLowerCase()}`;

  const project = await Project.create({
    reference,
    name: `Nettoyage ${request.buildingType} - ${request.city}`,
    slug,
    clientId: request.clientId,
    buildingType: request.buildingType,
    city: request.city,
    commune: request.commune,
    neighborhood: request.neighborhood,
    address: request.address,
    surface: request.estimatedSurface,
    surfaceUnit: request.surfaceUnit,
    description: request.description,
    status: 'PLANNED',
    isPublishedPublic: true,
  });

  request.status = 'SCHEDULED';
  await request.save();

  await AuditLog.create({
    userId,
    action: 'CONVERT_QUOTE_REQUEST_TO_PROJECT',
    entityType: 'Project',
    entityId: project._id,
    metadata: { quoteRequestId },
  });

  emitEvent('project_created', project);
  emitEvent('data_updated', { type: 'PROJECT' });

  return project;
};

// Projects CRUD
const getAllAdminProjects = async () => {
  return await Project.find().sort({ createdAt: -1 }).lean();
};

const createAdminProject = async (projectData) => {
  const projectCount = await Project.countDocuments();
  const reference = generateReference('PRJ', projectCount + 1);
  const slug = `chantier-${reference.toLowerCase()}-${Date.now().toString().slice(-4)}`;

  const created = await Project.create({
    reference,
    slug,
    name: projectData.name,
    buildingType: projectData.buildingType || 'Résidentiel',
    city: projectData.city || 'Abidjan',
    commune: projectData.commune || 'Abidjan',
    address: projectData.address || 'Abidjan',
    surface: projectData.surface || 0,
    description: projectData.description || '',
    beforeImage: projectData.beforeImage || '',
    afterImage: projectData.afterImage || '',
    isPublishedPublic: projectData.isPublishedPublic !== false,
    status: 'COMPLETED',
  });

  emitEvent('project_created', created);
  emitEvent('data_updated', { type: 'PROJECT' });

  return created;
};

const toggleProjectPublication = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Projet introuvable', 404);
  project.isPublishedPublic = !project.isPublishedPublic;
  await project.save();

  emitEvent('project_updated', project);
  emitEvent('data_updated', { type: 'PROJECT' });

  return project;
};

const deleteAdminProject = async (projectId) => {
  const deleted = await Project.findByIdAndDelete(projectId);
  emitEvent('project_deleted', { id: projectId });
  emitEvent('data_updated', { type: 'PROJECT' });
  return deleted;
};

// Partners CRUD
const getAllAdminPartners = async () => {
  return await Partner.find().sort({ createdAt: -1 }).lean();
};

const createAdminPartner = async (partnerData) => {
  const created = await Partner.create({
    name: partnerData.name,
    logoUrl: partnerData.logoUrl || '',
    category: partnerData.category || 'Promoteur / BTP',
    description: partnerData.description || '',
    websiteUrl: partnerData.websiteUrl || '',
    contactPhone: partnerData.contactPhone || '',
    contactEmail: partnerData.contactEmail || '',
    isPublished: partnerData.isPublished !== false,
  });

  emitEvent('partner_created', created);
  emitEvent('data_updated', { type: 'PARTNER' });

  return created;
};

const updateAdminPartner = async (partnerId, partnerData) => {
  const partner = await Partner.findById(partnerId);
  if (!partner) throw new AppError('Partenaire introuvable', 404);

  if (partnerData.name) partner.name = partnerData.name;
  if (partnerData.category) partner.category = partnerData.category;
  if (partnerData.logoUrl !== undefined) partner.logoUrl = partnerData.logoUrl;
  if (partnerData.description !== undefined) partner.description = partnerData.description;
  if (partnerData.websiteUrl !== undefined) partner.websiteUrl = partnerData.websiteUrl;
  if (partnerData.contactPhone !== undefined) partner.contactPhone = partnerData.contactPhone;
  if (partnerData.contactEmail !== undefined) partner.contactEmail = partnerData.contactEmail;
  if (partnerData.isPublished !== undefined) partner.isPublished = partnerData.isPublished;

  await partner.save();

  emitEvent('partner_updated', partner);
  emitEvent('data_updated', { type: 'PARTNER' });

  return partner;
};

const togglePartnerPublication = async (partnerId) => {
  const partner = await Partner.findById(partnerId);
  if (!partner) throw new AppError('Partenaire introuvable', 404);
  partner.isPublished = !partner.isPublished;
  await partner.save();

  emitEvent('partner_updated', partner);
  emitEvent('data_updated', { type: 'PARTNER' });

  return partner;
};

const deleteAdminPartner = async (partnerId) => {
  const deleted = await Partner.findByIdAndDelete(partnerId);
  emitEvent('partner_deleted', { id: partnerId });
  emitEvent('data_updated', { type: 'PARTNER' });
  return deleted;
};

module.exports = {
  getDashboardStats,
  getQuoteRequests,
  updateQuoteRequestStatus,
  deleteQuoteRequest,
  generateQuotePdf,
  uploadCustomQuotePdf,
  sendQuotePdfToClient,
  convertToProject,
  getAllAdminProjects,
  createAdminProject,
  toggleProjectPublication,
  deleteAdminProject,
  getAllAdminPartners,
  createAdminPartner,
  updateAdminPartner,
  togglePartnerPublication,
  deleteAdminPartner,
};
