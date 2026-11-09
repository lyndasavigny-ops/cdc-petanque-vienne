"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChampionshipDetail } from "@/lib/types";
import { championshipName } from "@/lib/cdc";
import { adminFetch } from "@/lib/adminFetch";
import ConfigTab from "./ConfigTab";
import FeuillesTab from "./FeuillesTab";
import SaisieTab from "./SaisieTab";
import ClassementTab from "./ClassementTab";
import JoueursTab from "./JoueursTab";
import ScansTab from "./ScansTab";

type Tab = "config" | "feuilles" | "saisie" | "classement" | "joueurs" | "scans";

const TABS: { id: Tab; label: string }[] = [
  { id: "config", label: "Configuration & Tirage" },
  { id: "joueurs", label: "Joueurs" },
  { id: "feuilles", label: "Feuilles de match" },
  { id: "saisie", label: "Saisie des scores" },
  { id: "classement", label: "Classement" },
  { id: "scans", label: "📁 Scans" },
];

export default function ChampionnatManager({ id }: { id: number }) {
  const router = useRouter();
  const [detail, setDetail] = useState<ChampionshipDetail | null>(null);
  const [tab, setTab] = useState<Tab>("config");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const reload = useCallback(async () => {
    const res = await adminFetch(`/api/championnats/${id}`, {
      cache: "no-store",
    });
    if (res.status === 404 || res.status === 401) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setDetail(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Actualisation automatique toutes les 10 s sur les onglets de consultation
  // (pas sur Configuration pour ne pas écraser une saisie en cours).
  useEffect(() => {
    if (tab === "config") return;
    const interval = setInterval(() => {
      reload();
    }, 10000);
    return () => clearInterval(interval);
  }, [tab, reload]);

  const [pdfBusy, setPdfBusy] = useState(false);
  async function downloadResultatsPdf() {
    setPdfBusy(true);
    try {
      const res = await adminFetch(`/api/championnats/${id}/resultats-pdf`);
      if (!res.ok) {
        alert("Impossible de générer le PDF (réservé à l'organisateur).");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const c = detail?.championship;
      a.download = c
        ? `resultats-CDC${c.division}-Poule${c.poule}-${c.saison}.pdf`
        : "resultats.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setPdfBusy(false);
    }
  }

  const [copied, setCopied] = useState(false);
  async function copyClubLink(code: string) {
    const url = `${window.location.origin}/saisie/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      prompt("Copiez ce lien :", url);
    }
  }

  async function remove() {
    if (!confirm("Supprimer définitivement ce championnat ?")) return;
    await adminFetch(`/api/championnats/${id}`, { method: "DELETE" });
    router.push("/");
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center text-slate-500">
        Chargement…
      </main>
    );
  }

  if (notFound || !detail) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <p className="text-3xl">🔐</p>
          <h1 className="mt-2 text-lg font-bold text-slate-800">
            Connexion organisateur requise
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Vos championnats et feuilles de match sont bien enregistrés —
            votre navigateur a simplement perdu la connexion. Reconnectez-vous
            depuis l&apos;accueil pour les retrouver.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
          >
            Se reconnecter
          </Link>
        </div>
      </main>
    );
  }

  const c = detail.championship;

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/" className="text-sm text-emerald-700 hover:underline">
          ← Tous les championnats
        </Link>
        <button
          onClick={remove}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Supprimer
        </button>
      </div>

      <header className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-500 p-6 text-white shadow-lg print:hidden">
        <p className="text-xs uppercase tracking-wide text-emerald-100">
          Comité départemental de la Vienne (86)
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          {championshipName(c)}
        </h1>
        <p className="mt-1 text-emerald-50">
          Saison {c.saison} · {c.typeCdc} · CDC {c.division} · Poule {c.poule} ·{" "}
          {detail.teams.length} équipes
        </p>
        {c.codeSaisie && (
          <div className="mt-3 rounded-lg bg-white/15 px-4 py-3 text-sm">
            <p className="font-semibold">
              📤 Partage aux clubs (saisie des scores uniquement)
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span>
                Code :{" "}
                <span className="rounded bg-white/90 px-2 py-0.5 font-mono font-bold tracking-widest text-emerald-800">
                  {c.codeSaisie}
                </span>
              </span>
              <button
                onClick={() => copyClubLink(c.codeSaisie)}
                className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow hover:bg-emerald-50"
              >
                {copied ? "✓ Lien copié !" : "📋 Copier le lien à envoyer"}
              </button>
              <a
                href={`/saisie/${c.codeSaisie}`}
                target="_blank"
                className="text-xs underline"
              >
                Ouvrir la page club
              </a>
            </div>
            <p className="mt-2 text-xs text-emerald-100">
              Donnez ce lien au <strong>club référent</strong> (un seul par
              poule) : le code se verrouille sur le premier appareil qui
              l&apos;utilise. Les scores arrivent ici en direct.
            </p>
            <button
              onClick={async () => {
                if (
                  !confirm(
                    "Réinitialiser l'appareil autorisé ? Le prochain appareil qui utilisera le code deviendra le nouvel appareil référent.",
                  )
                )
                  return;
                await adminFetch(`/api/championnats/${c.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ resetDevice: true }),
                });
                alert(
                  "Appareil réinitialisé : le prochain appareil utilisant le code sera autorisé.",
                );
              }}
              className="mt-2 rounded-lg border border-white/40 px-3 py-1 text-xs font-semibold text-white hover:bg-white/10"
            >
              🔄 Réinitialiser l&apos;appareil autorisé (changement de
              téléphone)
            </button>
          </div>
        )}
      </header>

      <nav className="mb-6 flex flex-wrap items-center gap-2 print:hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? "bg-emerald-600 text-white shadow"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
        {tab !== "config" && (
          <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
            En direct
          </span>
        )}
      </nav>

      {/* Les onglets restent montés pour ne pas perdre les saisies en cours */}
      <div className={tab === "config" ? "" : "hidden"}>
        <ConfigTab detail={detail} reload={reload} />
      </div>
      <div className={tab === "feuilles" ? "" : "hidden"}>
        <FeuillesTab detail={detail} />
      </div>
      <div className={tab === "saisie" ? "" : "hidden"}>
        <SaisieTab detail={detail} reload={reload} isOrganisateur />
      </div>
      <div className={tab === "classement" ? "" : "hidden"}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <p className="text-sm text-slate-500">
            📄 Document officiel imprimable : classement + tous les scores
            (réservé à l&apos;organisateur).
          </p>
          <button
            onClick={downloadResultatsPdf}
            disabled={pdfBusy}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {pdfBusy
              ? "Génération…"
              : "📄 Télécharger le PDF Résultats & Classement"}
          </button>
        </div>
        <ClassementTab detail={detail} isOrganisateur reload={reload} />
      </div>
      <div className={tab === "joueurs" ? "" : "hidden"}>
        <JoueursTab detail={detail} />
      </div>
      <div className={tab === "scans" ? "" : "hidden"}>
        <ScansTab detail={detail} />
      </div>
    </main>
  );
}
