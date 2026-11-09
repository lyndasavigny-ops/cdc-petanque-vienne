import type { Team, Rencontre } from "@/db/schema";

export type LigneClassement = {
  teamId: number;
  numero: number;
  nom: string;
  joues: number;
  gagnes: number;
  nuls: number;
  perdus: number;
  forfaits: number;
  pointsPour: number;
  pointsContre: number;
  difference: number;
  pointsTotal: number;
  classementFinal: number | null;
};

// Barème des points — modifiable par l'administrateur.
export type Bareme = {
  victoire: number;
  nul: number;
  defaite: number;
  forfait: number;
};

export const BAREME_DEFAUT: Bareme = {
  victoire: 3,
  nul: 2,
  defaite: 1,
  forfait: 0,
};

// Confrontation directe : qui a gagné le match entre 2 équipes ?
function confrontation(
  rencontres: Rencontre[],
  idA: number,
  idB: number,
): "a" | "b" | "nul" | "aucun" {
  const m = rencontres.find(
    (r) =>
      r.saisi &&
      ((r.teamAId === idA && r.teamBId === idB) ||
        (r.teamAId === idB && r.teamBId === idA)),
  );
  if (!m) return "aucun";
  const aIsTeamA = m.teamAId === idA;
  const sa = m.scoreA ?? 0;
  const sb = m.scoreB ?? 0;
  let res: "a" | "b" | "nul";
  if (sa > sb) res = aIsTeamA ? "a" : "b";
  else if (sa < sb) res = aIsTeamA ? "b" : "a";
  else res = "nul";
  return res;
}

// Mini-championnat : points obtenus dans les seuls matchs entre les équipes
// à égalité (critère 2 de l'article 12).
function miniChampionnat(
  ids: Set<number>,
  rencontres: Rencontre[],
  bareme: Bareme,
): Map<number, number> {
  const pts = new Map<number, number>();
  for (const id of ids) pts.set(id, 0);
  for (const r of rencontres) {
    if (!r.saisi) continue;
    if (r.teamAId == null || r.teamBId == null) continue;
    if (!ids.has(r.teamAId) || !ids.has(r.teamBId)) continue;
    const sa = r.scoreA ?? 0;
    const sb = r.scoreB ?? 0;
    const add = (id: number, v: number) => pts.set(id, (pts.get(id) ?? 0) + v);
    if (r.forfaitA && !r.forfaitB) {
      add(r.teamAId, bareme.forfait);
      add(r.teamBId, bareme.victoire);
    } else if (r.forfaitB && !r.forfaitA) {
      add(r.teamBId, bareme.forfait);
      add(r.teamAId, bareme.victoire);
    } else if (r.forfaitA && r.forfaitB) {
      add(r.teamAId, bareme.forfait);
      add(r.teamBId, bareme.forfait);
    } else if (sa > sb) {
      add(r.teamAId, bareme.victoire);
      add(r.teamBId, bareme.defaite);
    } else if (sa < sb) {
      add(r.teamBId, bareme.victoire);
      add(r.teamAId, bareme.defaite);
    } else {
      add(r.teamAId, bareme.nul);
      add(r.teamBId, bareme.nul);
    }
  }
  return pts;
}

// Applique le classement final saisi par l'admin (places 1..N).
function appliquerManuel(lignes: LigneClassement[]): LigneClassement[] {
  const n = lignes.length;
  const slots: (LigneClassement | null)[] = new Array(n).fill(null);
  const manuels: LigneClassement[] = [];
  const auto: LigneClassement[] = [];
  for (const l of lignes) {
    if (
      l.classementFinal != null &&
      l.classementFinal >= 1 &&
      l.classementFinal <= n
    ) {
      manuels.push(l);
    } else {
      auto.push(l);
    }
  }
  for (const l of manuels) {
    slots[l.classementFinal! - 1] = l;
  }
  let ai = 0;
  for (let r = 0; r < n; r++) {
    if (!slots[r] && ai < auto.length) {
      slots[r] = auto[ai++];
    }
  }
  return slots.filter((s): s is LigneClassement => s !== null);
}

export function computeClassement(
  teams: Team[],
  rencontres: Rencontre[],
  bareme: Bareme = BAREME_DEFAUT,
): LigneClassement[] {
  const map = new Map<number, LigneClassement>();
  for (const t of teams) {
    map.set(t.id, {
      teamId: t.id,
      numero: t.numero,
      nom: t.nom,
      joues: 0,
      gagnes: 0,
      nuls: 0,
      perdus: 0,
      forfaits: 0,
      pointsPour: 0,
      pointsContre: 0,
      difference: 0,
      pointsTotal: 0,
      classementFinal: t.classementFinal ?? null,
    });
  }

  for (const r of rencontres) {
    if (!r.saisi) continue;
    if (r.teamAId == null || r.teamBId == null) continue;
    const A = map.get(r.teamAId);
    const B = map.get(r.teamBId);
    if (!A || !B) continue;

    let sa = r.scoreA ?? 0;
    let sb = r.scoreB ?? 0;

    // Forfait : l'équipe vainqueur l'emporte 19 à 0 (règlement fédéral).
    const fA = r.forfaitA && !r.forfaitB;
    const fB = r.forfaitB && !r.forfaitA;
    const fBoth = r.forfaitA && r.forfaitB;
    if (fA) {
      sa = 0;
      sb = 19;
    } else if (fB) {
      sa = 19;
      sb = 0;
    } else if (fBoth) {
      sa = 0;
      sb = 0;
    }

    A.joues++;
    B.joues++;
    A.pointsPour += sa;
    A.pointsContre += sb;
    B.pointsPour += sb;
    B.pointsContre += sa;

    if (fA) {
      A.forfaits++;
      A.pointsTotal += bareme.forfait;
      B.gagnes++;
      B.pointsTotal += bareme.victoire;
    } else if (fB) {
      B.forfaits++;
      B.pointsTotal += bareme.forfait;
      A.gagnes++;
      A.pointsTotal += bareme.victoire;
    } else if (fBoth) {
      A.forfaits++;
      B.forfaits++;
      A.pointsTotal += bareme.forfait;
      B.pointsTotal += bareme.forfait;
    } else if (sa > sb) {
      A.gagnes++;
      A.pointsTotal += bareme.victoire;
      B.perdus++;
      B.pointsTotal += bareme.defaite;
    } else if (sa < sb) {
      B.gagnes++;
      B.pointsTotal += bareme.victoire;
      A.perdus++;
      A.pointsTotal += bareme.defaite;
    } else {
      A.nuls++;
      B.nuls++;
      A.pointsTotal += bareme.nul;
      B.pointsTotal += bareme.nul;
    }
  }

  const lignes = Array.from(map.values());
  for (const l of lignes) {
    l.difference = l.pointsPour - l.pointsContre;
  }

  // ARTICLE 12 — critères de classement :
  // 1. Total des points.
  // 2. Égalité : mini-championnat (résultats des oppositions entre elles).
  // 3. Point average général (différence Pour - Contre).
  const groups = new Map<number, LigneClassement[]>();
  for (const l of lignes) {
    const arr = groups.get(l.pointsTotal) ?? [];
    arr.push(l);
    groups.set(l.pointsTotal, arr);
  }
  const totaux = [...groups.keys()].sort((a, b) => b - a);
  const tries: LigneClassement[] = [];
  for (const total of totaux) {
    const g = groups.get(total)!;
    if (g.length === 1) {
      tries.push(g[0]);
    } else {
      const ids = new Set(g.map((x) => x.teamId));
      const mini = miniChampionnat(ids, rencontres, bareme);
      g.sort((a, b) => {
        const ma = mini.get(a.teamId) ?? 0;
        const mb = mini.get(b.teamId) ?? 0;
        if (mb !== ma) return mb - ma; // critère 2 : mini-championnat
        if (b.difference !== a.difference) return b.difference - a.difference; // critère 3
        if (b.pointsPour !== a.pointsPour) return b.pointsPour - a.pointsPour;
        return a.numero - b.numero;
      });
      tries.push(...g);
    }
  }

  // Classement final manuel (si l'admin a saisi des places)
  return appliquerManuel(tries);
}
