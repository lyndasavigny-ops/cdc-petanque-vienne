import { db } from "@/db";
import { rencontres, championships, journees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { TOTAL_POINTS, FORFAIT_SCORE, partiesMax } from "@/lib/cdc";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const rid = Number(id);
  const body = await req.json().catch(() => ({}));

  // Autorisation : organisateur (cookie/jeton) OU club référent avec le
  // code de saisie de la poule ET l'appareil autorisé.
  const admin = await isAdmin();
  if (!admin) {
    const code = String(body.code ?? "")
      .trim()
      .toUpperCase();
    const device = String(body.device ?? "").trim();
    if (!code) {
      return NextResponse.json(
        { error: "Accès refusé : code de saisie requis." },
        { status: 401 },
      );
    }
    const [renc] = await db
      .select()
      .from(rencontres)
      .where(eq(rencontres.id, rid));
    if (!renc) {
      return NextResponse.json({ error: "Rencontre introuvable." }, { status: 404 });
    }
    const [champ] = await db
      .select()
      .from(championships)
      .where(eq(championships.id, renc.championshipId));
    if (!champ || champ.codeSaisie.toUpperCase() !== code) {
      return NextResponse.json(
        { error: "Code de saisie invalide pour cette poule." },
        { status: 401 },
      );
    }
    // Vérification de l'appareil autorisé
    if (champ.deviceLock && champ.deviceLock !== device) {
      return NextResponse.json(
        {
          error:
            "Saisie refusée : ce code est réservé à l'appareil du club référent.",
        },
        { status: 403 },
      );
    }
    // Journée validée = verrouillée pour les clubs
    const [j] = await db
      .select()
      .from(journees)
      .where(eq(journees.id, renc.journeeId));
    if (j?.validee) {
      return NextResponse.json(
        {
          error:
            "Journée validée : les scores sont verrouillés. Contactez l'organisateur pour toute correction.",
        },
        { status: 403 },
      );
    }
  }

  const forfaitA = Boolean(body.forfaitA);
  const forfaitB = Boolean(body.forfaitB);

  // Réinitialisation (effacer la saisie)
  if (body.reset) {
    const [updated] = await db
      .update(rencontres)
      .set({
        scoreA: null,
        scoreB: null,
        forfaitA: false,
        forfaitB: false,
        saisi: false,
        partiesA: null,
        partiesB: null,
      })
      .where(eq(rencontres.id, rid))
      .returning();
    return NextResponse.json(updated);
  }

  let scoreA = body.scoreA === null || body.scoreA === "" ? null : Number(body.scoreA);
  let scoreB = body.scoreB === null || body.scoreB === "" ? null : Number(body.scoreB);

  // En cas de forfait, les scores sont imposés : 19 à 0 pour le vainqueur
  // (3 points avec un point average de +19 — règlement CDC).
  if (forfaitA && !forfaitB) {
    scoreA = 0;
    scoreB = FORFAIT_SCORE;
  } else if (forfaitB && !forfaitA) {
    scoreA = FORFAIT_SCORE;
    scoreB = 0;
  } else if (forfaitA && forfaitB) {
    scoreA = 0;
    scoreB = 0;
  } else {
    // Validation : les deux scores doivent faire 36 au total.
    if (scoreA === null || scoreB === null) {
      return NextResponse.json(
        { error: "Veuillez saisir les deux scores." },
        { status: 400 },
      );
    }
    if (
      !Number.isInteger(scoreA) ||
      !Number.isInteger(scoreB) ||
      scoreA < 0 ||
      scoreB < 0 ||
      scoreA > TOTAL_POINTS ||
      scoreB > TOTAL_POINTS
    ) {
      return NextResponse.json(
        { error: `Chaque score doit être un entier entre 0 et ${TOTAL_POINTS}.` },
        { status: 400 },
      );
    }
    if (scoreA + scoreB !== TOTAL_POINTS) {
      return NextResponse.json(
        {
          error: `Le total des deux scores doit faire ${TOTAL_POINTS} (actuellement ${
            scoreA + scoreB
          }).`,
        },
        { status: 400 },
      );
    }
  }

  // Parties gagnées (optionnel, critère 4 Article 12) :
  // Pétanque : total ≤ 11 (6 TT + 3 D + 2 T) · Provençal : total ≤ 4 (2 D + 2 T)
  const [rencForType] = await db
    .select()
    .from(rencontres)
    .where(eq(rencontres.id, rid));
  let maxParties = 11;
  let formatLabel = "11 (6 TT + 3 D + 2 T)";
  if (rencForType) {
    const [champType] = await db
      .select()
      .from(championships)
      .where(eq(championships.id, rencForType.championshipId));
    if (champType) {
      maxParties = partiesMax(champType.typeCdc);
      formatLabel =
        maxParties === 4 ? "4 (2 D + 2 T — Jeu Provençal)" : "11 (6 TT + 3 D + 2 T)";
    }
  }
  let partiesA: number | null = null;
  let partiesB: number | null = null;
  if (body.partiesA !== undefined && body.partiesA !== null && body.partiesA !== "") {
    partiesA = Math.max(0, Math.min(maxParties, Number(body.partiesA) || 0));
  }
  if (body.partiesB !== undefined && body.partiesB !== null && body.partiesB !== "") {
    partiesB = Math.max(0, Math.min(maxParties, Number(body.partiesB) || 0));
  }
  if (partiesA !== null && partiesB !== null && partiesA + partiesB > maxParties) {
    return NextResponse.json(
      { error: `Parties gagnées : le total ne peut pas dépasser ${formatLabel}.` },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(rencontres)
    .set({
      scoreA,
      scoreB,
      forfaitA,
      forfaitB,
      saisi: true,
      partiesA,
      partiesB,
    })
    .where(eq(rencontres.id, rid))
    .returning();

  return NextResponse.json(updated);
}
