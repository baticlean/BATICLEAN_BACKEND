const Faq = require('../models/Faq');
const { emitEvent } = require('../config/socket');
const AppError = require('../utils/appError');

const DEFAULT_FAQS = [
  {
    question: "Quels types de bâtiments pouvez-vous nettoyer après chantier ?",
    answer: "Baticlean intervient sur tous types de structures neuves ou rénovées : immeubles résidentiels, tours de bureaux, villas haut de gamme, centres commerciaux, hôpitaux et installations industrielles.",
    category: "Prestations BTP",
    displayOrder: 1,
    isPublished: true,
  },
  {
    question: "Quels produits et équipements utilisez-vous pour le décapage des sols ?",
    answer: "Nous utilisons exclusivement des monobrosses professionnelles à vitesse variable, aspirateurs eau et poussière industriels à filtres HEPA et décapants neutres certifiés sans danger pour les revêtements neufs.",
    category: "Conformité HSE",
    displayOrder: 2,
    isPublished: true,
  },
  {
    question: "Quel est le délai pour obtenir un devis et planifier une visite ?",
    answer: "Nos devis sont générés et transmis sous 24h après étude de votre demande. Une visite technique préalable gratuite peut être réalisée sous 24 à 48h selon votre localisation à Abidjan.",
    category: "Devis & Tarifs",
    displayOrder: 3,
    isPublished: true,
  },
  {
    question: "Intervenez-vous avant ou après l'aménagement du mobilier ?",
    answer: "Nous recommandons vivement une intervention principale de remise en état à la fin des gros travaux de peinture et plâtrerie, juste AVANT l'installation du mobilier afin de livrer des surfaces totalement dépoussiérées.",
    category: "Délais & Visites",
    displayOrder: 4,
    isPublished: true,
  },
  {
    question: "Vos équipes respectent-elles les normes de sécurité et EPI ?",
    answer: "100% de nos techniciens sont équipés d'EPI conformes (casques, chaussures de sécurité, masques anti-poussière, harnais de sécurité pour les vitreries en hauteur) avec une totale conformité aux exigences HSE BTP.",
    category: "Conformité HSE",
    displayOrder: 5,
    isPublished: true,
  },
];

const seedFaqsIfEmpty = async () => {
  const count = await Faq.countDocuments();
  if (count === 0) {
    await Faq.insertMany(DEFAULT_FAQS);
  }
};

const getPublicFaqs = async () => {
  await seedFaqsIfEmpty();
  return await Faq.find({ isPublished: true }).sort({ displayOrder: 1, createdAt: -1 }).lean();
};

const getAdminFaqs = async () => {
  await seedFaqsIfEmpty();
  return await Faq.find().sort({ displayOrder: 1, createdAt: -1 }).lean();
};

const createFaq = async (data) => {
  const count = await Faq.countDocuments();
  const created = await Faq.create({
    question: data.question,
    answer: data.answer,
    category: data.category || 'Prestations BTP',
    displayOrder: data.displayOrder || count + 1,
    isPublished: data.isPublished !== false,
  });

  emitEvent('faq_updated', created);
  emitEvent('data_updated', { type: 'FAQ' });

  return created;
};

const updateFaq = async (id, data) => {
  const faq = await Faq.findById(id);
  if (!faq) {
    throw new AppError('FAQ introuvable.', 404);
  }

  if (data.question) faq.question = data.question;
  if (data.answer) faq.answer = data.answer;
  if (data.category) faq.category = data.category;
  if (data.displayOrder !== undefined) faq.displayOrder = data.displayOrder;
  if (data.isPublished !== undefined) faq.isPublished = data.isPublished;

  await faq.save();

  emitEvent('faq_updated', faq);
  emitEvent('data_updated', { type: 'FAQ' });

  return faq;
};

const toggleFaqPublication = async (id) => {
  const faq = await Faq.findById(id);
  if (!faq) {
    throw new AppError('FAQ introuvable.', 404);
  }

  faq.isPublished = !faq.isPublished;
  await faq.save();

  emitEvent('faq_updated', faq);
  emitEvent('data_updated', { type: 'FAQ' });

  return faq;
};

const deleteFaq = async (id) => {
  const deleted = await Faq.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError('FAQ introuvable.', 404);
  }

  emitEvent('faq_deleted', { id });
  emitEvent('data_updated', { type: 'FAQ' });

  return deleted;
};

module.exports = {
  getPublicFaqs,
  getAdminFaqs,
  createFaq,
  updateFaq,
  toggleFaqPublication,
  deleteFaq,
};
