import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Seul le compte admin (master) peut gérer les utilisateurs.
function isAdmin(body: Record<string, unknown>, url: URL): boolean {
  const ident = String(
    body.adminIdent ?? url.searchParams.get("adminIdent") ?? "",
  )
    .trim()
    .toUpperCase();
  const code = String(
    body.adminCode ?? url.searchParams.get("adminCode") ?? "",
  )
    .trim()
    .toUpperCase();
  const masterIdent = (process.env.MASTER_IDENT || "admin").toUpperCase();
  const masterCode = (process.env.MASTER_CODE || "vienne86").toUpperCase();
  return ident === masterIdent && code === masterCode;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!isAdmin({}, url)) {
    return NextResponse.json({ error: "Accès réservé à l'administrateur." }, { status: 403 });
  }
  const rows = await db.select().from(users);
  return NextResponse.json(
    rows.map((u) => ({ id: u.id, identifiant: u.identifiant, nom: u.nom })),
  );
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  if (!isAdmin(body, url)) {
    return NextResponse.json({ error: "Accès réservé à l'administrateur." }, { status: 403 });
  }
  const identifiant = String(body.identifiant ?? "").trim().toUpperCase();
  const nom = String(body.nom ?? "").trim();
  const code = String(body.code ?? "").trim().toUpperCase();
  if (!identifiant || !code) {
    return NextResponse.json(
      { error: "Identifiant et mot de passe obligatoires." },
      { status: 400 },
    );
  }
  const [created] = await db
    .insert(users)
    .values({ identifiant, nom, code })
    .returning();
  return NextResponse.json(
    { id: created.id, identifiant: created.identifiant, nom: created.nom },
    { status: 201 },
  );
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  if (!isAdmin(body, url)) {
    return NextResponse.json({ error: "Accès réservé à l'administrateur." }, { status: 403 });
  }
  const id = Number(body.id ?? url.searchParams.get("id"));
  await db.delete(users).where(eq(users.id, id));
  return NextResponse.json({ ok: true });
}
