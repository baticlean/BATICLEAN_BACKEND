const { BrevoClient } = require('@getbrevo/brevo');
const env = require('../config/env');
const logger = require('../utils/logger');

const sendTransactionalEmail = async ({ toEmail, toName, subject, htmlContent, textContent, attachments }) => {
  try {
    if (!env.BREVO_API_KEY || env.BREVO_API_KEY === 'TODO_CONFIG_BREVO_API_KEY') {
      logger.warn(`[Brevo API Mock] Clé API non configurée. Email à ${toEmail} - Sujet: ${subject}`);
      return { messageId: 'mock-id-dev' };
    }

    const client = new BrevoClient({ apiKey: env.BREVO_API_KEY });

    const payload = {
      subject,
      htmlContent,
      sender: { name: env.SENDER_NAME, email: env.SENDER_EMAIL },
      to: [{ email: toEmail, name: toName || toEmail }],
    };

    if (textContent) {
      payload.textContent = textContent;
    }

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      payload.attachment = attachments.map((att) => ({
        name: att.name || 'document.pdf',
        content: att.content,
      }));
    }

    const data = await client.transactionalEmails.sendTransacEmail(payload);
    logger.info(`[Brevo Email] Envoyé avec succès à ${toEmail} (Pièces jointes: ${attachments?.length || 0}).`);
    return data;
  } catch (error) {
    logger.error(`[Brevo Email] Erreur d'envoi à ${toEmail} : ${error.message}`);
    return null;
  }
};

module.exports = {
  sendTransactionalEmail,
};
