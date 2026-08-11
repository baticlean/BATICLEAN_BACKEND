/**
 * Generates a modern, clean HTML email template for Baticlean transactional emails.
 */
const createBaseEmailTemplate = ({ title, preheader, contentHtml }) => {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0F172A;">
  <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0;">${preheader || ''}</div>
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);">
          
          <!-- En-tête officiel Baticlean -->
          <tr>
            <td style="background: linear-gradient(135deg, #195D9B 0%, #154E83 100%); padding: 30px 40px; text-align: center;">
              <div style="display: inline-block; background-color: #FFFFFF; padding: 10px 20px; border-radius: 12px; margin-bottom: 12px;">
                <span style="font-size: 22px; font-weight: 900; color: #195D9B; letter-spacing: -0.5px;">BATI<span style="color: #EF9437;">CLEAN</span></span>
              </div>
              <p style="margin: 0; font-size: 12px; color: #E2E8F0; text-transform: uppercase; tracking: 1px; font-weight: 600;">Spécialiste du Nettoyage après Construction</p>
            </td>
          </tr>

          <!-- Contenu Principal -->
          <tr>
            <td style="padding: 35px 40px; background-color: #FFFFFF;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Pied de page officiel sans lien www.baticlean.ci -->
          <tr>
            <td style="background-color: #F1F5F9; padding: 25px 40px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #334155;">Baticlean Côte d'Ivoire</p>
              <p style="margin: 0 0 12px 0; font-size: 11px; color: #64748B;">Service de nettoyage professionnel & remise en état de chantiers neufs.</p>
              <p style="margin: 0; font-size: 10px; color: #94A3B8;">Ceci est un message automatique de confirmation. Merci de ne pas y répondre directement.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Client Appointment Email Template
 */
const generateAppointmentClientEmail = ({ contactName, reference, dateStr, startTime, endTime, location }) => {
  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0F172A;">Demande de Visite Confirmée</h1>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #334155; line-height: 1.6;">
      Bonjour <strong>${contactName}</strong>,
    </p>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #334155; line-height: 1.6;">
      Votre demande de visite technique sur chantier a bien été enregistrée par nos services.
    </p>

    <!-- Badge de Référence -->
    <div style="background-color: #EBF4FC; border: 2px solid #195D9B; border-radius: 12px; padding: 16px 20px; text-align: center; margin-bottom: 28px;">
      <span style="display: block; font-size: 11px; font-weight: 700; color: #195D9B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Numéro de Suivi Dossier</span>
      <span style="font-size: 22px; font-weight: 900; color: #195D9B; letter-spacing: 1px;">${reference}</span>
    </div>

    <!-- Récapitulatif du Rendez-Vous -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; padding: 20px; margin-bottom: 28px;">
      <tr>
        <td style="padding-bottom: 12px; font-size: 13px; font-weight: 700; color: #475569; width: 40%;">Date souhaitée :</td>
        <td style="padding-bottom: 12px; font-size: 13px; font-weight: 700; color: #0F172A;">${dateStr}</td>
      </tr>
      <tr>
        <td style="padding-bottom: 12px; font-size: 13px; font-weight: 700; color: #475569;">Créneau d'intervention :</td>
        <td style="padding-bottom: 12px; font-size: 13px; font-weight: 700; color: #195D9B;">${startTime} - ${endTime}</td>
      </tr>
      <tr>
        <td style="font-size: 13px; font-weight: 700; color: #475569;">Lieu du chantier :</td>
        <td style="font-size: 13px; font-weight: 600; color: #0F172A;">${location}</td>
      </tr>
    </table>

    <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.6;">
      Un technicien Baticlean prendra contact avec vous 24 heures avant la visite afin de valider l'accès au site et coordonner l'évaluation.
    </p>

    <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
      <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0F172A;">L'Équipe Baticlean</p>
    </div>
  `;

  return createBaseEmailTemplate({
    title: `Confirmation de visite Baticlean [${reference}]`,
    preheader: `Votre demande de visite de chantier ${reference} est enregistrée.`,
    contentHtml,
  });
};

/**
 * Admin Appointment Alert Email Template
 */
const generateAppointmentAdminEmail = ({ contactName, email, phone, reference, dateStr, startTime, endTime, location }) => {
  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0F172A;">Nouvelle Demande de Visite de Chantier</h1>

    <div style="background-color: #FEF7EE; border: 2px solid #EF9437; border-radius: 12px; padding: 16px 20px; text-align: center; margin-bottom: 24px;">
      <span style="display: block; font-size: 11px; font-weight: 700; color: #EF9437; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Référence RDV</span>
      <span style="font-size: 22px; font-weight: 900; color: #D67E25; letter-spacing: 1px;">${reference}</span>
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; padding: 20px;">
      <tr>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #475569; width: 35%;">Client :</td>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #0F172A;">${contactName}</td>
      </tr>
      <tr>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #475569;">Téléphone :</td>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #195D9B;">${phone}</td>
      </tr>
      <tr>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #475569;">Email :</td>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 600; color: #0F172A;">${email}</td>
      </tr>
      <tr>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #475569;">Date & Heure :</td>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #0F172A;">${dateStr} (${startTime} - ${endTime})</td>
      </tr>
      <tr>
        <td style="font-size: 13px; font-weight: 700; color: #475569;">Lieu :</td>
        <td style="font-size: 13px; font-weight: 600; color: #0F172A;">${location}</td>
      </tr>
    </table>
  `;

  return createBaseEmailTemplate({
    title: `Alerte Rendez-Vous [${reference}]`,
    preheader: `Nouvelle demande de visite enregistrée sous la référence ${reference}.`,
    contentHtml,
  });
};

/**
 * Client Quote Email Template
 */
const generateQuoteClientEmail = ({ contactName, reference, buildingType, estimatedSurface, city, commune }) => {
  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0F172A;">Demande de Devis Enregistrée</h1>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #334155; line-height: 1.6;">
      Bonjour <strong>${contactName}</strong>,
    </p>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #334155; line-height: 1.6;">
      Nous avons bien reçu votre demande de devis pour le nettoyage et la remise en état de votre bâtiment.
    </p>

    <!-- Badge de Référence -->
    <div style="background-color: #EBF4FC; border: 2px solid #195D9B; border-radius: 12px; padding: 16px 20px; text-align: center; margin-bottom: 28px;">
      <span style="display: block; font-size: 11px; font-weight: 700; color: #195D9B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Référence Officielle du Dossier</span>
      <span style="font-size: 22px; font-weight: 900; color: #195D9B; letter-spacing: 1px;">${reference}</span>
    </div>

    <!-- Récapitulatif -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; padding: 20px; margin-bottom: 28px;">
      <tr>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #475569; width: 40%;">Type d'ouvrage :</td>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #0F172A;">${buildingType}</td>
      </tr>
      <tr>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #475569;">Surface estimée :</td>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #195D9B;">${estimatedSurface || 0} m²</td>
      </tr>
      <tr>
        <td style="font-size: 13px; font-weight: 700; color: #475569;">Localisation :</td>
        <td style="font-size: 13px; font-weight: 600; color: #0F172A;">${city}, ${commune}</td>
      </tr>
    </table>

    <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.6;">
      Notre équipe commerciale analyse les caractéristiques de votre chantier et vous transmettra une proposition détaillée sous 24h.
    </p>

    <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
      <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0F172A;">L'Équipe Baticlean</p>
    </div>
  `;

  return createBaseEmailTemplate({
    title: `Confirmation de devis Baticlean [${reference}]`,
    preheader: `Votre demande de devis ${reference} a été enregistrée avec succès.`,
    contentHtml,
  });
};

/**
 * Admin Quote Alert Email Template
 */
const generateQuoteAdminEmail = ({ contactName, email, phone, reference, buildingType, estimatedSurface, city, commune }) => {
  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0F172A;">Nouvelle Demande de Devis Reçue</h1>

    <div style="background-color: #FEF7EE; border: 2px solid #EF9437; border-radius: 12px; padding: 16px 20px; text-align: center; margin-bottom: 24px;">
      <span style="display: block; font-size: 11px; font-weight: 700; color: #EF9437; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Référence Devis</span>
      <span style="font-size: 22px; font-weight: 900; color: #D67E25; letter-spacing: 1px;">${reference}</span>
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; padding: 20px;">
      <tr>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #475569; width: 35%;">Client :</td>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #0F172A;">${contactName}</td>
      </tr>
      <tr>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #475569;">Téléphone :</td>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #195D9B;">${phone}</td>
      </tr>
      <tr>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #475569;">Email :</td>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 600; color: #0F172A;">${email}</td>
      </tr>
      <tr>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #475569;">Ouvrage :</td>
        <td style="padding-bottom: 10px; font-size: 13px; font-weight: 700; color: #0F172A;">${buildingType} (${estimatedSurface || 0} m²)</td>
      </tr>
      <tr>
        <td style="font-size: 13px; font-weight: 700; color: #475569;">Localisation :</td>
        <td style="font-size: 13px; font-weight: 600; color: #0F172A;">${city}, ${commune}</td>
      </tr>
    </table>
  `;

  return createBaseEmailTemplate({
    title: `Alerte Devis [${reference}]`,
    preheader: `Nouvelle demande de devis enregistrée sous la référence ${reference}.`,
    contentHtml,
  });
};

module.exports = {
  createBaseEmailTemplate,
  generateAppointmentClientEmail,
  generateAppointmentAdminEmail,
  generateQuoteClientEmail,
  generateQuoteAdminEmail,
};
