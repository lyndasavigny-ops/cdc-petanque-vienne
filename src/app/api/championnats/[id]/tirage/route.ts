import { db } from "@/db";
import { teams, journees, rencontres } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { roundRobin } from "@/lib/tirage";

export const dynamic = "force-dynamic";

// Effectue le tirage (calendrier round-robin) à partir des équipes saisies.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cid = Number(id);

  const teamRows = await db
    .select()
    .from(teams)
    .where(eq(teams.championshipId, cid))
    .orderBy(asc(teams.numero));

  if (teamRows.length < 2) {
    return NextResponse.json(
      { error: "Il faut au moins 2 équipes pour effectuer le tirage." },
      { status: 400 },
    );
  }

  // Suppression de l'ancien calendrier (cascade sur rencontres)
  await db.delete(journees).where(eq(journees.championshipId, cid));

  const calendrier = roundRobin(teamRows.length);

  let ordre = 0;
  for (let j = 0; j < calendrier.length; j++) {
    const [journee] = await db
      .insert(journees)
      .values({
        championshipId: cid,
        numero: j + 1,
        lieu: "",
        dateRencontre: "",
        heure: "",
      })
      .returning();

    for (const paire of calendrier[j]) {
      const teamA =
        paire.a !== null && paire.a !== undefined ? teamRows[paire.a] : null;
      const teamB =
        paire.b !== null && paire.b !== undefined ? teamRows[paire.b] : null;
      await db.insert(rencontres).values({
        championshipId: cid,
        journeeId: journee.id,
        ordre: ordre++,
        teamAId: teamA ? teamA.id : null,
        teamBId: teamB ? teamB.id : null,
      });
    }
  }

  return NextResponse.json({ ok: true, journees: calendrier.length });
}
