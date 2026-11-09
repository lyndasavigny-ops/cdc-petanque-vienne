"use client";

import { useState } from "react";

export default function HomeLogin({
  championnats,
}: {
  championnats: { id: number; label: string }[];
}) {
  const [ident, setIdent] = useState("admin");
  const [code, setCode] = useState("vienne86");
  const [show, setShow] = useState(false);
  const [connected, setConnected] = useState(false);

  function login(e: React.FormEvent) {
    e.preventDefault();
    if (ident.trim() && code.trim()) setConnected(true);
  }

  return (
    <section className="mb-8 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
      {!connected ? (
        <form onSubmit={login}>
          <h2 className="text-lg font-bold text-emerald-900">
            🔑 Se connecter
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Connectez-vous pour gérer vos championnats (comité ou club).
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Identifiant</span>
              <input
                value={ident}
                onChange={(e) => setIdent(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 font-mono uppercase"
                placeholder="admin"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Mot de passe</span>
              <div className="flex items-center gap-2">
                <input
                  type={show ? "text" : "password"}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono uppercase"
                  placeholder="vienne86"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  title="Afficher / masquer"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 text-lg hover:bg-slate-50"
                >
                  {show ? "🙈" : "👁"}
                </button>
              </div>
            </label>
            <button
              type="submit"
              className="self-end rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700"
            >
              Se connecter
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Première connexion (comité) : identifiant <strong>admin</strong> ·
            code <strong>vienne86</strong>.
          </p>
        </form>
      ) : (
        <div>
          <h2 className="text-lg font-bold text-emerald-900">
            ✅ Connecté — vos championnats
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Cliquez sur un championnat pour le gérer.
          </p>
          {championnats.length === 0 ? (
            <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
              Aucun championnat : créez-en un ci-dessous (vous serez connecté
              automatiquement).
            </p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {championnats.map((c) => (
                <li key={c.id}>
                  <a
                    href={`/championnat/${c.id}?identifiant=${encodeURIComponent(
                      ident.trim(),
                    )}&code=${encodeURIComponent(code.trim())}`}
                    className="block rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    {c.label} →
                  </a>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() => setConnected(false)}
            className="mt-3 text-sm text-slate-400 hover:underline"
          >
            ← Changer de compte
          </button>
        </div>
      )}
    </section>
  );
}
