import { db } from "@/db";
import { journees } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Met à jour les informations (lieu / date / heure) des journées existantes.
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
  const list: {
    id: number;
    lieu?: string;
    dateRencontre?: string;
    heure?: string;
  }[] = Array.isArray(body.journees) ? body.journees : [];

  for (const j of list) {
    await db
      .update(journees)
      .set({
        lieu: String(j.lieu ?? ""),
        dateRencontre: String(j.dateRencontre ?? ""),
        heure: String(j.heure ?? ""),
      })
      .where(eq(journees.id, Number(j.id)));
  }

  const rows = await db
    .select()
    .from(journees)
    .where(eq(journees.championshipId, cid))
    .orderBy(asc(journees.numero));
  return NextResponse.json(rows);
}
