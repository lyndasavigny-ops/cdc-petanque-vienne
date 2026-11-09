"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChampionshipDetail } from "@/lib/types";
import { adminFetch } from "@/lib/adminFetch";

type ScanMeta = {
  id: number;
  journeeId: number;
  filename: string;
  mimeType: string;
  taille: number;
  uploadedBy: string;
  createdAt: string;
};

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result);
      resolve(s.slice(s.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ScansTab({
  detail,
}: {
  detail: ChampionshipDetail;
}) {
  const cid = detail.championship.id;
  const [list, setList] = useState<ScanMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await adminFetch(`/api/championnats/${cid}/scans`, {
      cache: "no-store",
    });
    if (res.ok) setList(await res.json());
  }, [cid]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function upload(journeeId: number, file: File) {
    setBusy(true);
    setMsg(null);
    try {
      const dataBase64 = await fileToBase64(file);
      const res = await adminFetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          championshipId: cid,
          journeeId,
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          dataBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg("❌ " + (data.error ?? "Erreur d'envoi."));
      } else {
        setMsg(`✅ « ${file.name} » déposé.`);
        await reload();
      }
    } finally {
      setBusy(false);
    }
  }

  async function download(s: ScanMeta) {
    const res = await adminFetch(`/api/scans/${s.id}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = s.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function remove(s: ScanMeta) {
    if (!confirm(`Supprimer « ${s.filename} » ?`)) return;
    await adminFetch(`/api/scans/${s.id}`, { method: "DELETE" });
    await reload();
  }

  if (detail.journees.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        Effectuez d&apos;abord le tirage : les dossiers par journée seront
        créés automatiquement.
      </p>
    );
  }

  return (
    <div className="grid gap-5">
      <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
        📁 Un dossier par journée : déposez-y les feuilles de match scannées
        (photo ou PDF, 8 Mo max). Les clubs référents peuvent aussi en déposer
        depuis leur page de saisie — vous seul(e) pouvez les consulter et les
        télécharger ici.
      </p>
      {msg && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {msg}
        </p>
      )}
      {detail.journees.map((j) => {
        const files = list.filter((s) => s.journeeId === j.id);
        return (
          <section
            key={j.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-800">
                📁 Journée {j.numero}
                {j.lieu && ` — ${j.lieu}`}
                {j.dateRencontre && ` le ${j.dateRencontre}`}
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {files.length} fichier{files.length > 1 ? "s" : ""}
                </span>
              </h3>
              <label className="cursor-pointer rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900">
                📷 Déposer un scan
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(j.id, f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {files.length === 0 ? (
              <p className="text-sm italic text-slate-400">
                Aucune feuille scannée pour cette journée.
              </p>
            ) : (
              <ul className="grid gap-1">
                {files.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm"
                  >
                    <span className="font-medium text-slate-700">
                      {s.mimeType.startsWith("image/") ? "🖼" : "📄"}{" "}
                      {s.filename}
                      <span className="ml-2 text-xs text-slate-400">
                        {(s.taille / 1024 / 1024).toFixed(1)} Mo · déposé par{" "}
                        {s.uploadedBy} ·{" "}
                        {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </span>
                    <span className="flex gap-2">
                      <button
                        onClick={() => download(s)}
                        className="rounded border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-white"
                      >
                        ⬇ Télécharger
                      </button>
                      <button
                        onClick={() => remove(s)}
                        className="rounded border border-red-200 px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Supprimer
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
