"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ChampionshipDetail } from "@/lib/types";
import { adminFetch } from "@/lib/adminFetch";
import FeuilleComposition from "./FeuilleComposition";
import FeuilleDetaillee from "./FeuilleDetaillee";
import PrintButton from "./PrintButton";

export default function FeuilleViewer({
  championshipId,
  rencontreId,
}: {
  championshipId: number;
  rencontreId: number;
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
            : "Feuille de match introuvable.",
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

  const rencontre = detail.rencontres.find((r) => r.id === rencontreId);
  if (!rencontre) {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="text-slate-600">Rencontre introuvable.</p>
      </main>
    );
  }

  const journee = detail.journees.find((j) => j.id === rencontre.journeeId)!;
  const teamA =
    detail.teams.find((t) => t.id === rencontre.teamAId) ?? null;
  const teamB =
    detail.teams.find((t) => t.id === rencontre.teamBId) ?? null;

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/championnat/${championshipId}`}
          className="text-sm text-emerald-700 hover:underline"
        >
          ← Retour au championnat
        </Link>
        <PrintButton />
      </div>

      <div className="grid gap-8">
        <section className="print:break-after-page">
          <h2 className="mb-2 text-sm font-semibold text-slate-500 print:hidden">
            Feuille 1 — Composition des équipes
          </h2>
          <FeuilleComposition
            championship={detail.championship}
            journee={journee}
            rencontre={rencontre}
            teamA={teamA}
            teamB={teamB}
          />
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-500 print:hidden">
            Feuille 2 — Ordre des rencontres &amp; feuille de résultats
          </h2>
          <FeuilleDetaillee
            championship={detail.championship}
            journee={journee}
            rencontre={rencontre}
            teamA={teamA}
            teamB={teamB}
          />
        </section>
      </div>
    </main>
  );
}
