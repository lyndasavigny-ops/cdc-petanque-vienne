import { cookies, headers } from "next/headers";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const ADMIN_COOKIE = "cdc_admin";

const DEFAULT_ADMIN_USER = "admin";
const DEFAULT_ADMIN_CODE = "vienne86";

// Garantit que toutes les tables existent (auto-réparation / premier
// déploiement sur base vide).
import {
  ensureSchema,
  resetSchemaCache,
  isMissingTableError,
} from "@/db/bootstrap";

async function getSetting(key: string): Promise<string | null> {
  await ensureSchema();
  try {
    const [row] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key));
    return row ? row.value : null;
  } catch (e) {
    if (isMissingTableError(e)) {
      // La table a disparu (base recréée) : on reconstruit et on réessaie.
      resetSchemaCache();
      await ensureSchema();
      const [row] = await db
        .select()
        .from(appSettings)
        .where(eq(appSettings.key, key));
      return row ? row.value : null;
    }
    throw e;
  }
}

async function setSetting(key: string, value: string) {
  await ensureSchema();
  try {
    await db
      .insert(appSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: appSettings.key, set: { value } });
  } catch (e) {
    if (isMissingTableError(e)) {
      resetSchemaCache();
      await ensureSchema();
      await db
        .insert(appSettings)
        .values({ key, value })
        .onConflictDoUpdate({ target: appSettings.key, set: { value } });
      return;
    }
    throw e;
  }
}

// Récupère (et initialise si besoin) les identifiants organisateur
export async function getAdminCreds(): Promise<{
  identifiant: string;
  code: string;
}> {
  let identifiant = await getSetting("admin_user");
  let code = await getSetting("admin_code");
  if (!identifiant) {
    identifiant = DEFAULT_ADMIN_USER;
    await setSetting("admin_user", identifiant);
  }
  if (!code) {
    code = DEFAULT_ADMIN_CODE;
    await setSetting("admin_code", code);
  }
  return { identifiant, code };
}

export async function updateAdminCreds(identifiant: string, code: string) {
  await setSetting("admin_user", identifiant);
  await setSetting("admin_code", code);
}

// Récupère le jeton transmis (en-tête ou cookie)
async function getToken(): Promise<string | null> {
  try {
    const h = await headers();
    const headerCode = h.get("x-admin-code");
    if (headerCode) return headerCode;
  } catch {
    // headers() indisponible : on ignore
  }
  try {
    const store = await cookies();
    const v = store.get(ADMIN_COOKIE)?.value;
    if (v) return v;
  } catch {
    // cookies() indisponible : on ignore
  }
  return null;
}

// Vérifie si le code correspond à un co-organisateur ajouté
async function isCoOrganisateurCode(code: string): Promise<boolean> {
  try {
    const { appUsers } = await import("@/db/schema");
    const rows = await db
      .select()
      .from(appUsers)
      .where(eq(appUsers.code, code));
    return rows.length > 0;
  } catch {
    return false;
  }
}

// Accès organisateur : compte principal OU co-organisateur ajouté.
export async function isAdmin(): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;
  let creds: { identifiant: string; code: string };
  try {
    creds = await getAdminCreds();
  } catch {
    return false;
  }
  if (token === creds.code) return true;
  return isCoOrganisateurCode(token);
}

// Accès compte PRINCIPAL uniquement (gestion des utilisateurs, etc.)
export async function isMainAdmin(): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;
  try {
    const creds = await getAdminCreds();
    return token === creds.code;
  } catch {
    return false;
  }
}

// Génère un code de saisie club (6 caractères, sans ambiguïté)
export function genCodeSaisie(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
