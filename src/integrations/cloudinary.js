const cloudinary = require('cloudinary').v2;
const env = require('../config/env');
const logger = require('../utils/logger');

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

const uploadToCloudinary = async (fileBuffer, folder = 'baticlean', resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `baticlean/${folder}`,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          logger.error(`[Cloudinary] Erreur lors de l'envoi du fichier : ${error.message}`);
          return reject(error);
        }
        return resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          resourceType: result.resource_type,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    logger.info(`[Cloudinary] Supprimé avec succès : ${publicId}`);
    return result;
  } catch (error) {
    logger.error(`[Cloudinary] Erreur de suppression : ${error.message}`);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
};
