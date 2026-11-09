import { db } from "@/db";
import { championships } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isAdmin, genCodeSaisie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(championships)
    .orderBy(desc(championships.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const saison = String(body.saison ?? "").trim() || String(body.annee ?? 2025);
  const annee = Number(body.annee) || 2025;
  const typeCdc = String(body.typeCdc ?? "Senior");
  const division = Number(body.division) || 1;
  const poule = String(body.poule ?? "A");

  const [created] = await db
    .insert(championships)
    .values({
      saison,
      annee,
      typeCdc,
      division,
      poule,
      codeSaisie: genCodeSaisie(),
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
