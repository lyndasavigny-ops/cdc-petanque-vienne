"use client";

import type { ChampionshipDetail, Rencontre, Team } from "@/lib/types";
import { championshipName } from "@/lib/cdc";
import ClassementTab from "./ClassementTab";

function label(t: Team | undefined): string {
  if (!t) return "— Exempt —";
  return `${String(t.numero).padStart(2, "0")}-${t.nom}`;
}

// Vue publique : résultats + classement, sans connexion (lecture seule).
export default function PublicView({
  detail,
  onLogin,
}: {
  detail: ChampionshipDetail;
  onLogin: () => void;
}) {
  const c = detail.championship;

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <header className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-500 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-100">
              Comité départemental de la Vienne (86) · FFPJP
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              {championshipName(c)}
            </h1>
            <p className="mt-1 text-emerald-50">
              Saison {c.saison} · {c.typeCdc} · {detail.teams.length} équipes
            </p>
          </div>
          <button
            onClick={onLogin}
            className="rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30"
          >
            🔑 Se connecter
          </button>
        </div>
        <p className="mt-3 inline-block rounded-lg bg-white/20 px-3 py-1.5 text-sm">
          📊 Résultats et classement en direct — mis à jour automatiquement.
        </p>
      </header>

      {/* Classement */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-slate-800">
          🏆 Classement
        </h2>
        <ClassementTab detail={detail} />
      </section>

      {/* Résultats par journée */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-800">📋 Résultats</h2>
        {detail.journees.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
            Aucune journée programmée pour le moment.
          </p>
        )}
        <div className="grid gap-4">
          {detail.journees.map((j) => {
            const rs = detail.rencontres.filter((r) => r.journeeId === j.id);
            return (
              <section
                key={j.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="bg-cyan-100 px-4 py-2 text-sm font-semibold text-slate-800">
                  Journée {j.numero}
                  {j.lieu && ` — ${j.lieu}`}
                  {j.dateRencontre && ` le ${j.dateRencontre}`}
                  {j.heure && ` à ${j.heure}`}
                </div>
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {rs.map((r: Rencontre) => {
                      const a = detail.teams.find((t) => t.id === r.teamAId);
                      const b = detail.teams.find((t) => t.id === r.teamBId);
                      const played = r.saisi;
                      return (
                        <tr key={r.id} className="border-t border-slate-100">
                          <td className="px-4 py-2 text-right font-medium text-slate-800">
                            {label(a)}
                          </td>
                          <td className="w-24 px-2 py-2 text-center font-bold">
                            {played ? (
                              <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-800">
                                {r.scoreA} - {r.scoreB}
                              </span>
                            ) : (
                              <span className="text-slate-300">- : -</span>
                            )}
                          </td>
                          <td className="px-4 py-2 font-medium text-slate-800">
                            {label(b)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            );
          })}
        </div>
      </section>

      <footer className="mt-10 text-center text-xs text-slate-400">
        Comité de la Vienne · 1 Rue de la Poste, 86500 Saint Julien l&apos;Ars
      </footer>
    </main>
  );
}
