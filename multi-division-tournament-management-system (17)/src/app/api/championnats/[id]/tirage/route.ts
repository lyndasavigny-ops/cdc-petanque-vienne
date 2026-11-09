import { db } from "@/db";
import { teams, journees, rencontres } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { roundRobin } from "@/lib/tirage";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Effectue le tirage (calendrier round-robin) à partir des équipes saisies.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
  }
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

  // Règle fédérale : les équipes d'un même club doivent se rencontrer
  // lors des premiers matchs. On réordonne pour que les paires d'un même
  // club tombent en journée 1 (paires du round-robin : (0,n-1),(1,n-2)...).
  let ordered = teamRows;
  if (teamRows.length % 2 === 0) {
    const clubOf = (nom: string) =>
      nom.replace(/\s*\d+\s*$/, "").trim().toLowerCase();
    const byClub = new Map<string, typeof teamRows>();
    for (const t of teamRows) {
      const c = clubOf(t.nom);
      if (!byClub.has(c)) byClub.set(c, []);
      byClub.get(c)!.push(t);
    }
    const pairs: [typeof teamRows[0], typeof teamRows[0]][] = [];
    const paired = new Set<number>();
    for (const list of byClub.values()) {
      for (let k = 0; k + 1 < list.length; k += 2) {
        pairs.push([list[k], list[k + 1]]);
        paired.add(list[k].id);
        paired.add(list[k + 1].id);
      }
    }
    if (pairs.length > 0) {
      const n = teamRows.length;
      const order: (typeof teamRows[0] | undefined)[] = new Array(n);
      const slots: [number, number][] = [];
      for (let s = 0; s < n / 2; s++) slots.push([s, n - 1 - s]);
      pairs.forEach((p, idx) => {
        if (idx < slots.length) {
          order[slots[idx][0]] = p[0];
          order[slots[idx][1]] = p[1];
        }
      });
      const rest = teamRows.filter((t) => !paired.has(t.id));
      let ri = 0;
      for (let k = 0; k < n; k++) {
        if (!order[k]) order[k] = rest[ri++];
      }
      ordered = order as typeof teamRows;
    }
  }

  const calendrier = roundRobin(ordered.length);

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
        paire.a !== null && paire.a !== undefined ? ordered[paire.a] : null;
      const teamB =
        paire.b !== null && paire.b !== undefined ? ordered[paire.b] : null;
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
