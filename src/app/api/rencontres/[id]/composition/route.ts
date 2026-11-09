import { db } from "@/db";
import { rencontres } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const rid = Number(id);
  const body = await req.json().catch(() => ({}));

  const [current] = await db
    .select()
    .from(rencontres)
    .where(eq(rencontres.id, rid));
  if (!current) {
    return NextResponse.json({ error: "Rencontre introuvable" }, { status: 404 });
  }

  // Effectif complet de la feuille de composition (jusqu'à 10 licenciés).
  const MAX_EFFECTIF = 10;

  const norm = (arr: unknown) =>
    Array.isArray(arr)
      ? arr.slice(0, MAX_EFFECTIF).map((p) => ({
          nom: String((p as { nom?: string })?.nom ?? ""),
          licence: String((p as { licence?: string })?.licence ?? ""),
        }))
      : [];

  const update: Record<string, unknown> = {};
  if (body.compositionA !== undefined) update.compositionA = norm(body.compositionA);
  if (body.compositionB !== undefined) update.compositionB = norm(body.compositionB);

  const [updated] = await db
    .update(rencontres)
    .set(update)
    .where(eq(rencontres.id, rid))
    .returning();

  return NextResponse.json(updated);
}
