"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChampionshipDetail } from "@/lib/types";
import { championshipName } from "@/lib/cdc";
import ConfigTab from "./ConfigTab";
import FeuillesTab from "./FeuillesTab";
import SaisieTab from "./SaisieTab";
import ClassementTab from "./ClassementTab";
import DistributionTab from "./DistributionTab";
import GuideTab from "./GuideTab";
import FeuilleResultats from "./FeuilleResultats";
import PublicView from "./PublicView";

type Tab =
  | "config"
  | "feuilles"
  | "saisie"
  | "classement"
  | "distribution"
  | "guide"
  | "resultats";

const TABS: { id: Tab; label: string }[] = [
  { id: "config", label: "Configuration & Tirage" },
  { id: "feuilles", label: "Feuilles de match" },
  { id: "saisie", label: "Saisie des scores" },
  { id: "classement", label: "Classement" },
  { id: "resultats", label: "📄 Résultats (PDF)" },
  { id: "distribution", label: "📤 Distribution / SMS" },
  { id: "guide", label: "📖 Guide / PDF" },
];

function EyeButton({ show, onClick }: { show: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-300 text-lg hover:bg-slate-50"
    >
      {show ? "🙈" : "👁"}
    </button>
  );
}

export default function ChampionnatManager({
  id,
  code,
  identifiant,
}: {
  id: number;
  code: string;
  identifiant: string;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<ChampionshipDetail | null>(null);
  const [role, setRole] = useState<"admin" | "club" | "guest" | null>(null);
  const [clubName, setClubName] = useState("");
  const [tab, setTab] = useState<Tab>("saisie");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [identInput, setIdentInput] = useState(identifiant || "admin");
  const [pwInput, setPwInput] = useState(code || "vienne86");
  const [showPw, setShowPw] = useState(false);
  const [copied, setCopied] = useState("");

  const reload = useCallback(async () => {
    let ident = identifiant;
    let pw = code;
    if (!ident && !pw && typeof window !== "undefined") {
      try {
        const s = window.localStorage.getItem(`cdc-auth-${id}`);
        if (s) {
          const o = JSON.parse(s);
          ident = o.identifiant || "";
          pw = o.code || "";
        }
      } catch {
        /* ignore */
      }
    }
    const q = new URLSearchParams({
      identifiant: ident,
      code: pw,
      t: String(Date.now()),
    });
    const res = await fetch(`/api/championnats/${id}?${q}`, {
      cache: "no-store",
    });
    if (res.status === 404) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    if (!data || !data.championship) {
      setRole("guest");
      setDetail(null);
      setLoading(false);
      return;
    }
    if (data.role === "admin" || data.role === "club") {
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            `cdc-auth-${id}`,
            JSON.stringify({ identifiant: ident, code: pw }),
          );
        } catch {
          /* ignore */
        }
      }
    }
    setRole(data.role || "guest");
    setClubName(data.clubName || "");
    setDetail({
      championship: data.championship,
      teams: data.teams,
      journees: data.journees,
      rencontres: data.rencontres,
    });
    setLoading(false);
  }, [id, code, identifiant]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Mise à jour en direct (sauf Configuration)
  const [live, setLive] = useState(true);
  useEffect(() => {
    if (!live || tab === "config") return;
    const iv = setInterval(() => {
      reload();
    }, 10000);
    return () => clearInterval(iv);
  }, [live, tab, reload]);

  function login(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (identInput.trim()) q.set("identifiant", identInput.trim());
    if (pwInput.trim()) q.set("code", pwInput.trim());
    router.push(`/championnat/${id}?${q.toString()}`);
  }

  function copy(link: string, key: string) {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${link}` : link;
    navigator.clipboard?.writeText(url);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center text-slate-500">
        Chargement…
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="grid min-h-screen place-items-center">
        <div className="text-center">
          <p className="text-slate-600">Championnat introuvable.</p>
          <Link href="/" className="mt-3 inline-block text-emerald-600 underline">
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    );
  }

  // ---------- CONNEXION ----------
  if (!detail || (role === "guest" && showLogin)) {
    const hadCode = code.trim() !== "" || identifiant.trim() !== "";
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <form
          onSubmit={login}
          className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-8 shadow-lg"
        >
          <h1 className="text-xl font-bold text-emerald-900">Connexion</h1>
          <p className="mt-2 text-sm text-slate-500">
            Accès administrateur ou club organisateur (saisie des scores).
          </p>

          {hadCode && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              ⚠️ Identifiant ou mot de passe incorrect.
            </p>
          )}

          <label className="mt-4 block text-sm">
            <span className="font-medium text-slate-700">Identifiant</span>
            <input
              value={identInput}
              onChange={(e) => setIdentInput(e.target.value)}
              placeholder="ADMIN ou ORG-…"
              autoFocus
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono uppercase tracking-wider"
            />
          </label>

          <label className="mt-3 block text-sm">
            <span className="font-medium text-slate-700">Mot de passe</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type={showPw ? "text" : "password"}
                value={pwInput}
                onChange={(e) => setPwInput(e.target.value)}
                placeholder="ADM-… ou CLB-…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono uppercase tracking-wider"
              />
              <EyeButton show={showPw} onClick={() => setShowPw((s) => !s)} />
            </div>
          </label>

          <button
            type="submit"
            className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700"
          >
            Se connecter
          </button>
          {detail && (
            <button
              type="button"
              onClick={() => setShowLogin(false)}
              className="mt-3 w-full text-sm text-emerald-700 hover:underline"
            >
              ← Retour aux résultats
            </button>
          )}
          <Link href="/" className="mt-4 block text-center text-sm text-slate-400">
            Retour à l&apos;accueil
          </Link>
        </form>
      </main>
    );
  }

  // ---------- VUE PUBLIQUE (scores + classement, sans connexion) ----------
  if (role === "guest") {
    return <PublicView detail={detail} onLogin={() => setShowLogin(true)} />;
  }

  const c = detail.championship;
  const link = (ident: string, pw: string) =>
    `/championnat/${id}?identifiant=${encodeURIComponent(ident)}&code=${encodeURIComponent(pw)}`;

  // ---------- ESPACE CLUB : saisie des scores uniquement ----------
  if (role === "club") {
    return (
      <main className="mx-auto max-w-4xl px-5 py-8">
        <header className="mb-5 rounded-2xl bg-gradient-to-r from-sky-700 to-sky-500 p-6 text-white shadow-lg">
          <p className="text-xs uppercase tracking-wide text-sky-100">
            Espace club organisateur
          </p>
          <h1 className="mt-1 text-2xl font-bold">{championshipName(c)}</h1>
          <p className="mt-1 text-sky-50">
            {clubName ? `Club : ${clubName} · ` : ""}Saison {c.saison}
          </p>
          <p className="mt-3 inline-block rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold">
            🎯 Saisie des scores uniquement — les autres rubriques sont
            réservées à l&apos;administrateur.
          </p>
        </header>
        <SaisieTab detail={detail} reload={reload} role="club" />
      </main>
    );
  }

  // ---------- ESPACE ADMINISTRATEUR ----------
  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <header className="mb-5 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-500 p-6 text-white shadow-lg">
        <p className="text-xs uppercase tracking-wide text-emerald-100">
          Administrateur · Comité de la Vienne (86)
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          {championshipName(c)}
        </h1>
        <p className="mt-1 text-emerald-50">
          Saison {c.saison} · {c.typeCdc} · CDC {c.division} · Poule {c.poule} ·{" "}
          {detail.teams.length} équipes
        </p>
      </header>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          🔑 Identifiants &amp; mots de passe à partager (les clubs ne remplissent
          que les scores)
        </h2>
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm">
            <span className="w-40 font-semibold text-emerald-800">
              Administrateur (vous)
            </span>
            <code className="rounded bg-white px-2 py-0.5 font-mono text-xs">
              ADMIN
            </code>
            <code className="rounded bg-white px-2 py-0.5 font-mono text-xs">
              {c.adminCode}
            </code>
            <button
              onClick={() => copy(link("ADMIN", c.adminCode), "adm")}
              className="ml-auto rounded border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
            >
              {copied === "adm" ? "Copié ✓" : "Copier le lien"}
            </button>
          </div>
          {detail.teams.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <span className="w-40 truncate font-medium text-slate-700">
                {String(t.numero).padStart(2, "0")}-{t.nom}
              </span>
              <code className="rounded bg-white px-2 py-0.5 font-mono text-xs">
                {t.identifiant}
              </code>
              <code className="rounded bg-white px-2 py-0.5 font-mono text-xs">
                {t.code}
              </code>
              <button
                onClick={() => copy(link(t.identifiant, t.code), `t${t.id}`)}
                className="ml-auto rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {copied === `t${t.id}` ? "Copié ✓" : "Copier le lien"}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Partagez aussi l&apos;adresse publique : chacun y voit les{" "}
          <strong>résultats et le classement</strong> sans se connecter.
        </p>
      </section>

      <nav className="mb-6 flex flex-wrap gap-2">
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
        <button
          onClick={() => reload()}
          className="rounded-lg border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
        >
          🔄 Actualiser
        </button>
        <button
          onClick={() => setLive((v) => !v)}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            live ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
          }`}
        >
          {live ? "🟢 En direct" : "⏸ En pause"}
        </button>
      </nav>

      <div className={tab === "config" ? "" : "hidden"}>
        <ConfigTab detail={detail} reload={reload} />
      </div>
      <div className={tab === "feuilles" ? "" : "hidden"}>
        <FeuillesTab detail={detail} reload={reload} />
      </div>
      <div className={tab === "saisie" ? "" : "hidden"}>
        <SaisieTab detail={detail} reload={reload} role="admin" />
      </div>
      <div className={tab === "classement" ? "" : "hidden"}>
        <ClassementTab detail={detail} admin reload={reload} />
      </div>
      <div className={tab === "distribution" ? "" : "hidden"}>
        <DistributionTab detail={detail} />
      </div>
      <div className={tab === "guide" ? "" : "hidden"}>
        <GuideTab />
      </div>
      <div className={tab === "resultats" ? "" : "hidden"}>
        <FeuilleResultats detail={detail} />
      </div>
    </main>
  );
}
