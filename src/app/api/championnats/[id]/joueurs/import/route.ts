import { db } from "@/db";
import { teams, players } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Import CSV des joueurs : colonnes equipe;nom;prenom;licence
// Remplace les listes des équipes présentes dans le fichier.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Réservé à l'organisateur." }, { status: 401 });
  }
  const { id } = await params;
  const cid = Number(id);
  const text = (await req.text()).replace(/^\uFEFF/, "");

  const teamRows = await db
    .select()
    .from(teams)
    .where(eq(teams.championshipId, cid))
    .orderBy(asc(teams.numero));
  const byName = new Map(
    teamRows.map((t) => [t.nom.trim().toLowerCase(), t]),
  );

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parsed: { teamId: number; nom: string; prenom: string; licence: string }[] = [];
  const inconnues = new Set<string>();
  let ignoreHeader = true;

  for (const line of lines) {
    const sep = line.includes(";") ? ";" : ",";
    const cols = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    if (ignoreHeader && /equipe/i.test(cols[0] ?? "")) {
      ignoreHeader = false;
      continue;
    }
    ignoreHeader = false;
    const [equipe, nom, prenom, licence] = [
      cols[0] ?? "",
      cols[1] ?? "",
      cols[2] ?? "",
      cols[3] ?? "",
    ];
    if (!equipe) continue;
    const team = byName.get(equipe.toLowerCase());
    if (!team) {
      inconnues.add(equipe);
      continue;
    }
    if (!nom && !prenom) continue;
    parsed.push({ teamId: team.id, nom, prenom, licence });
  }

  // Remplacer les listes des équipes concernées
  const touchedTeams = [...new Set(parsed.map((p) => p.teamId))];
  if (touchedTeams.length > 0) {
    await db.delete(players).where(inArray(players.teamId, touchedTeams));
  }
  const counter = new Map<number, number>();
  for (const p of parsed) {
    const next = (counter.get(p.teamId) ?? 0) + 1;
    if (next > 8) continue; // 8 joueurs max par équipe
    counter.set(p.teamId, next);
    await db.insert(players).values({
      teamId: p.teamId,
      ordre: next,
      nom: p.nom,
      prenom: p.prenom,
      licence: p.licence,
    });
  }

  return NextResponse.json({
    ok: true,
    importes: parsed.length,
    equipesInconnues: [...inconnues],
  });
}
