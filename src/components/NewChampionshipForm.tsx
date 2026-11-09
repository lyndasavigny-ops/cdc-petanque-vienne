"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TYPES_CDC, DIVISIONS, poulesForDivision } from "@/lib/cdc";

export default function NewChampionshipForm() {
  const router = useRouter();
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [saison, setSaison] = useState(String(new Date().getFullYear()));
  const [typeCdc, setTypeCdc] = useState<string>("Senior");
  const [division, setDivision] = useState(1);
  const [poule, setPoule] = useState("A");
  const [loading, setLoading] = useState(false);

  const poules = poulesForDivision(division);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/championnats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annee, saison, typeCdc, division, poule }),
      });
      const data = await res.json();
      if (res.ok) {
        // On ouvre directement avec le code administrateur créé.
        const q = data.adminCode
          ? `?code=${encodeURIComponent(data.adminCode)}`
          : "";
        router.push(`/championnat/${data.id}${q}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <h2 className="text-lg font-semibold text-emerald-900">
          Créer un championnat
        </h2>
        <p className="text-sm text-slate-500">
          Choisissez le niveau de CDC, la poule, la saison et le type.
        </p>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Saison</span>
        <input
          value={saison}
          onChange={(e) => setSaison(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
          placeholder="2025"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Année</span>
        <input
          type="number"
          value={annee}
          onChange={(e) => setAnnee(Number(e.target.value))}
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Type de CDC</span>
        <select
          value={typeCdc}
          onChange={(e) => setTypeCdc(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          {TYPES_CDC.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Division (CDC)</span>
        <select
          value={division}
          onChange={(e) => {
            const d = Number(e.target.value);
            setDivision(d);
            const p = poulesForDivision(d);
            if (!p.includes(poule)) setPoule(p[0]);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          {DIVISIONS.map((d) => (
            <option key={d.division} value={d.division}>
              CDC{d.division} — {d.label} ({d.poules} poule
              {d.poules > 1 ? "s" : ""})
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Poule</span>
        <select
          value={poule}
          onChange={(e) => setPoule(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          {poules.map((p) => (
            <option key={p} value={p}>
              Poule {p}
            </option>
          ))}
        </select>
      </label>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Création…" : "Créer le championnat"}
        </button>
      </div>
    </form>
  );
}
