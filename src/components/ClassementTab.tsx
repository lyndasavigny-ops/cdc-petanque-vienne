"use client";

import { useEffect, useState } from "react";
import type { ChampionshipDetail } from "@/lib/types";
import { computeClassement, baremeOf } from "@/lib/classement";
import { adminFetch } from "@/lib/adminFetch";

export default function ClassementTab({
  detail,
  isOrganisateur,
  reload,
}: {
  detail: ChampionshipDetail;
  isOrganisateur?: boolean;
  reload?: () => Promise<void>;
}) {
  const bareme = baremeOf(detail.championship);
  const lignes = computeClassement(detail.teams, detail.rencontres, bareme);

  // Saisie de l'ordre manuel (organisateur)
  const [ranks, setRanks] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init: Record<number, string> = {};
    for (const t of detail.teams) {
      const m = (t as { classementManuel?: number }).classementManuel ?? 0;
      init[t.id] = m > 0 ? String(m) : "";
    }
    setRanks(init);
  }, [detail]);

  const manuelActif = detail.teams.some(
    (t) => ((t as { classementManuel?: number }).classementManuel ?? 0) > 0,
  );

  async function appliquer() {
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      const res = await adminFetch(
        `/api/championnats/${detail.championship.id}/classement-manuel`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ranks: detail.teams.map((t) => ({
              teamId: t.id,
              rang: Number(ranks[t.id]) || 0,
            })),
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur.");
      } else {
        setMsg("✅ Ordre manuel appliqué.");
        if (reload) await reload();
      }
    } finally {
      setSaving(false);
    }
  }

  async function reinitialiser() {
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      await adminFetch(
        `/api/championnats/${detail.championship.id}/classement-manuel`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ranks: detail.teams.map((t) => ({ teamId: t.id, rang: 0 })),
          }),
        },
      );
      setMsg("✅ Retour au classement automatique.");
      if (reload) await reload();
    } finally {
      setSaving(false);
    }
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
          Classement mis à jour en direct · {totalJoues} rencontre
          {totalJoues > 1 ? "s" : ""} saisie{totalJoues > 1 ? "s" : ""}.
          {manuelActif && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
              ✋ Ordre manuel actif
            </span>
          )}
        </p>
        <p className="text-xs text-slate-500">
          Victoire {bareme.victoire} pts · Nul {bareme.nul} pts · Défaite{" "}
          {bareme.defaite} pt{bareme.defaite > 1 ? "s" : ""} · Forfait{" "}
          {bareme.forfait} pt{bareme.forfait > 1 ? "s" : ""}
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-700 text-white">
              <th className="px-3 py-2 text-left">Clt</th>
              <th className="px-3 py-2 text-left">Équipe</th>
              <th className="px-2 py-2">Joués</th>
              <th className="px-2 py-2">Pts</th>
              <th className="px-2 py-2">G</th>
              <th className="px-2 py-2">N</th>
              <th className="px-2 py-2">P</th>
              <th className="px-2 py-2">Forf.</th>
              <th className="px-2 py-2">Pour</th>
              <th className="px-2 py-2">Contre</th>
              <th className="px-2 py-2">Diff.</th>
              {isOrganisateur && (
                <th className="bg-amber-500 px-2 py-2" title="Visible uniquement par l'organisateur">
                  ✋ Ordre manuel
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
                  {l.manuel > 0 && (
                    <span className="ml-1 text-xs text-amber-600">✋</span>
                  )}
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
                {isOrganisateur && (
                  <td className="bg-amber-50 px-2 py-1 text-center">
                    <input
                      type="number"
                      min={1}
                      max={detail.teams.length}
                      value={ranks[l.teamId] ?? ""}
                      placeholder="—"
                      onChange={(e) =>
                        setRanks((prev) => ({
                          ...prev,
                          [l.teamId]: e.target.value,
                        }))
                      }
                      className="w-14 rounded border border-amber-300 px-1 py-1 text-center text-sm font-bold"
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isOrganisateur && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            ✋ Ordre manuel du classement final (visible par vous seul)
          </p>
          <p className="mt-1 text-xs text-amber-800">
            En cas d&apos;égalité entre plusieurs équipes : tapez le rang voulu
            (1 à {detail.teams.length}) dans la colonne « Ordre manuel » puis
            Appliquer. Les équipes avec un numéro passent en tête du classement
            dans l&apos;ordre choisi ; celles sans numéro suivent en ordre
            automatique. Chaque numéro ne peut servir qu&apos;une fois.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              onClick={appliquer}
              disabled={saving}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {saving ? "Enregistrement…" : "✅ Appliquer l'ordre manuel"}
            </button>
            <button
              onClick={reinitialiser}
              disabled={saving}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              ♻️ Revenir au classement automatique
            </button>
          </div>
          {msg && <p className="mt-2 text-sm text-emerald-700">{msg}</p>}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Tri : points total · en cas d&apos;égalité à deux :{" "}
        <strong>confrontation directe</strong> (le vainqueur du match entre les
        deux passe devant) ; si leur match était nul : différence (Pour −
        Contre), puis points pour.
      </p>
    </div>
  );
}
