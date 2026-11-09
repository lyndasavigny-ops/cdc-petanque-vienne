"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetch, setAdminToken } from "@/lib/adminFetch";

// Champ mot de passe avec œil pour afficher / masquer
function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-11"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        tabIndex={-1}
        aria-label={visible ? "Masquer le code" : "Afficher le code"}
        title={visible ? "Masquer le code" : "Afficher le code"}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-lg text-slate-500 hover:text-slate-800"
      >
        {visible ? "🙈" : "👁️"}
      </button>
    </div>
  );
}

export function AdminLoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const [identifiant, setIdentifiant] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setHint(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          identifiant: identifiant.trim(),
          code: code.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `Erreur de connexion (${res.status}).`);
        if (res.status === 401) {
          setHint(
            "Astuce : utilisez l'œil 👁️ pour vérifier le code tapé " +
              "(tout en minuscules, sans espace). En cas d'oubli, " +
              "contactez l'administrateur principal.",
          );
        }
      } else {
        // Jeton mémorisé dans le navigateur : fonctionne même si les
        // cookies sont bloqués.
        setAdminToken(data.token ?? code.trim());
        if (onSuccess) onSuccess();
      }
    } catch {
      setError(
        "Impossible de joindre le serveur. Vérifiez que vous êtes bien sur " +
          "l'adresse la plus récente du site, puis réessayez.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Identifiant</span>
        <input
          value={identifiant}
          onChange={(e) => setIdentifiant(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
          autoComplete="username"
          placeholder="admin"
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Code</span>
        <PasswordInput
          value={code}
          onChange={setCode}
          autoComplete="current-password"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {hint && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {hint}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-slate-800 px-4 py-2.5 font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
      >
        {loading ? "Connexion…" : "Se connecter"}
      </button>
      <p className="text-xs text-slate-400">
        Accès réservé : identifiants fournis par l&apos;administrateur du
        comité.
      </p>
    </form>
  );
}

export function ClubCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/saisie/${cleaned}`, { cache: "no-store" });
      if (!res.ok) {
        setError("Code invalide. Vérifiez le code transmis par l'organisateur.");
      } else {
        router.push(`/saisie/${cleaned}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">
          Code de saisie de votre poule
        </span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="rounded-lg border border-slate-300 px-3 py-2 text-center font-mono text-lg tracking-[0.3em] uppercase"
          placeholder="ABC123"
          maxLength={6}
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? "Vérification…" : "Accéder à la saisie des scores"}
      </button>
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        setAdminToken("");
        await fetch("/api/auth/logout", { method: "POST" });
        router.refresh();
      }}
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
    >
      Se déconnecter
    </button>
  );
}

export function AdminSettingsForm({
  currentIdentifiant,
  onSaved,
}: {
  currentIdentifiant: string;
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [identifiant, setIdentifiant] = useState(currentIdentifiant);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    const res = await adminFetch("/api/auth/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiant, code }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur.");
    } else {
      // mémoriser le nouveau code pour rester connecté
      setAdminToken(data.token ?? code);
      setMsg("Identifiants mis à jour.");
      setCode("");
      if (onSaved) onSaved();
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm font-semibold text-slate-700"
      >
        🔑 Modifier l&apos;identifiant / code organisateur {open ? "▲" : "▼"}
      </button>
      {open && (
        <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-3">
          <input
            value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)}
            placeholder="Identifiant"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <PasswordInput
            value={code}
            onChange={setCode}
            placeholder="Nouveau code"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
          >
            Enregistrer
          </button>
          {msg && (
            <p className="text-sm text-emerald-600 sm:col-span-3">{msg}</p>
          )}
          {error && (
            <p className="text-sm text-red-600 sm:col-span-3">{error}</p>
          )}
        </form>
      )}
    </div>
  );
}
