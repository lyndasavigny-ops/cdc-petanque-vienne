import { db } from "@/db";
import {
  championships,
  teams,
  journees,
  rencontres,
} from "@/db/schema";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { ensureSchema } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

// Export complet des données en un fichier JSON téléchargeable.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
  }
  await ensureSchema();

  const [champs, teamRows, journeeRows, rencontreRows] = await Promise.all([
    db.select().from(championships),
    db.select().from(teams),
    db.select().from(journees),
    db.select().from(rencontres),
  ]);

  const backup = {
    application: "CDC Pétanque Vienne 86",
    version: 1,
    date: new Date().toISOString(),
    championships: champs,
    teams: teamRows,
    journees: journeeRows,
    rencontres: rencontreRows,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="sauvegarde-cdc-${date}.json"`,
    },
  });
}
