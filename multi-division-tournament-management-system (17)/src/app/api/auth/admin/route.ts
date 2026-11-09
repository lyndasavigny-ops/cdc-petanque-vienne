import { NextResponse } from "next/server";
import { isMainAdmin, updateAdminCreds, ADMIN_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Modification de l'identifiant / code du compte principal
// (réservé au compte principal lui-même)
export async function PATCH(req: Request) {
  if (!(await isMainAdmin())) {
    return NextResponse.json(
      { error: "Seul le compte principal peut modifier ces identifiants." },
      { status: 401 },
    );
  }
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
  await updateAdminCreds(identifiant, code);
  const res = NextResponse.json({ ok: true, token: code });
  res.cookies.set(ADMIN_COOKIE, code, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return res;
}
