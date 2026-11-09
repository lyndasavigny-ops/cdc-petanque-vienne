import { db } from "@/db";
import { rencontres, championships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { TOTAL_POINTS } from "@/lib/cdc";
import { formatConfig } from "@/lib/cdc";

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

  const [champ] = await db
    .select()
    .from(championships)
    .where(eq(championships.id, current.championshipId));
  const cfg = formatConfig(champ?.format);

  // Réinitialisation (effacer la saisie)
  if (body.reset) {
    const [updated] = await db
      .update(rencontres)
      .set({
        scoreA: null,
        scoreB: null,
        partiesA: [],
        partiesB: [],
        forfaitA: false,
        forfaitB: false,
        saisi: false,
      })
      .where(eq(rencontres.id, rid))
      .returning();
    return NextResponse.json(updated);
  }

  // Verrouillage / déverrouillage (sécurité : le club ne peut plus modifier).
  if (typeof body.verrouille === "boolean") {
    const [updated] = await db
      .update(rencontres)
      .set({ verrouille: body.verrouille })
      .where(eq(rencontres.id, rid))
      .returning();
    return NextResponse.json(updated);
  }

  // Une rencontre verrouillée ne peut plus être modifiée.
  if (current.verrouille && !body.reset) {
    return NextResponse.json(
      { error: "Rencontre verrouillée : seul l'administrateur peut la modifier." },
      { status: 403 },
    );
  }

  const forfaitA = Boolean(body.forfaitA);
  const forfaitB = Boolean(body.forfaitB);

  let scoreA: number | null = null;
  let scoreB: number | null = null;
  let partiesA: number[] = [];
  let partiesB: number[] = [];

  const hasParties =
    Array.isArray(body.partiesA) && Array.isArray(body.partiesB);

  if (hasParties) {
    // Saisie détaillée par partie (feuille de match)
    partiesA = body.partiesA.map((n: unknown) => Number(n) || 0);
    partiesB = body.partiesB.map((n: unknown) => Number(n) || 0);

    if (partiesA.length !== cfg.parties || partiesB.length !== cfg.parties) {
      return NextResponse.json(
        { error: `Il doit y avoir ${cfg.parties} parties.` },
        { status: 400 },
      );
    }
    for (let i = 0; i < cfg.parties; i++) {
      const a = partiesA[i];
      const b = partiesB[i];
      if (
        !Number.isInteger(a) ||
        !Number.isInteger(b) ||
        a < 0 ||
        b < 0 ||
        a > cfg.pointsParPartie ||
        b > cfg.pointsParPartie
      ) {
        return NextResponse.json(
          {
            error: `Partie ${i + 1} : chaque score doit être entre 0 et ${
              cfg.pointsParPartie
            }.`,
          },
          { status: 400 },
        );
      }
      if (a + b !== cfg.pointsParPartie) {
        return NextResponse.json(
          {
            error: `Partie ${i + 1} : le total doit faire ${
              cfg.pointsParPartie
            } (actuellement ${a + b}).`,
          },
          { status: 400 },
        );
      }
    }
    scoreA = partiesA.reduce((x, y) => x + y, 0);
    scoreB = partiesB.reduce((x, y) => x + y, 0);
  } else {
    // Saisie du total directement (onglet Saisie)
    scoreA =
      body.scoreA === null || body.scoreA === "" ? null : Number(body.scoreA);
    scoreB =
      body.scoreB === null || body.scoreB === "" ? null : Number(body.scoreB);
  }

  // Gestion des forfaits : les scores sont imposés.
  if (forfaitA && !forfaitB) {
    scoreA = 0;
    scoreB = TOTAL_POINTS;
    partiesA = [];
    partiesB = [];
  } else if (forfaitB && !forfaitA) {
    scoreA = TOTAL_POINTS;
    scoreB = 0;
    partiesA = [];
    partiesB = [];
  } else if (forfaitA && forfaitB) {
    scoreA = 0;
    scoreB = 0;
    partiesA = [];
    partiesB = [];
  } else {
    if (scoreA === null || scoreB === null) {
      return NextResponse.json(
        { error: "Veuillez saisir les scores." },
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
        {
          error: `Chaque score doit être un entier entre 0 et ${TOTAL_POINTS}.`,
        },
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

  const [updated] = await db
    .update(rencontres)
    .set({
      scoreA,
      scoreB,
      partiesA,
      partiesB,
      forfaitA,
      forfaitB,
      saisi: true,
    })
    .where(eq(rencontres.id, rid))
    .returning();

  return NextResponse.json(updated);
}
