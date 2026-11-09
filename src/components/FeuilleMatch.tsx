"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { ChampionshipDetail, Rencontre, Team, Journee } from "@/lib/types";
import type { FormatConfig } from "@/lib/cdc";
import { typeLabel } from "@/lib/cdc";

type Joueur = { nom: string; licence: string };

const MAX_EFFECTIF = 8;

function normalize(arr: unknown, n: number): Joueur[] {
  const base = Array.isArray(arr) ? (arr as Joueur[]) : [];
  return Array.from({ length: n }, (_, i) => ({
    nom: String(base[i]?.nom ?? ""),
    licence: String(base[i]?.licence ?? ""),
  }));
}

function label(t: Team | undefined): string {
  if (!t) return "— Exempt —";
  return `${String(t.numero).padStart(2, "0")}-${t.nom}`;
}

/* Logos officiels (vectoriels) */
function LogoFrance() {
  return (
    <svg viewBox="0 0 130 218" className="h-24 w-16" aria-label="FFPJP France">
      {/* Plumes tricolores */}
      <path d="M40 88 C14 72 22 44 52 36 C41 58 47 68 66 71 C55 77 48 83 40 88 Z" fill="#1e3a8a" />
      <path d="M35 104 C9 92 17 66 47 60 C39 78 45 86 62 89 C51 95 44 100 35 104 Z" fill="#e5e7eb" />
      <path d="M32 120 C8 110 16 86 46 82 C40 96 46 104 61 107 C51 113 41 117 32 120 Z" fill="#dc2626" />
      {/* Corps */}
      <path d="M66 64 C98 62 114 88 108 118 C102 148 86 164 66 168 C79 147 83 120 76 99 C71 84 66 74 66 64 Z" fill="#1e3a8a" />
      {/* Cou */}
      <path d="M70 66 C68 46 84 32 101 36" stroke="#1e3a8a" strokeWidth="13" fill="none" strokeLinecap="round" />
      {/* Tête */}
      <circle cx="103" cy="38" r="16" fill="#1e3a8a" />
      {/* Crête rouge */}
      <path d="M95 25 L100 8 L107 23 L116 6 L122 25 Z" fill="#dc2626" />
      {/* Barbillon */}
      <path d="M116 46 C128 48 128 63 116 65 C120 56 120 51 116 46 Z" fill="#dc2626" />
      {/* Bec */}
      <path d="M118 40 L132 38 L118 47 Z" fill="#f59e0b" />
      {/* Œil */}
      <circle cx="106" cy="34" r="3.2" fill="#fff" />
      {/* Pattes */}
      <path d="M76 168 L74 184 M74 184 L63 192 M74 184 L85 192" stroke="#1e3a8a" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Texte */}
      <text x="65" y="192" textAnchor="middle" fill="#1e3a8a" fontSize="16" fontWeight="bold">FFPJP</text>
      <text x="65" y="212" textAnchor="middle" fill="#dc2626" fontSize="16" fontWeight="bold">FRANCE</text>
    </svg>
  );
}
function LogoFFPJP() {
  return (
    <svg viewBox="0 0 120 132" className="h-16 w-16" aria-label="FFPJP Vienne">
      <path d="M60 4 L114 21 V70 C114 99 89 117 60 130 C31 117 6 99 6 70 V21 Z" fill="#fff" stroke="#1e40af" strokeWidth="5" />
      <text x="60" y="28" textAnchor="middle" fill="#1e40af" fontSize="13" fontWeight="bold">F.F.P.J.P.</text>
      {/* Écusson bleu */}
      <path d="M40 36 H80 V76 C80 92 71 101 60 106 C49 101 40 92 40 76 Z" fill="#1e3a8a" stroke="#fbbf24" strokeWidth="2" />
      {/* Fleur de lys or */}
      <g fill="#fbbf24">
        <path d="M49 42 l1.5 -4 l1.5 4 l-1.5 2.6 z M50.5 45 a1.5 1.5 0 1 0 0.1 0 z" />
        <path d="M69 42 l1.5 -4 l1.5 4 l-1.5 2.6 z M70.5 45 a1.5 1.5 0 1 0 0.1 0 z" />
        <path d="M49 58 l1.5 -4 l1.5 4 l-1.5 2.6 z M50.5 61 a1.5 1.5 0 1 0 0.1 0 z" />
        <path d="M69 58 l1.5 -4 l1.5 4 l-1.5 2.6 z M70.5 61 a1.5 1.5 0 1 0 0.1 0 z" />
      </g>
      {/* Lion rampant rouge */}
      <path d="M55 92 C50 86 51 77 58 73 C55 77 57 79 61 77 C67 75 72 79 71 86 C70 92 62 96 55 92 Z" fill="#dc2626" />
      <path d="M62 73 C65 69 63 64 58 64 C61 67 60 70 57 71 Z" fill="#dc2626" />
      <path d="M70 86 C74 84 76 80 74 76 C73 80 71 82 69 82 Z" fill="#dc2626" />
      <text x="60" y="124" textAnchor="middle" fill="#1e40af" fontSize="12" fontWeight="bold">VIENNE</text>
    </svg>
  );
}
function LogoComite() {
  return (
    <svg viewBox="0 0 130 136" className="h-16 w-16" aria-label="Comité Régional Nouvelle-Aquitaine">
      <path d="M65 6 L124 22 V74 C124 102 98 122 65 132 C32 122 6 102 6 74 V22 Z" fill="#fbbf24" stroke="#111" strokeWidth="2" />
      <path d="M65 6 L65 132 C32 122 6 102 6 74 V22 Z" fill="#15803d" />
      <path d="M6 22 L124 22 L121 12 L9 12 Z" fill="#1e3a8a" />
      <rect x="48" y="11" width="14" height="11" fill="#fff" />
      <path d="M78 12 H92 L90 22 H80 Z" fill="#dc2626" />
      <text x="28" y="20" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">F.F.</text>
      <text x="65" y="20" textAnchor="middle" fill="#111" fontSize="8" fontWeight="bold">P.</text>
      <text x="103" y="20" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">J.P</text>
      <text x="30" y="42" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">Comité</text>
      <text x="98" y="42" textAnchor="middle" fill="#111" fontSize="9" fontWeight="bold">Régional</text>
      {/* Carte Nouvelle-Aquitaine */}
      <path d="M22 56 C26 50 36 50 40 56 C44 62 42 72 38 80 C42 86 40 96 32 98 C24 100 18 94 18 86 C18 76 16 62 22 56 Z" fill="#fff" stroke="#111" strokeWidth="1" />
      <g fill="#111" fontSize="5.5" textAnchor="middle">
        <text x="26" y="62">86</text>
        <text x="36" y="60">79</text>
        <text x="24" y="72">87</text>
        <text x="35" y="71">24</text>
        <text x="27" y="82">19</text>
        <text x="34" y="92">47</text>
        <text x="24" y="93">40</text>
      </g>
      {/* Tête de cheval */}
      <path d="M78 60 C82 52 92 52 96 58 C100 64 98 72 92 76 C96 72 94 66 88 66 C84 66 78 66 78 60 Z" fill="#dc2626" />
      <path d="M92 55 L97 50 L95 57 Z" fill="#dc2626" />
      <text x="65" y="112" textAnchor="middle" fill="#dc2626" fontSize="10" fontWeight="bold">Nouvelle-Aquitaine</text>
      <circle cx="48" cy="122" r="3.5" fill="#e5e7eb" stroke="#111" strokeWidth="0.8" />
      <circle cx="65" cy="126" r="3.5" fill="#e5e7eb" stroke="#111" strokeWidth="0.8" />
      <circle cx="82" cy="122" r="3.5" fill="#e5e7eb" stroke="#111" strokeWidth="0.8" />
    </svg>
  );
}

function JoueurInput({
  value,
  onChange,
}: {
  value: Joueur;
  onChange: (v: Joueur) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        value={value.nom}
        onChange={(e) => onChange({ ...value, nom: e.target.value })}
        placeholder="Nom & Prénom"
        className="min-w-0 flex-1 border-b border-slate-300 bg-transparent px-0.5 py-0.5 text-center outline-none focus:border-emerald-500"
      />
      <input
        value={value.licence}
        onChange={(e) => onChange({ ...value, licence: e.target.value })}
        placeholder="N° Lic."
        className="w-16 border-b border-slate-300 bg-transparent px-0.5 py-0.5 text-right outline-none focus:border-emerald-500"
      />
    </div>
  );
}

/* Tableau « Composition de l'équipe » (8 licenciés) */
function CompositionSheet({
  side,
  joueurs,
  setJoueur,
}: {
  side: "A" | "B";
  joueurs: Joueur[];
  setJoueur: (idx: number, val: Joueur) => void;
}) {
  const head = side === "A" ? "bg-gray-100" : "bg-gray-200";
  return (
    <div className="flex-1">
      <div className={`px-2 py-1 text-center text-xs font-bold ${head}`}>
        Composition de l&apos;équipe - {side}
      </div>
      <table className="w-full border-collapse border border-slate-800 text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="w-8 border border-slate-800 px-1 py-1" />
            <th className="border border-slate-800 px-1 py-1 text-center">
              Nom &amp; Prénom
            </th>
            <th className="w-24 border border-slate-800 px-1 py-1 text-center">
              N° de licence
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: MAX_EFFECTIF }).map((_, i) => (
            <tr key={i}>
              <td className="border border-slate-800 px-1 py-1 text-center text-slate-500">
                {i + 1}
              </td>
              <td className="border border-slate-800 px-1 py-0.5">
                <input
                  value={joueurs[i]?.nom ?? ""}
                  onChange={(e) =>
                    setJoueur(i, {
                      nom: e.target.value,
                      licence: joueurs[i]?.licence ?? "",
                    })
                  }
                  className="w-full border-b border-slate-300 bg-transparent px-1 py-1 text-center outline-none focus:border-emerald-500"
                />
              </td>
              <td className="border border-slate-800 px-1 py-0.5">
                <input
                  value={joueurs[i]?.licence ?? ""}
                  onChange={(e) =>
                    setJoueur(i, {
                      nom: joueurs[i]?.nom ?? "",
                      licence: e.target.value,
                    })
                  }
                  className="w-full border-b border-slate-300 bg-transparent px-1 py-1 text-right outline-none focus:border-emerald-500"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Tableau « Ordre des rencontres » : Score/Pts groupés par partie */
function ClubSheet({
  side,
  joueurs,
  setJoueur,
  scores,
  setScore,
  scoresAdv,
  cfg,
  forfait,
}: {
  side: "A" | "B";
  joueurs: Joueur[];
  setJoueur: (idx: number, val: Joueur) => void;
  scores: (number | "")[];
  setScore: (party: number, val: number | "") => void;
  scoresAdv: (number | "")[];
  cfg: FormatConfig;
  forfait: boolean;
}) {
  const sub = side === "A" ? "bg-gray-100" : "bg-gray-200";
  let subTotalScore = 0;
  let subTotalPts = 0;

  return (
    <table className="w-full border-collapse border border-slate-800 text-xs">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-slate-800 px-1 py-1 text-center">
            Nom &amp; Prénom
          </th>
          <th className="w-14 border border-slate-800 px-1 py-1">Score</th>
          <th className="w-11 border border-slate-800 px-1 py-1">Pts</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: cfg.parties }).map((_, p) => {
          const s = scores[p] === "" ? 0 : Number(scores[p]);
          const adv = scoresAdv[p] === "" ? 0 : Number(scoresAdv[p]);
          let pts = 1;
          if (forfait) pts = 0;
          else if (s > adv) pts = 3;
          else if (s === adv) pts = 2;
          subTotalScore += scores[p] === "" ? 0 : s;
          subTotalPts += pts;

          return (
            <Fragment key={p}>
              {Array.from({ length: cfg.joueursParPartie }).map((_, j) => {
                const idx = p * cfg.joueursParPartie + j;
                return (
                  <tr key={idx}>
                    <td className="border border-slate-800 px-1 py-1">
                      <JoueurInput
                        value={joueurs[idx] ?? { nom: "", licence: "" }}
                        onChange={(v) => setJoueur(idx, v)}
                      />
                    </td>
                    {j === 0 && (
                      <td
                        rowSpan={cfg.joueursParPartie}
                        className="border border-slate-800 bg-gray-100 p-0 align-middle"
                      >
                        <input
                          type="number"
                          min={0}
                          max={cfg.pointsParPartie}
                          value={scores[p] === "" ? "" : scores[p]}
                          disabled={forfait}
                          onChange={(e) =>
                            setScore(
                              p,
                              e.target.value === ""
                                ? ""
                                : Math.max(
                                    0,
                                    Math.min(cfg.pointsParPartie, Number(e.target.value)),
                                  ),
                            )
                          }
                          className="h-full w-full bg-transparent px-1 py-1 text-center text-sm font-bold outline-none disabled:bg-slate-100"
                        />
                      </td>
                    )}
                    {j === 0 && (
                      <td
                        rowSpan={cfg.joueursParPartie}
                        className="border border-slate-800 bg-gray-100 text-center align-middle text-sm font-bold"
                      >
                        {forfait ? 0 : pts}
                      </td>
                    )}
                  </tr>
                );
              })}
            </Fragment>
          );
        })}
        <tr className={sub}>
          <td className="border border-slate-800 px-1 py-1 text-right font-semibold">
            Sous-Total pts
          </td>
          <td className="border border-slate-800 px-1 py-1 text-center font-bold">
            {subTotalScore}
          </td>
          <td className="border border-slate-800 px-1 py-1 text-center font-bold">
            {subTotalPts}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default function FeuilleMatch({
  detail,
  rencontre,
  journee,
  cfg,
  reload,
}: {
  detail: ChampionshipDetail;
  rencontre: Rencontre;
  journee: Journee;
  cfg: FormatConfig;
  reload: () => Promise<void>;
}) {
  const c = detail.championship;
  const teamA = detail.teams.find((t) => t.id === rencontre.teamAId);
  const teamB = detail.teams.find((t) => t.id === rencontre.teamBId);
  const nbJoueurs = cfg.parties * cfg.joueursParPartie;

  const type = typeLabel(c.typeCdc);
  const designation = `CDC${c.division} POULE ${c.poule}`;
  const champFull = `CDC${c.division}_Poule_${c.poule}_${c.typeCdc}`;
  const matchNum =
    detail.rencontres
      .filter((r) => r.journeeId === rencontre.journeeId)
      .findIndex((r) => r.id === rencontre.id) + 1;
  const infoLine = `Saison ${c.saison} · Journée ${journee.numero} · ${
    journee.lieu || "—"
  } le ${journee.dateRencontre || "—"} à ${journee.heure || "—"} · Match n°${matchNum}`;

  const [compA, setCompA] = useState<Joueur[]>(() =>
    normalize(rencontre.compositionA, MAX_EFFECTIF),
  );
  const [compB, setCompB] = useState<Joueur[]>(() =>
    normalize(rencontre.compositionB, MAX_EFFECTIF),
  );
  const initScores = (arr: number[] | null | undefined): (number | "")[] =>
    Array.from({ length: cfg.parties }, (_, i) => {
      const v = Array.isArray(arr) ? arr[i] : undefined;
      return typeof v === "number" && !Number.isNaN(v) ? v : "";
    });
  const [scoresA, setScoresA] = useState<(number | "")[]>(() =>
    initScores(rencontre.partiesA),
  );
  const [scoresB, setScoresB] = useState<(number | "")[]>(() =>
    initScores(rencontre.partiesB),
  );
  const [forfaitA, setForfaitA] = useState(rencontre.forfaitA);
  const [forfaitB, setForfaitB] = useState(rencontre.forfaitB);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function setScoreA(p: number, val: number | "") {
    setScoresA((prev) => prev.map((v, i) => (i === p ? val : v)));
    if (val !== "") {
      setScoresB((prev) => prev.map((v, i) => (i === p ? cfg.pointsParPartie - Number(val) : v)));
    }
  }
  function setScoreB(p: number, val: number | "") {
    setScoresB((prev) => prev.map((v, i) => (i === p ? val : v)));
    if (val !== "") {
      setScoresA((prev) => prev.map((v, i) => (i === p ? cfg.pointsParPartie - Number(val) : v)));
    }
  }
  const setJoueurA = (i: number, v: Joueur) =>
    setCompA((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  const setJoueurB = (i: number, v: Joueur) =>
    setCompB((prev) => prev.map((x, idx) => (idx === i ? v : x)));

  async function saveScores(silent = false) {
    const incomplete = scoresA.some((v) => v === "") || scoresB.some((v) => v === "");
    if (!forfaitA && !forfaitB && incomplete) {
      if (silent) return;
      setMsg({ ok: false, text: `Remplissez les ${cfg.parties} parties.` });
      return;
    }
    setSaving(true);
    if (!silent) setMsg(null);
    try {
      await fetch(`/api/rencontres/${rencontre.id}/composition`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compositionA: compA, compositionB: compB }),
      });
      const res = await fetch(`/api/rencontres/${rencontre.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partiesA: scoresA.map((v) => (v === "" ? 0 : Number(v))),
          partiesB: scoresB.map((v) => (v === "" ? 0 : Number(v))),
          forfaitA,
          forfaitB,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: d.error ?? "Erreur de validation" });
      } else {
        await reload();
        setMsg({
          ok: true,
          text: silent ? "✓ Enregistré automatiquement — classement à jour." : "Feuille validée, classement mis à jour.",
        });
      }
    } finally {
      setSaving(false);
    }
  }

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const incomplete = scoresA.some((v) => v === "") || scoresB.some((v) => v === "");
    if (!forfaitA && !forfaitB && incomplete) return;
    const t = setTimeout(() => saveScores(true), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoresA, scoresB, forfaitA, forfaitB]);

  async function saveComposition() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/rencontres/${rencontre.id}/composition`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compositionA: compA, compositionB: compB }),
      });
      if (!res.ok) {
        const d = await res.json();
        setMsg({ ok: false, text: d.error ?? "Erreur" });
      } else {
        await reload();
        setMsg({ ok: true, text: "Composition enregistrée." });
      }
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    setSaving(true);
    setMsg(null);
    try {
      await fetch(`/api/rencontres/${rencontre.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
      setScoresA(Array.from({ length: cfg.parties }, () => ""));
      setScoresB(Array.from({ length: cfg.parties }, () => ""));
      setForfaitA(false);
      setForfaitB(false);
      await reload();
      setMsg({ ok: true, text: "Saisie effacée." });
    } finally {
      setSaving(false);
    }
  }

  const exemptTeam = teamA ?? teamB;
  if (!teamA || !teamB) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
        {exemptTeam ? label(exemptTeam) : "—"} est exempt de cette journée (pas de feuille de match).
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {/* ===================== FEUILLE 1 : COMPOSITION ===================== */}
      <section className="rounded-md border border-slate-300 bg-white p-3 print:break-inside-avoid">
        {/* Titre officiel */}
        <div className="rounded bg-gray-100 px-3 py-3">
          <div className="flex items-center justify-center gap-3">
            <LogoFrance />
            <div className="text-center">
              <h2 className="text-lg font-black uppercase text-blue-800">
                Feuille de match CDC - {type}
              </h2>
              <p className="text-xs italic text-slate-600">
                Fédération Française de Pétanque et Jeu Provençal
              </p>
            </div>
          </div>
        </div>

        {/* Désignation */}
        <div className="mt-2 rounded bg-gray-200 px-3 py-2 text-center">
          <p className="text-2xl font-black uppercase text-blue-800">
            {designation}
          </p>
          <p className="text-[11px] text-slate-700">{infoLine}</p>
        </div>

        {/* Comité + N° terrain */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded border border-slate-400 px-2 py-1.5 text-xs font-semibold">
            Comité départemental : Vienne (86)
          </div>
          <div className="rounded border border-slate-400 px-2 py-1.5 text-xs">
            N° Terrain : <span className="inline-block w-24 border-b border-slate-400" />
          </div>
        </div>

        {/* Capitaines */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded bg-gray-100 p-3 text-sm">
            <p className="mb-2 font-semibold">
              Capitaine Club A — {label(teamA)}
            </p>
            <div className="space-y-3">
              <p className="flex items-end gap-2">
                <span className="w-24 shrink-0">Nom :</span>
                <span className="h-6 flex-1 border-b-2 border-slate-400" />
              </p>
              <p className="flex items-end gap-2">
                <span className="w-24 shrink-0">Prénom :</span>
                <span className="h-6 flex-1 border-b-2 border-slate-400" />
              </p>
              <p className="flex items-end gap-2">
                <span className="w-24 shrink-0">N° licence :</span>
                <span className="h-6 flex-1 border-b-2 border-slate-400" />
              </p>
            </div>
          </div>
          <div className="rounded bg-gray-200 p-3 text-sm">
            <p className="mb-2 font-semibold">
              Capitaine Club B — {label(teamB)}
            </p>
            <div className="space-y-3">
              <p className="flex items-end gap-2">
                <span className="w-24 shrink-0">Nom :</span>
                <span className="h-6 flex-1 border-b-2 border-slate-400" />
              </p>
              <p className="flex items-end gap-2">
                <span className="w-24 shrink-0">Prénom :</span>
                <span className="h-6 flex-1 border-b-2 border-slate-400" />
              </p>
              <p className="flex items-end gap-2">
                <span className="w-24 shrink-0">N° licence :</span>
                <span className="h-6 flex-1 border-b-2 border-slate-400" />
              </p>
            </div>
          </div>
        </div>

        {/* Barres clubs */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded bg-gray-100 px-2 py-1.5 text-center text-sm font-bold">
            {label(teamA)}
          </div>
          <div className="rounded bg-gray-200 px-2 py-1.5 text-center text-sm font-bold">
            {label(teamB)}
          </div>
        </div>

        {/* Compositions */}
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <CompositionSheet side="A" joueurs={compA} setJoueur={setJoueurA} />
          <CompositionSheet side="B" joueurs={compB} setJoueur={setJoueurB} />
        </div>

        {/* Pied : logos + mention officielle */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <LogoFFPJP />
          <div className="flex-1 rounded border border-slate-300 px-3 py-2 text-center text-[11px] font-semibold leading-tight text-slate-700">
            En cas d&apos;incident joindre un rapport
            <br />
            Au Siège Social du Comité de la Vienne
            <br />
            1 Rue de la Poste 86500 Saint Julien l&apos;Ars
          </div>
          <LogoComite />
        </div>

        {/* Réserve + signatures (capitaines + arbitre) */}
        <div className="mt-2 rounded border border-slate-400 p-2">
          <p className="text-xs">
            Réserve : <span className="inline-block w-full border-b border-slate-300" />
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
            <div>
              Signature Capitaine A :<br />
              <span className="inline-block w-full border-b border-slate-400" />
            </div>
            <div>
              Signature Capitaine B :<br />
              <span className="inline-block w-full border-b border-slate-400" />
            </div>
            <div>
              Signature Arbitre :<br />
              <span className="inline-block w-full border-b border-slate-400" />
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FEUILLE 2 : ORDRE DES RENCONTRES ===================== */}
      <section className="rounded-md border border-slate-300 bg-white p-3 print:break-before-page">
        {/* Barres clubs (au-dessus du titre) */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded bg-gray-100 px-2 py-1.5 text-center text-sm font-bold">
            {label(teamA)}
          </div>
          <div className="rounded bg-gray-200 px-2 py-1.5 text-center text-sm font-bold">
            {label(teamB)}
          </div>
        </div>

        {/* Titre feuille de résultats */}
        <div className="mt-2 rounded bg-gray-200 px-3 py-2 text-center">
          <p className="text-sm font-black uppercase text-slate-950">
            Ordre des rencontres &amp; feuille de résultats
          </p>
          <p className="text-[11px] text-slate-700">
            {champFull} · {infoLine}
          </p>
        </div>

        {/* Ordre : Score/Pts groupés par partie */}
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold text-purple-800">
              Équipe A — {label(teamA)}
            </p>
            <ClubSheet
              side="A"
              joueurs={compA.slice(0, nbJoueurs)}
              setJoueur={setJoueurA}
              scores={scoresA}
              setScore={setScoreA}
              scoresAdv={scoresB}
              cfg={cfg}
              forfait={forfaitA}
            />
            <div className="mt-1 space-y-1 text-[11px] text-slate-600">
              <p>Joueur Remplaçant N°1 : <span className="inline-block w-28 border-b border-slate-300" /></p>
              <p>Joueur Remplaçant N°2 : <span className="inline-block w-28 border-b border-slate-300" /></p>
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-pink-800">
              Équipe B — {label(teamB)}
            </p>
            <ClubSheet
              side="B"
              joueurs={compB.slice(0, nbJoueurs)}
              setJoueur={setJoueurB}
              scores={scoresB}
              setScore={setScoreB}
              scoresAdv={scoresA}
              cfg={cfg}
              forfait={forfaitB}
            />
            <div className="mt-1 space-y-1 text-[11px] text-slate-600">
              <p>Joueur Remplaçant N°1 : <span className="inline-block w-28 border-b border-slate-300" /></p>
              <p>Joueur Remplaçant N°2 : <span className="inline-block w-28 border-b border-slate-300" /></p>
            </div>
          </div>
        </div>

        {/* Actions (écran uniquement) */}
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-slate-300 pt-2 text-xs print:hidden">
          <label className="flex items-center gap-1 text-slate-600">
            <input type="checkbox" checked={forfaitA} onChange={(e) => setForfaitA(e.target.checked)} />
            Forfait {teamA.nom}
          </label>
          <label className="flex items-center gap-1 text-slate-600">
            <input type="checkbox" checked={forfaitB} onChange={(e) => setForfaitB(e.target.checked)} />
            Forfait {teamB.nom}
          </label>
          <div className="ml-auto flex flex-wrap gap-2">
            <button onClick={saveComposition} disabled={saving} className="rounded border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50">
              Composition
            </button>
            {rencontre.saisi && (
              <button onClick={reset} disabled={saving} className="rounded border border-red-200 px-3 py-1.5 font-medium text-red-600 hover:bg-red-50">
                Effacer
              </button>
            )}
            <button onClick={() => saveScores(false)} disabled={saving} className="rounded bg-emerald-600 px-4 py-1.5 font-semibold text-white hover:bg-emerald-700">
              {saving ? "…" : "Valider la feuille"}
            </button>
          </div>
        </div>

        {msg && (
          <p className={`mt-2 rounded px-2 py-1 text-xs ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {msg.text}
          </p>
        )}
      </section>
    </div>
  );
}
