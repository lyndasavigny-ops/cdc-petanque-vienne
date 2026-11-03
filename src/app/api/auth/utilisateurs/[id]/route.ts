import { db } from "@/db";
import { appUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isMainAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Suppression d'un co-organisateur — compte principal uniquement
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isMainAdmin())) {
    return NextResponse.json(
      { error: "Réservé au compte principal." },
      { status: 401 },
    );
  }
  const { id } = await params;
  await db.delete(appUsers).where(eq(appUsers.id, Number(id)));
  return NextResponse.json({ ok: true });
}
