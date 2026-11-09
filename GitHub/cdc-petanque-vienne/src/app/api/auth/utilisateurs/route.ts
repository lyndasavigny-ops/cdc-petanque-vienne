import { db } from "@/db";
import { appUsers } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isMainAdmin, getAdminCreds } from "@/lib/auth";
import { ensureSchema } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

// Liste des co-organisateurs — compte principal uniquement
export async function GET() {
  if (!(await isMainAdmin())) {
    return NextResponse.json(
      { error: "Réservé au compte principal." },
      { status: 401 },
    );
  }
  await ensureSchema();
  const rows = await db
    .select({
      id: appUsers.id,
      identifiant: appUsers.identifiant,
      createdAt: appUsers.createdAt,
    })
    .from(appUsers)
    .orderBy(asc(appUsers.id));
  return NextResponse.json(rows);
}

// Ajout d'un co-organisateur — compte principal uniquement
export async function POST(req: Request) {
  if (!(await isMainAdmin())) {
    return NextResponse.json(
      { error: "Réservé au compte principal." },
      { status: 401 },
    );
  }
  await ensureSchema();
  const body = await req.json().catch(() => ({}));
  const identifiant = String(body.identifiant ?? "").trim();
  const code = String(body.code ?? "").trim();

  if (identifiant.length < 3 || code.length < 4) {
    return NextResponse.json(
      {
        error:
          "Identifiant : 3 caractères minimum. Code : 4 caractères minimum.",
      },
      { status: 400 },
    );
  }

  // Le code doit être unique (il sert de jeton de connexion)
  const creds = await getAdminCreds();
  if (code === creds.code) {
    return NextResponse.json(
      { error: "Ce code est déjà utilisé par le compte principal." },
      { status: 400 },
    );
  }
  const existing = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.code, code));
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Ce code est déjà utilisé par un autre utilisateur." },
      { status: 400 },
    );
  }

  const [created] = await db
    .insert(appUsers)
    .values({ identifiant, code })
    .returning({
      id: appUsers.id,
      identifiant: appUsers.identifiant,
      createdAt: appUsers.createdAt,
    });
  return NextResponse.json(created, { status: 201 });
}
