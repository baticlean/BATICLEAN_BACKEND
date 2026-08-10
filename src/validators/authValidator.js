const { z } = require('zod');

const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "L'email est obligatoire." })
      .email({ message: 'Adresse email invalide.' })
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: 'Le mot de passe est obligatoire.' })
      .min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
  }),
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: 'Le jeton de rafraîchissement est obligatoire.' }),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string({ required_error: 'Le mot de passe actuel est obligatoire.' }),
    newPassword: z
      .string({ required_error: 'Le nouveau mot de passe est obligatoire.' })
      .min(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' }),
  }),
});

const registerAdminSchema = z.object({
  body: z.object({
    firstName: z.string({ required_error: 'Le prénom est obligatoire.' }).min(2).trim(),
    lastName: z.string({ required_error: 'Le nom est obligatoire.' }).min(2).trim(),
    email: z
      .string({ required_error: "L'email est obligatoire." })
      .email({ message: 'Adresse email invalide.' })
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: 'Le mot de passe est obligatoire.' })
      .min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' }),
    adminRegistrationKey: z.string({ required_error: 'La clé secrète de création admin est obligatoire.' }),
  }),
});

module.exports = {
  loginSchema,
  registerAdminSchema,
  refreshTokenSchema,
  changePasswordSchema,
};
