import { db } from "@/db";
import { championships, scans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { ensureSchema } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

const MAX_BASE64 = 11_000_000; // ~8 Mo par fichier

// Dépôt d'une feuille de match scannée (photo/PDF) :
// par l'organisateur OU le club référent (code + appareil autorisé).
export async function POST(req: Request) {
  await ensureSchema();
  const body = await req.json().catch(() => ({}));
  const championshipId = Number(body.championshipId);
  const journeeId = Number(body.journeeId);
  const filename = String(body.filename ?? "scan").slice(0, 150);
  const mimeType = String(body.mimeType ?? "application/octet-stream");
  const dataBase64 = String(body.dataBase64 ?? "");

  if (!championshipId || !journeeId || !dataBase64) {
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  }
  if (dataBase64.length > MAX_BASE64) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (8 Mo maximum). Réduisez la qualité de la photo." },
      { status: 400 },
    );
  }
  if (!/^(image\/|application\/pdf)/.test(mimeType)) {
    return NextResponse.json(
      { error: "Seules les photos et les PDF sont acceptés." },
      { status: 400 },
    );
  }

  const admin = await isAdmin();
  let uploadedBy = "organisateur";
  if (!admin) {
    const code = String(body.code ?? "").trim().toUpperCase();
    const device = String(body.device ?? "").trim();
    const [champ] = await db
      .select()
      .from(championships)
      .where(eq(championships.id, championshipId));
    if (!champ || champ.codeSaisie.toUpperCase() !== code) {
      return NextResponse.json({ error: "Code de saisie invalide." }, { status: 401 });
    }
    if (champ.deviceLock && champ.deviceLock !== device) {
      return NextResponse.json(
        { error: "Dépôt réservé à l'appareil du club référent." },
        { status: 403 },
      );
    }
    uploadedBy = "club";
  }

  const [created] = await db
    .insert(scans)
    .values({
      championshipId,
      journeeId,
      filename,
      mimeType,
      dataBase64,
      taille: Math.round((dataBase64.length * 3) / 4),
      uploadedBy,
    })
    .returning({ id: scans.id, filename: scans.filename });

  return NextResponse.json({ ok: true, scan: created }, { status: 201 });
}
