import { db } from "@/db";
import { championships, teams, players } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { ensureSchema } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

function norm(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Violations : un joueur inscrit dans plusieurs équipes ne peut pas jouer
// dans une équipe de division inférieure ou égale à la sienne.
async function computeViolations(annee: number, typeCdc: string) {
  const rows = await db
    .select({
      nom: players.nom,
      prenom: players.prenom,
      teamNom: teams.nom,
      division: championships.division,
      poule: championships.poule,
    })
    .from(players)
    .innerJoin(teams, eq(players.teamId, teams.id))
    .innerJoin(championships, eq(teams.championshipId, championships.id))
    .where(eq(championships.annee, annee));

  const filtered = rows.filter(
    (r) =>
      r.nom.trim() !== "" &&
      r.prenom.trim() !== "",
  );
  void typeCdc;

  const byPlayer = new Map<string, typeof filtered>();
  for (const r of filtered) {
    const key = norm(r.nom) + "|" + norm(r.prenom);
    if (!byPlayer.has(key)) byPlayer.set(key, []);
    byPlayer.get(key)!.push(r);
  }

  const violations: string[] = [];
  for (const list of byPlayer.values()) {
    if (list.length < 2) continue;
    const minDiv = Math.min(...list.map((l) => l.division));
    const problematic = list.filter(
      (l, idx) =>
        l.division > minDiv ||
        list.findIndex((x) => x.division === l.division) !== idx,
    );
    // doublon strict même division OU inscription en division inférieure
    const sameDivCount = list.filter((l) => l.division === minDiv).length;
    if (problematic.length > 0 || sameDivCount > 1) {
      const detail = list
        .map((l) => `${l.teamNom} (CDC${l.division} ${l.poule})`)
        .join(" + ");
      violations.push(
        `${list[0].nom.toUpperCase()} ${list[0].prenom} : inscrit dans ${detail} — interdit de jouer en division inférieure ou égale à la sienne.`,
      );
    }
  }
  return violations;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Réservé à l'organisateur." }, { status: 401 });
  }
  await ensureSchema();
  const { id } = await params;
  const cid = Number(id);

  const [champ] = await db
    .select()
    .from(championships)
    .where(eq(championships.id, cid));
  if (!champ) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const teamRows = await db
    .select()
    .from(teams)
    .where(eq(teams.championshipId, cid))
    .orderBy(asc(teams.numero));
  const ids = teamRows.map((t) => t.id);
  const playerRows = ids.length
    ? await db
        .select()
        .from(players)
        .where(inArray(players.teamId, ids))
        .orderBy(asc(players.ordre))
    : [];

  const violations = await computeViolations(champ.annee, champ.typeCdc);

  return NextResponse.json({ teams: teamRows, players: playerRows, violations });
}

// Remplace les listes de joueurs du championnat
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Réservé à l'organisateur." }, { status: 401 });
  }
  await ensureSchema();
  const { id } = await params;
  const cid = Number(id);
  const body = await req.json().catch(() => ({}));
  const list: { teamId: number; ordre: number; nom: string; prenom: string; licence?: string }[] =
    Array.isArray(body.players) ? body.players : [];

  const teamRows = await db
    .select()
    .from(teams)
    .where(eq(teams.championshipId, cid));
  const validIds = new Set(teamRows.map((t) => t.id));

  if (validIds.size > 0) {
    await db.delete(players).where(inArray(players.teamId, [...validIds]));
  }
  for (const p of list) {
    if (!validIds.has(Number(p.teamId))) continue;
    const nom = String(p.nom ?? "").trim();
    const prenom = String(p.prenom ?? "").trim();
    if (!nom && !prenom) continue;
    await db.insert(players).values({
      teamId: Number(p.teamId),
      ordre: Math.max(1, Math.min(8, Number(p.ordre) || 1)),
      nom,
      prenom,
      licence: String(p.licence ?? "").trim(),
    });
  }

  const [champ] = await db
    .select()
    .from(championships)
    .where(eq(championships.id, cid));
  const violations = champ
    ? await computeViolations(champ.annee, champ.typeCdc)
    : [];

  return NextResponse.json({ ok: true, violations });
}
