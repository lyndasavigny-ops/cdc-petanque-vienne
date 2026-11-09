"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChampionshipDetail } from "@/lib/types";
import { adminFetch } from "@/lib/adminFetch";

type PlayerRow = { nom: string; prenom: string; licence: string };

export default function JoueursTab({
  detail,
}: {
  detail: ChampionshipDetail;
}) {
  const cid = detail.championship.id;
  const [rosters, setRosters] = useState<Record<number, PlayerRow[]>>({});
  const [violations, setViolations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    const res = await adminFetch(`/api/championnats/${cid}/joueurs`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = await res.json();
    const r: Record<number, PlayerRow[]> = {};
    for (const t of detail.teams) {
      const ps = (data.players as { teamId: number; ordre: number; nom: string; prenom: string; licence: string }[])
        .filter((p) => p.teamId === t.id)
        .sort((a, b) => a.ordre - b.ordre);
      r[t.id] = Array.from({ length: 8 }, (_, i) => ({
        nom: ps[i]?.nom ?? "",
        prenom: ps[i]?.prenom ?? "",
        licence: ps[i]?.licence ?? "",
      }));
    }
    setRosters(r);
    setViolations(data.violations ?? []);
    setLoading(false);
  }, [cid, detail.teams]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const playersList: { teamId: number; ordre: number; nom: string; prenom: string; licence: string }[] = [];
      for (const t of detail.teams) {
        (rosters[t.id] ?? []).forEach((p, i) => {
          if (p.nom.trim() || p.prenom.trim()) {
            playersList.push({
              teamId: t.id,
              ordre: i + 1,
              nom: p.nom,
              prenom: p.prenom,
              licence: p.licence,
            });
          }
        });
      }
      const res = await adminFetch(`/api/championnats/${cid}/joueurs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players: playersList }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("✅ Listes enregistrées.");
        setViolations(data.violations ?? []);
      }
    } finally {
      setSaving(false);
    }
  }

  async function exportCsv() {
    const res = await adminFetch(`/api/championnats/${cid}/joueurs/export`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "joueurs.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importCsv(file: File) {
    setMsg(null);
    const text = await file.text();
    const res = await adminFetch(`/api/championnats/${cid}/joueurs/import`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: text,
    });
    const data = await res.json();
    if (res.ok) {
      let m = `✅ ${data.importes} joueur(s) importé(s).`;
      if (data.equipesInconnues?.length) {
        m += ` ⚠️ Équipes non reconnues (ignorées) : ${data.equipesInconnues.join(", ")} — le nom doit correspondre exactement.`;
      }
      setMsg(m);
      await reload();
    } else {
      setMsg("❌ " + (data.error ?? "Erreur d'import."));
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function update(teamId: number, idx: number, field: keyof PlayerRow, value: string) {
    setRosters((prev) => ({
      ...prev,
      [teamId]: (prev[teamId] ?? []).map((p, i) =>
        i === idx ? { ...p, [field]: value } : p,
      ),
    }));
  }

  if (loading) {
    return <p className="p-6 text-slate-500">Chargement des listes…</p>;
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "💾 Enregistrer les listes"}
        </button>
        <button
          onClick={exportCsv}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ⬇️ Exporter (CSV Excel)
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ⬆️ Importer un fichier CSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importCsv(f);
          }}
        />
        <span className="text-xs text-slate-500">
          Format : equipe;nom;prenom;licence (une ligne par joueur)
        </span>
      </div>
      {msg && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {msg}
        </p>
      )}

      {violations.length > 0 && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
          <p className="font-bold text-red-800">
            🚫 Inscriptions non conformes détectées :
          </p>
          <ul className="mt-2 grid gap-1 text-sm text-red-700">
            {violations.map((v, i) => (
              <li key={i}>• {v}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-red-600">
            Règle : un joueur inscrit sur une liste ne peut pas jouer avec une
            équipe de division inférieure ou égale à la sienne.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {detail.teams.map((t) => (
          <section
            key={t.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h3 className="mb-2 font-bold text-slate-800">
              {String(t.numero).padStart(2, "0")}-{t.nom}
            </h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="w-6 px-1 py-1">#</th>
                  <th className="px-1 py-1 text-left">Nom</th>
                  <th className="px-1 py-1 text-left">Prénom</th>
                  <th className="w-24 px-1 py-1 text-left">N° licence</th>
                </tr>
              </thead>
              <tbody>
                {(rosters[t.id] ?? []).map((p, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-1 py-0.5 text-center font-bold text-slate-400">
                      {i + 1}
                    </td>
                    <td className="px-1 py-0.5">
                      <input
                        value={p.nom}
                        onChange={(e) => update(t.id, i, "nom", e.target.value)}
                        className="w-full rounded border border-slate-200 px-1.5 py-1"
                      />
                    </td>
                    <td className="px-1 py-0.5">
                      <input
                        value={p.prenom}
                        onChange={(e) =>
                          update(t.id, i, "prenom", e.target.value)
                        }
                        className="w-full rounded border border-slate-200 px-1.5 py-1"
                      />
                    </td>
                    <td className="px-1 py-0.5">
                      <input
                        value={p.licence}
                        onChange={(e) =>
                          update(t.id, i, "licence", e.target.value)
                        }
                        className="w-full rounded border border-slate-200 px-1.5 py-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  );
}
