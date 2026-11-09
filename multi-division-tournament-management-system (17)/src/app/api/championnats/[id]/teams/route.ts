import { db } from "@/db";
import { teams } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Remplace la liste des équipes en conservant les ids par numéro
// (permet de renommer une équipe sans casser le tirage déjà effectué).
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
  }
  const { id } = await params;
  const cid = Number(id);
  const body = await req.json().catch(() => ({}));
  const list: { numero: number; nom: string }[] = Array.isArray(body.teams)
    ? body.teams
    : [];

  const cleaned = list
    .map((t) => ({ numero: Number(t.numero), nom: String(t.nom ?? "").trim() }))
    .filter((t) => t.nom.length > 0);

  const existing = await db
    .select()
    .from(teams)
    .where(eq(teams.championshipId, cid));
  const byNumero = new Map(existing.map((t) => [t.numero, t]));

  const keepNumeros = new Set(cleaned.map((t) => t.numero));

  // suppression des équipes retirées (cascade sur rencontres)
  const toDelete = existing
    .filter((t) => !keepNumeros.has(t.numero))
    .map((t) => t.id);
  if (toDelete.length > 0) {
    await db.delete(teams).where(inArray(teams.id, toDelete));
  }

  for (const t of cleaned) {
    const ex = byNumero.get(t.numero);
    if (ex) {
      if (ex.nom !== t.nom) {
        await db.update(teams).set({ nom: t.nom }).where(eq(teams.id, ex.id));
      }
    } else {
      await db
        .insert(teams)
        .values({ championshipId: cid, numero: t.numero, nom: t.nom });
    }
  }

  const rows = await db
    .select()
    .from(teams)
    .where(eq(teams.championshipId, cid))
    .orderBy(asc(teams.numero));
  return NextResponse.json(rows);
}
