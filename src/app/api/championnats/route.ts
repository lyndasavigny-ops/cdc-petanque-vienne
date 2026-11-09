import { db } from "@/db";
import { championships } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select()
    .from(championships)
    .orderBy(desc(championships.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const saison = String(body.saison ?? "").trim() || String(body.annee ?? 2025);
  const annee = Number(body.annee) || 2025;
  const typeCdc = String(body.typeCdc ?? "Senior");
  const division = Number(body.division) || 1;
  const poule = String(body.poule ?? "A");
  const format = String(body.format ?? "Doublettes");
  const adminCode = "ADM-" + Math.random().toString(36).slice(2, 8).toUpperCase();

  const [created] = await db
    .insert(championships)
    .values({ saison, annee, typeCdc, division, poule, format, adminCode })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
