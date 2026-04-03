const fs = require('fs');
const path = require('path');
const PDFDocument = require('./tmms-backend/node_modules/pdfkit');

const outputPath = path.join(process.cwd(), 'TMMS-Guide-Client.pdf');
const doc = new PDFDocument({ margin: 50, size: 'A4' });
doc.pipe(fs.createWriteStream(outputPath));

function title(text) {
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f172a').text(text);
  doc.moveDown(0.3);
}

function section(text) {
  doc.moveDown(0.4);
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#1e3a8a').text(text);
  doc.moveDown(0.2);
}

function body(text) {
  doc.font('Helvetica').fontSize(11).fillColor('#111827').text(text, { lineGap: 3 });
}

function bullet(text) {
  doc.font('Helvetica').fontSize(11).fillColor('#111827').text('• ' + text, { indent: 10, lineGap: 3 });
}

title('TMMS - Guide Client (Version 1.0)');
body('Ce document explique comment utiliser l application TMMS (Task & Machine Management System).');
body('URL application: https://tmms-frontend-pujm-4rpxa4y0r.vercel.app');
body('Support: hbouchi@tmmsgroup.ma');

section('1) Connexion');
bullet('Ouvrir le lien de l application dans votre navigateur.');
bullet('Choisir la langue (English / Français / العربية).');
bullet('Se connecter avec votre email et mot de passe.');
bullet('Si vous n avez pas de compte: cliquer sur Sign Up / Inscription.');

section('2) Tableau de bord (Analytics)');
bullet('Importer un fichier Excel (.xlsx ou .xls).');
bullet('Cliquer sur Upload & Parse pour analyser les données.');
bullet('Consulter les KPI, graphiques (bar, line, pie) et le tableau filtré.');
bullet('Utiliser les filtres (catégorie, dates) pour affiner les résultats.');

section('3) Centre de Fichiers');
bullet('Les administrateurs peuvent importer des fichiers et liens Power BI.');
bullet('Les utilisateurs voient uniquement les fichiers qui leur sont assignés.');
bullet('Si un fichier est restreint: cliquer sur Request Access.');
bullet('L administrateur approuve ou rejette la demande.');

section('4) Notifications');
bullet('Icône cloche en haut pour suivre les demandes et validations.');
bullet('Administrateur: nouvelles demandes d accès et messages de contact.');
bullet('Utilisateur: approbation ou rejet de sa demande.');

section('5) Profil et Paramètres');
bullet('Cliquer sur l avatar pour ouvrir Profile, Settings ou Logout.');
bullet('Le mode clair/sombre est disponible dans la barre supérieure.');
bullet('La langue peut être changée à tout moment.');

section('6) Rôles');
bullet('Admin: gère les fichiers, utilisateurs, demandes, audit logs.');
bullet('User: consulte ses fichiers, envoie des demandes et messages de contact.');

section('7) Audit Logs (Admin)');
bullet('La page Audit Logs trace les actions importantes (connexion, upload, assignation, suppression, approbation).');
bullet('Vous pouvez filtrer les journaux puis exporter en Excel ou PDF.');

section('8) Bonnes pratiques');
bullet('Utiliser des mots de passe forts.');
bullet('Ne pas partager les comptes administrateurs.');
bullet('Vérifier les données Excel avant import.');

section('9) Dépannage rapide');
bullet('Erreur de connexion: vérifier internet et l URL.');
bullet('Upload refusé: vérifier format/poids du fichier.');
bullet('Pas d accès à un fichier: envoyer une demande d accès.');

section('10) Contact');
body('Email support: hbouchi@tmmsgroup.ma');
body('TMMS Group © 2026');

doc.end();
console.log('PDF generated:', outputPath);
