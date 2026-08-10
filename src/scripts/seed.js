const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Service = require('../models/Service');
const BuildingType = require('../models/BuildingType');
const Settings = require('../models/Settings');
const { USER_ROLES } = require('../constants/enums');

const seedData = async () => {
  console.log('[Seed Script] Démarrage du peuplement des données initiales...');
  await connectDB();

  const adminEmail = 'admin@baticlean.com';
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    const passwordHash = await User.hashPassword('Baticlean2026!Secure');
    await User.create({
      firstName: 'Admin',
      lastName: 'Baticlean',
      email: adminEmail,
      phone: '+2250700000000',
      passwordHash,
      role: USER_ROLES.ADMIN,
      isActive: true,
    });
    console.log(`[Seed Script] Compte Administrateur par défaut créé (${adminEmail}).`);
  } else {
    console.log('[Seed Script] Compte Administrateur déjà existant.');
  }

  const defaultServices = [
    {
      name: 'Nettoyage de fin de chantier',
      slug: 'nettoyage-fin-de-chantier',
      shortDescription: 'Élimination complète des poussières de chantier, traces de peinture, mortier et préparation des surfaces.',
      description: 'Prestation complète comprenant le brossage des sols, le dépoussiérage haute efficacité, le lavage des vitres et le nettoyage minutieux avant remise des clés.',
      features: ['Dépoussiérage intégral', 'Nettoyage des vitres et encadrements', 'Décapage des résidus de colle et peinture'],
      order: 1,
    },
    {
      name: 'Remise en état avant aménagement',
      slug: 'remise-en-etat-avant-amenagement',
      shortDescription: 'Nettoyage approfondi et désinfection avant installation du mobilier et mise en service du bâtiment.',
      description: 'Lavage des murs, sanitaires, escaliers, parties communes et sols pour accueillir vos équipes ou résidents en toute sécurité.',
      features: ['Désinfection des sanitaires', 'Lavage des sols et surfaces', 'Nettoyage des parties communes'],
      order: 2,
    },
  ];

  for (const s of defaultServices) {
    await Service.findOneAndUpdate({ slug: s.slug }, s, { upsert: true, new: true });
  }
  console.log('[Seed Script] Prestations initiales synchronisées.');

  const defaultBuildingTypes = [
    { name: 'Appartements et résidences', slug: 'appartements-et-residences', order: 1 },
    { name: 'Maisons', slug: 'maisons', order: 2 },
    { name: 'Immeubles résidentiels', slug: 'immeubles-residentiels', order: 3 },
    { name: 'Bureaux', slug: 'bureaux', order: 4 },
    { name: 'Écoles', slug: 'ecoles', order: 5 },
    { name: 'Hôpitaux et établissements de santé', slug: 'hopitaux-et-sante', order: 6 },
    { name: 'Hôtels', slug: 'hotels', order: 7 },
    { name: 'Commerces', slug: 'commerces', order: 8 },
    { name: 'Entrepôts', slug: 'entrepots', order: 9 },
    { name: 'Bâtiments institutionnels', slug: 'batiments-institutionnels', order: 10 },
  ];

  for (const bt of defaultBuildingTypes) {
    await BuildingType.findOneAndUpdate({ slug: bt.slug }, bt, { upsert: true, new: true });
  }
  console.log('[Seed Script] Catégories de bâtiments synchronisées.');

  await Settings.findOneAndUpdate(
    { key: 'GENERAL' },
    {
      key: 'GENERAL',
      companyName: 'Baticlean',
      openingHours: 'Du lundi au samedi : 08h00 - 18h00',
      appointmentTimeSlots: [
        { startTime: '08:00', endTime: '10:00', isActive: true },
        { startTime: '10:00', endTime: '12:00', isActive: true },
        { startTime: '14:00', endTime: '16:00', isActive: true },
        { startTime: '16:00', endTime: '18:00', isActive: true },
      ],
    },
    { upsert: true }
  );
  console.log('[Seed Script] Paramètres et créneaux de rendez-vous configurés.');

  await disconnectDB();
  console.log('[Seed Script] Initialisation terminée avec succès.');
};

seedData();
