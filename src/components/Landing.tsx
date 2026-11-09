"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Champ = {
  id: number;
  label: string;
  saison: string;
  typeCdc: string;
};

export default function Landing({ championnats }: { championnats: Champ[] }) {
  const router = useRouter();
  const [clubChamp, setClubChamp] = useState(championnats[0]?.id ?? 0);
  const [clubCode, setClubCode] = useState("");
  const [orgChamp, setOrgChamp] = useState(championnats[0]?.id ?? 0);
  const [orgIdent, setOrgIdent] = useState("admin");
  const [orgCode, setOrgCode] = useState("vienne86");
  const [showOrg, setShowOrg] = useState(false);

  function goClub(e: React.FormEvent) {
    e.preventDefault();
    if (!clubChamp || !clubCode.trim()) return;
    router.push(
      `/championnat/${clubChamp}?code=${encodeURIComponent(clubCode.trim())}`,
    );
  }

  function goOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!orgChamp) return;
    const q = new URLSearchParams();
    if (orgIdent.trim()) q.set("identifiant", orgIdent.trim());
    if (orgCode.trim()) q.set("code", orgCode.trim());
    router.push(`/championnat/${orgChamp}?${q.toString()}`);
  }

  return (
    <div>
      {/* Résultats & classements */}
      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-slate-800">
          🏆 Résultats &amp; classements
        </h2>
        {championnats.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            Aucun championnat pour le moment.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {championnats.map((c) => (
              <a
                key={c.id}
                href={`/championnat/${c.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-400 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    {c.typeCdc}
                  </span>
                  <span className="text-xs text-slate-400">
                    Saison {c.saison}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-slate-900">
                  {c.label}
                </h3>
                <p className="mt-2 text-sm font-medium text-emerald-600 group-hover:underline">
                  Voir scores &amp; classement →
                </p>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Accès club & organisateur */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800">🎯 Accès club</h3>
          <p className="mt-1 text-sm text-slate-500">
            Entrez le code de saisie transmis par l&apos;organisateur pour
            remplir les scores de votre poule.
          </p>
          <form onSubmit={goClub} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Championnat</span>
              <select
                value={clubChamp}
                onChange={(e) => setClubChamp(Number(e.target.value))}
                className="rounded-lg border border-slate-300 px-3 py-2.5"
              >
                {championnats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">
                Code de saisie de votre poule
              </span>
              <input
                value={clubCode}
                onChange={(e) => setClubCode(e.target.value)}
                placeholder="A B C 1 2 3"
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-center font-mono uppercase tracking-widest"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700"
            >
              Accéder à la saisie des scores
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800">
            🔐 Accès organisateur
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Réservé au comité : création des championnats, tirages, feuilles de
            match et suivi des résultats.
          </p>
          <form onSubmit={goOrg} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Championnat</span>
              <select
                value={orgChamp}
                onChange={(e) => setOrgChamp(Number(e.target.value))}
                className="rounded-lg border border-slate-300 px-3 py-2.5"
              >
                {championnats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Identifiant</span>
              <input
                value={orgIdent}
                onChange={(e) => setOrgIdent(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2.5 font-mono uppercase"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Code</span>
              <div className="flex items-center gap-2">
                <input
                  type={showOrg ? "text" : "password"}
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono uppercase"
                />
                <button
                  type="button"
                  onClick={() => setShowOrg((s) => !s)}
                  title="Afficher / masquer"
                  className="grid h-10 w-10 place-items-center rounded-lg border border-slate-300 text-lg hover:bg-slate-50"
                >
                  {showOrg ? "🙈" : "👁"}
                </button>
              </div>
            </label>
            <button
              type="submit"
              className="rounded-lg bg-slate-800 px-4 py-2.5 font-semibold text-white hover:bg-slate-900"
            >
              Se connecter
            </button>
            <p className="text-xs text-slate-500">
              Première connexion : identifiant <strong>admin</strong> · code{" "}
              <strong>vienne86</strong>.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
