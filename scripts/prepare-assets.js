/*
 * Prépare les fichiers du dossier public/ s'ils manquent :
 *  - télécharge les 3 logos officiels (FFPJP, Vienne, Nouvelle-Aquitaine)
 *  - génère le guide PDF
 * Exécuté automatiquement avant chaque build (Vercel, local...).
 * Ne fait JAMAIS échouer le build : en cas de problème réseau, le site
 * fonctionne quand même (les logos seront simplement absents).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const IMG_DIR = path.join(ROOT, "public", "images");

const LOGOS = [
  {
    file: "logo-ffpjp.png",
    url: "https://www.ffpjp.org/portail/images/ffpjp_logo-quadri-avec-texte.jpg",
  },
  {
    file: "logo-vienne.png",
    url: "https://i0.wp.com/comitepetanque86.fr/wp-content/uploads/2018/01/ecusson_ffpjp_vienne.jpg?ssl=1",
  },
  {
    file: "logo-nouvelle-aquitaine.png",
    url: "https://www.petanque79.com/media/uploaded/sites/13801/kcupload/images/LOGO%20NELLE%20AQUITAINE%281%29.jpg",
  },
];

async function downloadLogo(logo) {
  const dest = path.join(IMG_DIR, logo.file);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    console.log(`  ✓ ${logo.file} déjà présent`);
    return;
  }
  try {
    const res = await fetch(logo.url, {
      headers: { "User-Agent": "Mozilla/5.0 (site CDC petanque)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) throw new Error("fichier trop petit");
    fs.writeFileSync(dest, buf);
    console.log(`  ⬇ ${logo.file} téléchargé (${Math.round(buf.length / 1024)} Ko)`);
  } catch (e) {
    console.warn(`  ⚠ ${logo.file} : téléchargement impossible (${e.message}) — le site fonctionnera sans ce logo.`);
  }
}

function generateGuide() {
  const dest = path.join(ROOT, "public", "guide.pdf");
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    console.log("  ✓ guide.pdf déjà présent");
    return;
  }
  try {
    require("./make-guide.js");
    console.log("  📄 guide.pdf généré");
  } catch (e) {
    console.warn(`  ⚠ guide.pdf : génération impossible (${e.message}).`);
  }
}

async function main() {
  console.log("Préparation du dossier public/ ...");
  fs.mkdirSync(IMG_DIR, { recursive: true });
  for (const logo of LOGOS) {
    await downloadLogo(logo);
  }
  generateGuide();
  console.log("Préparation terminée.");
}

main().catch((e) => {
  console.warn("prepare-assets : erreur non bloquante —", e.message);
});
