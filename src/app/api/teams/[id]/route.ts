import { db } from "@/db";
import { teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Permet à l'admin de saisir le classement final manuel d'une équipe.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tid = Number(id);
  const body = await req.json().catch(() => ({}));

  let valeur: number | null = null;
  if (body.classementFinal === null || body.classementFinal === "") {
    valeur = null;
  } else {
    const n = Number(body.classementFinal);
    valeur = Number.isInteger(n) && n > 0 ? n : null;
  }

  const [updated] = await db
    .update(teams)
    .set({ classementFinal: valeur })
    .where(eq(teams.id, tid))
    .returning();

  return NextResponse.json({ ok: true, classementFinal: updated.classementFinal });
}
