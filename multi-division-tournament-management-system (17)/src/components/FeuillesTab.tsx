"use client";

import Link from "next/link";
import type { ChampionshipDetail, Team } from "@/lib/types";
import { championshipName } from "@/lib/cdc";

function teamLabel(team: Team | undefined): string {
  if (!team) return "— Exempt —";
  return `${String(team.numero).padStart(2, "0")}-${team.nom}`;
}

export default function FeuillesTab({
  detail,
}: {
  detail: ChampionshipDetail;
}) {
  const c = detail.championship;
  const teamsById = new Map(detail.teams.map((t) => [t.id, t]));

  if (detail.journees.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        Effectuez d&apos;abord le tirage dans l&apos;onglet Configuration pour
        générer les feuilles de match.
      </p>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-800">
          🖨️ Cliquez sur <strong>« Imprimer la journée (recto/verso) »</strong>{" "}
          pour sortir toutes les feuilles de match d&apos;une journée :
          composition au recto, résultats au verso.
        </p>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          🖨️ Imprimer ce récapitulatif
        </button>
      </div>

      <div id="feuilles-print" className="grid gap-5">
        {/* En-tête type tableau Excel */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-purple-200 px-4 py-2 text-center font-bold text-slate-800">
            Saison {c.saison}
          </div>
          <div className="rounded-md bg-sky-200 px-4 py-2 text-center font-bold text-slate-800">
            {championshipName(c)}
          </div>
        </div>

        {detail.journees.map((j) => {
          const rs = detail.rencontres.filter((r) => r.journeeId === j.id);
          return (
            <section
              key={j.id}
              className="overflow-hidden rounded-md border-2 border-slate-800 bg-white print:break-inside-avoid"
            >
              <div className="flex items-center bg-sky-100 text-sm font-bold text-slate-800">
                <span className="flex-1 px-3 py-1.5 text-center">
                  Journée {j.numero}
                  {j.lieu && ` — ${j.lieu}`}
                  {j.dateRencontre && ` le ${j.dateRencontre}`}
                  {j.heure && ` à ${j.heure}`}
                </span>
                <Link
                  href={`/championnat/${c.id}/journee/${j.numero}`}
                  className="m-1 rounded bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900 print:hidden"
                >
                  🖨️ Imprimer la journée (recto/verso)
                </Link>
              </div>
              <table className="w-full border-collapse text-xs sm:text-sm">
                <tbody>
                  {rs.map((r) => {
                    const a = r.teamAId
                      ? teamsById.get(r.teamAId)
                      : undefined;
                    const b = r.teamBId
                      ? teamsById.get(r.teamBId)
                      : undefined;
                    return (
                      <tr key={r.id} className="border-t border-slate-300">
                        <td className="border-r border-slate-300 px-2 py-1.5 font-medium">
                          {teamLabel(a)}
                        </td>
                        <td className="w-12 border-r border-slate-300 bg-slate-50 px-2 py-1.5 text-center font-bold">
                          {r.saisi && r.scoreA != null ? r.scoreA : ""}
                        </td>
                        <td className="w-12 border-r border-slate-300 bg-slate-50 px-2 py-1.5 text-center font-bold">
                          {r.saisi && r.scoreB != null ? r.scoreB : ""}
                        </td>
                        <td className="px-2 py-1.5 text-right font-medium">
                          {teamLabel(b)}
                        </td>
                        <td className="w-20 border-l border-slate-300 px-2 py-1.5 text-center print:hidden">
                          {a && b && (
                            <Link
                              href={`/championnat/${c.id}/feuille/${r.id}`}
                              className="text-xs font-semibold text-emerald-700 hover:underline"
                            >
                              📄 Feuille
                            </Link>
                          )}
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
    </div>
  );
}
