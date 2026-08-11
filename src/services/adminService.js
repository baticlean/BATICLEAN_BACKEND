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

  // Formater pour que clientId contactName/phone/email soient extraits facilement si présents
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
  convertToProject,
  getAllAdminProjects,
  createAdminProject,
  toggleProjectPublication,
  deleteAdminProject,
  getAllAdminPartners,
  createAdminPartner,
  togglePartnerPublication,
  deleteAdminPartner,
};
