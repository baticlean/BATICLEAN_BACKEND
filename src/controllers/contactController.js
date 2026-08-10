const ContactMessage = require('../models/ContactMessage');
const { sendSuccess } = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../constants/httpCodes');
const { sendTransactionalEmail } = require('../integrations/brevo');
const env = require('../config/env');

const submitContactMessage = async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;

    const contactDoc = await ContactMessage.create({
      name,
      email,
      phone,
      message,
    });

    const htmlAdmin = `
      <h2>Nouveau message de contact direct</h2>
      <p><strong>De :</strong> ${name} (${email} - ${phone || 'N/A'})</p>
      <p><strong>Message :</strong></p>
      <p>${message}</p>
    `;

    await sendTransactionalEmail({
      toEmail: env.ADMIN_NOTIFICATION_EMAIL,
      toName: 'Admin Baticlean',
      subject: `Nouveau message de contact de ${name}`,
      htmlContent: htmlAdmin,
    });

    return sendSuccess(
      res,
      { message: 'Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais.' },
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  submitContactMessage,
};
