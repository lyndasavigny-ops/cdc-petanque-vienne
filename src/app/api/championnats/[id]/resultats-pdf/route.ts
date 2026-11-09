import { db } from "@/db";
import { championships, teams, journees, rencontres } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { computeClassement, baremeOf } from "@/lib/classement";
import { championshipName, isProvencal } from "@/lib/cdc";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";

const GREEN = "#047857";
const DARK = "#1e293b";
const GRAY = "#475569";
const LIGHT = "#f1f5f9";

// PDF officiel « Résultats & Classement » — réservé aux organisateurs.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Accès réservé à l'organisateur." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const cid = Number(id);

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

  const teamsById = new Map(teamRows.map((t) => [t.id, t]));
  const label = (tid: number | null) => {
    if (!tid) return "— Exempt —";
    const t = teamsById.get(tid);
    return t ? `${String(t.numero).padStart(2, "0")}-${t.nom}` : "?";
  };

  const bareme = baremeOf(champ);
  const lignes = computeClassement(teamRows, rencontreRows, bareme);
  const nbSaisies = rencontreRows.filter((r) => r.saisi).length;

  // --- Génération du PDF ---
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 46, bottom: 46, left: 40, right: 40 },
  });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const pageW = 595.28;
  const left = 40;
  const tableW = pageW - 80;

  // En-tête
  doc.rect(0, 0, pageW, 92).fill(GREEN);
  doc
    .fillColor("white")
    .font("Helvetica-Bold")
    .fontSize(18)
    .text(`${championshipName(champ)} — Saison ${champ.saison}`, left, 20);
  doc
    .font("Helvetica")
    .fontSize(10)
    .text(
      `Comité départemental de la Vienne (86) · FFPJP · ${champ.typeCdc} · ${teamRows.length} équipes · ${nbSaisies} rencontre(s) jouée(s)`,
      left,
      46,
    );
  doc
    .fontSize(8)
    .text(
      `Document officiel édité le ${new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })} — réservé à l'organisation`,
      left,
      64,
    );
  doc.y = 110;
  doc.x = left;

  // ---- CLASSEMENT ----
  doc
    .fillColor(GREEN)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("CLASSEMENT", left, doc.y);
  doc
    .moveTo(left, doc.y + 2)
    .lineTo(left + tableW, doc.y + 2)
    .strokeColor(GREEN)
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.4);

  // Largeurs des colonnes du classement
  const cols = [
    { label: "Clt", w: 30 },
    { label: "Équipe", w: 160 },
    { label: "Joués", w: 38 },
    { label: "Pts", w: 32 },
    { label: "G", w: 26 },
    { label: "N", w: 26 },
    { label: "P", w: 26 },
    { label: "Forf.", w: 32 },
    { label: "Pour", w: 36 },
    { label: "Contre", w: 42 },
    { label: "Diff.", w: 40 },
  ];
  const rowH = 20;

  function classementHeader(y: number) {
    doc.rect(left, y, tableW, rowH).fill(GREEN);
    let x = left;
    doc.fillColor("white").font("Helvetica-Bold").fontSize(9);
    for (const c of cols) {
      doc.text(c.label, x + 3, y + 6, { width: c.w - 6, align: c.label === "Équipe" ? "left" : "center" });
      x += c.w;
    }
    return y + rowH;
  }

  let y = classementHeader(doc.y);
  lignes.forEach((l, i) => {
    if (i % 2 === 0) {
      doc.rect(left, y, tableW, rowH).fill(LIGHT);
    }
    if (i === 0) {
      doc.rect(left, y, tableW, rowH).fill("#fef3c7"); // 1er en doré
    }
    const vals = [
      `${i + 1}${i === 0 ? "er" : "e"}`,
      `${String(l.numero).padStart(2, "0")}-${l.nom}`,
      String(l.joues),
      String(l.pointsTotal),
      String(l.gagnes),
      String(l.nuls),
      String(l.perdus),
      String(l.forfaits),
      String(l.pointsPour),
      String(l.pointsContre),
      `${l.difference > 0 ? "+" : ""}${l.difference}`,
    ];
    let x = left;
    vals.forEach((v, idx) => {
      doc
        .fillColor(idx === 3 ? GREEN : DARK)
        .font(idx === 1 || idx === 3 ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9)
        .text(v, x + 3, y + 6, {
          width: cols[idx].w - 6,
          align: idx === 1 ? "left" : "center",
        });
      x += cols[idx].w;
    });
    y += rowH;
  });
  // Cadre du tableau
  doc
    .rect(left, y - rowH * lignes.length - rowH, tableW, rowH * (lignes.length + 1))
    .strokeColor(DARK)
    .lineWidth(0.8)
    .stroke();

  doc.y = y + 8;
  doc
    .fillColor(GRAY)
    .font("Helvetica-Oblique")
    .fontSize(8)
    .text(
      `Victoire ${bareme.victoire} pts · Nul ${bareme.nul} pts · Défaite ${bareme.defaite} pt · Forfait ${bareme.forfait} pt — victoire par forfait : 19 à 0. Classement selon l'Article 12 FFPJP : points, puis confrontation directe (égalité à 2) ou mini-classement des oppositions (égalité à 3+), puis point average général, puis parties gagnées sur ${isProvencal(champ.typeCdc) ? "4 (Jeu Provençal : 2 D + 2 T, chaque partie = 9 pts)" : "11 (6 TT + 3 D + 2 T)"}.`,
      left,
      doc.y,
    );
  doc.moveDown(1);

  // ---- SCORES PAR JOURNÉE ----
  doc
    .fillColor(GREEN)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("SCORES PAR JOURNÉE", left, doc.y);
  doc
    .moveTo(left, doc.y + 2)
    .lineTo(left + tableW, doc.y + 2)
    .strokeColor(GREEN)
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.5);

  const scoreRowH = 18;
  for (const j of journeeRows) {
    const rs = rencontreRows.filter((r) => r.journeeId === j.id);
    const blockH = scoreRowH * (rs.length + 1) + 8;

    // Saut de page si le bloc ne tient pas
    if (doc.y + blockH > 780) {
      doc.addPage();
      doc.y = 46;
    }

    const by = doc.y;
    // Bandeau journée
    doc.rect(left, by, tableW, scoreRowH).fill("#bae6fd");
    let titre = `Journée ${j.numero}`;
    if (j.lieu) titre += ` — ${j.lieu}`;
    if (j.dateRencontre) titre += ` le ${j.dateRencontre}`;
    if (j.heure) titre += ` à ${j.heure}`;
    if (j.validee) titre += "   ✓ VALIDÉE";
    doc
      .fillColor(DARK)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(titre, left + 6, by + 5, { width: tableW - 12 });

    let ry = by + scoreRowH;
    for (const r of rs) {
      const exempt = !r.teamAId || !r.teamBId;
      const sA = r.saisi && r.scoreA != null ? String(r.scoreA) : "";
      const sB = r.saisi && r.scoreB != null ? String(r.scoreB) : "";
      const winA = r.saisi && (r.scoreA ?? 0) > (r.scoreB ?? 0);
      const winB = r.saisi && (r.scoreB ?? 0) > (r.scoreA ?? 0);

      doc
        .rect(left, ry, tableW, scoreRowH)
        .strokeColor("#cbd5e1")
        .lineWidth(0.5)
        .stroke();

      if (exempt) {
        doc
          .fillColor(GRAY)
          .font("Helvetica-Oblique")
          .fontSize(8.5)
          .text(
            `${label(r.teamAId ?? r.teamBId)} — exempt`,
            left + 6,
            ry + 5,
            { width: tableW - 12 },
          );
      } else {
        const halfW = (tableW - 70) / 2;
        doc
          .fillColor(DARK)
          .font(winA ? "Helvetica-Bold" : "Helvetica")
          .fontSize(8.5)
          .text(label(r.teamAId), left + 6, ry + 5, {
            width: halfW - 10,
            align: "left",
          });
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .text(sA, left + halfW, ry + 5, { width: 25, align: "center" });
        doc
          .font("Helvetica")
          .text("-", left + halfW + 25, ry + 5, { width: 20, align: "center" });
        doc
          .font("Helvetica-Bold")
          .text(sB, left + halfW + 45, ry + 5, { width: 25, align: "center" });
        doc
          .font(winB ? "Helvetica-Bold" : "Helvetica")
          .fontSize(8.5)
          .text(label(r.teamBId), left + halfW + 80, ry + 5, {
            width: tableW - halfW - 86,
            align: "right",
          });
        if (r.forfaitA || r.forfaitB) {
          doc
            .fillColor("#dc2626")
            .fontSize(7)
            .text("(forfait)", left + halfW, ry + 12, {
              width: 70,
              align: "center",
            });
        }
      }
      ry += scoreRowH;
    }
    doc.y = ry + 8;
  }

  // Pied de page
  doc
    .fillColor("#94a3b8")
    .font("Helvetica-Oblique")
    .fontSize(7.5)
    .text(
      "Comité de la Vienne · 1 Rue de la Poste, 86500 Saint Julien l'Ars — document généré automatiquement par le site CDC Pétanque",
      left,
      800,
      { width: tableW, align: "center" },
    );

  doc.end();
  const buffer = await done;

  const fileName = `resultats-CDC${champ.division}-Poule${champ.poule}-${champ.saison}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
