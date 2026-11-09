import { db } from "@/db";
import { scans } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { ensureSchema } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

// Liste des scans d'une poule (sans les données) — organisateur uniquement
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Réservé à l'organisateur." }, { status: 401 });
  }
  await ensureSchema();
  const { id } = await params;
  const rows = await db
    .select({
      id: scans.id,
      journeeId: scans.journeeId,
      filename: scans.filename,
      mimeType: scans.mimeType,
      taille: scans.taille,
      uploadedBy: scans.uploadedBy,
      createdAt: scans.createdAt,
    })
    .from(scans)
    .where(eq(scans.championshipId, Number(id)))
    .orderBy(desc(scans.createdAt));
  return NextResponse.json(rows);
}
