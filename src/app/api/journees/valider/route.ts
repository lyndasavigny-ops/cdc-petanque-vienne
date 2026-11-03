import { db } from "@/db";
import { journees, rencontres, championships } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { ensureSchema } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

// Validation définitive d'une journée par le club référent (ou l'admin),
// et déverrouillage par l'admin uniquement.
export async function POST(req: Request) {
  await ensureSchema();
  const body = await req.json().catch(() => ({}));
  const journeeId = Number(body.journeeId);
  const unlock = Boolean(body.unlock);

  const [journee] = await db
    .select()
    .from(journees)
    .where(eq(journees.id, journeeId));
  if (!journee) {
    return NextResponse.json({ error: "Journée introuvable." }, { status: 404 });
  }

  const admin = await isAdmin();

  // Déverrouillage : admin uniquement
  if (unlock) {
    if (!admin) {
      return NextResponse.json(
        { error: "Seul l'organisateur peut déverrouiller une journée." },
        { status: 401 },
      );
    }
    const [updated] = await db
      .update(journees)
      .set({ validee: false })
      .where(eq(journees.id, journeeId))
      .returning();
    return NextResponse.json(updated);
  }

  // Validation : admin OU club référent (code + appareil autorisé)
  if (!admin) {
    const code = String(body.code ?? "").trim().toUpperCase();
    const device = String(body.device ?? "").trim();
    const [champ] = await db
      .select()
      .from(championships)
      .where(eq(championships.id, journee.championshipId));
    if (!champ || champ.codeSaisie.toUpperCase() !== code) {
      return NextResponse.json(
        { error: "Code de saisie invalide." },
        { status: 401 },
      );
    }
    if (champ.deviceLock && champ.deviceLock !== device) {
      return NextResponse.json(
        { error: "Validation réservée à l'appareil du club référent." },
        { status: 403 },
      );
    }
  }

  // Toutes les rencontres (hors exempt) doivent être saisies
  const rs = await db
    .select()
    .from(rencontres)
    .where(and(eq(rencontres.journeeId, journeeId)));
  const aJouer = rs.filter((r) => r.teamAId && r.teamBId);
  const manquantes = aJouer.filter((r) => !r.saisi);
  if (manquantes.length > 0) {
    return NextResponse.json(
      {
        error: `Impossible de valider : ${manquantes.length} rencontre(s) sans score.`,
      },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(journees)
    .set({ validee: true })
    .where(eq(journees.id, journeeId))
    .returning();
  return NextResponse.json(updated);
}
