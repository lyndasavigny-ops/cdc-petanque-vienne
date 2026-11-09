import { FORFAIT_SCORE } from "./cdc";
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
  manuel: number; // rang imposé par l'organisateur (0 = automatique)
};

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

export function baremeOf(c: {
  ptsVictoire?: number | null;
  ptsNul?: number | null;
  ptsDefaite?: number | null;
  ptsForfait?: number | null;
}): Bareme {
  return {
    victoire: c.ptsVictoire ?? 3,
    nul: c.ptsNul ?? 2,
    defaite: c.ptsDefaite ?? 1,
    forfait: c.ptsForfait ?? 0,
  };
}

type MatchInfo = {
  aId: number;
  bId: number;
  sa: number;
  sb: number;
  pa: number | null; // parties gagnées équipe A (sur 11)
  pb: number | null;
};

/**
 * Classement selon l'Article 12 du règlement CDC (FFPJP) :
 *  1. Total des points marqués
 *  2. Égalité entre 2 : résultat de l'opposition directe ; si nul → 3 puis 4
 *     Égalité entre 3+ : mini-classement (critère 1) sur les seules
 *     oppositions entre équipes concernées, puis 3 et 4 si nécessaire
 *  3. Point average général (Pour − Contre)
 *  4. Parties gagnées dans l'opposition entre elles (sur 11 : 6TT+3D+2T)
 *  L'ordre manuel de l'organisateur prime sur tout.
 */
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
      manuel: (t as { classementManuel?: number }).classementManuel ?? 0,
    });
  }

  const matches: MatchInfo[] = [];

  for (const r of rencontres) {
    if (!r.saisi) continue;
    if (r.teamAId == null || r.teamBId == null) continue;
    const A = map.get(r.teamAId);
    const B = map.get(r.teamBId);
    if (!A || !B) continue;

    let sa = r.scoreA ?? 0;
    let sb = r.scoreB ?? 0;
    if (r.forfaitA && !r.forfaitB) {
      sa = 0;
      sb = FORFAIT_SCORE;
    } else if (r.forfaitB && !r.forfaitA) {
      sb = 0;
      sa = FORFAIT_SCORE;
    }

    matches.push({
      aId: r.teamAId,
      bId: r.teamBId,
      sa,
      sb,
      pa: (r as { partiesA?: number | null }).partiesA ?? null,
      pb: (r as { partiesB?: number | null }).partiesB ?? null,
    });

    A.joues++;
    B.joues++;
    A.pointsPour += sa;
    A.pointsContre += sb;
    B.pointsPour += sb;
    B.pointsContre += sa;

    if (r.forfaitA && !r.forfaitB) {
      A.forfaits++;
      A.pointsTotal += bareme.forfait;
      B.gagnes++;
      B.pointsTotal += bareme.victoire;
    } else if (r.forfaitB && !r.forfaitA) {
      B.forfaits++;
      B.pointsTotal += bareme.forfait;
      A.gagnes++;
      A.pointsTotal += bareme.victoire;
    } else if (r.forfaitA && r.forfaitB) {
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

  // Oppositions entre un ensemble d'équipes
  const mutual = (ids: Set<number>) =>
    matches.filter((m) => ids.has(m.aId) && ids.has(m.bId));

  // Parties gagnées par une équipe dans un ensemble d'oppositions
  function partiesDans(teamId: number, ms: MatchInfo[]): number {
    let p = 0;
    for (const m of ms) {
      if (m.aId === teamId) p += m.pa ?? 0;
      else if (m.bId === teamId) p += m.pb ?? 0;
    }
    return p;
  }

  // Critères 2→4 pour DEUX équipes
  function pairCompare(a: LigneClassement, b: LigneClassement): number {
    const ms = mutual(new Set([a.teamId, b.teamId]));
    let winsA = 0;
    let winsB = 0;
    for (const m of ms) {
      const sA = m.aId === a.teamId ? m.sa : m.sb;
      const sB = m.aId === a.teamId ? m.sb : m.sa;
      if (sA > sB) winsA++;
      else if (sB > sA) winsB++;
    }
    if (winsA !== winsB) return winsB - winsA; // critère 2 : opposition directe
    if (a.difference !== b.difference) return b.difference - a.difference; // critère 3
    const pgA = partiesDans(a.teamId, ms);
    const pgB = partiesDans(b.teamId, ms);
    if (pgA !== pgB) return pgB - pgA; // critère 4
    if (a.pointsPour !== b.pointsPour) return b.pointsPour - a.pointsPour;
    return a.numero - b.numero;
  }

  // Départage d'un groupe à égalité de points
  function departage(group: LigneClassement[]): LigneClassement[] {
    if (group.length <= 1) return group;
    if (group.length === 2) {
      const [a, b] = group;
      return pairCompare(a, b) <= 0 ? [a, b] : [b, a];
    }
    // 3+ : mini-classement (critère 1) sur les seules oppositions concernées
    const ids = new Set(group.map((g) => g.teamId));
    const ms = mutual(ids);
    const mini = new Map<number, number>(group.map((g) => [g.teamId, 0]));
    for (const m of ms) {
      if (m.sa > m.sb) {
        mini.set(m.aId, (mini.get(m.aId) ?? 0) + bareme.victoire);
        mini.set(m.bId, (mini.get(m.bId) ?? 0) + bareme.defaite);
      } else if (m.sa < m.sb) {
        mini.set(m.bId, (mini.get(m.bId) ?? 0) + bareme.victoire);
        mini.set(m.aId, (mini.get(m.aId) ?? 0) + bareme.defaite);
      } else {
        mini.set(m.aId, (mini.get(m.aId) ?? 0) + bareme.nul);
        mini.set(m.bId, (mini.get(m.bId) ?? 0) + bareme.nul);
      }
    }
    const sorted = group
      .slice()
      .sort(
        (x, y) => (mini.get(y.teamId) ?? 0) - (mini.get(x.teamId) ?? 0),
      );
    const result: LigneClassement[] = [];
    let i = 0;
    while (i < sorted.length) {
      let j = i;
      while (
        j < sorted.length &&
        mini.get(sorted[j].teamId) === mini.get(sorted[i].teamId)
      )
        j++;
      const sub = sorted.slice(i, j);
      if (sub.length === 1) {
        result.push(sub[0]);
      } else if (sub.length === 2) {
        const [a, b] = sub;
        result.push(...(pairCompare(a, b) <= 0 ? [a, b] : [b, a]));
      } else {
        // toujours à égalité : critère 3 (général) puis 4 (oppositions)
        sub.sort((a, b) => {
          if (a.difference !== b.difference)
            return b.difference - a.difference;
          const pgA = partiesDans(a.teamId, ms);
          const pgB = partiesDans(b.teamId, ms);
          if (pgA !== pgB) return pgB - pgA;
          if (a.pointsPour !== b.pointsPour)
            return b.pointsPour - a.pointsPour;
          return a.numero - b.numero;
        });
        result.push(...sub);
      }
      i = j;
    }
    return result;
  }

  // Tri principal : critère 1 (points), puis départage des groupes
  lignes.sort(
    (a, b) => b.pointsTotal - a.pointsTotal || a.numero - b.numero,
  );
  const final: LigneClassement[] = [];
  let i = 0;
  while (i < lignes.length) {
    let j = i;
    while (
      j < lignes.length &&
      lignes[j].pointsTotal === lignes[i].pointsTotal
    )
      j++;
    final.push(...departage(lignes.slice(i, j)));
    i = j;
  }

  // Ordre manuel de l'organisateur : prioritaire (tri stable)
  final.sort((a, b) => {
    if (a.manuel > 0 || b.manuel > 0) {
      if (a.manuel > 0 && b.manuel > 0) return a.manuel - b.manuel;
      return a.manuel > 0 ? -1 : 1;
    }
    return 0;
  });

  return final;
}
