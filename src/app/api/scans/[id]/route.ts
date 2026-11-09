import { db } from "@/db";
import { scans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Téléchargement d'un scan — organisateur uniquement
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Réservé à l'organisateur." }, { status: 401 });
  }
  const { id } = await params;
  const [scan] = await db
    .select()
    .from(scans)
    .where(eq(scans.id, Number(id)));
  if (!scan) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }
  const buffer = Buffer.from(scan.dataBase64, "base64");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": scan.mimeType,
      "Content-Disposition": `attachment; filename="${scan.filename}"`,
    },
  });
}

// Suppression — organisateur uniquement
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Réservé à l'organisateur." }, { status: 401 });
  }
  const { id } = await params;
  await db.delete(scans).where(eq(scans.id, Number(id)));
  return NextResponse.json({ ok: true });
}
