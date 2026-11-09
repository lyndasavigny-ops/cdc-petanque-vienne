import { db } from "@/db";
import { championships, teams, players } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Export CSV des joueurs (Excel, séparateur point-virgule)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Réservé à l'organisateur." }, { status: 401 });
  }
  const { id } = await params;
  const cid = Number(id);

  const [champ] = await db
    .select()
    .from(championships)
    .where(eq(championships.id, cid));
  const teamRows = await db
    .select()
    .from(teams)
    .where(eq(teams.championshipId, cid))
    .orderBy(asc(teams.numero));
  const ids = teamRows.map((t) => t.id);
  const playerRows = ids.length
    ? await db
        .select()
        .from(players)
        .where(inArray(players.teamId, ids))
        .orderBy(asc(players.ordre))
    : [];
  const teamName = new Map(teamRows.map((t) => [t.id, t.nom]));

  const lines = ["equipe;nom;prenom;licence"];
  for (const t of teamRows) {
    const ps = playerRows.filter((p) => p.teamId === t.id);
    for (const p of ps) {
      lines.push(
        `${teamName.get(t.id)};${p.nom};${p.prenom};${p.licence}`,
      );
    }
    if (ps.length === 0) lines.push(`${t.nom};;;`);
  }

  const csv = "\uFEFF" + lines.join("\r\n"); // BOM pour Excel
  const fname = champ
    ? `joueurs-CDC${champ.division}-Poule${champ.poule}-${champ.saison}.csv`
    : "joueurs.csv";
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fname}"`,
    },
  });
}
