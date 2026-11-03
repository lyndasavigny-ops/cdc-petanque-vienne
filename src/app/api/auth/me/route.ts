import { NextResponse } from "next/server";
import { isAdmin, isMainAdmin, getAdminCreds } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ admin: false });
  }
  const main = await isMainAdmin();
  const creds = await getAdminCreds();
  return NextResponse.json({
    admin: true,
    principal: main,
    identifiant: main ? creds.identifiant : undefined,
  });
}
