import { db } from "@/db";
import {
  championships,
  teams,
  journees,
  rencontres,
  type Championship,
  type Team,
  type Journee,
  type Rencontre,
} from "@/db/schema";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { ensureSchema } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

// Restauration complète depuis un fichier de sauvegarde JSON.
// ATTENTION : remplace toutes les données actuelles.
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
  }
  await ensureSchema();

  let backup: {
    championships?: Championship[];
    teams?: Team[];
    journees?: Journee[];
    rencontres?: Rencontre[];
  };
  try {
    backup = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Fichier illisible : ce n'est pas une sauvegarde valide." },
      { status: 400 },
    );
  }

  if (!Array.isArray(backup.championships)) {
    return NextResponse.json(
      {
        error:
          "Ce fichier ne ressemble pas à une sauvegarde CDC (championnats manquants).",
      },
      { status: 400 },
    );
  }

  // On remplace tout (l'ordre respecte les dépendances).
  await db.delete(rencontres);
  await db.delete(journees);
  await db.delete(teams);
  await db.delete(championships);

  for (const c of backup.championships) {
    await db.insert(championships).values({
      id: c.id,
      saison: c.saison,
      annee: c.annee,
      typeCdc: c.typeCdc,
      division: c.division,
      poule: c.poule,
      codeSaisie: c.codeSaisie ?? "",
      createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
    });
  }
  for (const t of backup.teams ?? []) {
    await db.insert(teams).values({
      id: t.id,
      championshipId: t.championshipId,
      numero: t.numero,
      nom: t.nom,
    });
  }
  for (const j of backup.journees ?? []) {
    await db.insert(journees).values({
      id: j.id,
      championshipId: j.championshipId,
      numero: j.numero,
      lieu: j.lieu ?? "",
      dateRencontre: j.dateRencontre ?? "",
      heure: j.heure ?? "",
    });
  }
  for (const r of backup.rencontres ?? []) {
    await db.insert(rencontres).values({
      id: r.id,
      championshipId: r.championshipId,
      journeeId: r.journeeId,
      ordre: r.ordre,
      teamAId: r.teamAId,
      teamBId: r.teamBId,
      scoreA: r.scoreA,
      scoreB: r.scoreB,
      forfaitA: r.forfaitA ?? false,
      forfaitB: r.forfaitB ?? false,
      saisi: r.saisi ?? false,
    });
  }

  // Resynchroniser les compteurs d'identifiants après insertion avec id explicites
  const { sql } = await import("drizzle-orm");
  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('championships','id'), COALESCE((SELECT MAX(id) FROM championships), 1))`,
  );
  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('teams','id'), COALESCE((SELECT MAX(id) FROM teams), 1))`,
  );
  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('journees','id'), COALESCE((SELECT MAX(id) FROM journees), 1))`,
  );
  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('rencontres','id'), COALESCE((SELECT MAX(id) FROM rencontres), 1))`,
  );

  return NextResponse.json({
    ok: true,
    championnats: backup.championships.length,
    equipes: (backup.teams ?? []).length,
    rencontres: (backup.rencontres ?? []).length,
  });
}
