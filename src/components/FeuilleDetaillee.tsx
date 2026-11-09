import type { Championship, Journee, Rencontre, Team } from "@/db/schema";
import { championshipName, isProvencal } from "@/lib/cdc";

function teamLabel(team: Team | null | undefined): string {
  if (!team) return "— Exempt —";
  return `${String(team.numero).padStart(2, "0")}-${team.nom}`;
}

/**
 * Table d'une équipe pour une section (Tête à Tête / Doublettes / Triplettes).
 * - rows : nombre de lignes joueurs (6)
 * - group : taille de fusion des cases Score / Pts
 *     Tête à Tête -> 1 (6 parties)
 *     Doublettes  -> 2 (3 parties : lignes 1-2, 3-4, 5-6 fusionnées)
 *     Triplettes  -> 3 (2 parties : lignes 1-3 et 4-6 fusionnées)
 */
function SideTable({
  rows,
  group,
  contre,
  accent,
}: {
  rows: number;
  group: number;
  contre?: boolean;
  accent: "violet" | "rose";
}) {
  const headerBg = accent === "violet" ? "bg-slate-100" : "bg-slate-200";
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr>
          {contre && <th className="w-10 border-0"></th>}
          <th className="border border-slate-700 bg-slate-100 px-2 py-1 text-left">
            Nom - Prénom
          </th>
          <th className="w-12 border border-slate-700 bg-slate-100 px-1 py-1">
            Score
          </th>
          <th className="w-10 border border-slate-700 bg-slate-100 px-1 py-1">
            Pts
          </th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, i) => (
          <tr key={i}>
            {contre && (
              <td className="border-0 pr-1 text-right text-[10px] italic text-slate-500">
                Contre
              </td>
            )}
            <td className="h-7 border border-slate-700 px-2"></td>
            {i % group === 0 && (
              <td
                rowSpan={group}
                className="border border-slate-700 bg-white px-1 text-center"
              ></td>
            )}
            {i % group === 0 && (
              <td
                rowSpan={group}
                className="border border-slate-700 bg-white px-1 text-center"
              ></td>
            )}
          </tr>
        ))}
        <tr>
          {contre && <td className="border-0"></td>}
          <td
            className={`border border-slate-700 px-2 py-1 text-right text-[11px] font-bold ${headerBg}`}
          >
            Sous-Total pts
          </td>
          <td className="border border-slate-700"></td>
          <td className="border border-slate-700"></td>
        </tr>
      </tbody>
    </table>
  );
}

function Remplacants({ n }: { n: number }) {
  return (
    <div className="mt-1 text-[10px] italic text-slate-600">
      {Array.from({ length: n }, (_, i) => (
        <p key={i}>Joueur Remplaçant N°{i + 1} : ____________________</p>
      ))}
    </div>
  );
}

function Section({
  label,
  rows,
  group,
  remplacants,
}: {
  label: string;
  rows: number;
  group: number;
  remplacants: number;
}) {
  return (
    <div className="flex gap-2 print:break-inside-avoid">
      <div className="flex w-6 items-center justify-center">
        <span
          className="text-xs font-bold text-slate-700"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {label}
        </span>
      </div>
      <div className="grid flex-1 gap-4 sm:grid-cols-2">
        <div>
          <SideTable rows={rows} group={group} accent="violet" />
          {remplacants > 0 && <Remplacants n={remplacants} />}
        </div>
        <div>
          <SideTable rows={rows} group={group} contre accent="rose" />
          {remplacants > 0 && <Remplacants n={remplacants} />}
        </div>
      </div>
    </div>
  );
}

export default function FeuilleDetaillee({
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
      {/* Titre d'abord */}
      <div className="mb-3 rounded bg-slate-50 px-3 py-1.5 text-center text-sm font-bold text-blue-800">
        ORDRE des RENCONTRES &amp; FEUILLE de RESULTATS — {championshipName(championship)} · Saison{" "}
        {championship.saison} · Journée {journee.numero}
        {journee.lieu && ` · ${journee.lieu}`}
        {journee.dateRencontre && ` le ${journee.dateRencontre}`}
        {journee.heure && ` à ${journee.heure}`}
        {" · "}Match n°{rencontre.ordre + 1}
      </div>

      {/* Puis bandeaux équipes */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded bg-slate-100 px-3 py-1.5 text-center text-sm font-bold">
          {teamLabel(teamA)}
        </div>
        <div className="rounded bg-slate-200 px-3 py-1.5 text-center text-sm font-bold">
          {teamLabel(teamB)}
        </div>
      </div>

      {isProvencal(championship.typeCdc) ? (
        <div className="grid gap-5">
          {/* CDC Jeu Provençal : 4 parties (2 doublettes + 2 triplettes),
              chaque partie vaut 9 points — pas de tête-à-tête. */}
          <p className="rounded bg-slate-50 px-3 py-1 text-center text-[10px] font-semibold text-blue-800">
            Jeu Provençal — rencontre en 4 parties : 2 doublettes + 2
            triplettes (chaque partie gagnée = 9 points, total 36)
          </p>
          {/* Doublettes : 2 parties -> score/pts fusionnés par 2 lignes */}
          <Section label="Doublettes" rows={4} group={2} remplacants={2} />
          {/* Triplettes : 2 parties -> score/pts fusionnés par 3 lignes */}
          <Section label="Triplettes" rows={6} group={3} remplacants={2} />
        </div>
      ) : (
        <div className="grid gap-5">
          {/* Tête à Tête : 6 parties, score/pts par ligne */}
          <Section label="Tête à Tête" rows={6} group={1} remplacants={0} />

          {/* Doublettes : 3 parties -> score/pts fusionnés par 2 lignes */}
          <Section label="Doublettes" rows={6} group={2} remplacants={2} />

          {/* Triplettes : 2 parties -> score/pts fusionnés par 3 lignes */}
          <Section label="Triplettes" rows={6} group={3} remplacants={2} />
        </div>
      )}

      {/* Totaux et signatures */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div className="rounded border border-slate-700 px-3 py-2">
          <p className="font-bold">Total Général pts équipe A : ________</p>
        </div>
        <div className="rounded border border-slate-700 px-3 py-2">
          <p className="font-bold">Total Général pts équipe B : ________</p>
        </div>
      </div>

      <div className="mt-3 grid gap-1 text-xs text-slate-700">
        <p>
          Équipe gagnante : ____________ A ou B · du Club de : ____________
        </p>
        <p>
          Équipe perdante : ____________ A ou B · du Club de : ____________
        </p>
        <p>Match nul entre A et B : ____________</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center text-[10px] text-slate-600">
        <p>Signature Capitaine Équipe A</p>
        <p>Nom - Prénom &amp; Signature de l&apos;Arbitre</p>
        <p>Signature Capitaine Équipe B</p>
      </div>

      <p className="mt-4 text-center text-[10px] italic text-slate-500">
        En cas d&apos;incident joindre un rapport au Siège Social du Comité de
        la Vienne — 1 Rue de la Poste, 86500 Saint Julien l&apos;Ars
      </p>
    </div>
  );
}
