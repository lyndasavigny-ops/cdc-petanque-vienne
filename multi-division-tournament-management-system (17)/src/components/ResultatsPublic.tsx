"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Team, Journee, Rencontre } from "@/lib/types";
import { championshipName, TOTAL_POINTS } from "@/lib/cdc";
import { computeClassement, baremeOf } from "@/lib/classement";

type PublicChampionship = {
  id: number;
  saison: string;
  annee: number;
  typeCdc: string;
  division: number;
  poule: string;
  ptsVictoire?: number;
  ptsNul?: number;
  ptsDefaite?: number;
  ptsForfait?: number;
};

type PublicDetail = {
  championship: PublicChampionship;
  teams: Team[];
  journees: Journee[];
  rencontres: Rencontre[];
};

function teamLabel(team: Team | undefined): string {
  if (!team) return "— Exempt —";
  return `${String(team.numero).padStart(2, "0")}-${team.nom}`;
}

export default function ResultatsPublic({ id }: { id: number }) {
  const [detail, setDetail] = useState<PublicDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"classement" | "scores">("classement");

  const reload = useCallback(async () => {
    const res = await fetch(`/api/public/championnats/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      setError("Championnat introuvable.");
      return;
    }
    setDetail(await res.json());
  }, [id]);

  useEffect(() => {
    reload();
    const interval = setInterval(reload, 10000);
    return () => clearInterval(interval);
  }, [reload]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center">
        <div className="text-center">
          <p className="text-slate-600">{error}</p>
          <Link href="/" className="mt-3 inline-block text-emerald-600 underline">
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="grid min-h-screen place-items-center text-slate-500">
        Chargement…
      </main>
    );
  }

  const c = detail.championship;
  const teamsById = new Map(detail.teams.map((t) => [t.id, t]));
  const lignes = computeClassement(detail.teams, detail.rencontres, baremeOf(detail.championship));
  const totalSaisis = detail.rencontres.filter((r) => r.saisi).length;

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-4 print:hidden">
        <Link href="/" className="text-sm text-emerald-700 hover:underline">
          ← Toutes les poules
        </Link>
      </div>

      <header className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-500 p-6 text-white shadow-lg">
        <p className="text-xs uppercase tracking-wide text-emerald-100">
          Comité départemental de la Vienne (86) · Résultats publics
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          {championshipName(c)}
        </h1>
        <p className="mt-1 text-emerald-50">
          Saison {c.saison} · {totalSaisis} rencontre
          {totalSaisis > 1 ? "s" : ""} jouée{totalSaisis > 1 ? "s" : ""}
        </p>
        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-300"></span>
          En direct — actualisation automatique
        </p>
      </header>

      <nav className="mb-6 flex gap-2">
        <button
          onClick={() => setView("classement")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            view === "classement"
              ? "bg-emerald-600 text-white shadow"
              : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          🏆 Classement
        </button>
        <button
          onClick={() => setView("scores")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            view === "scores"
              ? "bg-emerald-600 text-white shadow"
              : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          📋 Scores par journée
        </button>
      </nav>

      {/* Classement */}
      <div className={view === "classement" ? "" : "hidden"}>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Victoire {c.ptsVictoire ?? 3} pts · Nul {c.ptsNul ?? 2} pts · Défaite{" "}
          {c.ptsDefaite ?? 1} pt · Forfait {c.ptsForfait ?? 0} pt — chaque
          rencontre se joue sur {TOTAL_POINTS} points.
        </p>
      </div>

      {/* Scores par journée */}
      <div className={view === "scores" ? "grid gap-5" : "hidden"}>
        {detail.journees.map((j) => {
          const rs = detail.rencontres.filter((r) => r.journeeId === j.id);
          return (
            <section
              key={j.id}
              className="overflow-hidden rounded-md border-2 border-slate-800 bg-white"
            >
              <div className="bg-sky-100 px-3 py-1.5 text-center text-sm font-bold text-slate-800">
                Journée {j.numero}
                {j.lieu && ` — ${j.lieu}`}
                {j.dateRencontre && ` le ${j.dateRencontre}`}
                {j.heure && ` à ${j.heure}`}
              </div>
              <table className="w-full border-collapse text-xs sm:text-sm">
                <tbody>
                  {rs.map((r) => {
                    const a = r.teamAId ? teamsById.get(r.teamAId) : undefined;
                    const b = r.teamBId ? teamsById.get(r.teamBId) : undefined;
                    const winA =
                      r.saisi && (r.scoreA ?? 0) > (r.scoreB ?? 0);
                    const winB =
                      r.saisi && (r.scoreB ?? 0) > (r.scoreA ?? 0);
                    return (
                      <tr key={r.id} className="border-t border-slate-300">
                        <td
                          className={`px-2 py-1.5 font-medium ${winA ? "bg-emerald-50 font-bold" : ""}`}
                        >
                          {teamLabel(a)}
                        </td>
                        <td className="w-12 border-x border-slate-300 bg-slate-50 px-2 py-1.5 text-center font-bold">
                          {r.saisi && r.scoreA != null ? r.scoreA : ""}
                        </td>
                        <td className="w-12 border-r border-slate-300 bg-slate-50 px-2 py-1.5 text-center font-bold">
                          {r.saisi && r.scoreB != null ? r.scoreB : ""}
                        </td>
                        <td
                          className={`px-2 py-1.5 text-right font-medium ${winB ? "bg-emerald-50 font-bold" : ""}`}
                        >
                          {teamLabel(b)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })}
        {detail.journees.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            Le calendrier n&apos;a pas encore été tiré.
          </p>
        )}
      </div>

      <footer className="mt-12 text-center text-xs text-slate-400">
        Comité de la Vienne · 1 Rue de la Poste, 86500 Saint Julien l&apos;Ars
      </footer>
    </main>
  );
}
