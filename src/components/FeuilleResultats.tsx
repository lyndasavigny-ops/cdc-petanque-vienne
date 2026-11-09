"use client";

import type { ChampionshipDetail, Team } from "@/lib/types";
import { championshipName } from "@/lib/cdc";
import { computeClassement } from "@/lib/classement";

function teamLabel(t: Team | undefined): string {
  if (!t) return "— Exempt —";
  return `${String(t.numero).padStart(2, "0")}-${t.nom}`;
}

// Feuille de résultats + classement, à imprimer en PDF (réservée à l'admin).
export default function FeuilleResultats({
  detail,
}: {
  detail: ChampionshipDetail;
}) {
  const c = detail.championship;
  const lignes = computeClassement(detail.teams, detail.rencontres, {
    victoire: c.ptsVictoire,
    nul: c.ptsNul,
    defaite: c.ptsDefaite,
    forfait: c.ptsForfait,
  });

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            📄 Feuille de résultats &amp; classement (PDF)
          </h2>
          <p className="text-sm text-slate-500">
            Réservé à l&apos;administrateur — imprimez la feuille officielle des
            résultats.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          🖨️ Imprimer / PDF
        </button>
      </div>

      <div
        id="resultats-print"
        className="rounded-2xl border border-slate-200 bg-white p-6"
      >
        {/* En-tête */}
        <div className="border-b-2 border-slate-800 pb-3 text-center">
          <h1 className="text-2xl font-black uppercase text-blue-800">
            {championshipName(c)}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Saison {c.saison} · {c.typeCdc} · CDC {c.division} · Poule {c.poule}
          </p>
          <p className="text-xs text-slate-500">
            Feuille de résultats et classement — Comité de la Vienne (86)
          </p>
        </div>

        {/* Résultats */}
        <section className="mt-5">
          <h2 className="mb-2 text-lg font-bold text-slate-800">
            📋 Résultats
          </h2>
          {detail.journees.length === 0 && (
            <p className="text-sm text-slate-500">Aucune journée.</p>
          )}
          <div className="grid gap-3">
            {detail.journees.map((j) => {
              const rs = detail.rencontres.filter((r) => r.journeeId === j.id);
              return (
                <div key={j.id}>
                  <h3 className="text-sm font-semibold text-slate-700">
                    Journée {j.numero}
                    {j.lieu && ` — ${j.lieu}`}
                    {j.dateRencontre && ` le ${j.dateRencontre}`}
                    {j.heure && ` à ${j.heure}`}
                  </h3>
                  <table className="mt-1 w-full border-collapse text-sm">
                    <tbody>
                      {rs.map((r) => {
                        const a = detail.teams.find((t) => t.id === r.teamAId);
                        const b = detail.teams.find((t) => t.id === r.teamBId);
                        return (
                          <tr key={r.id} className="border-t border-slate-200">
                            <td className="px-2 py-1 text-right">
                              {teamLabel(a)}
                            </td>
                            <td className="w-20 px-2 py-1 text-center font-bold">
                              {r.saisi ? `${r.scoreA} - ${r.scoreB}` : "- : -"}
                            </td>
                            <td className="px-2 py-1">{teamLabel(b)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </section>

        {/* Classement */}
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-bold text-slate-800">
            🏆 Classement
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-2 py-1">Rang</th>
                <th className="border border-slate-300 px-2 py-1 text-left">
                  Équipe
                </th>
                <th className="border border-slate-300 px-2 py-1">Joués</th>
                <th className="border border-slate-300 px-2 py-1">Pts</th>
                <th className="border border-slate-300 px-2 py-1">G</th>
                <th className="border border-slate-300 px-2 py-1">N</th>
                <th className="border border-slate-300 px-2 py-1">P</th>
                <th className="border border-slate-300 px-2 py-1">Forf</th>
                <th className="border border-slate-300 px-2 py-1">Pour</th>
                <th className="border border-slate-300 px-2 py-1">Contre</th>
                <th className="border border-slate-300 px-2 py-1">Diff</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={l.teamId}>
                  <td className="border border-slate-300 px-2 py-1 text-center font-bold">
                    {i + 1}
                  </td>
                  <td className="border border-slate-300 px-2 py-1">
                    {String(l.numero).padStart(2, "0")}-{l.nom}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    {l.joues}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center font-bold">
                    {l.pointsTotal}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    {l.gagnes}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    {l.nuls}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    {l.perdus}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    {l.forfaits}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    {l.pointsPour}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    {l.pointsContre}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    {l.difference > 0 ? "+" : ""}
                    {l.difference}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-500">
            Barème : victoire {c.ptsVictoire} · nul {c.ptsNul} · défaite{" "}
            {c.ptsDefaite} · forfait {c.ptsForfait} pts. — <strong>Forfait = 19 à 0</strong>{" "}
            (différence +19). Égalité :{" "}
            <strong>
              1. points · 2. confrontation directe / mini-championnat · 3. point
              average
            </strong>{" "}
            (article 12).
          </p>
        </section>

        {/* Pied */}
        <div className="mt-8 flex items-center justify-between text-xs text-slate-600">
          <span>
            Le Président :{" "}
            <span className="inline-block w-40 border-b border-slate-400" />
          </span>
          <span>
            Date :{" "}
            <span className="inline-block w-32 border-b border-slate-400" />
          </span>
        </div>
      </div>
    </div>
  );
}
