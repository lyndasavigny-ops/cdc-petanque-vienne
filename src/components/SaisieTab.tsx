"use client";

import { useEffect, useRef, useState } from "react";
import type { ChampionshipDetail, Rencontre, Team } from "@/lib/types";
import { TOTAL_POINTS } from "@/lib/cdc";

function teamLabel(t: Team | undefined): string {
  if (!t) return "— Exempt —";
  return `${String(t.numero).padStart(2, "0")}-${t.nom}`;
}

function RencontreRow({
  r,
  teamsById,
  onSaved,
  role,
  onUnlock,
}: {
  r: Rencontre;
  teamsById: Map<number, Team>;
  onSaved: () => Promise<void>;
  role: "admin" | "club" | "guest";
  onUnlock: (id: number) => void;
}) {
  const teamA = r.teamAId ? teamsById.get(r.teamAId) : undefined;
  const teamB = r.teamBId ? teamsById.get(r.teamBId) : undefined;
  const exempt = !r.teamAId || !r.teamBId;
  const locked = r.verrouille;

  const [scoreA, setScoreA] = useState<string>(
    r.scoreA != null ? String(r.scoreA) : "",
  );
  const [scoreB, setScoreB] = useState<string>(
    r.scoreB != null ? String(r.scoreB) : "",
  );
  const [forfaitA, setForfaitA] = useState(r.forfaitA);
  const [forfaitB, setForfaitB] = useState(r.forfaitB);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateA(v: string) {
    setScoreA(v);
    if (v !== "" && !Number.isNaN(Number(v))) {
      const n = Number(v);
      if (n >= 0 && n <= TOTAL_POINTS) setScoreB(String(TOTAL_POINTS - n));
    }
  }
  function updateB(v: string) {
    setScoreB(v);
    if (v !== "" && !Number.isNaN(Number(v))) {
      const n = Number(v);
      if (n >= 0 && n <= TOTAL_POINTS) setScoreA(String(TOTAL_POINTS - n));
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/rencontres/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scoreA: scoreA === "" ? null : Number(scoreA),
          scoreB: scoreB === "" ? null : Number(scoreB),
          forfaitA,
          forfaitB,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur");
      } else {
        await onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  // Sauvegarde automatique (uniquement si non verrouillé)
  const firstRun = useRef(true);
  useEffect(() => {
    if (locked) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const a = scoreA === "" ? null : Number(scoreA);
    const b = scoreB === "" ? null : Number(scoreB);
    const valid =
      forfaitA || forfaitB || (a !== null && b !== null && a + b === TOTAL_POINTS);
    if (!valid) return;
    const t = setTimeout(() => {
      save();
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoreA, scoreB, forfaitA, forfaitB]);

  if (exempt) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
        <span className="font-medium">{teamLabel(teamA ?? teamB)}</span>
        <span className="italic">est exempt de cette journée.</span>
      </div>
    );
  }

  const total = (Number(scoreA) || 0) + (Number(scoreB) || 0);
  const totalOk = forfaitA || forfaitB || total === TOTAL_POINTS;

  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        locked
          ? "border-emerald-300 bg-emerald-50/40"
          : r.saisi
            ? "border-emerald-200 bg-emerald-50/40"
            : "border-slate-200"
      }`}
    >
      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_auto_auto_1fr]">
        <span className="text-sm font-medium text-slate-800">
          {teamLabel(teamA)}
        </span>
        <input
          type="number"
          min={0}
          max={TOTAL_POINTS}
          value={scoreA}
          disabled={locked || forfaitA || forfaitB}
          onChange={(e) => updateA(e.target.value)}
          className="w-16 rounded border border-slate-300 px-2 py-1 text-center text-sm disabled:bg-slate-100"
        />
        <span className="text-center text-xs font-bold text-slate-400">VS</span>
        <input
          type="number"
          min={0}
          max={TOTAL_POINTS}
          value={scoreB}
          disabled={locked || forfaitA || forfaitB}
          onChange={(e) => updateB(e.target.value)}
          className="w-16 rounded border border-slate-300 px-2 py-1 text-center text-sm disabled:bg-slate-100"
        />
        <span className="text-right text-sm font-medium text-slate-800">
          {teamLabel(teamB)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
        <label className="flex items-center gap-1 text-slate-600">
          <input
            type="checkbox"
            checked={forfaitA}
            disabled={locked}
            onChange={(e) => setForfaitA(e.target.checked)}
          />
          Forfait {teamA?.nom}
        </label>
        <label className="flex items-center gap-1 text-slate-600">
          <input
            type="checkbox"
            checked={forfaitB}
            disabled={locked}
            onChange={(e) => setForfaitB(e.target.checked)}
          />
          Forfait {teamB?.nom}
        </label>
        {!forfaitA && !forfaitB && (
          <span
            className={`font-semibold ${
              totalOk ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            Total : {total}/{TOTAL_POINTS}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {locked ? (
            <>
              <span className="rounded bg-emerald-600 px-2 py-1 font-semibold text-white">
                🔒 Verrouillé
              </span>
              {role === "admin" && (
                <button
                  onClick={() => onUnlock(r.id)}
                  className="rounded border border-slate-300 px-2 py-1 font-medium text-slate-600 hover:bg-slate-50"
                >
                  🔓 Déverrouiller
                </button>
              )}
            </>
          ) : (
            <button
              onClick={save}
              disabled={saving || !totalOk}
              className="rounded bg-emerald-600 px-3 py-1 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "…" : "Enregistrer"}
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function SaisieTab({
  detail,
  reload,
  role,
}: {
  detail: ChampionshipDetail;
  reload: () => Promise<void>;
  role: "admin" | "club" | "guest";
}) {
  const teamsById = new Map(detail.teams.map((t) => [t.id, t]));
  const mesRencontres = detail.rencontres;
  const aVerrouiller = mesRencontres.filter((r) => r.saisi && !r.verrouille);
  const toutesVerrouillees =
    mesRencontres.length > 0 && mesRencontres.every((r) => r.verrouille);

  async function unlock(id: number) {
    await fetch(`/api/rencontres/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verrouille: false }),
    });
    await reload();
  }

  async function validerJournee() {
    if (aVerrouiller.length === 0) {
      alert("Aucune rencontre remplie à verrouiller.");
      return;
    }
    const ok = confirm(
      "Tout est OK ?\n\nUne fois validé, vous ne pourrez PLUS modifier les scores.\nSeul l'administrateur pourra les modifier.\n\nConfirmer ?",
    );
    if (!ok) return;
    for (const r of aVerrouiller) {
      await fetch(`/api/rencontres/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verrouille: true }),
      });
    }
    await reload();
  }

  if (detail.journees.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        Effectuez d&apos;abord le tirage dans l&apos;onglet Configuration pour
        générer les rencontres.
      </p>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Bandeau sécurité + validation */}
      <div className="rounded-lg bg-blue-50 px-4 py-3 print:hidden">
        <p className="text-sm text-blue-800">
          Saisissez le score d&apos;une seule équipe : l&apos;autre se complète
          automatiquement ({TOTAL_POINTS} points). Quand tout est rempli, cliquez
          sur <strong>« Valider la journée »</strong> — vous ne pourrez plus
          modifier ensuite (seul l&apos;administrateur pourra).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={validerJournee}
            disabled={aVerrouiller.length === 0}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            ✅ Valider la journée ({aVerrouiller.length} rencontre
            {aVerrouiller.length > 1 ? "s" : ""})
          </button>
          {toutesVerrouillees && (
            <span className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">
              🔒 Journée validée et verrouillée
            </span>
          )}
        </div>
      </div>

      {detail.journees.map((j) => {
        const rs = detail.rencontres.filter((r) => r.journeeId === j.id);
        const done = rs.filter((r) => r.verrouille).length;
        return (
          <section
            key={j.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-800">
                Journée {j.numero}
                {j.lieu && ` — ${j.lieu}`}
                {j.dateRencontre && ` le ${j.dateRencontre}`}
                {j.heure && ` à ${j.heure}`}
              </h3>
              <span
                className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                  done === rs.length
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                🔒 {done}/{rs.length} verrouillées
              </span>
            </div>
            <div className="grid gap-2">
              {rs.map((r) => (
                <RencontreRow
                  key={r.id}
                  r={r}
                  teamsById={teamsById}
                  onSaved={reload}
                  role={role}
                  onUnlock={unlock}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
