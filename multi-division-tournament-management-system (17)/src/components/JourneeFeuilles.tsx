"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ChampionshipDetail } from "@/lib/types";
import { adminFetch } from "@/lib/adminFetch";
import FeuilleComposition from "./FeuilleComposition";
import FeuilleDetaillee from "./FeuilleDetaillee";
import PrintButton from "./PrintButton";

// Impression de toutes les feuilles de match d'une journée.
// Ordre : Feuille 1 (composition) puis Feuille 2 (résultats) pour chaque
// rencontre, avec saut de page entre chaque feuille.
// => En imprimant en RECTO/VERSO : 1 feuille papier par match
//    (composition au recto, résultats au verso).
export default function JourneeFeuilles({
  championshipId,
  journeeNumero,
}: {
  championshipId: number;
  journeeNumero: number;
}) {
  const [detail, setDetail] = useState<ChampionshipDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await adminFetch(`/api/championnats/${championshipId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setError(
          res.status === 401
            ? "Vos feuilles sont bien enregistrées — reconnectez-vous depuis l'accueil pour y accéder."
            : "Journée introuvable.",
        );
        return;
      }
      setDetail(await res.json());
    })();
  }, [championshipId]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="text-center">
          <p className="text-slate-600">{error}</p>
          <Link
            href="/"
            className="mt-3 inline-block text-emerald-600 underline"
          >
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

  const journee = detail.journees.find((j) => j.numero === journeeNumero);
  if (!journee) {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="text-slate-600">Journée introuvable.</p>
      </main>
    );
  }

  // Seules les vraies rencontres (pas les exempts) ont des feuilles
  const rencontres = detail.rencontres.filter(
    (r) => r.journeeId === journee.id && r.teamAId && r.teamBId,
  );

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 print:max-w-none print:p-0">
      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href={`/championnat/${championshipId}`}
              className="text-sm text-emerald-700 hover:underline"
            >
              ← Retour au championnat
            </Link>
            <h1 className="mt-1 text-xl font-bold text-slate-800">
              Feuilles de match — Journée {journee.numero}
              {journee.lieu && ` · ${journee.lieu}`}
              {journee.dateRencontre && ` le ${journee.dateRencontre}`}
              {journee.heure && ` à ${journee.heure}`}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {rencontres.length} rencontre{rencontres.length > 1 ? "s" : ""} ·{" "}
              {rencontres.length * 2} pages
            </p>
          </div>
          <PrintButton />
        </div>
        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
          🖨️ <strong>Pour imprimer recto/verso :</strong> dans la fenêtre
          d&apos;impression, activez « Recto verso » (retournement sur les
          bords longs). Chaque match sortira sur une seule feuille papier :
          composition des équipes au recto, ordre des rencontres &amp;
          résultats au verso.
        </p>
      </div>

      <div className="grid gap-8 print:block">
        {rencontres.map((r, idx) => {
          const teamA = detail.teams.find((t) => t.id === r.teamAId) ?? null;
          const teamB = detail.teams.find((t) => t.id === r.teamBId) ?? null;
          return (
            <div key={r.id}>
              <h2 className="mb-2 text-sm font-semibold text-slate-500 print:hidden">
                Match {idx + 1} — {teamA?.nom} contre {teamB?.nom}
              </h2>
              {/* RECTO : composition */}
              <section className="print:break-after-page">
                <FeuilleComposition
                  championship={detail.championship}
                  journee={journee}
                  rencontre={r}
                  teamA={teamA}
                  teamB={teamB}
                />
              </section>
              {/* VERSO : résultats */}
              <section
                className={
                  idx < rencontres.length - 1
                    ? "mt-8 print:mt-0 print:break-after-page"
                    : "mt-8 print:mt-0"
                }
              >
                <FeuilleDetaillee
                  championship={detail.championship}
                  journee={journee}
                  rencontre={r}
                  teamA={teamA}
                  teamB={teamB}
                />
              </section>
            </div>
          );
        })}
      </div>

      {rencontres.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Aucune rencontre pour cette journée.
        </p>
      )}
    </main>
  );
}
