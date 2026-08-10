const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  MONGODB_URI: z.string().min(1, { message: "L'URI MongoDB est obligatoire." }),
  JWT_SECRET: z.string().min(32, { message: "Le secret JWT doit contenir au moins 32 caractères." }),
  JWT_REFRESH_SECRET: z.string().min(32, { message: "Le secret JWT Refresh doit contenir au moins 32 caractères." }),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  ADMIN_REGISTRATION_KEY: z.string().optional().default('Baticlean_Admin_Master_Secured_Passcode_2026_Key99'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default('TODO_CONFIG_CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: z.string().optional().default('TODO_CONFIG_CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: z.string().optional().default('TODO_CONFIG_CLOUDINARY_API_SECRET'),
  BREVO_API_KEY: z.string().optional().default('TODO_CONFIG_BREVO_API_KEY'),
  SENDER_EMAIL: z.string().email().optional().default('contact@baticlean.com'),
  SENDER_NAME: z.string().optional().default('Baticlean Official'),
  ADMIN_NOTIFICATION_EMAIL: z.string().email().optional().default('admin@baticlean.com'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Erreur critique de configuration des variables d'environnement :");
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }
  return result.data;
};

const env = parseEnv();

module.exports = env;
