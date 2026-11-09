import { db } from "@/db";
import { championships, teams, journees, rencontres } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

// Détail public d'un championnat : équipes, journées, rencontres et scores.
// Lecture seule — le code de saisie n'est jamais exposé.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureSchema();
  const { id } = await params;
  const cid = Number(id);

  const [champ] = await db
    .select({
      id: championships.id,
      saison: championships.saison,
      annee: championships.annee,
      typeCdc: championships.typeCdc,
      division: championships.division,
      poule: championships.poule,
      ptsVictoire: championships.ptsVictoire,
      ptsNul: championships.ptsNul,
      ptsDefaite: championships.ptsDefaite,
      ptsForfait: championships.ptsForfait,
    })
    .from(championships)
    .where(eq(championships.id, cid));
  if (!champ) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const [teamRows, journeeRows, rencontreRows] = await Promise.all([
    db
      .select()
      .from(teams)
      .where(eq(teams.championshipId, cid))
      .orderBy(asc(teams.numero)),
    db
      .select()
      .from(journees)
      .where(eq(journees.championshipId, cid))
      .orderBy(asc(journees.numero)),
    db
      .select()
      .from(rencontres)
      .where(eq(rencontres.championshipId, cid))
      .orderBy(asc(rencontres.ordre)),
  ]);

  return NextResponse.json({
    championship: champ,
    teams: teamRows,
    journees: journeeRows,
    rencontres: rencontreRows,
  });
}
