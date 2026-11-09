"use client";

import { useCallback, useEffect, useState } from "react";

type U = { id: number; identifiant: string; nom: string };

export default function UsersManager({ champId }: { champId: number }) {
  const [creds, setCreds] = useState({ identifiant: "", code: "" });
  const [users, setUsers] = useState<U[]>([]);
  const [form, setForm] = useState({ identifiant: "", nom: "", code: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const s = window.localStorage.getItem(`cdc-auth-${champId}`);
      if (s) {
        const o = JSON.parse(s);
        setCreds({ identifiant: o.identifiant || "", code: o.code || "" });
      }
    } catch {
      /* ignore */
    }
  }, [champId]);

  const refresh = useCallback(async () => {
    if (!creds.identifiant && !creds.code) {
      setLoading(false);
      return;
    }
    const q = new URLSearchParams({
      adminIdent: creds.identifiant,
      adminCode: creds.code,
    });
    const res = await fetch(`/api/users?${q}`);
    const d = await res.json();
    if (Array.isArray(d)) setUsers(d);
    setLoading(false);
  }, [creds]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminIdent: creds.identifiant,
        adminCode: creds.code,
        identifiant: form.identifiant,
        nom: form.nom,
        code: form.code,
      }),
    });
    const d = await res.json();
    if (!res.ok) {
      setMsg(d.error ?? "Erreur");
    } else {
      setMsg(`✅ Utilisateur « ${form.nom || form.identifiant} » ajouté.`);
      setForm({ identifiant: "", nom: "", code: "" });
      refresh();
    }
  }

  async function removeUser(id: number) {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminIdent: creds.identifiant,
        adminCode: creds.code,
        id,
      }),
    });
    refresh();
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-800">
        👥 Ajouter un utilisateur <span className="text-xs text-slate-500">(réservé à l&apos;administrateur)</span>
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Ajoutez un adjoint ou co-gérant : il pourra se connecter avec son propre
        identifiant. <strong>Seul votre compte admin peut créer des comptes.</strong>
      </p>

      <form onSubmit={addUser} className="mt-3 grid gap-2 sm:grid-cols-4">
        <input
          value={form.nom}
          onChange={(e) => setForm({ ...form, nom: e.target.value })}
          placeholder="Nom de la personne"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          value={form.identifiant}
          onChange={(e) => setForm({ ...form, identifiant: e.target.value })}
          placeholder="Identifiant"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase"
        />
        <input
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="Mot de passe"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase"
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + Ajouter
        </button>
      </form>

      {msg && <p className="mt-2 text-sm text-slate-700">{msg}</p>}

      <div className="mt-4">
        <h4 className="text-sm font-semibold text-slate-700">
          Utilisateurs ({users.length})
        </h4>
        {loading ? (
          <p className="mt-2 text-sm text-slate-400">Chargement…</p>
        ) : users.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">
            Aucun utilisateur ajouté pour le moment.
          </p>
        ) : (
          <ul className="mt-2 grid gap-2">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-700">{u.nom}</span>
                <code className="rounded bg-white px-2 py-0.5 font-mono text-xs">
                  {u.identifiant}
                </code>
                <button
                  onClick={() => removeUser(u.id)}
                  className="ml-auto rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
