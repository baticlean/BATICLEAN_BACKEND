const Brevo = require('@getbrevo/brevo');
const env = require('../config/env');
const logger = require('../utils/logger');

const apiInstance = new Brevo.TransactionalEmailsApi();
const apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = env.BREVO_API_KEY;

const sendTransactionalEmail = async ({ toEmail, toName, subject, htmlContent, textContent }) => {
  try {
    if (env.BREVO_API_KEY === 'TODO_CONFIG_BREVO_API_KEY') {
      logger.warn(`[Brevo API Mock] Clé API non configurée. Email à ${toEmail} - Sujet: ${subject}`);
      return { messageId: 'mock-id-dev' };
    }

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    if (textContent) sendSmtpEmail.textContent = textContent;
    sendSmtpEmail.sender = { name: env.SENDER_NAME, email: env.SENDER_EMAIL };
    sendSmtpEmail.to = [{ email: toEmail, name: toName || toEmail }];

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    logger.info(`[Brevo Email] Envoyé avec succès à ${toEmail}. ID: ${data.messageId}`);
    return data;
  } catch (error) {
    logger.error(`[Brevo Email] Erreur d'envoi à ${toEmail} : ${error.message}`);
    return null;
  }
};

module.exports = {
  sendTransactionalEmail,
};
