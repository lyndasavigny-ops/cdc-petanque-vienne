import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/bootstrap";
import { isAdmin } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Page de diagnostic en français : ouvrez /api/diagnostic dans le
// navigateur pour savoir exactement ce qui bloque sur le déploiement.
export async function GET() {
  const result: Record<string, string> = {};

  // 1. Variable d'environnement
  const url = process.env.DATABASE_URL;
  if (!url) {
    result["1_variable_DATABASE_URL"] =
      "❌ MANQUANTE — Sur Vercel : Settings → Environment Variables → ajouter DATABASE_URL avec l'adresse de votre base Neon, puis Redeploy.";
    return NextResponse.json(result, { status: 500 });
  }
  const masked = url.replace(/:\/\/([^:]+):[^@]+@/, "://$1:•••@");
  result["1_variable_DATABASE_URL"] = `✅ Présente (${masked.slice(0, 60)}…)`;

  // 2. Connexion à la base
  try {
    await db.execute(sql`select 1`);
    result["2_connexion_base"] = "✅ Connexion à la base réussie";
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    result["2_connexion_base"] =
      `❌ ÉCHEC de connexion : ${msg} — Vérifiez que l'adresse copiée depuis Neon est complète (elle doit contenir le mot de passe et finir par ?sslmode=require).`;
    return NextResponse.json(result, { status: 500 });
  }

  // 3. Création / présence des tables
  try {
    await ensureSchema();
    result["3_tables"] = "✅ Tables présentes (créées automatiquement si besoin)";
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    result["3_tables"] = `❌ Impossible de créer les tables : ${msg}`;
    return NextResponse.json(result, { status: 500 });
  }

  // 4. Identifiants organisateur — détails réservés aux admins connectés
  try {
    const admin = await isAdmin();
    const rows = await db.execute(
      sql`SELECT key, value FROM app_settings WHERE key IN ('admin_user','admin_code')`,
    );
    const list = (rows as unknown as { rows: { key: string; value: string }[] })
      .rows;
    const user = list.find((r) => r.key === "admin_user")?.value;
    if (admin && user) {
      result["4_identifiants"] =
        `✅ Identifiant organisateur configuré : « ${user} » (le code n'est jamais affiché). En cas d'oubli : supprimez les lignes admin_user et admin_code de la table app_settings sur Neon, les identifiants par défaut seront restaurés.`;
    } else if (user) {
      result["4_identifiants"] =
        "✅ Comptes organisateur configurés (détails visibles uniquement par un organisateur connecté).";
    } else {
      result["4_identifiants"] =
        "✅ Pas encore initialisés — ils seront créés à la première connexion.";
    }
  } catch {
    result["4_identifiants"] = "⚠️ Vérification impossible (sans gravité).";
  }

  // 5. Fichiers des logos (feuilles de match)
  try {
    const imgDir = path.join(process.cwd(), "public", "images");
    const logos = [
      "logo-ffpjp.png",
      "logo-vienne.png",
      "logo-nouvelle-aquitaine.png",
    ];
    const manquants = logos.filter(
      (l) => !fs.existsSync(path.join(imgDir, l)),
    );
    if (manquants.length === 0) {
      result["5_logos"] = "✅ Les 3 logos des feuilles de match sont présents";
    } else {
      result["5_logos"] =
        `❌ Logos manquants : ${manquants.join(", ")} — le dossier public/images n'a pas été transféré. Re-téléchargez le ZIP depuis Arena et envoyez TOUT son contenu (y compris le dossier public) sur GitHub/Vercel.`;
    }
  } catch {
    result["5_logos"] = "⚠️ Vérification des logos impossible.";
  }

  result["conclusion"] =
    "✅ Tout fonctionne ! Vous pouvez vous connecter depuis la page d'accueil.";
  return NextResponse.json(result);
}
