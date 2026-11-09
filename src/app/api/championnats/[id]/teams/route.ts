import { db } from "@/db";
import { teams } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const gen = (p: string) =>
  p + Math.random().toString(36).slice(2, 7).toUpperCase();

type TeamInput = { numero: number; nom: string };

// Remplace la liste des équipes en conservant les ids par numéro
// (permet de renommer une équipe sans casser le tirage déjà effectué).
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cid = Number(id);
  const body = await req.json().catch(() => ({}));
  const list: TeamInput[] = Array.isArray(body.teams) ? body.teams : [];

  const cleaned = list
    .map((t) => ({ numero: Number(t.numero), nom: String(t.nom ?? "").trim() }))
    .filter((t) => t.nom.length > 0);

  const existing = await db
    .select()
    .from(teams)
    .where(eq(teams.championshipId, cid));
  const byNumero = new Map(existing.map((t) => [t.numero, t]));

  const keepNumeros = new Set(cleaned.map((t) => t.numero));

  const toDelete = existing
    .filter((t) => !keepNumeros.has(t.numero))
    .map((t) => t.id);
  if (toDelete.length > 0) {
    await db.delete(teams).where(inArray(teams.id, toDelete));
  }

  for (const t of cleaned) {
    const ex = byNumero.get(t.numero);
    if (ex) {
      const patch: Record<string, unknown> = {};
      if (ex.nom !== t.nom) patch.nom = t.nom;
      // garantit un identifiant/mot de passe pour les équipes déjà créées
      if (!ex.identifiant) patch.identifiant = gen("ORG-");
      if (!ex.code) patch.code = gen("CLB-");
      if (Object.keys(patch).length > 0) {
        await db.update(teams).set(patch).where(eq(teams.id, ex.id));
      }
    } else {
      await db.insert(teams).values({
        championshipId: cid,
        numero: t.numero,
        nom: t.nom,
        identifiant: gen("ORG-"),
        code: gen("CLB-"),
      });
    }
  }

  const rows = await db
    .select()
    .from(teams)
    .where(eq(teams.championshipId, cid))
    .orderBy(asc(teams.numero));
  return NextResponse.json(rows);
}
