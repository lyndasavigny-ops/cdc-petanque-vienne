"use client";

import { useEffect, useRef, useState } from "react";
import type { ChampionshipDetail, Rencontre, Team } from "@/lib/types";
import { TOTAL_POINTS, partiesMax } from "@/lib/cdc";
import { adminFetch } from "@/lib/adminFetch";
import { getDeviceId } from "@/lib/device";
import { fileToBase64 } from "./ScansTab";

function teamLabel(team: Team | undefined): string {
  if (!team) return "— Exempt —";
  return `${String(team.numero).padStart(2, "0")}-${team.nom}`;
}

type SaveState = "idle" | "saving" | "saved" | "error";

function RencontreRow({
  r,
  teamsById,
  onSaved,
  code,
  locked,
  maxParties = 11,
}: {
  r: Rencontre;
  teamsById: Map<number, Team>;
  onSaved: () => Promise<void>;
  code?: string;
  locked?: boolean;
  maxParties?: number;
}) {
  const teamA = r.teamAId ? teamsById.get(r.teamAId) : undefined;
  const teamB = r.teamBId ? teamsById.get(r.teamBId) : undefined;
  const exempt = !r.teamAId || !r.teamBId;

  const [scoreA, setScoreA] = useState<string>(
    r.scoreA != null ? String(r.scoreA) : "",
  );
  const [scoreB, setScoreB] = useState<string>(
    r.scoreB != null ? String(r.scoreB) : "",
  );
  const [forfaitA, setForfaitA] = useState(r.forfaitA);
  const [forfaitB, setForfaitB] = useState(r.forfaitB);
  const [partiesA, setPartiesA] = useState<string>(
    (r as { partiesA?: number | null }).partiesA != null
      ? String((r as { partiesA?: number | null }).partiesA)
      : "",
  );
  const [partiesB, setPartiesB] = useState<string>(
    (r as { partiesB?: number | null }).partiesB != null
      ? String((r as { partiesB?: number | null }).partiesB)
      : "",
  );
  const [saveState, setSaveState] = useState<SaveState>(
    r.saisi ? "saved" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nettoyage du timer au démontage
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function doSave(payload: {
    scoreA: number | null;
    scoreB: number | null;
    forfaitA: boolean;
    forfaitB: boolean;
  }) {
    setSaveState("saving");
    setError(null);
    try {
      const res = await adminFetch(`/api/rencontres/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          partiesA: partiesA === "" ? null : Number(partiesA),
          partiesB: partiesB === "" ? null : Number(partiesB),
          code,
          device: getDeviceId(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveState("error");
        setError(data.error ?? "Erreur d'enregistrement");
      } else {
        setSaveState("saved");
        await onSaved();
      }
    } catch {
      setSaveState("error");
      setError("Erreur réseau : score non enregistré");
    }
  }

  // Sauvegarde automatique (débouncée) dès que la saisie est valide
  function scheduleAutoSave(
    nextA: string,
    nextB: string,
    nextForfaitA: boolean,
    nextForfaitB: boolean,
  ) {
    if (timer.current) clearTimeout(timer.current);

    const fa = nextForfaitA;
    const fb = nextForfaitB;
    const a = nextA === "" ? null : Number(nextA);
    const b = nextB === "" ? null : Number(nextB);

    const valid =
      fa ||
      fb ||
      (a !== null &&
        b !== null &&
        Number.isInteger(a) &&
        Number.isInteger(b) &&
        a >= 0 &&
        b >= 0 &&
        a + b === TOTAL_POINTS);

    if (!valid) {
      setSaveState("idle");
      return;
    }

    timer.current = setTimeout(() => {
      doSave({ scoreA: a, scoreB: b, forfaitA: fa, forfaitB: fb });
    }, 600);
  }

  // auto-complément : si on saisit A, B = 36 - A
  function updateA(v: string) {
    let nextB = scoreB;
    setScoreA(v);
    if (v !== "" && !Number.isNaN(Number(v))) {
      const n = Number(v);
      if (n >= 0 && n <= TOTAL_POINTS) {
        nextB = String(TOTAL_POINTS - n);
        setScoreB(nextB);
      }
    }
    scheduleAutoSave(v, nextB, forfaitA, forfaitB);
  }
  function updateB(v: string) {
    let nextA = scoreA;
    setScoreB(v);
    if (v !== "" && !Number.isNaN(Number(v))) {
      const n = Number(v);
      if (n >= 0 && n <= TOTAL_POINTS) {
        nextA = String(TOTAL_POINTS - n);
        setScoreA(nextA);
      }
    }
    scheduleAutoSave(nextA, v, forfaitA, forfaitB);
  }

  function toggleForfaitA(checked: boolean) {
    setForfaitA(checked);
    scheduleAutoSave(scoreA, scoreB, checked, forfaitB);
  }
  function toggleForfaitB(checked: boolean) {
    setForfaitB(checked);
    scheduleAutoSave(scoreA, scoreB, forfaitA, checked);
  }

  async function reset() {
    if (timer.current) clearTimeout(timer.current);
    setSaveState("saving");
    setError(null);
    try {
      await adminFetch(`/api/rencontres/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true, code, device: getDeviceId() }),
      });
      setScoreA("");
      setScoreB("");
      setForfaitA(false);
      setForfaitB(false);
      setSaveState("idle");
      await onSaved();
    } catch {
      setSaveState("error");
    }
  }

  if (exempt) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
        <span className="font-medium">{teamLabel(teamA ?? teamB)}</span>
        <span className="italic">est exempt lors de cette journée.</span>
      </div>
    );
  }

  const total = (Number(scoreA) || 0) + (Number(scoreB) || 0);
  const totalOk = forfaitA || forfaitB || total === TOTAL_POINTS;
  const hasInput = scoreA !== "" || scoreB !== "" || forfaitA || forfaitB;

  // Journée validée : affichage en lecture seule
  if (locked) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_auto_auto_1fr]">
          <span className="text-sm font-medium text-slate-700">
            {teamLabel(teamA)}
          </span>
          <span className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-center text-sm font-bold">
            {r.scoreA ?? ""}
          </span>
          <span className="text-center text-xs font-bold text-slate-400">
            VS
          </span>
          <span className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-center text-sm font-bold">
            {r.scoreB ?? ""}
          </span>
          <span className="text-right text-sm font-medium text-slate-700">
            {teamLabel(teamB)}
          </span>
        </div>
        <p className="mt-1 text-right text-xs text-slate-400">
          🔒 Journée validée
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        saveState === "saved"
          ? "border-emerald-300 bg-emerald-50/40"
          : saveState === "error"
            ? "border-red-300 bg-red-50/40"
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
          disabled={forfaitA || forfaitB}
          onChange={(e) => updateA(e.target.value)}
          className="w-16 rounded border border-slate-300 px-2 py-1 text-center text-sm disabled:bg-slate-100"
        />
        <span className="text-center text-xs font-bold text-slate-400">VS</span>
        <input
          type="number"
          min={0}
          max={TOTAL_POINTS}
          value={scoreB}
          disabled={forfaitA || forfaitB}
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
            onChange={(e) => toggleForfaitA(e.target.checked)}
          />
          Forfait {teamA?.nom}
        </label>
        <label className="flex items-center gap-1 text-slate-600">
          <input
            type="checkbox"
            checked={forfaitB}
            onChange={(e) => toggleForfaitB(e.target.checked)}
          />
          Forfait {teamB?.nom}
        </label>
        <span
          className="flex items-center gap-1 text-slate-500"
          title={`Nombre de parties gagnées sur ${maxParties} (${maxParties === 4 ? "2 D + 2 T — Jeu Provençal" : "6 TT + 3 D + 2 T"}) — sert au départage Article 12`}
        >
          Parties :
          <input
            type="number"
            min={0}
            max={maxParties}
            value={partiesA}
            placeholder="–"
            onChange={(e) => setPartiesA(e.target.value)}
            className="w-11 rounded border border-slate-300 px-1 py-0.5 text-center"
          />
          /
          <input
            type="number"
            min={0}
            max={maxParties}
            value={partiesB}
            placeholder="–"
            onChange={(e) => setPartiesB(e.target.value)}
            className="w-11 rounded border border-slate-300 px-1 py-0.5 text-center"
          />
          <span className="text-[10px]">(sur {maxParties}, optionnel)</span>
        </span>
        {!forfaitA && !forfaitB && hasInput && (
          <span
            className={`font-semibold ${
              totalOk ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            Total : {total}/{TOTAL_POINTS}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {saveState === "saving" && (
            <span className="font-medium text-slate-500">
              Enregistrement…
            </span>
          )}
          {saveState === "saved" && (
            <span className="font-semibold text-emerald-600">
              ✓ Enregistré
            </span>
          )}
          {saveState === "error" && (
            <span className="font-semibold text-red-600">✗ Non enregistré</span>
          )}
          {saveState === "idle" && hasInput && !totalOk && (
            <span className="font-medium text-amber-600">
              En attente (total ≠ {TOTAL_POINTS})
            </span>
          )}
          {(saveState === "saved" || r.saisi) && (
            <button
              onClick={reset}
              className="rounded border border-slate-300 px-2 py-1 font-medium text-slate-600 hover:bg-slate-50"
            >
              Effacer
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
  code,
  isOrganisateur,
}: {
  detail: ChampionshipDetail;
  reload: () => Promise<void>;
  code?: string;
  isOrganisateur?: boolean;
}) {
  const teamsById = new Map(detail.teams.map((t) => [t.id, t]));
  const [valMsg, setValMsg] = useState<Record<number, string>>({});
  const [scanMsg, setScanMsg] = useState<Record<number, string>>({});

  async function deposerScan(journeeId: number, file: File) {
    setScanMsg((m) => ({ ...m, [journeeId]: "Envoi en cours…" }));
    try {
      const dataBase64 = await fileToBase64(file);
      const res = await adminFetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          championshipId: detail.championship.id,
          journeeId,
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          dataBase64,
          code,
          device: getDeviceId(),
        }),
      });
      const data = await res.json();
      setScanMsg((m) => ({
        ...m,
        [journeeId]: res.ok
          ? `✅ Feuille « ${file.name} » déposée, merci !`
          : "❌ " + (data.error ?? "Erreur d'envoi."),
      }));
    } catch {
      setScanMsg((m) => ({ ...m, [journeeId]: "❌ Erreur de lecture du fichier." }));
    }
  }

  async function validerJournee(journeeId: number) {
    if (
      !confirm(
        "⚠️ Après validation, les scores de cette journée seront VERROUILLÉS : " +
          "vous ne pourrez plus les modifier (seul l'organisateur le pourra). " +
          "Confirmez-vous que tous les scores sont corrects ?",
      )
    ) {
      return;
    }
    const res = await adminFetch("/api/journees/valider", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        journeeId,
        code,
        device: getDeviceId(),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setValMsg((m) => ({ ...m, [journeeId]: "❌ " + (data.error ?? "Erreur") }));
    } else {
      setValMsg((m) => ({ ...m, [journeeId]: "" }));
      await reload();
    }
  }

  async function deverrouillerJournee(journeeId: number) {
    if (!confirm("Déverrouiller cette journée pour permettre des corrections ?"))
      return;
    const res = await adminFetch("/api/journees/valider", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ journeeId, unlock: true }),
    });
    if (res.ok) await reload();
  }

  if (detail.journees.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        Effectuez d&apos;abord le tirage dans l&apos;onglet Configuration.
      </p>
    );
  }

  return (
    <div className="grid gap-6">
      <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Saisissez le score d&apos;une seule équipe : l&apos;autre se complète
        automatiquement pour atteindre {TOTAL_POINTS}. Le score est{" "}
        <strong>enregistré automatiquement</strong> dès que le total fait{" "}
        {TOTAL_POINTS} (mention « ✓ Enregistré »). Quand toute la journée est
        remplie, <strong>validez-la définitivement</strong> après vérification.
      </p>
      {detail.journees.map((j) => {
        const rs = detail.rencontres.filter((r) => r.journeeId === j.id);
        const aJouer = rs.filter((r) => r.teamAId && r.teamBId);
        const done = rs.filter((r) => r.saisi || !r.teamAId || !r.teamBId)
          .length;
        const complete = aJouer.length > 0 && aJouer.every((r) => r.saisi);
        const lockedForMe = j.validee && !isOrganisateur;
        return (
          <section
            key={j.id}
            className={`rounded-2xl border p-5 shadow-sm ${
              j.validee
                ? "border-emerald-300 bg-emerald-50/30"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-800">
                Journée {j.numero}
                {j.lieu && ` — ${j.lieu}`}
                {j.dateRencontre && ` le ${j.dateRencontre}`}
                {j.heure && ` à ${j.heure}`}
              </h3>
              <div className="flex items-center gap-2">
                {j.validee && (
                  <span className="rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-bold text-white">
                    ✅ Journée validée
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                    done === rs.length
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {done}/{rs.length} rencontres
                </span>
              </div>
            </div>
            <div className="grid gap-2">
              {rs.map((r) => (
                <RencontreRow
                  key={r.id}
                  r={r}
                  teamsById={teamsById}
                  onSaved={reload}
                  code={code}
                  locked={lockedForMe}
                  maxParties={partiesMax(detail.championship.typeCdc)}
                />
              ))}
            </div>

            {/* Récapitulatif et validation (club) */}
            {complete && !j.validee && (
              <div className="mt-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
                <p className="font-bold text-amber-900">
                  📋 Toutes les rencontres sont saisies — vérifiez avant de
                  valider :
                </p>
                <ul className="mt-2 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
                  {aJouer.map((r) => {
                    const a = r.teamAId ? teamsById.get(r.teamAId) : undefined;
                    const b = r.teamBId ? teamsById.get(r.teamBId) : undefined;
                    return (
                      <li key={r.id}>
                        {a?.nom} <strong>{r.scoreA}</strong> —{" "}
                        <strong>{r.scoreB}</strong> {b?.nom}
                        {(r.forfaitA || r.forfaitB) && " (forfait)"}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-xs text-amber-800">
                  ⚠️ Après validation, vous ne pourrez plus modifier ces
                  scores. En cas d&apos;erreur découverte ensuite, contactez
                  l&apos;organisateur.
                </p>
                <button
                  onClick={() => validerJournee(j.id)}
                  className="mt-3 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  ✅ Tout est correct — Valider définitivement la journée
                </button>
                {valMsg[j.id] && (
                  <p className="mt-2 text-sm text-red-600">{valMsg[j.id]}</p>
                )}
              </div>
            )}

            {/* Dépôt de la feuille de match scannée */}
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
              <label className="cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                📷 Joindre la feuille de match scannée (photo/PDF)
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) deposerScan(j.id, f);
                    e.target.value = "";
                  }}
                />
              </label>
              {scanMsg[j.id] && (
                <span className="text-xs text-slate-600">{scanMsg[j.id]}</span>
              )}
            </div>

            {/* Déverrouillage (organisateur) */}
            {j.validee && isOrganisateur && (
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => deverrouillerJournee(j.id)}
                  className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                >
                  🔓 Déverrouiller la journée (corrections)
                </button>
                <span className="text-xs text-slate-500">
                  En tant qu&apos;organisateur vous pouvez toujours modifier
                  les scores ci-dessus.
                </span>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
