import { db } from "@/db";
import {
  championships,
  teams,
  journees,
  rencontres,
  users,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cid = Number(id);
  const url = new URL(req.url);
  const ident = (url.searchParams.get("identifiant") ?? "").trim().toUpperCase();
  const code = (url.searchParams.get("code") ?? "").trim().toUpperCase();

  const [champ] = await db
    .select()
    .from(championships)
    .where(eq(championships.id, cid));
  if (!champ) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const [teamRows, journeeRows, rencontreRows] = await Promise.all([
    db
      .select()
      .from(teams)
      .where(eq(teams.championshipId, cid))
      .orderBy(asc(teams.numero)),
    db
      .select()
      .from(journees)
      .where(eq(journees.championshipId, cid))
      .orderBy(asc(journees.numero)),
    db
      .select()
      .from(rencontres)
      .where(eq(rencontres.championshipId, cid))
      .orderBy(asc(rencontres.ordre)),
  ]);

  // Résolution du rôle : identifiant + mot de passe (insensible à la casse).
  let role: "admin" | "club" | "guest" = "guest";
  let clubName = "";
  let clubTeamId: number | null = null;
  // Accès maître du comité (identifiant admin / code vienne86 par défaut).
  const MASTER_IDENT = (process.env.MASTER_IDENT || "admin").toUpperCase();
  const MASTER_PW = (process.env.MASTER_CODE || "vienne86").toUpperCase();
  const adminPw = champ.adminCode ? champ.adminCode.toUpperCase() : "";
  if (ident === MASTER_IDENT && code === MASTER_PW) {
    role = "admin"; // ouvre tous les championnats en administrateur
  } else if (adminPw && code === adminPw && (ident === "" || ident === "ADMIN")) {
    role = "admin";
  } else if (code) {
    // Utilisateur supplémentaire ajouté par l'admin ?
    const u = await db
      .select()
      .from(users)
      .where(eq(users.code, code))
      .limit(1);
    const userMatch =
      u.length > 0 &&
      (ident === "" || u[0].identifiant.toUpperCase() === ident);
    if (userMatch) {
      role = "admin";
    } else {
      const t = teamRows.find(
        (x) =>
          x.code &&
          x.code.toUpperCase() === code &&
          (ident === "" || !x.identifiant || x.identifiant.toUpperCase() === ident),
      );
      if (t) {
        role = "club";
        clubName = t.nom;
        clubTeamId = t.id;
      }
    }
  }

  const championship = role === "admin" ? champ : { ...champ, adminCode: "" };
  const safeTeams =
    role === "admin"
      ? teamRows
      : teamRows.map((t) => ({ ...t, code: "", identifiant: "" }));

  // Le public (guest) accède en lecture seule aux résultats et au classement.
  return NextResponse.json({
    role,
    clubName: role === "guest" ? "" : clubName,
    championship,
    teams: safeTeams,
    journees: journeeRows,
    rencontres:
      role === "club" && clubTeamId
        ? rencontreRows.filter(
            (r) => r.teamAId === clubTeamId || r.teamBId === clubTeamId,
          )
        : rencontreRows,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cid = Number(id);
  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (body.saison !== undefined) update.saison = String(body.saison);
  if (body.annee !== undefined) update.annee = Number(body.annee);
  if (body.typeCdc !== undefined) update.typeCdc = String(body.typeCdc);
  if (body.division !== undefined) update.division = Number(body.division);
  if (body.poule !== undefined) update.poule = String(body.poule);
  if (body.format !== undefined) update.format = String(body.format);
  if (body.ptsVictoire !== undefined) update.ptsVictoire = Number(body.ptsVictoire);
  if (body.ptsNul !== undefined) update.ptsNul = Number(body.ptsNul);
  if (body.ptsDefaite !== undefined) update.ptsDefaite = Number(body.ptsDefaite);
  if (body.ptsForfait !== undefined) update.ptsForfait = Number(body.ptsForfait);

  const [updated] = await db
    .update(championships)
    .set(update)
    .where(eq(championships.id, cid))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cid = Number(id);
  await db.delete(championships).where(eq(championships.id, cid));
  return NextResponse.json({ ok: true });
}
