import { db } from "@/db";
import { championships } from "@/db/schema";
import { desc } from "drizzle-orm";
import Landing from "@/components/Landing";
import NewChampionshipForm from "@/components/NewChampionshipForm";
import { championshipName } from "@/lib/cdc";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rows = await db
    .select()
    .from(championships)
    .orderBy(desc(championships.createdAt));

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <header className="rounded-3xl bg-gradient-to-r from-emerald-700 to-emerald-500 p-10 text-white shadow-lg">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-100">
          Comité départemental de la Vienne (86) · FFPJP
        </p>
        <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">
          Championnats Des Clubs — Pétanque
        </h1>
        <p className="mt-4 max-w-3xl text-emerald-50">
          Consultez librement les scores et classements ci-dessous. Clubs :
          saisissez les scores de votre poule avec votre code. Organisateur :
          connectez-vous pour gérer les championnats.
        </p>
      </header>

      <div className="mt-10">
        <Landing
          championnats={rows.map((c) => ({
            id: c.id,
            label: championshipName(c),
            saison: c.saison,
            typeCdc: c.typeCdc,
          }))}
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold text-slate-800">
          ➕ Créer un championnat
        </h2>
        <NewChampionshipForm />
      </section>

      <footer className="mt-12 text-center text-xs text-slate-400">
        Comité de la Vienne · 1 rue de la Poste, 86500 Saint Julien l&apos;Ars
        <br />
        <span className="mt-1 inline-block rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          Version 12
        </span>
      </footer>
    </main>
  );
}
