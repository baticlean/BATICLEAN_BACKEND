const { z } = require('zod');
const {
  CLIENT_TYPES,
  BUILDING_TYPES,
  CONSTRUCTION_STATUS,
  DIRT_LEVELS,
} = require('../constants/enums');

const createQuoteRequestSchema = z.object({
  body: z.object({
    contactName: z
      .string({ required_error: 'Le nom du responsable est obligatoire.' })
      .min(2, { message: 'Le nom doit contenir au moins 2 caractères.' })
      .trim(),
    companyName: z.string().optional().nullable(),
    email: z
      .string({ required_error: "L'adresse email est obligatoire." })
      .email({ message: 'Adresse email invalide.' })
      .toLowerCase()
      .trim(),
    phone: z
      .string({ required_error: 'Le numéro de téléphone est obligatoire.' })
      .min(8, { message: 'Numéro de téléphone invalide.' })
      .trim(),
    whatsapp: z.string().optional().nullable(),
    requesterType: z.nativeEnum(CLIENT_TYPES, {
      errorMap: () => ({ message: 'Type de demandeur invalide.' }),
    }),

    buildingType: z.nativeEnum(BUILDING_TYPES, {
      errorMap: () => ({ message: 'Type de bâtiment invalide.' }),
    }),
    city: z.string({ required_error: 'La ville est obligatoire.' }).trim(),
    commune: z.string({ required_error: 'La commune est obligatoire.' }).trim(),
    neighborhood: z.string({ required_error: 'Le quartier est obligatoire.' }).trim(),
    address: z.string({ required_error: "L'adresse complète est obligatoire." }).trim(),

    estimatedSurface: z.coerce.number().optional(),
    surfaceUnit: z.string().default('m²'),
    numberOfLevels: z.coerce.number().min(1).default(1),
    numberOfRooms: z.coerce.number().optional(),

    constructionStatus: z.nativeEnum(CONSTRUCTION_STATUS, {
      errorMap: () => ({ message: "L'état actuel du chantier est invalide." }),
    }),
    dirtLevel: z.nativeEnum(DIRT_LEVELS, {
      errorMap: () => ({ message: 'Le niveau de salissure est invalide.' }),
    }),

    requestedServices: z.array(z.string()).optional().default([]),
    otherNeeds: z.string().optional().nullable(),

    preferredTiming: z.string().optional(),
    preferredDate: z.string().optional().nullable(),

    description: z.string().optional().nullable(),
    visitRequested: z.coerce.boolean().default(false),
  }),
});

module.exports = {
  createQuoteRequestSchema,
};
