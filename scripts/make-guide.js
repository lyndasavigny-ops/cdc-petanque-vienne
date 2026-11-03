/* Génère public/guide.pdf : guide complet du site CDC Pétanque */
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "..", "public", "guide.pdf");
const doc = new PDFDocument({ size: "A4", margins: { top: 50, bottom: 50, left: 50, right: 50 } });
doc.pipe(fs.createWriteStream(out));

const GREEN = "#047857";
const DARK = "#1e293b";
const GRAY = "#475569";

function title(t) {
  doc.moveDown(0.8);
  doc.fillColor(GREEN).fontSize(15).font("Helvetica-Bold").text(t);
  doc.moveTo(doc.x, doc.y + 2).lineTo(545, doc.y + 2).strokeColor(GREEN).lineWidth(1).stroke();
  doc.moveDown(0.4);
}

function sub(t) {
  doc.moveDown(0.3);
  doc.fillColor(DARK).fontSize(11.5).font("Helvetica-Bold").text(t);
  doc.moveDown(0.15);
}

function p(t, opts = {}) {
  doc.fillColor(GRAY).fontSize(10).font("Helvetica").text(t, { lineGap: 2, ...opts });
}

function bullet(t) {
  doc.fillColor(GRAY).fontSize(10).font("Helvetica").text("•  " + t, { indent: 10, lineGap: 2 });
}

function box(t) {
  doc.moveDown(0.3);
  const x = doc.x, y = doc.y;
  const w = 495;
  const h = doc.heightOfString(t, { width: w - 20 }) + 16;
  doc.rect(x, y, w, h).fillAndStroke("#ecfdf5", GREEN);
  doc.fillColor(DARK).fontSize(10).font("Helvetica-Bold").text(t, x + 10, y + 8, { width: w - 20, lineGap: 2 });
  doc.moveDown(0.5);
  doc.x = x;
}

function warn(t) {
  doc.moveDown(0.3);
  const x = doc.x, y = doc.y;
  const w = 495;
  const h = doc.heightOfString(t, { width: w - 20 }) + 16;
  doc.rect(x, y, w, h).fillAndStroke("#fffbeb", "#d97706");
  doc.fillColor("#92400e").fontSize(10).font("Helvetica-Bold").text(t, x + 10, y + 8, { width: w - 20, lineGap: 2 });
  doc.moveDown(0.5);
  doc.x = x;
}

// ===== PAGE 1 : PRESENTATION & CONNEXION =====
doc.rect(0, 0, 595.28, 105).fill(GREEN);
doc.fillColor("white").fontSize(21).font("Helvetica-Bold").text("Guide complet du site CDC Pétanque", 50, 26);
doc.fontSize(12).font("Helvetica").text("Comité départemental de la Vienne (86) · FFPJP", 50, 56);
doc.fontSize(9).text("Championnats Des Clubs : tirage, feuilles de match, saisie sécurisée des scores, classement en direct", 50, 76);
doc.y = 125;
doc.x = 50;

title("1. Le site et ses 3 niveaux d'accès");
bullet("VISITEURS (tout le monde) : voient les scores et classements de toutes les poules, sans code — section « Résultats & classements » sur l'accueil, mise à jour en direct.");
bullet("CLUB RÉFÉRENT (1 par poule) : saisit les scores avec son code à 6 caractères. Le code se verrouille sur le PREMIER appareil utilisé : personne d'autre ne peut saisir.");
bullet("ORGANISATEUR (vous) : accès complet — championnats, tirages, feuilles de match, corrections, déverrouillages, sauvegardes.");
box("Adresse du site :  ______________________________________________\n(votre adresse Vercel, ex : https://cdc-petanque-vienne.vercel.app)");

title("2. Connexion organisateur");
bullet("Page d'accueil → bloc « Accès organisateur »");
bullet("Identifiant : admin   ·   Code : vienne86 (minuscules, sans espace — vérifiez avec l'oeil)");
bullet("Changez le code après la 1ère connexion (bouton « Modifier l'identifiant / code »)");
bullet("En cas de blocage : ouvrez /api/diagnostic sur votre site pour un diagnostic détaillé en français");
doc.moveDown(0.2);
sub("Co-organisateurs (plusieurs comptes) :");
bullet("Panneau « Co-organisateurs (ajouter un accès) » : créez un identifiant + code par personne de confiance");
bullet("Ils gèrent championnats, scores, feuilles, sauvegardes — comme vous");
bullet("MAIS seul VOTRE compte principal peut : ajouter/supprimer des utilisateurs et modifier le compte principal");
bullet("« Supprimer l'accès » coupe immédiatement la connexion de la personne");

title("3. Créer un championnat et faire le tirage");
bullet("Saison, Année, Type (Senior / Vétéran / Féminin), Division (CDC 1 à 4), Poule (A à H)");
bullet("Onglet « Configuration & Tirage » : saisir les 8 équipes puis « Lancer le tirage »");
bullet("8 équipes = 7 journées de 4 rencontres, chaque équipe rencontre toutes les autres");
bullet("Renseigner lieu / date / heure de chaque journée, puis Enregistrer");
bullet("Renommer une équipe après tirage est possible sans perdre scores ni calendrier");

title("4. Les feuilles de match");
bullet("Onglet « Feuilles de match » → « Imprimer la journée (recto/verso) » sur chaque journée");
bullet("1 feuille papier par match : composition des équipes au recto, résultats au verso");
bullet("Feuille 1 : titre bleu, CDC + poule en gros, capitaines (lignes espacées), 8 joueurs, logos officiels FFPJP / Vienne / Nouvelle-Aquitaine, case Réserve, signatures");
bullet("Feuille 2 : Tête à Tête (6 parties), Doublettes (3 parties, cases fusionnées par 2), Triplettes (2 parties, cases fusionnées par 3), sous-totaux, remplaçants");
bullet("À l'impression : activer « Recto verso » ET « Graphiques d'arrière-plan »");

// ===== PAGE 2 : CLUB REFERENT & SECURITES =====
doc.addPage();
title("5. Le club référent : saisie sécurisée des scores");
p("Chaque poule a un code unique (bandeau vert du championnat, bouton « Copier le lien à envoyer »). Donnez ce code à UN SEUL club référent par poule.");
doc.moveDown(0.2);
sub("Verrouillage sur un seul appareil :");
bullet("Le 1er appareil (téléphone) qui ouvre le lien devient l'appareil autorisé");
bullet("Tout autre appareil est refusé, même avec le bon code");
bullet("Changement de téléphone : bouton « Réinitialiser l'appareil autorisé » (organisateur)");
doc.moveDown(0.2);
sub("Saisie des scores (après la journée) :");
bullet("Taper le score d'une équipe : l'autre se complète automatiquement à 36");
bullet("Enregistrement automatique (mention « Enregistré ») — le classement se met à jour aussitôt");
bullet("Forfait : cocher la case, les scores sont imposés (0 / 36)");
doc.moveDown(0.2);
sub("Validation définitive de la journée :");
bullet("Quand tous les scores sont saisis, un récapitulatif s'affiche : « Vérifiez avant de valider »");
bullet("Le club clique « Tout est correct — Valider définitivement » (+ confirmation)");
bullet("Après validation : scores VERROUILLÉS pour le club (lecture seule, cadenas)");
bullet("Seul l'organisateur peut encore modifier ou déverrouiller la journée");

sub("SMS type pour le club référent :");
box("Voici le lien de saisie de notre poule : [adresse du site]/saisie/VOTRECODE\nIMPORTANT : ouvre-le depuis TON téléphone uniquement (le code se verrouille sur le 1er appareil utilisé). Après la journée, saisis tous les scores (le 2e score se complète tout seul à 36), vérifie le récapitulatif puis « Valider définitivement ». On ne peut plus modifier ensuite - en cas d'erreur, appelle-moi.");

sub("SMS type pour tous les autres (joueurs, supporters) :");
box("Suivez les résultats et classements en direct : [adresse du site]\nCliquez sur votre poule dans « Résultats & classements ». Aucun code nécessaire.");

title("6. Pendant et après la journée (organisateur)");
bullet("Onglets Saisie / Classement : actualisation automatique toutes les 10 s (badge « En direct »)");
bullet("Vous voyez les scores arriver au fur et à mesure, le classement se recalcule seul");
bullet("Points : victoire 3 · nul 2 · défaite 1 · forfait 0 — rencontres sur 36 points");
bullet("Correction après validation : modifiez directement (admin) ou « Déverrouiller la journée »");

// ===== PAGE 3 : SAUVEGARDE, DEPANNAGE =====
doc.addPage();
title("7. Sauvegarde et restauration (votre assurance)");
bullet("Tableau de bord → « Sauvegarde & restauration des données »");
bullet("« Télécharger la sauvegarde » : fichier contenant TOUT (championnats, équipes, tirages, scores)");
bullet("À faire après chaque journée — gardez le fichier (clé USB, e-mail à vous-même)");
bullet("« Restaurer depuis un fichier » : remet tout à l'identique en cas de problème");
doc.moveDown(0.2);
sub("Vos 3 protections :");
bullet("1. Le code du site : ZIP téléchargé d'Arena + dépôt GitHub (redéployable à tout moment)");
bullet("2. Vos données : le fichier de sauvegarde téléchargeable");
bullet("3. La base Neon : historique automatique (console Neon → Restore, retour 24 h en arrière)");

title("8. Hébergement (GitHub + Neon + Vercel) — rappels");
bullet("Le code du site est sur GitHub, la base de données sur Neon (gratuit), l'hébergement sur Vercel (gratuit)");
bullet("La variable DATABASE_URL (Vercel → Settings → Environment Variables) contient l'adresse Neon");
bullet("Les tables de la base se créent automatiquement au premier démarrage");
doc.moveDown(0.2);
sub("Mettre à jour le site (avec GitHub Desktop) :");
bullet("1. Télécharger le nouveau ZIP depuis Arena, l'extraire (clic droit → Extraire tout)");
bullet("2. Copier-coller tout le contenu extrait dans le dossier Documents → GitHub → votre-depot (remplacer)");
bullet("3. GitHub Desktop : « Commit to main » puis « Push origin »");
bullet("4. Vercel redéploie automatiquement en 2-3 min — les scores et classements (dans Neon) ne sont pas touchés");
bullet("Vérifiez le numéro de version en bas de la page d'accueil du site");

title("9. Dépannage rapide");
bullet("Impossible de se connecter : ouvrez /api/diagnostic → chaque ligne indique le problème et la solution");
bullet("« Connexion requise » : vos données sont sauvées, reconnectez-vous depuis l'accueil");
bullet("Code club refusé « déjà utilisé sur un autre appareil » : c'est la sécurité ! Bouton « Réinitialiser l'appareil autorisé » si changement légitime de téléphone");
bullet("« Journée validée : scores verrouillés » : normal après validation — l'organisateur corrige ou déverrouille");
bullet("Score refusé : le total des 2 scores doit faire exactement 36");
bullet("Logos absents à l'impression : cocher « Graphiques d'arrière-plan » dans la fenêtre d'impression");
bullet("Logos absents sur le site : le dossier public/images n'a pas été transféré sur GitHub — renvoyer tout le ZIP");
bullet("Données perdues / bug grave : « Restaurer depuis un fichier » avec votre dernière sauvegarde");

title("10. Checklist jour de championnat");
bullet("AVANT : imprimer les feuilles recto/verso, les remettre au club organisateur");
bullet("PENDANT : les feuilles papier se remplissent sur les terrains");
bullet("APRÈS : le club référent saisit les scores sur SON téléphone, vérifie le récapitulatif, valide définitivement");
bullet("VOUS : suivez en direct, puis téléchargez une sauvegarde");
bullet("TOUT LE MONDE : consulte les résultats et classements sur le site, sans code");

doc.moveDown(1.2);
doc.fillColor("#94a3b8").fontSize(8).font("Helvetica-Oblique")
  .text("Comité de la Vienne · 1 Rue de la Poste, 86500 Saint Julien l'Ars — Guide pour la version 13 du site", { align: "center" });

doc.end();
console.log("PDF généré :", out);
