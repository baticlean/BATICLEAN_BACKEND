const { z } = require('zod');

const contactMessageSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Le nom est obligatoire.' })
      .min(2, { message: 'Le nom doit contenir au moins 2 caractères.' })
      .trim(),
    email: z
      .string({ required_error: "L'adresse email est obligatoire." })
      .email({ message: 'Adresse email invalide.' })
      .toLowerCase()
      .trim(),
    phone: z.string().optional().nullable(),
    message: z
      .string({ required_error: 'Le message est obligatoire.' })
      .min(10, { message: 'Le message doit contenir au moins 10 caractères.' })
      .trim(),
  }),
});

module.exports = {
  contactMessageSchema,
};
