import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Connexion paresseuse : le pool n'est créé qu'au premier usage réel.
// Ainsi le build (Vercel, etc.) réussit même si DATABASE_URL n'est pas
// encore configurée — l'erreur claire n'apparaît qu'à l'exécution.

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsDrizzle?: NodePgDatabase;
};

function getPool(): Pool {
  if (globalForDb.__arenaNextJsPostgresqlPool) {
    return globalForDb.__arenaNextJsPostgresqlPool;
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL est manquante. Sur Vercel : Settings → Environment Variables → ajouter DATABASE_URL (adresse de votre base Neon/Postgres), puis redéployer.",
    );
  }
  // Les bases hébergées (Neon, Supabase, Railway…) exigent le SSL.
  // On l'active automatiquement sauf pour une base locale.
  const isLocal =
    /localhost|127\.0\.0\.1/.test(databaseUrl) &&
    !/sslmode=require/.test(databaseUrl);
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });
  globalForDb.__arenaNextJsPostgresqlPool = pool;
  return pool;
}

function getDb(): NodePgDatabase {
  if (globalForDb.__arenaNextJsDrizzle) {
    return globalForDb.__arenaNextJsDrizzle;
  }
  const instance = drizzle(getPool());
  globalForDb.__arenaNextJsDrizzle = instance;
  return instance;
}

// Proxy : toute propriété utilisée sur `db` déclenche l'initialisation réelle.
export const db = new Proxy({} as NodePgDatabase, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export const pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    const real = getPool();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
