"use client";

import { useState } from "react";
import type { ChampionshipDetail, Rencontre, Team } from "@/lib/types";
import { championshipName, formatConfig } from "@/lib/cdc";
import FeuilleMatch from "./FeuilleMatch";

function teamLabel(t: Team | undefined): string {
  if (!t) return "— Exempt —";
  return `${String(t.numero).padStart(2, "0")}-${t.nom}`;
}

type View = "detaillee" | "journee";

export default function FeuillesTab({
  detail,
  reload,
}: {
  detail: ChampionshipDetail;
  reload: () => Promise<void>;
}) {
  const c = detail.championship;
  const cfg = formatConfig(c.format);
  const [view, setView] = useState<View>("detaillee");

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
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setView("detaillee")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              view === "detaillee"
                ? "bg-emerald-600 text-white shadow"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Feuilles de match (recto/verso)
          </button>
          <button
            onClick={() => setView("journee")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              view === "journee"
                ? "bg-emerald-600 text-white shadow"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Récapitulatif par journée
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => reload()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            🔄 Actualiser
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
          >
            🖨️ Imprimer
          </button>
        </div>
      </div>

      {/* ============ VUE : FEUILLES DE MATCH DÉTAILLÉES ============ */}
      {view === "detaillee" && (
        <div id="feuilles-print" className="grid gap-6">
          {detail.journees.map((j) => {
            const rs = detail.rencontres.filter((r) => r.journeeId === j.id);
            return (
              <div key={j.id} className="grid gap-4">
                <div className="rounded-md bg-gray-200 px-3 py-1.5 text-center text-sm font-bold text-slate-800">
                  Journée {j.numero}
                  {j.lieu && ` — ${j.lieu}`}
                  {j.dateRencontre && ` le ${j.dateRencontre}`}
                  {j.heure && ` à ${j.heure}`}
                </div>
                {rs.map((r: Rencontre) => (
                  <FeuilleMatch
                    key={r.id}
                    detail={detail}
                    rencontre={r}
                    journee={j}
                    cfg={cfg}
                    reload={reload}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ============ VUE : RÉCAPITULATIF PAR JOURNÉE ============ */}
      {view === "journee" && (
        <div id="feuilles-print" className="grid gap-6">
          {detail.journees.map((j, idx) => {
            const rs = detail.rencontres.filter((r) => r.journeeId === j.id);
            return (
              <section
                key={j.id}
                className={`overflow-hidden rounded-md border-2 border-slate-800 bg-white print:break-inside-avoid ${
                  idx > 0 ? "print:break-before-page" : ""
                }`}
              >
                <div className="grid grid-cols-2 gap-2 p-2">
                  <div className="rounded bg-gray-100 px-3 py-1.5 text-center text-sm font-bold text-slate-800">
                    Saison {c.saison}
                  </div>
                  <div className="rounded bg-gray-200 px-3 py-1.5 text-center text-sm font-bold text-slate-800">
                    {championshipName(c)}
                  </div>
                </div>

                <div className="mx-2 rounded bg-gray-200 px-3 py-1.5 text-center text-sm font-bold text-slate-800">
                  Journée {j.numero}
                  {j.lieu && ` — ${j.lieu}`}
                  {j.dateRencontre && ` le ${j.dateRencontre}`}
                  {j.heure && ` à ${j.heure}`}
                </div>

                <div className="p-2">
                  <table className="w-full border-collapse text-sm">
                    <tbody>
                      {rs.map((r: Rencontre) => {
                        const a = r.teamAId
                          ? detail.teams.find((t) => t.id === r.teamAId)
                          : undefined;
                        const b = r.teamBId
                          ? detail.teams.find((t) => t.id === r.teamBId)
                          : undefined;
                        const sa = r.saisi && r.scoreA != null ? r.scoreA : "";
                        const sb = r.saisi && r.scoreB != null ? r.scoreB : "";
                        return (
                          <tr key={r.id}>
                            <td className="border border-slate-800 px-2 py-2 font-medium">
                              {teamLabel(a)}
                            </td>
                            <td className="w-14 border border-slate-800 bg-gray-100 px-2 py-2 text-center font-bold">
                              {sa}
                            </td>
                            <td className="w-14 border border-slate-800 bg-gray-100 px-2 py-2 text-center font-bold">
                              {sb}
                            </td>
                            <td className="border border-slate-800 px-2 py-2 text-right font-medium">
                              {teamLabel(b)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-300 px-3 py-2 text-[11px] text-slate-600">
                  <span>
                    Signature capitaine A :{" "}
                    <span className="inline-block w-32 border-b border-slate-400" />
                  </span>
                  <span>
                    Signature capitaine B :{" "}
                    <span className="inline-block w-32 border-b border-slate-400" />
                  </span>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
