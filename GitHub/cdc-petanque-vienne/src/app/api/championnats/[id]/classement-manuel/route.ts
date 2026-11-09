import { db } from "@/db";
import { teams } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Ordre manuel du classement final — réservé à l'organisateur.
// Body : { ranks: [{ teamId, rang }] }  (rang 0 = retour à l'automatique)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Réservé à l'organisateur." },
      { status: 401 },
    );
  }
  const { id } = await params;
  const cid = Number(id);
  const body = await req.json().catch(() => ({}));
  const ranks: { teamId: number; rang: number }[] = Array.isArray(body.ranks)
    ? body.ranks
    : [];

  // Vérification : pas deux fois le même rang (hors 0)
  const used = ranks.map((r) => Number(r.rang)).filter((n) => n > 0);
  const doublons = used.filter((n, i) => used.indexOf(n) !== i);
  if (doublons.length > 0) {
    return NextResponse.json(
      {
        error: `Le rang ${doublons[0]} est utilisé plusieurs fois. Chaque numéro ne peut servir qu'une fois.`,
      },
      { status: 400 },
    );
  }

  for (const r of ranks) {
    await db
      .update(teams)
      .set({ classementManuel: Math.max(0, Number(r.rang) || 0) })
      .where(and(eq(teams.id, Number(r.teamId)), eq(teams.championshipId, cid)));
  }

  return NextResponse.json({ ok: true });
}
