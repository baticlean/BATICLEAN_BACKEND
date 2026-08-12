const Testimonial = require('../models/Testimonial');
const { emitEvent } = require('../config/socket');
const AppError = require('../utils/appError');

const submitPublicTestimonial = async (data) => {
  if (!data.authorName || !data.comment) {
    throw new AppError('Le nom et le commentaire sont obligatoires.', 400);
  }

  const created = await Testimonial.create({
    authorName: data.authorName,
    company: data.company || '',
    role: data.role || 'Client Baticlean',
    rating: Number(data.rating) || 5,
    title: data.title || '',
    comment: data.comment,
    buildingType: data.buildingType || 'Résidentiel / Tertiaire',
    city: data.city || 'Abidjan',
    status: 'PENDING',
  });

  emitEvent('testimonial_created', created);
  emitEvent('data_updated', { type: 'TESTIMONIAL' });

  return created;
};

const getPublicTestimonials = async () => {
  return await Testimonial.find({ status: 'APPROVED' }).sort({ createdAt: -1 }).lean();
};

const getAdminTestimonials = async () => {
  return await Testimonial.find().sort({ createdAt: -1 }).lean();
};

const createAdminTestimonial = async (data) => {
  if (!data.authorName || !data.comment) {
    throw new AppError('Le nom et le commentaire sont obligatoires.', 400);
  }

  const created = await Testimonial.create({
    authorName: data.authorName,
    company: data.company || '',
    role: data.role || 'Promoteur / Client',
    rating: Number(data.rating) || 5,
    title: data.title || '',
    comment: data.comment,
    buildingType: data.buildingType || 'Résidentiel',
    city: data.city || 'Abidjan',
    logoUrl: data.logoUrl || '',
    status: 'APPROVED',
    isFeatured: data.isFeatured !== false,
  });

  emitEvent('testimonial_updated', created);
  emitEvent('data_updated', { type: 'TESTIMONIAL' });

  return created;
};

const updateTestimonialStatus = async (id, status) => {
  const item = await Testimonial.findById(id);
  if (!item) {
    throw new AppError('Avis client introuvable.', 404);
  }

  item.status = status;
  await item.save();

  emitEvent('testimonial_updated', item);
  emitEvent('data_updated', { type: 'TESTIMONIAL' });

  return item;
};

const deleteTestimonial = async (id) => {
  const deleted = await Testimonial.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError('Avis client introuvable.', 404);
  }

  emitEvent('testimonial_deleted', { id });
  emitEvent('data_updated', { type: 'TESTIMONIAL' });

  return deleted;
};

module.exports = {
  submitPublicTestimonial,
  getPublicTestimonials,
  getAdminTestimonials,
  createAdminTestimonial,
  updateTestimonialStatus,
  deleteTestimonial,
};
