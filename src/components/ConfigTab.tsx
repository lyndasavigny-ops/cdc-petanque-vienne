"use client";

import { useState, useEffect } from "react";
import type { ChampionshipDetail } from "@/lib/types";
import { TYPES_CDC, DIVISIONS, poulesForDivision } from "@/lib/cdc";
import { adminFetch } from "@/lib/adminFetch";

export default function ConfigTab({
  detail,
  reload,
}: {
  detail: ChampionshipDetail;
  reload: () => Promise<void>;
}) {
  const c = detail.championship;
  const [saison, setSaison] = useState(c.saison);
  const [annee, setAnnee] = useState(c.annee);
  const [typeCdc, setTypeCdc] = useState(c.typeCdc);
  const [division, setDivision] = useState(c.division);
  const [poule, setPoule] = useState(c.poule);
  const [ptsVictoire, setPtsVictoire] = useState(c.ptsVictoire ?? 3);
  const [ptsNul, setPtsNul] = useState(c.ptsNul ?? 2);
  const [ptsDefaite, setPtsDefaite] = useState(c.ptsDefaite ?? 1);
  const [ptsForfait, setPtsForfait] = useState(c.ptsForfait ?? 0);
  const [savingCfg, setSavingCfg] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Équipes : grille éditable
  const [teamRows, setTeamRows] = useState<{ numero: number; nom: string }[]>(
    [],
  );
  const [savingTeams, setSavingTeams] = useState(false);
  const [tirageLoading, setTirageLoading] = useState(false);
  const [tirageError, setTirageError] = useState<string | null>(null);

  // Journées
  const [journeeRows, setJourneeRows] = useState(detail.journees);
  const [savingJournees, setSavingJournees] = useState(false);

  useEffect(() => {
    const max = Math.max(8, detail.teams.length);
    const rows: { numero: number; nom: string }[] = [];
    for (let i = 1; i <= max; i++) {
      const existing = detail.teams.find((t) => t.numero === i);
      rows.push({ numero: i, nom: existing ? existing.nom : "" });
    }
    setTeamRows(rows);
    setJourneeRows(detail.journees);
  }, [detail]);

  const poules = poulesForDivision(division);
  const hasTirage = detail.journees.length > 0;

  async function saveConfig() {
    setSavingCfg(true);
    setMsg(null);
    try {
      await adminFetch(`/api/championnats/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saison,
          annee,
          typeCdc,
          division,
          poule,
          ptsVictoire,
          ptsNul,
          ptsDefaite,
          ptsForfait,
        }),
      });
      await reload();
      setMsg("Désignation enregistrée.");
    } finally {
      setSavingCfg(false);
    }
  }

  async function saveTeams() {
    setSavingTeams(true);
    setMsg(null);
    try {
      await adminFetch(`/api/championnats/${c.id}/teams`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teams: teamRows.filter((t) => t.nom.trim().length > 0),
        }),
      });
      await reload();
      setMsg("Équipes enregistrées.");
    } finally {
      setSavingTeams(false);
    }
  }

  async function lancerTirage() {
    if (
      hasTirage &&
      !confirm(
        "Un tirage existe déjà. Le relancer effacera les scores saisis. Continuer ?",
      )
    ) {
      return;
    }
    setTirageLoading(true);
    setTirageError(null);
    try {
      // On enregistre d'abord les équipes
      await adminFetch(`/api/championnats/${c.id}/teams`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teams: teamRows.filter((t) => t.nom.trim().length > 0),
        }),
      });
      const res = await adminFetch(`/api/championnats/${c.id}/tirage`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setTirageError(data.error ?? "Erreur lors du tirage.");
      } else {
        await reload();
        setMsg(`Tirage effectué : ${data.journees} journées générées.`);
      }
    } finally {
      setTirageLoading(false);
    }
  }

  async function saveJournees() {
    setSavingJournees(true);
    setMsg(null);
    try {
      await adminFetch(`/api/championnats/${c.id}/journees`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journees: journeeRows.map((j) => ({
            id: j.id,
            lieu: j.lieu,
            dateRencontre: j.dateRencontre,
            heure: j.heure,
          })),
        }),
      });
      await reload();
      setMsg("Dates et lieux enregistrés.");
    } finally {
      setSavingJournees(false);
    }
  }

  return (
    <div className="grid gap-8">
      {msg && (
        <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {msg}
        </div>
      )}

      {/* Désignation */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">
          Désignation du championnat
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Saison</span>
            <input
              value={saison}
              onChange={(e) => setSaison(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Année</span>
            <input
              type="number"
              value={annee}
              onChange={(e) => setAnnee(Number(e.target.value))}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Type de CDC</span>
            <select
              value={typeCdc}
              onChange={(e) => setTypeCdc(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              {TYPES_CDC.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Division (CDC)</span>
            <select
              value={division}
              onChange={(e) => {
                const d = Number(e.target.value);
                setDivision(d);
                const p = poulesForDivision(d);
                if (!p.includes(poule)) setPoule(p[0]);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              {DIVISIONS.map((d) => (
                <option key={d.division} value={d.division}>
                  CDC{d.division} — {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Poule</span>
            <select
              value={poule}
              onChange={(e) => setPoule(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              {poules.map((p) => (
                <option key={p} value={p}>
                  Poule {p}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Barème de points */}
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <h4 className="font-semibold text-slate-800">
            🎯 Barème de points du classement
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            Modifiez les points attribués par résultat : le classement (site et
            PDF) se recalcule automatiquement, y compris pour les rencontres
            déjà jouées.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-emerald-800">Victoire</span>
              <input
                type="number"
                min={0}
                value={ptsVictoire}
                onChange={(e) => setPtsVictoire(Number(e.target.value))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-center font-bold"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Nul</span>
              <input
                type="number"
                min={0}
                value={ptsNul}
                onChange={(e) => setPtsNul(Number(e.target.value))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-center font-bold"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Défaite</span>
              <input
                type="number"
                min={0}
                value={ptsDefaite}
                onChange={(e) => setPtsDefaite(Number(e.target.value))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-center font-bold"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-red-700">Forfait</span>
              <input
                type="number"
                min={0}
                value={ptsForfait}
                onChange={(e) => setPtsForfait(Number(e.target.value))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-center font-bold"
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Barème officiel FFPJP : Victoire 3 · Nul 2 · Défaite 1 · Forfait 0
          </p>
        </div>

        <button
          onClick={saveConfig}
          disabled={savingCfg}
          className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
        >
          {savingCfg ? "Enregistrement…" : "Enregistrer la désignation"}
        </button>
      </section>

      {/* Équipes */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-800">
            Équipes de la poule
          </h3>
          <button
            onClick={() =>
              setTeamRows((prev) => [
                ...prev,
                { numero: prev.length + 1, nom: "" },
              ])
            }
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            + Ajouter une ligne
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {teamRows.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-8 shrink-0 text-right text-sm font-semibold text-slate-500">
                {String(t.numero).padStart(2, "0")}
              </span>
              <input
                value={t.nom}
                onChange={(e) =>
                  setTeamRows((prev) =>
                    prev.map((x, idx) =>
                      idx === i ? { ...x, nom: e.target.value } : x,
                    ),
                  )
                }
                placeholder={`Nom de l'équipe ${t.numero}`}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={saveTeams}
            disabled={savingTeams}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
          >
            {savingTeams ? "Enregistrement…" : "Enregistrer les équipes"}
          </button>
          <button
            onClick={lancerTirage}
            disabled={tirageLoading}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {tirageLoading
              ? "Tirage en cours…"
              : hasTirage
                ? "Relancer le tirage"
                : "Lancer le tirage"}
          </button>
        </div>
        {tirageError && (
          <p className="mt-2 text-sm text-red-600">{tirageError}</p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Le tirage crée un calendrier en poule (chaque équipe rencontre toutes
          les autres). Renommer une équipe puis « Enregistrer les équipes »
          conserve le tirage et les scores.
        </p>
      </section>

      {/* Journées : dates et lieux */}
      {journeeRows.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            Dates et lieux des journées
          </h3>
          <div className="grid gap-3">
            {journeeRows.map((j, i) => (
              <div
                key={j.id}
                className="grid items-center gap-2 sm:grid-cols-[auto_2fr_2fr_1fr]"
              >
                <span className="text-sm font-semibold text-slate-600">
                  J{j.numero}
                </span>
                <input
                  value={j.lieu}
                  placeholder="Lieu (ex: Loudun)"
                  onChange={(e) =>
                    setJourneeRows((prev) =>
                      prev.map((x, idx) =>
                        idx === i ? { ...x, lieu: e.target.value } : x,
                      ),
                    )
                  }
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
                <input
                  value={j.dateRencontre}
                  placeholder="Date (ex: 14 Juin 2025)"
                  onChange={(e) =>
                    setJourneeRows((prev) =>
                      prev.map((x, idx) =>
                        idx === i ? { ...x, dateRencontre: e.target.value } : x,
                      ),
                    )
                  }
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
                <input
                  value={j.heure}
                  placeholder="Heure (ex: 9h)"
                  onChange={(e) =>
                    setJourneeRows((prev) =>
                      prev.map((x, idx) =>
                        idx === i ? { ...x, heure: e.target.value } : x,
                      ),
                    )
                  }
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </div>
            ))}
          </div>
          <button
            onClick={saveJournees}
            disabled={savingJournees}
            className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
          >
            {savingJournees ? "Enregistrement…" : "Enregistrer dates et lieux"}
          </button>
        </section>
      )}
    </div>
  );
}
