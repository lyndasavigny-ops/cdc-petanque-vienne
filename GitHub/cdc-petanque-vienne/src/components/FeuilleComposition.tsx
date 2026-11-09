/* eslint-disable @next/next/no-img-element */
import type { Championship, Journee, Rencontre, Team } from "@/db/schema";

function teamLabel(team: Team | null | undefined): string {
  if (!team) return "— Exempt —";
  return `${String(team.numero).padStart(2, "0")}-${team.nom}`;
}

function CompositionTable({ accent }: { accent: "violet" | "rose" }) {
  const headBg = accent === "violet" ? "bg-slate-100" : "bg-slate-200";
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr>
          <th className="w-7 border border-slate-700 bg-slate-100"></th>
          <th
            className={`border border-slate-700 px-2 py-1 text-center ${headBg}`}
          >
            Nom &amp; Prénom
          </th>
          <th className={`w-24 border border-slate-700 px-1 py-1 ${headBg}`}>
            N de licence
          </th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 8 }, (_, i) => (
          <tr key={i}>
            <td className="h-9 border border-slate-700 bg-slate-100 text-center font-bold">
              {i + 1}
            </td>
            <td className="border border-slate-700 text-center align-middle"></td>
            <td className="border border-slate-700 bg-slate-50 text-center align-middle"></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function FeuilleComposition({
  championship,
  journee,
  rencontre,
  teamA,
  teamB,
}: {
  championship: Championship;
  journee: Journee;
  rencontre: Rencontre;
  teamA: Team | null;
  teamB: Team | null;
}) {
  return (
    <div className="mx-auto max-w-4xl rounded-md border-2 border-slate-800 bg-white p-4 print:border-0 print:p-0">
      {/* Titre principal avec le coq FFPJP France */}
      <div className="mb-3 flex items-center gap-3 rounded border-2 border-slate-800 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-4 py-2">
        <img
          src="/images/logo-ffpjp.png"
          alt="FFPJP France"
          className="h-20 w-20 shrink-0 object-contain"
          style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
        />
        <div className="flex-1 text-center">
          <h1 className="text-xl font-extrabold uppercase tracking-wide text-blue-800">
            Feuille de match CDC - {championship.typeCdc.toUpperCase()}
          </h1>
          <p className="mt-1 text-sm font-medium text-blue-600">
            Fédération Française de Pétanque et Jeu Provençal
          </p>
        </div>
        <img
          src="/images/logo-ffpjp.png"
          alt="FFPJP France"
          className="h-20 w-20 shrink-0 object-contain opacity-0"
          aria-hidden
        />
      </div>

      {/* Désignation en gros et en gras */}
      <div className="mb-3 rounded bg-slate-50 px-4 py-2 text-center">
        <p className="text-2xl font-extrabold uppercase tracking-wide text-blue-800">
          CDC{championship.division} Poule {championship.poule}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-slate-600">
          Saison {championship.saison} · Journée {journee.numero}
          {journee.lieu && ` · ${journee.lieu}`}
          {journee.dateRencontre && ` le ${journee.dateRencontre}`}
          {journee.heure && ` à ${journee.heure}`} · Match n°
          {rencontre.ordre + 1}
        </p>
      </div>

      {/* En-tête comité / terrain */}
      <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded border border-slate-700 bg-slate-100 px-3 py-1.5 font-bold">
          Comité departemental : Vienne (86)
        </div>
        <div className="rounded border border-slate-700 bg-slate-100 px-3 py-1.5 font-bold">
          N° Terrain : ________
        </div>
      </div>

      {/* Capitaines : lignes espacées pour l'écriture manuscrite */}
      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded border border-slate-300 bg-slate-100 px-3 py-2">
          <p className="font-bold text-slate-800">
            Capitaine Club A — {teamLabel(teamA)}
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="shrink-0 font-medium">Nom :</span>
            <span className="h-6 flex-1 border-b border-slate-500"></span>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="shrink-0 font-medium">Prénom :</span>
            <span className="h-6 flex-1 border-b border-slate-500"></span>
          </div>
          <div className="mt-3 mb-1 flex items-end gap-2">
            <span className="shrink-0 font-medium">N° de licence :</span>
            <span className="h-6 flex-1 border-b border-slate-500"></span>
          </div>
        </div>
        <div className="rounded border border-slate-400 bg-slate-200 px-3 py-2">
          <p className="font-bold text-slate-800">
            Capitaine Club B — {teamLabel(teamB)}
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="shrink-0 font-medium">Nom :</span>
            <span className="h-6 flex-1 border-b border-slate-500"></span>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="shrink-0 font-medium">Prénom :</span>
            <span className="h-6 flex-1 border-b border-slate-500"></span>
          </div>
          <div className="mt-3 mb-1 flex items-end gap-2">
            <span className="shrink-0 font-medium">N° de licence :</span>
            <span className="h-6 flex-1 border-b border-slate-500"></span>
          </div>
        </div>
      </div>

      {/* Bandeaux équipes */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded bg-slate-100 px-3 py-1.5 text-center text-sm font-bold">
          {teamLabel(teamA)}
        </div>
        <div className="rounded bg-slate-200 px-3 py-1.5 text-center text-sm font-bold">
          {teamLabel(teamB)}
        </div>
      </div>

      {/* Composition des équipes : 8 lignes */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="rounded-t bg-slate-100 px-3 py-1.5 text-center text-sm font-bold text-slate-800">
            Composition de l&apos;equipe - A
          </div>
          <CompositionTable accent="violet" />
        </div>
        <div>
          <div className="rounded-t bg-slate-200 px-3 py-1.5 text-center text-sm font-bold text-slate-800">
            Composition de l&apos;equipe - B
          </div>
          <CompositionTable accent="rose" />
        </div>
      </div>

      {/* Pied de page avec logos */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <img
          src="/images/logo-vienne.png"
          alt="FFPJP Vienne"
          className="h-24 w-24 shrink-0 object-contain"
          style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
        />
        <div className="flex-1 rounded border border-slate-700 bg-slate-50 px-3 py-2 text-center text-xs italic text-slate-700">
          <p className="font-semibold">
            En cas d&apos;incident joindre un rapport
          </p>
          <p>Au Siège Sociale du Comité de la Vienne</p>
          <p>1 Rue de la Poste 86500 Saint Julien l&apos;Ars</p>
        </div>
        <img
          src="/images/logo-nouvelle-aquitaine.png"
          alt="Comité Régional Nouvelle-Aquitaine"
          className="h-24 w-24 shrink-0 object-contain"
          style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
        />
      </div>

      {/* Case Réserve */}
      <div className="mt-3 rounded border border-slate-700">
        <p className="border-b border-slate-700 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800">
          Réserve :
        </p>
        <div className="h-14"></div>
      </div>

      {/* Signatures capitaines et arbitre */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded border border-slate-700">
          <p className="border-b border-slate-700 bg-slate-100 px-2 py-1 font-bold text-slate-800">
            Signature Capitaine Équipe A
          </p>
          <div className="h-16"></div>
        </div>
        <div className="rounded border border-slate-700">
          <p className="border-b border-slate-700 bg-slate-100 px-2 py-1 font-bold text-slate-800">
            Nom - Prénom &amp; Signature de l&apos;Arbitre
          </p>
          <div className="h-16"></div>
        </div>
        <div className="rounded border border-slate-700">
          <p className="border-b border-slate-700 bg-slate-200 px-2 py-1 font-bold text-slate-800">
            Signature Capitaine Équipe B
          </p>
          <div className="h-16"></div>
        </div>
      </div>
    </div>
  );
}
