import { db } from "@/db";
import { journees } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Réordonne les journées — réservé à l'organisateur.
// Body : { orders: [{ id, numero }] } — chaque numéro de 1 à N, une seule fois.
// Les rencontres, scores et scans restent attachés à leur journée :
// seul le numéro (l'ordre d'affichage) change.
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
  const orders: { id: number; numero: number }[] = Array.isArray(body.orders)
    ? body.orders
    : [];

  const existing = await db
    .select()
    .from(journees)
    .where(eq(journees.championshipId, cid))
    .orderBy(asc(journees.numero));

  if (orders.length !== existing.length) {
    return NextResponse.json(
      { error: "Il faut donner un numéro à chaque journée." },
      { status: 400 },
    );
  }

  const validIds = new Set(existing.map((j) => j.id));
  const nums = orders.map((o) => Number(o.numero));
  const n = existing.length;

  // Vérifications : ids valides, numéros 1..N sans doublon
  for (const o of orders) {
    if (!validIds.has(Number(o.id))) {
      return NextResponse.json(
        { error: "Journée inconnue dans la demande." },
        { status: 400 },
      );
    }
  }
  const uniques = new Set(nums);
  if (
    uniques.size !== n ||
    nums.some((x) => !Number.isInteger(x) || x < 1 || x > n)
  ) {
    return NextResponse.json(
      {
        error: `Chaque numéro de 1 à ${n} doit être utilisé exactement une fois (pas de doublon, pas de trou).`,
      },
      { status: 400 },
    );
  }

  // Deux passes pour éviter les collisions de numéros pendant l'échange
  for (const o of orders) {
    await db
      .update(journees)
      .set({ numero: Number(o.numero) + 1000 })
      .where(eq(journees.id, Number(o.id)));
  }
  for (const o of orders) {
    await db
      .update(journees)
      .set({ numero: Number(o.numero) })
      .where(eq(journees.id, Number(o.id)));
  }

  const rows = await db
    .select()
    .from(journees)
    .where(eq(journees.championshipId, cid))
    .orderBy(asc(journees.numero));
  return NextResponse.json(rows);
}
