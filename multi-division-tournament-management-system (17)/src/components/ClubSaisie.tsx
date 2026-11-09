"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChampionshipDetail } from "@/lib/types";
import { championshipName } from "@/lib/cdc";
import { getDeviceId } from "@/lib/device";
import SaisieTab from "./SaisieTab";
import ClassementTab from "./ClassementTab";

export default function ClubSaisie({ code }: { code: string }) {
  const [detail, setDetail] = useState<ChampionshipDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"saisie" | "classement">("saisie");

  const reload = useCallback(async () => {
    const device = getDeviceId();
    const res = await fetch(
      `/api/saisie/${code}?device=${encodeURIComponent(device)}`,
      { cache: "no-store" },
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Code invalide.");
      return;
    }
    setError(null);
    setDetail(data);
  }, [code]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Actualisation automatique : les scores des autres clubs et le classement
  // arrivent en direct.
  useEffect(() => {
    const interval = setInterval(() => {
      reload();
    }, 10000);
    return () => clearInterval(interval);
  }, [reload]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-red-600">{error}</p>
          <p className="mt-2 text-sm text-slate-500">
            Vérifiez le code de saisie transmis par l&apos;organisateur.
          </p>
          <a
            href="/"
            className="mt-4 inline-block text-sm text-emerald-700 underline"
          >
            Retour à l&apos;accueil
          </a>
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

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <header className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-500 p-6 text-white shadow-lg">
        <p className="text-xs uppercase tracking-wide text-emerald-100">
          Comité départemental de la Vienne (86) · Accès club
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          {championshipName(c)}
        </h1>
        <p className="mt-1 text-emerald-50">
          Saison {c.saison} · Saisie des scores de votre poule
        </p>
        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-300"></span>
          En direct — actualisation automatique
        </p>
      </header>

      <nav className="mb-6 flex gap-2">
        <button
          onClick={() => setView("saisie")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            view === "saisie"
              ? "bg-emerald-600 text-white shadow"
              : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Saisie des scores
        </button>
        <button
          onClick={() => setView("classement")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            view === "classement"
              ? "bg-emerald-600 text-white shadow"
              : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Classement
        </button>
      </nav>

      <div className={view === "saisie" ? "" : "hidden"}>
        <SaisieTab detail={detail} reload={reload} code={code} />
      </div>
      <div className={view === "classement" ? "" : "hidden"}>
        <ClassementTab detail={detail} />
      </div>
    </main>
  );
}
