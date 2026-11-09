import { db } from "@/db";
import { sql } from "drizzle-orm";

// Crée automatiquement toutes les tables si elles n'existent pas.
// Permet de déployer sur une base vide (Neon, etc.) sans aucune commande.
let done = false;

// À appeler si une requête échoue avec « relation does not exist » :
// force la re-création au prochain ensureSchema().
export function resetSchemaCache() {
  done = false;
}

// Détecte l'erreur PostgreSQL « table inexistante » (code 42P01),
// y compris lorsqu'elle est enveloppée (DrizzleQueryError -> cause).
export function isMissingTableError(e: unknown): boolean {
  let cur = e as
    | { code?: string; message?: string; cause?: unknown }
    | undefined;
  for (let depth = 0; cur && depth < 5; depth++) {
    if (
      cur.code === "42P01" ||
      /relation .* does not exist/i.test(String(cur.message ?? ""))
    ) {
      return true;
    }
    cur = cur.cause as typeof cur;
  }
  return false;
}

export async function ensureSchema(): Promise<void> {
  if (done) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key text PRIMARY KEY,
      value text NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_users (
      id serial PRIMARY KEY,
      identifiant text NOT NULL,
      code text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS championships (
      id serial PRIMARY KEY,
      saison text NOT NULL DEFAULT '',
      annee integer NOT NULL DEFAULT 2025,
      type_cdc text NOT NULL DEFAULT 'Senior',
      division integer NOT NULL DEFAULT 1,
      poule text NOT NULL DEFAULT 'A',
      code_saisie text NOT NULL DEFAULT '',
      device_lock text NOT NULL DEFAULT '',
      pts_victoire integer NOT NULL DEFAULT 3,
      pts_nul integer NOT NULL DEFAULT 2,
      pts_defaite integer NOT NULL DEFAULT 1,
      pts_forfait integer NOT NULL DEFAULT 0,
      created_at timestamp DEFAULT now() NOT NULL
    )
  `);
  await db.execute(
    sql`ALTER TABLE championships ADD COLUMN IF NOT EXISTS device_lock text NOT NULL DEFAULT ''`,
  );
  await db.execute(
    sql`ALTER TABLE championships ADD COLUMN IF NOT EXISTS pts_victoire integer NOT NULL DEFAULT 3`,
  );
  await db.execute(
    sql`ALTER TABLE championships ADD COLUMN IF NOT EXISTS pts_nul integer NOT NULL DEFAULT 2`,
  );
  await db.execute(
    sql`ALTER TABLE championships ADD COLUMN IF NOT EXISTS pts_defaite integer NOT NULL DEFAULT 1`,
  );
  await db.execute(
    sql`ALTER TABLE championships ADD COLUMN IF NOT EXISTS pts_forfait integer NOT NULL DEFAULT 0`,
  );
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS teams (
      id serial PRIMARY KEY,
      championship_id integer NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      numero integer NOT NULL,
      nom text NOT NULL,
      classement_manuel integer NOT NULL DEFAULT 0
    )
  `);
  await db.execute(
    sql`ALTER TABLE teams ADD COLUMN IF NOT EXISTS classement_manuel integer NOT NULL DEFAULT 0`,
  );
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS journees (
      id serial PRIMARY KEY,
      championship_id integer NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      numero integer NOT NULL,
      lieu text NOT NULL DEFAULT '',
      date_rencontre text NOT NULL DEFAULT '',
      heure text NOT NULL DEFAULT '',
      validee boolean NOT NULL DEFAULT false
    )
  `);
  await db.execute(
    sql`ALTER TABLE journees ADD COLUMN IF NOT EXISTS validee boolean NOT NULL DEFAULT false`,
  );
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rencontres (
      id serial PRIMARY KEY,
      championship_id integer NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      journee_id integer NOT NULL REFERENCES journees(id) ON DELETE CASCADE,
      ordre integer NOT NULL DEFAULT 0,
      team_a_id integer REFERENCES teams(id) ON DELETE CASCADE,
      team_b_id integer REFERENCES teams(id) ON DELETE CASCADE,
      score_a integer,
      score_b integer,
      forfait_a boolean NOT NULL DEFAULT false,
      forfait_b boolean NOT NULL DEFAULT false,
      saisi boolean NOT NULL DEFAULT false,
      parties_a integer,
      parties_b integer
    )
  `);
  await db.execute(
    sql`ALTER TABLE rencontres ADD COLUMN IF NOT EXISTS parties_a integer`,
  );
  await db.execute(
    sql`ALTER TABLE rencontres ADD COLUMN IF NOT EXISTS parties_b integer`,
  );
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS players (
      id serial PRIMARY KEY,
      team_id integer NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      ordre integer NOT NULL DEFAULT 1,
      nom text NOT NULL DEFAULT '',
      prenom text NOT NULL DEFAULT '',
      licence text NOT NULL DEFAULT ''
    )
  `);
  // Mise en conformité : les forfaits enregistrés 36-0 passent à 19-0
  // (règlement CDC : victoire par forfait = 19 à 0).
  await db.execute(sql`
    UPDATE rencontres SET score_a = 0, score_b = 19
    WHERE forfait_a = true AND forfait_b = false AND score_b = 36
  `);
  await db.execute(sql`
    UPDATE rencontres SET score_a = 19, score_b = 0
    WHERE forfait_b = true AND forfait_a = false AND score_a = 36
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS scans (
      id serial PRIMARY KEY,
      championship_id integer NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      journee_id integer NOT NULL REFERENCES journees(id) ON DELETE CASCADE,
      filename text NOT NULL,
      mime_type text NOT NULL,
      data_base64 text NOT NULL,
      taille integer NOT NULL DEFAULT 0,
      uploaded_by text NOT NULL DEFAULT 'club',
      created_at timestamp DEFAULT now() NOT NULL
    )
  `);
  done = true;
}
