// Initialisation du schéma au démarrage du serveur (Node.js uniquement).
// Permet de démarrer sur une base Neuve (Neon/Vercel) sans erreur.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { ensureSchema } = await import("./db/ensureSchema");
      await ensureSchema();
    } catch (err) {
      // On ne bloque pas le démarrage : on journalise seulement.
      console.error("[schema] initialisation:", err);
    }
  }
}
