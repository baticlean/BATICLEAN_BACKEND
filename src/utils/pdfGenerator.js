const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const Settings = require('../models/Settings');

/**
 * Génère un document PDF vectoriel de Devis BTP Officiel Baticlean
 * @param {Object} quoteRequest Objet de la demande de devis MongoDB
 * @returns {Promise<Buffer>} Buffer du fichier PDF généré
 */
const generateQuotePdfBuffer = async (quoteRequest) => {
  let settings = await Settings.findOne({ key: 'GENERAL' }).lean();
  if (!settings) {
    settings = {
      officialAddress: "Abidjan, Côte d'Ivoire - Cocody Angré 8ème Tranche",
      officialPhone: '+225 07 68 38 87 79',
      phoneSecondary: '+225 01 02 03 04 05',
      officialEmail: 'contact@baticlean.ci',
      emailDevis: 'devis@baticlean.ci',
    };
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#195D9B';
      const secondaryColor = '#EF9437';
      const darkColor = '#0F172A';
      const grayColor = '#475569';
      const lightBg = '#F8FAFC';

      // 1. EN-TÊTE / HEADER
      // Logo si présent
      const logoPath = path.join(__dirname, '../../../BATICLEAN/public/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 35, { width: 55 });
      }

      doc
        .fillColor(primaryColor)
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('BATICLEAN CÔTE D\'IVOIRE', 105, 35);

      doc
        .fillColor(secondaryColor)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('SPÉCIALISTE DU NETTOYAGE APRÈS CONSTRUCTION & FIN DE CHANTIER', 105, 60);

      const addressText = settings.officialAddress || "Abidjan, Côte d'Ivoire - Cocody Angré";
      const phoneText = `Tél: ${settings.officialPhone || ''} ${settings.phoneSecondary ? '/ ' + settings.phoneSecondary : ''} • Email: ${settings.emailDevis || settings.officialEmail || ''}`;

      doc
        .fillColor(grayColor)
        .fontSize(8)
        .font('Helvetica')
        .text(addressText, 105, 72)
        .text(phoneText, 105, 84);

      doc
        .moveTo(40, 102)
        .lineTo(555, 102)
        .strokeColor('#E2E8F0')
        .lineWidth(1)
        .stroke();

      // 2. RÉFÉRENCE DEVIS ET CLIENT
      const now = new Date();
      const issueDate = now.toLocaleDateString('fr-FR');
      const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR');
      const ref = quoteRequest.reference || `DEV-2026-${Date.now().toString().slice(-6)}`;

      // Bloc Référence (Gauche)
      doc
        .rect(40, 115, 240, 95)
        .fillColor(lightBg)
        .fill()
        .strokeColor('#CBD5E1')
        .stroke();

      doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`DEVIS N° ${ref}`, 50, 125);

      doc
        .fillColor(darkColor)
        .fontSize(9)
        .font('Helvetica')
        .text(`Date d'émission : ${issueDate}`, 50, 145)
        .text(`Validité de l'offre : 30 jours (jusqu'au ${validUntil})`, 50, 160)
        .text(`Statut : PROPOSITION OFFICIELLE`, 50, 175);

      // Bloc Client (Droite)
      doc
        .rect(295, 115, 260, 95)
        .fillColor('#F1F5F9')
        .fill()
        .strokeColor('#CBD5E1')
        .stroke();

      const clientName = `${quoteRequest.firstName || ''} ${quoteRequest.lastName || ''}`.trim() || quoteRequest.clientId?.contactName || 'Client Baticlean';
      const clientCompany = quoteRequest.clientId?.companyName ? ` (${quoteRequest.clientId.companyName})` : '';

      doc
        .fillColor(darkColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('DESTINATAIRE / CLIENT :', 305, 125);

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text(`${clientName}${clientCompany}`, 305, 140);

      doc
        .fontSize(8.5)
        .font('Helvetica')
        .fillColor(grayColor)
        .text(`Tél : ${quoteRequest.phone || quoteRequest.clientId?.phone || 'Non renseigné'}`, 305, 155)
        .text(`Email : ${quoteRequest.email || quoteRequest.clientId?.email || 'Non renseigné'}`, 305, 168)
        .text(`Site du chantier : ${quoteRequest.city || 'Abidjan'} ${quoteRequest.commune ? '(' + quoteRequest.commune + ')' : ''}`, 305, 181);

      // 3. SPÉCIFICATIONS DU CHANTIER
      doc
        .rect(40, 222, 515, 35)
        .fillColor('#EBF4FC')
        .fill()
        .strokeColor('#ADD1F3')
        .stroke();

      const surface = quoteRequest.estimatedSurface || 100;
      const buildingType = quoteRequest.buildingType || 'Résidentiel / Tertiaire';

      doc
        .fillColor(primaryColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(`OBJET : Remise en état & Nettoyage intégral fin de chantier - ${buildingType}`, 50, 230)
        .text(`SUPERFICIE ESTIMÉE : ${surface} m²  |  Niveaux : ${quoteRequest.numberOfLevels || 1}  |  Niveau d'encrassement : Chantier Neuf`, 50, 243);

      // 4. TABLEAU DES PRESTATIONS BTP
      const startY = 270;
      doc
        .rect(40, startY, 515, 22)
        .fillColor(primaryColor)
        .fill();

      doc
        .fillColor('#FFFFFF')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('DÉSIGNATION DES PRESTATIONS DE REMISE EN ÉTAT', 50, startY + 6)
        .text('SURFACE', 380, startY + 6)
        .text('P.U. (FCFA)', 440, startY + 6)
        .text('TOTAL HT', 500, startY + 6);

      // Détermination du tarif unitaire selon la superficie (moyenne BTP 1 200 à 2 000 FCFA/m²)
      const unitPrice = surface >= 500 ? 1200 : surface >= 200 ? 1500 : 1800;
      const totalHT = Math.round(surface * unitPrice);
      const tva = Math.round(totalHT * 0.18);
      const totalTTC = totalHT + tva;

      const items = [
        {
          title: 'Lot 1 : Dépoussiérage Haute Efficacité',
          desc: 'Aspiration industrielle, nettoyage des plafonds, murs, gaines et menuiseries.',
          surface: `${surface} m²`,
          unit: `${Math.round(unitPrice * 0.35).toLocaleString('fr-FR')}`,
          total: `${Math.round(totalHT * 0.35).toLocaleString('fr-FR')} FCFA`,
        },
        {
          title: 'Lot 2 : Décapage & Traitement des Sols',
          desc: 'Décapage monobrosse des carrelages, marbres, résines et élimination des laitance ciment.',
          surface: `${surface} m²`,
          unit: `${Math.round(unitPrice * 0.35).toLocaleString('fr-FR')}`,
          total: `${Math.round(totalHT * 0.35).toLocaleString('fr-FR')} FCFA`,
        },
        {
          title: 'Lot 3 : Nettoyage Intégral Vitreries & Châssis',
          desc: 'Lavage des vitres, grattage des peintures/silicone, nettoyage des encadrements et rails.',
          surface: 'Forfait',
          unit: '-',
          total: `${Math.round(totalHT * 0.15).toLocaleString('fr-FR')} FCFA`,
        },
        {
          title: 'Lot 4 : Finitions & Remise des Clés sans Réserve',
          desc: 'Désinfection des sanitaires, astiquage des robinetteries et évacuation des résidus fins.',
          surface: 'Forfait',
          unit: '-',
          total: `${Math.round(totalHT * 0.15).toLocaleString('fr-FR')} FCFA`,
        },
      ];

      let currentY = startY + 22;
      items.forEach((item, index) => {
        const rowBg = index % 2 === 0 ? '#FFFFFF' : lightBg;
        doc.rect(40, currentY, 515, 38).fillColor(rowBg).fill().strokeColor('#E2E8F0').stroke();

        doc
          .fillColor(darkColor)
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text(item.title, 50, currentY + 6);

        doc
          .fillColor(grayColor)
          .fontSize(7.5)
          .font('Helvetica')
          .text(item.desc, 50, currentY + 20, { width: 320 });

        doc
          .fillColor(darkColor)
          .fontSize(8.5)
          .font('Helvetica')
          .text(item.surface, 380, currentY + 14)
          .text(item.unit, 440, currentY + 14)
          .font('Helvetica-Bold')
          .text(item.total, 490, currentY + 14);

        currentY += 38;
      });

      // 5. RÉCAPITULATIF FINANCIER
      const summaryY = currentY + 15;
      doc
        .rect(330, summaryY, 225, 80)
        .fillColor(lightBg)
        .fill()
        .strokeColor('#CBD5E1')
        .stroke();

      doc
        .fillColor(darkColor)
        .fontSize(9)
        .font('Helvetica')
        .text('Total Hors Taxes (HT) :', 340, summaryY + 10)
        .text(`${totalHT.toLocaleString('fr-FR')} FCFA`, 460, summaryY + 10, { align: 'right' });

      doc
        .text('TVA (18%) :', 340, summaryY + 28)
        .text(`${tva.toLocaleString('fr-FR')} FCFA`, 460, summaryY + 28, { align: 'right' });

      doc
        .rect(330, summaryY + 48, 225, 32)
        .fillColor(primaryColor)
        .fill();

      doc
        .fillColor('#FFFFFF')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('NET À PAYER (TTC) :', 340, summaryY + 58)
        .text(`${totalTTC.toLocaleString('fr-FR')} FCFA`, 450, summaryY + 58, { align: 'right' });

      // 6. CONDITIONS DE RÈGLEMENT ET CACHET OFFICIEL
      doc
        .fillColor(darkColor)
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .text('CONDITIONS DE RÈGLEMENT ET D\'EXÉCUTION :', 40, summaryY + 10);

      doc
        .fillColor(grayColor)
        .fontSize(7.5)
        .font('Helvetica')
        .text('• Acompte de 50% exigé à la validation de la commande.', 40, summaryY + 25)
        .text('• Solde de 50% payable le jour de la réception des travaux sans réserve.', 40, summaryY + 37)
        .text('• Matériel certifié, mono-brosses et EPI conformes aux normes HSE BTP.', 40, summaryY + 49)
        .text('• Règlement par virement bancaire ou chèque à l\'ordre de BATICLEAN CI.', 40, summaryY + 61);

      // Cachet & Signature (Bas Droite)
      const footerY = summaryY + 100;
      doc
        .fillColor(primaryColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('POUR BATICLEAN CÔTE D\'IVOIRE', 360, footerY);

      doc
        .fillColor(grayColor)
        .fontSize(8)
        .font('Helvetica-Oblique')
        .text('La Direction Générale - Cachet & Signature', 360, footerY + 14);

      // Ligne décorative de bas de page
      doc
        .rect(360, footerY + 30, 180, 45)
        .strokeColor(secondaryColor)
        .lineWidth(1)
        .dash(3, { space: 3 })
        .stroke();

      doc
        .undash()
        .fillColor(secondaryColor)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('DOCUMENT OFFICIEL BATICLEAN', 370, footerY + 47);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateQuotePdfBuffer,
};
