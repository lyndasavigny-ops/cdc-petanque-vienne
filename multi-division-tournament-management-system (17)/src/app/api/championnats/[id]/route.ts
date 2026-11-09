import { db } from "@/db";
import {
  championships,
  teams,
  journees,
  rencontres,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
  }
  const { id } = await params;
  const cid = Number(id);
  const [champ] = await db
    .select()
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
  }
  const { id } = await params;
  const cid = Number(id);
  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (body.saison !== undefined) update.saison = String(body.saison);
  if (body.annee !== undefined) update.annee = Number(body.annee);
  if (body.typeCdc !== undefined) update.typeCdc = String(body.typeCdc);
  if (body.division !== undefined) update.division = Number(body.division);
  if (body.poule !== undefined) update.poule = String(body.poule);
  // Réinitialisation de l'appareil autorisé (le prochain appareil qui
  // utilisera le code club deviendra le nouvel appareil référent).
  if (body.resetDevice) update.deviceLock = "";
  // Barème de points (victoire / nul / défaite / forfait)
  if (body.ptsVictoire !== undefined)
    update.ptsVictoire = Number(body.ptsVictoire) || 0;
  if (body.ptsNul !== undefined) update.ptsNul = Number(body.ptsNul) || 0;
  if (body.ptsDefaite !== undefined)
    update.ptsDefaite = Number(body.ptsDefaite) || 0;
  if (body.ptsForfait !== undefined)
    update.ptsForfait = Number(body.ptsForfait) || 0;

  const [updated] = await db
    .update(championships)
    .set(update)
    .where(eq(championships.id, cid))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
  }
  const { id } = await params;
  const cid = Number(id);
  await db.delete(championships).where(eq(championships.id, cid));
  return NextResponse.json({ ok: true });
}
