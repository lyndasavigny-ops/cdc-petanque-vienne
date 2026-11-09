"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminFetch";

type User = { id: number; identifiant: string; createdAt: string };

export default function UtilisateursPanel() {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [identifiant, setIdentifiant] = useState("");
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await adminFetch("/api/auth/utilisateurs", {
      cache: "no-store",
    });
    if (res.ok) setUsers(await res.json());
  }, []);

  useEffect(() => {
    if (open) reload();
  }, [open, reload]);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    const res = await adminFetch("/api/auth/utilisateurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiant, code }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur.");
    } else {
      setMsg(
        `✅ « ${data.identifiant} » ajouté. Transmettez-lui son identifiant et son code : il se connectera via « Accès organisateur ».`,
      );
      setIdentifiant("");
      setCode("");
      await reload();
    }
  }

  async function supprimer(u: User) {
    if (
      !confirm(
        `Supprimer l'accès de « ${u.identifiant} » ? Il ne pourra plus se connecter.`,
      )
    )
      return;
    await adminFetch(`/api/auth/utilisateurs/${u.id}`, { method: "DELETE" });
    await reload();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm font-semibold text-slate-700"
      >
        👥 Co-organisateurs (ajouter un accès) {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className="mt-3 grid gap-4">
          <p className="text-xs text-slate-500">
            Ajoutez des personnes de confiance (membre du comité, secrétaire…)
            avec leur propre identifiant et code. Ils auront accès à la gestion
            des championnats et des scores, mais{" "}
            <strong>
              seul votre compte principal peut ajouter ou supprimer des
              utilisateurs
            </strong>{" "}
            et modifier vos identifiants.
          </p>

          {/* Liste */}
          {users.length > 0 ? (
            <ul className="grid gap-2">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span className="text-sm font-medium text-slate-800">
                    👤 {u.identifiant}
                  </span>
                  <button
                    onClick={() => supprimer(u)}
                    className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Supprimer l&apos;accès
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">
              Aucun co-organisateur pour le moment.
            </p>
          )}

          {/* Ajout */}
          <form onSubmit={ajouter} className="grid gap-3 sm:grid-cols-3">
            <input
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              placeholder="Identifiant (ex: pierre)"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="relative">
              <input
                type={showCode ? "text" : "password"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code (4 car. min.)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowCode(!showCode)}
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-slate-500"
              >
                {showCode ? "🙈" : "👁️"}
              </button>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
            >
              + Ajouter
            </button>
          </form>
          {msg && <p className="text-sm text-emerald-700">{msg}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
