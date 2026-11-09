import { NextResponse } from "next/server";
import { getAdminCreds, ADMIN_COOKIE } from "@/lib/auth";
import { db } from "@/db";
import { appUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureSchema } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const identifiant = String(body.identifiant ?? "").trim();
    const code = String(body.code ?? "").trim();

    await ensureSchema();
    const creds = await getAdminCreds();

    let tokenValide: string | null = null;

    // 1. Compte principal
    if (
      identifiant.toLowerCase() === creds.identifiant.toLowerCase() &&
      code === creds.code
    ) {
      tokenValide = creds.code;
    } else {
      // 2. Co-organisateur ajouté par le compte principal
      const rows = await db
        .select()
        .from(appUsers)
        .where(eq(appUsers.code, code));
      const match = rows.find(
        (u) => u.identifiant.toLowerCase() === identifiant.toLowerCase(),
      );
      if (match) tokenValide = match.code;
    }

    if (!tokenValide) {
      return NextResponse.json(
        { error: "Identifiant ou code incorrect." },
        { status: 401 },
      );
    }

    // Le jeton est renvoyé au client qui le stocke en localStorage
    // (fonctionne même si les cookies sont bloqués). Cookie en secours.
    const res = NextResponse.json({ ok: true, token: tokenValide });
    res.cookies.set(ADMIN_COOKIE, tokenValide, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 180, // 6 mois
    });
    return res;
  } catch (e) {
    console.error("Erreur login:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        error:
          "Erreur serveur lors de la connexion : " +
          msg +
          " — Ouvrez /api/diagnostic sur ce site pour un diagnostic détaillé.",
      },
      { status: 500 },
    );
  }
}
