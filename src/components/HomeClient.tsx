"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Championship } from "@/lib/types";
import { championshipName, APP_VERSION } from "@/lib/cdc";
import {
  adminFetch,
  setAdminToken,
  getAdminToken,
  isStoragePersistent,
} from "@/lib/adminFetch";
import NewChampionshipForm from "./NewChampionshipForm";
import SauvegardePanel from "./SauvegardePanel";
import UtilisateursPanel from "./UtilisateursPanel";
import {
  AdminLoginForm,
  ClubCodeForm,
  AdminSettingsForm,
} from "./LoginForms";

type PublicChampionship = {
  id: number;
  saison: string;
  annee: number;
  typeCdc: string;
  division: number;
  poule: string;
};

export default function HomeClient() {
  const [checked, setChecked] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [principal, setPrincipal] = useState(false);
  const [identifiant, setIdentifiant] = useState("admin");
  const [rows, setRows] = useState<Championship[]>([]);
  const [publicRows, setPublicRows] = useState<PublicChampionship[]>([]);

  const refresh = useCallback(async () => {
    try {
      const me = await adminFetch("/api/auth/me", { cache: "no-store" });
      const data = await me.json();
      if (data.admin) {
        setAdmin(true);
        setPrincipal(Boolean(data.principal));
        setIdentifiant(data.identifiant ?? "admin");
        const res = await adminFetch("/api/championnats", {
          cache: "no-store",
        });
        if (res.ok) {
          setRows(await res.json());
        }
      } else {
        // Jeton périmé (code changé ou base réinitialisée) : on le purge
        // pour repartir sur une connexion propre.
        if (getAdminToken()) {
          setAdminToken("");
        }
        setAdmin(false);
        setRows([]);
      }
    } catch {
      setAdmin(false);
    } finally {
      setChecked(true);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Liste publique des poules (pour tout visiteur, sans connexion)
    fetch("/api/public/championnats", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setPublicRows(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [refresh]);

  function logout() {
    setAdminToken("");
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setAdmin(false);
    setRows([]);
  }

  if (!checked) {
    return (
      <main className="grid min-h-screen place-items-center text-slate-500">
        Chargement…
      </main>
    );
  }

  if (!admin) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        <header className="mb-8 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-500 p-8 text-white shadow-lg">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-100">
            Comité départemental de la Vienne (86) · FFPJP
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Championnats Des Clubs — Pétanque
          </h1>
          <p className="mt-3 max-w-2xl text-emerald-50">
            Consultez librement les scores et classements ci-dessous. Clubs :
            saisissez les scores de votre poule avec votre code. Organisateur :
            connectez-vous pour gérer les championnats.
          </p>
        </header>

        {/* Résultats publics : visibles par tout le monde, sans code */}
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-slate-800">
            🏆 Résultats &amp; classements
          </h2>
          {publicRows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              Aucun championnat en cours pour le moment.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {publicRows.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/resultats/${c.id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        {c.typeCdc}
                      </span>
                      <span className="text-xs text-slate-400">
                        Saison {c.saison}
                      </span>
                    </div>
                    <h3 className="mt-2 font-bold text-slate-900">
                      CDC{c.division} — Poule {c.poule}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-emerald-700">
                      Voir scores &amp; classement →
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid gap-6 sm:grid-cols-2">
          <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold text-emerald-900">
              🎯 Accès club
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Entrez le code de saisie transmis par l&apos;organisateur pour
              remplir les scores de votre poule.
            </p>
            <ClubCodeForm />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold text-slate-800">
              🔐 Accès organisateur
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Réservé au comité : création des championnats, tirages, feuilles
              de match et suivi des résultats.
            </p>
            <AdminLoginForm onSuccess={refresh} />
          </section>
        </div>

        <p className="mt-6 text-center">
          <a
            href="/guide.pdf"
            target="_blank"
            className="text-sm font-semibold text-emerald-700 underline"
          >
            📄 Télécharger le guide d&apos;utilisation (PDF)
          </a>
        </p>

        <footer className="mt-12 text-center text-xs text-slate-400">
          Comité de la Vienne · 1 Rue de la Poste, 86500 Saint Julien l&apos;Ars · {APP_VERSION}
        </footer>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-4 flex justify-end">
        <button
          onClick={logout}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Se déconnecter
        </button>
      </div>
      {!isStoragePersistent() && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-800">
          ⚠️ Votre navigateur bloque la mémorisation : vous êtes connecté, mais
          la connexion sera perdue si vous rechargez complètement la page.
          Ouvrez le site dans un onglet normal du navigateur pour rester
          connecté durablement.
        </p>
      )}
      <header className="mb-8 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-500 p-8 text-white shadow-lg">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-100">
          Comité départemental de la Vienne (86) · FFPJP · Espace organisateur
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Championnats Des Clubs — Pétanque
        </h1>
        <p className="mt-3 max-w-2xl text-emerald-50">
          Créez vos championnats, effectuez le tirage, générez les feuilles de
          match et suivez le classement en direct. Chaque rencontre se joue sur
          36 points (victoire 3 pts · nul 2 pts · défaite 1 pt · forfait 0 pt).
        </p>
      </header>

      <section className="mb-6 grid gap-3">
        <a
          href="/guide.pdf"
          target="_blank"
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-800 transition hover:bg-emerald-100"
        >
          📄 Télécharger le guide d&apos;utilisation (PDF)
          <span className="text-xs font-normal text-emerald-600">
            Connexion, SMS type pour les clubs, impression des feuilles,
            dépannage…
          </span>
        </a>
        <SauvegardePanel onRestored={refresh} />
        {principal && (
          <>
            <UtilisateursPanel />
            <AdminSettingsForm
              currentIdentifiant={identifiant}
              onSaved={refresh}
            />
          </>
        )}
        {!principal && (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
            👤 Vous êtes connecté en tant que co-organisateur. La gestion des
            utilisateurs et du compte principal est réservée à
            l&apos;administrateur principal.
          </p>
        )}
      </section>

      <section className="mb-10">
        <NewChampionshipForm />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-800">
          Championnats enregistrés ({rows.length})
        </h2>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            Aucun championnat pour le moment. Créez-en un ci-dessus.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {rows.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/championnat/${c.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-400 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      {c.typeCdc}
                    </span>
                    <span className="text-sm text-slate-400">
                      Saison {c.saison}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-slate-900">
                    {championshipName(c)}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    CDC {c.division} · Poule {c.poule} · {c.annee}
                  </p>
                  {c.codeSaisie && (
                    <p className="mt-2 text-xs text-slate-500">
                      Code club :{" "}
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono font-bold tracking-widest text-slate-800">
                        {c.codeSaisie}
                      </span>
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-12 text-center text-xs text-slate-400">
        Comité de la Vienne · 1 Rue de la Poste, 86500 Saint Julien l&apos;Ars · {APP_VERSION}
      </footer>
    </main>
  );
}
