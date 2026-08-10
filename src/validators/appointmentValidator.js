const { z } = require('zod');
const { APPOINTMENT_REASONS } = require('../constants/enums');

const createAppointmentSchema = z.object({
  body: z.object({
    contactName: z
      .string({ required_error: 'Le nom du contact est obligatoire.' })
      .min(2)
      .trim(),
    email: z
      .string({ required_error: "L'adresse email est obligatoire." })
      .email({ message: 'Adresse email invalide.' })
      .toLowerCase()
      .trim(),
    phone: z
      .string({ required_error: 'Le numéro de téléphone est obligatoire.' })
      .min(8)
      .trim(),
    reason: z.nativeEnum(APPOINTMENT_REASONS, {
      errorMap: () => ({ message: 'Motif de rendez-vous invalide.' }),
    }),
    location: z
      .string({ required_error: 'Le lieu du rendez-vous est obligatoire.' })
      .trim(),
    date: z.string({ required_error: 'La date est obligatoire.' }),
    startTime: z.string({ required_error: "L'heure de début est obligatoire." }),
    endTime: z.string({ required_error: "L'heure de fin est obligatoire." }),
    quoteRequestId: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

const availabilitySchema = z.object({
  query: z.object({
    date: z.string({ required_error: 'La date est obligatoire pour vérifier la disponibilité.' }),
  }),
});

module.exports = {
  createAppointmentSchema,
  availabilitySchema,
};
