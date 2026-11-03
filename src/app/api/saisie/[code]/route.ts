import { db } from "@/db";
import { championships, teams, journees, rencontres } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

// Accès club : données de la poule correspondant au code de saisie.
// Sécurité : le code est verrouillé sur le PREMIER appareil qui l'utilise
// (paramètre ?device=xxx). Les autres appareils sont refusés tant que
// l'organisateur n'a pas réinitialisé le verrou.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  await ensureSchema();
  const { code } = await params;
  const cleaned = String(code).trim().toUpperCase();
  if (!cleaned) {
    return NextResponse.json({ error: "Code requis." }, { status: 400 });
  }

  const url = new URL(req.url);
  const device = String(url.searchParams.get("device") ?? "").trim();

  const [champ] = await db
    .select()
    .from(championships)
    .where(eq(championships.codeSaisie, cleaned));
  if (!champ) {
    return NextResponse.json({ error: "Code invalide." }, { status: 404 });
  }

  // Verrouillage appareil
  if (device) {
    if (!champ.deviceLock) {
      // Premier appareil : on le mémorise comme appareil autorisé.
      await db
        .update(championships)
        .set({ deviceLock: device })
        .where(eq(championships.id, champ.id));
      champ.deviceLock = device;
    } else if (champ.deviceLock !== device) {
      return NextResponse.json(
        {
          error:
            "Ce code est déjà utilisé sur un autre appareil (celui du club référent). " +
            "Pour changer d'appareil, demandez à l'organisateur de réinitialiser l'accès.",
        },
        { status: 403 },
      );
    }
  }

  const [teamRows, journeeRows, rencontreRows] = await Promise.all([
    db
      .select()
      .from(teams)
      .where(eq(teams.championshipId, champ.id))
      .orderBy(asc(teams.numero)),
    db
      .select()
      .from(journees)
      .where(eq(journees.championshipId, champ.id))
      .orderBy(asc(journees.numero)),
    db
      .select()
      .from(rencontres)
      .where(eq(rencontres.championshipId, champ.id))
      .orderBy(asc(rencontres.ordre)),
  ]);

  // Ne jamais exposer le verrou lui-même
  const { deviceLock, ...publicChamp } = champ;
  void deviceLock;

  return NextResponse.json({
    championship: publicChamp,
    teams: teamRows,
    journees: journeeRows,
    rencontres: rencontreRows,
  });
}
