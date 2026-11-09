"use client";

import { useRef, useState } from "react";
import { adminFetch } from "@/lib/adminFetch";

export default function SauvegardePanel({
  onRestored,
}: {
  onRestored?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function telecharger() {
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await adminFetch("/api/sauvegarde");
      if (!res.ok) {
        setError("Impossible de générer la sauvegarde.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sauvegarde-cdc-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg(
        "✅ Sauvegarde téléchargée ! Gardez ce fichier précieusement (clé USB, e-mail à vous-même…).",
      );
    } finally {
      setBusy(false);
    }
  }

  async function restaurer(file: File) {
    if (
      !confirm(
        "⚠️ La restauration REMPLACE toutes les données actuelles du site par celles du fichier. Continuer ?",
      )
    ) {
      return;
    }
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const text = await file.text();
      const res = await adminFetch("/api/sauvegarde/restaurer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la restauration.");
      } else {
        setMsg(
          `✅ Restauration réussie : ${data.championnats} championnat(s), ${data.equipes} équipe(s), ${data.rencontres} rencontre(s).`,
        );
        if (onRestored) onRestored();
      }
    } catch {
      setError("Fichier illisible.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm font-semibold text-slate-700"
      >
        💾 Sauvegarde &amp; restauration des données {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className="mt-3 grid gap-3">
          <p className="text-xs text-slate-500">
            Téléchargez régulièrement une sauvegarde (après chaque journée par
            exemple). En cas de problème — bug, mauvaise manipulation, base
            perdue — vous pourrez tout restaurer à l&apos;identique :
            championnats, équipes, tirages, scores et classements.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={telecharger}
              disabled={busy}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              ⬇️ Télécharger la sauvegarde
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
            >
              ♻️ Restaurer depuis un fichier
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) restaurer(f);
              }}
            />
          </div>
          {msg && <p className="text-sm text-emerald-700">{msg}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
