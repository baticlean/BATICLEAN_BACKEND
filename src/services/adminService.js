const QuoteRequest = require('../models/QuoteRequest');
const Appointment = require('../models/Appointment');
const Quote = require('../models/Quote');
const Project = require('../models/Project');
const Client = require('../models/Client');
const AuditLog = require('../models/AuditLog');
const { generateReference } = require('../utils/referenceGenerator');
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
    recentRequests,
  ] = await Promise.all([
    QuoteRequest.countDocuments(),
    QuoteRequest.countDocuments({ status: 'NEW' }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: 'PENDING' }),
    Project.countDocuments(),
    Project.countDocuments({ status: 'IN_PROGRESS' }),
    QuoteRequest.find().sort({ createdAt: -1 }).limit(5).populate('clientId', 'contactName companyName email phone').lean(),
  ]);

  return {
    quoteRequests: { total: totalQuoteRequests, new: newQuoteRequests },
    appointments: { total: totalAppointments, pending: pendingAppointments },
    projects: { total: totalProjects, inProgress: inProgressProjects },
    recentRequests,
  };
};

const getQuoteRequests = async ({ page = 1, limit = 10, status, search }) => {
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

  return {
    requests,
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

  return project;
};

module.exports = {
  getDashboardStats,
  getQuoteRequests,
  updateQuoteRequestStatus,
  convertToProject,
};
