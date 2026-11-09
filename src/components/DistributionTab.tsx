"use client";

import { useEffect, useState } from "react";
import type { ChampionshipDetail } from "@/lib/types";
import { championshipName } from "@/lib/cdc";
import { computeClassement } from "@/lib/classement";
import UsersManager from "./UsersManager";

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DistributionTab({
  detail,
}: {
  detail: ChampionshipDetail;
}) {
  const c = detail.championship;
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const buildLink = (ident: string, pw: string) =>
    `${origin}/championnat/${c.id}?identifiant=${encodeURIComponent(
      ident,
    )}&code=${encodeURIComponent(pw)}`;

  const smsText = (nom: string, ident: string, pw: string) =>
    `Bonjour ${nom}, voici votre accès pour saisir les scores du championnat ${championshipName(
      c,
    )} (Saison ${c.saison}). Cliquez ici : ${buildLink(
      ident,
      pw,
    )} — vous ne pouvez remplir que les scores (total 36 points). Saisissez les scores dès la rencontre terminée. Sportivement, Comité de la Vienne (86).`;

  function copy(text: string, key: string) {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  function exportClassement() {
    const lignes = computeClassement(detail.teams, detail.rencontres, {
      victoire: c.ptsVictoire,
      nul: c.ptsNul,
      defaite: c.ptsDefaite,
      forfait: c.ptsForfait,
    });
    const head =
      "Rang;Équipe;Joués;Points;Gagnés;Nuls;Perdus;Forfaits;Pour;Contre;Différence";
    const rows = lignes.map(
      (l, i) =>
        `${i + 1};${l.nom};${l.joues};${l.pointsTotal};${l.gagnes};${l.nuls};${l.perdus};${l.forfaits};${l.pointsPour};${l.pointsContre};${l.difference}`,
    );
    download(
      `classement-${championshipName(c)}-saison-${c.saison}.csv`,
      "\uFEFF" + [head, ...rows].join("\r\n"),
      "text/csv",
    );
  }

  function exportScores() {
    const head =
      "Journée;Équipe A;Score A;Score B;Équipe B;Statut";
    const teamOf = (id: number | null) => {
      const t = detail.teams.find((x) => x.id === id);
      return t ? `${String(t.numero).padStart(2, "0")}-${t.nom}` : "Exempt";
    };
    const rows = detail.rencontres.map((r) => {
      const j = detail.journees.find((x) => x.id === r.journeeId);
      return `${j?.numero ?? "?"};${teamOf(r.teamAId)};${
        r.saisi ? r.scoreA : ""
      };${r.saisi ? r.scoreB : ""};${teamOf(r.teamBId)};${
        r.saisi ? "Joué" : "À venir"
      }`;
    });
    download(
      `scores-${championshipName(c)}-saison-${c.saison}.csv`,
      "\uFEFF" + [head, ...rows].join("\r\n"),
      "text/csv",
    );
  }

  function exportSauvegarde() {
    download(
      `sauvegarde-${championshipName(c)}-saison-${c.saison}.json`,
      JSON.stringify(detail, null, 2),
      "application/json",
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            📤 Distribution &amp; sauvegarde
          </h2>
          <p className="text-sm text-slate-500">
            Envoyez les accès aux clubs, et gardez une copie de vos données.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          🖨️ Imprimer / PDF
        </button>
      </div>

      {/* Gestion des utilisateurs (admin seulement) */}
      <UsersManager champId={c.id} />

      {/* Sauvegarde — filet de sécurité */}
      <section className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 print:hidden">
        <h3 className="font-semibold text-emerald-900">
          💾 Sauvegarde — en cas de bug du site
        </h3>
        <p className="mt-1 text-sm text-emerald-800">
          Téléchargez régulièrement une copie de vos données. Vous gardez
          toujours vos résultats, même si le site a un souci.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={exportClassement}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100"
          >
            📥 Classement (CSV)
          </button>
          <button
            onClick={exportScores}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100"
          >
            📥 Scores par journée (CSV)
          </button>
          <button
            onClick={exportSauvegarde}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100"
          >
            📥 Sauvegarde complète (JSON)
          </button>
        </div>
        <ul className="mt-3 list-inside list-disc text-xs text-emerald-800">
          <li>
            <strong>CSV</strong> : s&apos;ouvre dans Excel / LibreOffice.
          </li>
          <li>
            <strong>JSON</strong> : copie complète du championnat (à conserver).
          </li>
          <li>
            <strong>PDF</strong> : utilisez « Imprimer / PDF » pour les feuilles.
          </li>
        </ul>
      </section>

      <div id="dist-print" className="grid gap-4">
        {/* En-tête du document */}
        <div className="rounded-lg border-2 border-slate-800 bg-white p-3 text-center">
          <h3 className="text-lg font-black uppercase text-slate-900">
            {championshipName(c)}
          </h3>
          <p className="text-sm text-slate-600">
            Saison {c.saison} · {c.typeCdc} · CDC {c.division} · Poule {c.poule}
          </p>
          <p className="text-xs text-slate-500">
            Accès des clubs — à envoyer par SMS / e-mail
          </p>
        </div>

        {/* Accès comité */}
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
          <h4 className="font-semibold text-emerald-900">
            Votre accès — Comité de la Vienne (86)
          </h4>
          <div className="print:hidden">
            <p className="mt-1 text-sm">
              Identifiant :{" "}
              <code className="rounded bg-white px-2 py-0.5 font-mono">admin</code>{" "}
              · Mot de passe :{" "}
              <code className="rounded bg-white px-2 py-0.5 font-mono">
                vienne86
              </code>
            </p>
            <p className="mt-1 break-all text-xs text-slate-600">
              Lien : {buildLink("admin", "vienne86")}
            </p>
          </div>
          <p className="mt-1 hidden text-xs text-slate-500 print:block">
            Identifiant : •••••• · Mot de passe : •••••• (masqués à
            l&apos;impression — visibles dans l&apos;application)
          </p>
        </div>

        {/* Accès clubs */}
        <h4 className="text-md font-bold text-slate-800">
          Accès des clubs ({detail.teams.length})
        </h4>

        {detail.teams.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">
            Aucune équipe : ajoutez les équipes puis lancez le tirage.
          </p>
        )}

        {detail.teams.map((t) => {
          const lnk = buildLink(t.identifiant, t.code);
          const sms = smsText(t.nom, t.identifiant, t.code);
          return (
            <section key={t.id} className="rounded-lg border border-slate-300 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold text-slate-900">
                  {String(t.numero).padStart(2, "0")} — {t.nom}
                </h4>
                <div className="flex gap-2 print:hidden">
                  <button
                    onClick={() => copy(lnk, `l${t.id}`)}
                    className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                  >
                    {copied === `l${t.id}` ? "Lien copié ✓" : "Copier le lien"}
                  </button>
                  <button
                    onClick={() => copy(sms, `s${t.id}`)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    {copied === `s${t.id}` ? "SMS copié ✓" : "Copier le SMS"}
                  </button>
                </div>
              </div>

              <div className="print:hidden">
                <p className="mt-2 text-sm">
                  Identifiant :{" "}
                  <code className="rounded bg-slate-100 px-2 py-0.5 font-mono">
                    {t.identifiant}
                  </code>{" "}
                  · Mot de passe :{" "}
                  <code className="rounded bg-slate-100 px-2 py-0.5 font-mono">
                    {t.code}
                  </code>
                </p>

                <p className="mt-1 break-all text-xs text-slate-600">
                  <strong>Lien :</strong> {lnk}
                </p>

                <div className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-700">
                  <strong>📱 SMS à envoyer :</strong>
                  <p className="mt-1 leading-relaxed">{sms}</p>
                </div>
              </div>
              <p className="mt-2 hidden text-xs text-slate-500 print:block">
                Identifiant : •••••• · Mot de passe : •••••• · Lien : ••••••
                (masqués à l&apos;impression)
              </p>
            </section>
          );
        })}
      </div>
    </div>
  );
}
