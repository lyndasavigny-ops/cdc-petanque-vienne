/* Génère public/guide.pdf : guide complet du site CDC Pétanque (v19) */
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
  doc.moveDown(0.7);
  doc.fillColor(GREEN).fontSize(14.5).font("Helvetica-Bold").text(t);
  doc.moveTo(doc.x, doc.y + 2).lineTo(545, doc.y + 2).strokeColor(GREEN).lineWidth(1).stroke();
  doc.moveDown(0.35);
}

function sub(t) {
  doc.moveDown(0.25);
  doc.fillColor(DARK).fontSize(11).font("Helvetica-Bold").text(t);
  doc.moveDown(0.1);
}

function p(t, opts = {}) {
  doc.fillColor(GRAY).fontSize(9.5).font("Helvetica").text(t, { lineGap: 1.8, ...opts });
}

function bullet(t) {
  doc.fillColor(GRAY).fontSize(9.5).font("Helvetica").text("•  " + t, { indent: 10, lineGap: 1.8 });
}

function box(t) {
  doc.moveDown(0.25);
  const x = doc.x, y = doc.y;
  const w = 495;
  const h = doc.heightOfString(t, { width: w - 20 }) + 14;
  doc.rect(x, y, w, h).fillAndStroke("#ecfdf5", GREEN);
  doc.fillColor(DARK).fontSize(9.5).font("Helvetica-Bold").text(t, x + 10, y + 7, { width: w - 20, lineGap: 1.8 });
  doc.moveDown(0.4);
  doc.x = x;
}

// ===== PAGE 1 =====
doc.rect(0, 0, 595.28, 100).fill(GREEN);
doc.fillColor("white").fontSize(20).font("Helvetica-Bold").text("Guide complet du site CDC Pétanque", 50, 24);
doc.fontSize(11.5).font("Helvetica").text("Comité départemental de la Vienne (86) · FFPJP — version 21", 50, 52);
doc.fontSize(8.5).text("Tirage, feuilles de match, saisie sécurisée, scans, listes de joueurs, classement Article 12, PDF résultats", 50, 70);
doc.y = 118;
doc.x = 50;

title("1. Les 3 niveaux d'accès");
bullet("VISITEURS : scores et classements de toutes les poules, sans code (accueil → « Résultats & classements »), mise à jour en direct.");
bullet("CLUB RÉFÉRENT (1 par poule) : saisit les scores et dépose la feuille scannée avec son code à 6 caractères, verrouillé sur le 1er appareil utilisé.");
bullet("ORGANISATEUR (vous + co-organisateurs) : accès complet.");
box("Adresse du site :  ______________________________________________");

title("2. Connexion organisateur & co-organisateurs");
bullet("Accueil → « Accès organisateur » : entrez votre identifiant et votre code personnels.");
p("Par sécurité, les identifiants ne figurent pas dans ce document public. Notez les vôtres ci-dessous et conservez ce guide en lieu sûr :");
box("Mon identifiant : ____________________    Mon code : ____________________");
bullet("Panneau « Co-organisateurs » : créez un identifiant + code par personne de confiance. Seul VOTRE compte principal gère les utilisateurs.");
bullet("Blocage ? Ouvrez /api/diagnostic sur votre site : diagnostic détaillé en français.");

title("3. Créer un championnat (onglet Configuration & Tirage)");
bullet("Saison, Année, Type (Senior / Vétéran / Féminin / Provençal), Division (CDC 1-4), Poule (A-H).");
bullet("CDC JEU PROVENÇAL : rencontre en 4 parties (2 doublettes + 2 triplettes, pas de tête-à-tête), chaque partie gagnée = 9 points → total 36 inchangé. Les feuilles de match et le départage s'adaptent automatiquement.");
bullet("Barème de points MODIFIABLE : Victoire / Nul / Défaite / Forfait (officiel : 3/2/1/0). Le classement se recalcule partout automatiquement.");
bullet("Saisir les 8 équipes → « Lancer le tirage » : calendrier complet (7 journées).");
bullet("Règle fédérale appliquée : les équipes d'un même club (ex. CENON 1 / CENON 2) se rencontrent automatiquement en Journée 1.");
bullet("Renseigner lieu / date / heure de chaque journée → Enregistrer.");
bullet("RÉORGANISER LES JOURNÉES : case orange « → » à côté de chaque journée — tapez les nouveaux numéros (ex. J1→7, J7→1) puis « Réorganiser ». Scores, dates et scans suivent leur journée.");

title("4. Listes de joueurs (onglet Joueurs)");
bullet("8 joueurs par équipe : Nom, Prénom, N° de licence.");
bullet("Export CSV (Excel) et Import CSV — format : equipe;nom;prenom;licence (une ligne par joueur).");
bullet("CONTRÔLE AUTOMATIQUE : alerte rouge si un joueur est inscrit dans plusieurs équipes — interdit de jouer en division inférieure ou égale à la sienne.");

// ===== PAGE 2 =====
doc.addPage();
title("5. Feuilles de match (onglet Feuilles de match)");
bullet("« Imprimer la journée (recto/verso) » : 1 feuille papier par match — composition au recto, résultats au verso.");
bullet("Logos officiels FFPJP / Vienne / Nouvelle-Aquitaine. À l'impression : activer « Recto verso » ET « Graphiques d'arrière-plan ».");

title("6. Saisie des scores (club référent)");
bullet("Taper le score d'une équipe : l'autre se complète automatiquement à 36.");
bullet("Enregistrement automatique (« Enregistré ») — classement mis à jour en direct.");
bullet("FORFAIT (règlement) : victoire par forfait imposée 19 à 0 → 3 points et point average +19 pour le vainqueur, 0 point pour le forfaitaire.");
bullet("Parties gagnées (optionnel) : cases « Parties _/_ » — sur 11 en pétanque (6 TT + 3 D + 2 T) ou sur 4 en Jeu Provençal (2 D + 2 T). Sert au critère 4 de l'Article 12 en cas d'égalité.");
bullet("SCAN DE LA FEUILLE : bouton « Joindre la feuille de match scannée » (photo/PDF, 8 Mo max) sous chaque journée.");
bullet("VALIDATION DÉFINITIVE : quand tout est saisi, récapitulatif → « Valider définitivement » → scores verrouillés (seul l'organisateur peut modifier/déverrouiller).");

sub("SMS type pour le club référent :");
box("Voici le lien de saisie de notre poule : [adresse du site]/saisie/VOTRECODE\nIMPORTANT : ouvre-le depuis TON téléphone uniquement (code verrouillé sur le 1er appareil). Après la journée : saisis les scores (le 2e se complète à 36), joins la photo de la feuille de match, vérifie le récapitulatif puis « Valider définitivement ». En cas d'erreur après validation, appelle-moi.");

title("7. Classement (règlement Article 12 FFPJP)");
bullet("Critère 1 : total des points marqués (barème du championnat).");
bullet("Égalité entre 2 équipes : CONFRONTATION DIRECTE (le vainqueur du match entre elles passe devant, même avec un moins bon point average). Si nul entre elles : critère 3 puis 4.");
bullet("Égalité entre 3+ : mini-classement sur les SEULES oppositions des équipes concernées (critère 1), puis critères 3 et 4 si nécessaire.");
bullet("Critère 3 : point average général (différence Pour − Contre).");
bullet("Critère 4 : parties gagnées dans l'opposition (sur 11 en pétanque, sur 4 en Jeu Provençal).");
bullet("ORDRE MANUEL (visible par vous seul) : colonne orange « Ordre manuel » dans l'onglet Classement — tapez les rangs 1 à 8 puis « Appliquer » pour imposer le classement final. « Revenir au classement automatique » pour annuler.");

title("8. Scans des feuilles (onglet 📁 Scans — organisateur)");
bullet("Un dossier par journée : les scans déposés par les clubs y arrivent automatiquement.");
bullet("Vous pouvez aussi déposer les vôtres, tout télécharger ou supprimer.");
bullet("Seul l'organisateur consulte les fichiers — les clubs ne font que déposer.");

title("9. PDF Résultats & Classement (organisateur)");
bullet("Onglet Classement → « Télécharger le PDF Résultats & Classement ».");
bullet("Contenu : classement complet (1er en doré) + tous les scores par journée (vainqueurs en gras, forfaits signalés, journées validées cochées).");
bullet("Réservé à l'organisateur — idéal pour archive ou affichage au club-house.");

// ===== PAGE 3 =====
doc.addPage();
title("10. Sauvegarde et restauration");
bullet("Tableau de bord → « Sauvegarde & restauration » → « Télécharger la sauvegarde » après chaque journée (fichier contenant TOUT).");
bullet("« Restaurer depuis un fichier » remet tout à l'identique en cas de problème.");
bullet("3 protections : le code (GitHub), vos données (fichier de sauvegarde), la base Neon (historique automatique 24 h).");

title("11. Hébergement et mises à jour");
bullet("Code sur GitHub · base de données sur Neon · hébergement sur Vercel (gratuits).");
bullet("Variable DATABASE_URL (Vercel → Settings → Environment Variables) = adresse Neon complète (mot de passe en clair, se termine par ?sslmode=require).");
sub("Mettre à jour le site :");
bullet("1. Télécharger le ZIP depuis Arena (panneau du site) → clic droit → Extraire tout.");
bullet("2. Copier-coller tout le contenu dans Documents → GitHub → cdc-petanque-vienne (Remplacer).");
bullet("3. GitHub Desktop : « Commit to main » puis « Push origin ».");
bullet("4. Vercel redéploie automatiquement (2-3 min). Vérifier le numéro de version en bas de l'accueil.");
bullet("Les scores et classements (dans Neon) ne sont jamais touchés par une mise à jour.");

title("12. Dépannage rapide");
bullet("Connexion impossible : /api/diagnostic indique le problème et la solution.");
bullet("Code club « déjà utilisé sur un autre appareil » : c'est la sécurité. Bouton « Réinitialiser l'appareil autorisé » si changement légitime de téléphone.");
bullet("« Journée validée : scores verrouillés » : normal — l'organisateur corrige ou déverrouille.");
bullet("Score refusé : le total des 2 scores doit faire exactement 36 (sauf forfait : 19-0 imposé).");
bullet("Parties refusées : le total ne peut pas dépasser 11.");
bullet("Logos absents à l'impression : cocher « Graphiques d'arrière-plan ».");
bullet("Doute sur une inscription : onglet Joueurs → les alertes rouges listent les joueurs en infraction.");

title("13. Checklist jour de championnat");
bullet("AVANT : imprimer les feuilles recto/verso, les remettre au club organisateur.");
bullet("PENDANT : les feuilles papier se remplissent sur les terrains.");
bullet("APRÈS : le club référent saisit les scores (+ parties gagnées si besoin), joint la photo de la feuille, vérifie le récapitulatif, valide définitivement.");
bullet("VOUS : suivez en direct, vérifiez les scans, téléchargez une sauvegarde, puis le PDF Résultats pour l'archive.");
bullet("TOUT LE MONDE : consulte scores et classements sur le site, sans code.");

doc.moveDown(1);
doc.fillColor("#94a3b8").fontSize(8).font("Helvetica-Oblique")
  .text("Comité de la Vienne · 1 Rue de la Poste, 86500 Saint Julien l'Ars — Guide pour la version 21 du site", { align: "center" });

doc.end();
console.log("PDF généré :", out);
