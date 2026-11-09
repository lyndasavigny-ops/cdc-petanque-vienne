import { sql } from "drizzle-orm";
import { db } from "./index";

// Crée les tables si elles n'existent pas (base vide sur Neon/Vercel).
// Idempotent : ne modifie rien si les tables existent déjà.
export async function ensureSchema(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS championships (
      id serial PRIMARY KEY,
      saison text NOT NULL DEFAULT '',
      annee integer NOT NULL DEFAULT 2025,
      type_cdc text NOT NULL DEFAULT 'Senior',
      division integer NOT NULL DEFAULT 1,
      poule text NOT NULL DEFAULT 'A',
      format text NOT NULL DEFAULT 'Doublettes',
      admin_code text NOT NULL DEFAULT '',
      created_at timestamp NOT NULL DEFAULT now()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS teams (
      id serial PRIMARY KEY,
      championship_id integer NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      numero integer NOT NULL,
      nom text NOT NULL,
      identifiant text NOT NULL DEFAULT '',
      code text NOT NULL DEFAULT ''
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS journees (
      id serial PRIMARY KEY,
      championship_id integer NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
      numero integer NOT NULL,
      lieu text NOT NULL DEFAULT '',
      date_rencontre text NOT NULL DEFAULT '',
      heure text NOT NULL DEFAULT ''
    );
  `);

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
      parties_a jsonb DEFAULT '[]'::jsonb,
      parties_b jsonb DEFAULT '[]'::jsonb,
      composition_a jsonb DEFAULT '[]'::jsonb,
      composition_b jsonb DEFAULT '[]'::jsonb,
      forfait_a boolean NOT NULL DEFAULT false,
      forfait_b boolean NOT NULL DEFAULT false,
      saisi boolean NOT NULL DEFAULT false
    );
  `);
}
