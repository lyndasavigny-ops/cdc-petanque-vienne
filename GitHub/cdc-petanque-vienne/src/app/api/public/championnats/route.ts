import { db } from "@/db";
import { championships } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

// Liste publique des championnats (lecture seule, sans code de saisie)
export async function GET() {
  await ensureSchema();
  const rows = await db
    .select({
      id: championships.id,
      saison: championships.saison,
      annee: championships.annee,
      typeCdc: championships.typeCdc,
      division: championships.division,
      poule: championships.poule,
    })
    .from(championships)
    .orderBy(desc(championships.createdAt));
  return NextResponse.json(rows);
}
