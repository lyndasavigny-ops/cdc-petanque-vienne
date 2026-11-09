"use client";

import type { ChampionshipDetail } from "@/lib/types";
import { computeClassement } from "@/lib/classement";

export default function ClassementTab({
  detail,
  admin = false,
  reload,
}: {
  detail: ChampionshipDetail;
  admin?: boolean;
  reload?: () => Promise<void>;
}) {
  const ch = detail.championship;
  const lignes = computeClassement(detail.teams, detail.rencontres, {
    victoire: ch.ptsVictoire,
    nul: ch.ptsNul,
    defaite: ch.ptsDefaite,
    forfait: ch.ptsForfait,
  });

  async function setRang(teamId: number, valeur: string) {
    await fetch(`/api/teams/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classementFinal: valeur === "" ? null : Number(valeur),
      }),
    });
    if (reload) await reload();
  }

  if (detail.teams.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        Aucune équipe enregistrée.
      </p>
    );
  }

  const totalJoues = detail.rencontres.filter((r) => r.saisi).length;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          Classement en direct · {totalJoues} rencontre
          {totalJoues > 1 ? "s" : ""} saisie{totalJoues > 1 ? "s" : ""} · barème
          V{ch.ptsVictoire}/N{ch.ptsNul}/D{ch.ptsDefaite}/F{ch.ptsForfait}
        </p>
        <p className="text-xs text-slate-500">
          Égalité → confrontation directe (vainqueur devant) → différence.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-700 text-white">
              <th className="px-3 py-2 text-left">Clt</th>
              <th className="px-3 py-2 text-left">Équipe</th>
              <th className="px-2 py-2">Joués</th>
              <th className="px-2 py-2">Pts</th>
              <th className="px-2 py-2">G</th>
              <th className="px-2 py-2">N</th>
              <th className="px-2 py-2">P</th>
              <th className="px-2 py-2">Forf</th>
              <th className="px-2 py-2">Pour</th>
              <th className="px-2 py-2">Contre</th>
              <th className="px-2 py-2">Diff</th>
              {admin && (
                <th className="bg-emerald-800 px-2 py-2">
                  Classement final (admin)
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr
                key={l.teamId}
                className={`border-t border-slate-100 ${
                  i === 0 ? "bg-amber-50" : i % 2 ? "bg-slate-50/50" : ""
                }`}
              >
                <td className="px-3 py-2 font-bold text-slate-700">
                  {i + 1}
                  {i === 0 ? "er" : "ème"}
                </td>
                <td className="px-3 py-2 font-medium text-slate-900">
                  {String(l.numero).padStart(2, "0")}-{l.nom}
                </td>
                <td className="px-2 py-2 text-center">{l.joues}</td>
                <td className="px-2 py-2 text-center font-bold text-emerald-700">
                  {l.pointsTotal}
                </td>
                <td className="px-2 py-2 text-center">{l.gagnes}</td>
                <td className="px-2 py-2 text-center">{l.nuls}</td>
                <td className="px-2 py-2 text-center">{l.perdus}</td>
                <td className="px-2 py-2 text-center">{l.forfaits}</td>
                <td className="px-2 py-2 text-center">{l.pointsPour}</td>
                <td className="px-2 py-2 text-center">{l.pointsContre}</td>
                <td
                  className={`px-2 py-2 text-center font-medium ${
                    l.difference > 0
                      ? "text-emerald-600"
                      : l.difference < 0
                        ? "text-red-500"
                        : "text-slate-500"
                  }`}
                >
                  {l.difference > 0 ? "+" : ""}
                  {l.difference}
                </td>
                {admin && (
                  <td className="bg-emerald-50 px-2 py-1 text-center">
                    <input
                      key={`${l.teamId}-${l.classementFinal ?? ""}`}
                      type="number"
                      min={1}
                      max={lignes.length}
                      defaultValue={l.classementFinal ?? ""}
                      placeholder="—"
                      onBlur={(e) => setRang(l.teamId, e.target.value)}
                      className="w-16 rounded border border-emerald-300 px-2 py-1 text-center text-sm"
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {admin && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <strong>Classement final (admin) :</strong> en cas d&apos;égalité
          entre plusieurs équipes, tapez le numéro de place (1, 2, 3…) pour
          imposer l&apos;ordre final. Exemple : mettez <strong>3</strong> devant
          une équipe pour la mettre 3ème, <strong>1</strong> pour la mettre 1ère.
          Le classement se réorganise automatiquement. Laissez vide pour garder
          l&apos;ordre automatique.
        </div>
      )}
    </div>
  );
}
