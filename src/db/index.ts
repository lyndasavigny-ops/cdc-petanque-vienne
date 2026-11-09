import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsDb?: ReturnType<typeof drizzle>;
};

// La connexion est créée à la demande : rien ne plante au moment du build
// si DATABASE_URL n'est pas encore définie. L'erreur n'arrive qu'à la
// première vraie requête (à l'exécution).
function getDb(): ReturnType<typeof drizzle> {
  if (!globalForDb.__arenaNextJsDb) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL est nécessaire : ajoutez la variable d'environnement DATABASE_URL (base PostgreSQL) dans Vercel → Settings → Environment Variables.",
      );
    }
    const pool =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({ connectionString: databaseUrl });
    globalForDb.__arenaNextJsPostgresqlPool = pool;
    globalForDb.__arenaNextJsDb = drizzle(pool);
  }
  return globalForDb.__arenaNextJsDb;
}

// `db` s'initialise paresseusement (proxy) : utiliser db.select()/insert()/...
// déclenche la connexion seulement au premier usage réel.
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const instance = getDb() as unknown as Record<string | symbol, unknown>;
    const value = instance[prop];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
});
