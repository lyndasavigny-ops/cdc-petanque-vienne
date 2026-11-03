import { TOTAL_POINTS } from "./cdc";
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

// Extrait le barème d'un championnat (avec valeurs par défaut de secours)
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

// Points de classement selon le barème du championnat
// (par défaut : victoire 3, nul 2, défaite 1, forfait 0)
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

  for (const r of rencontres) {
    if (!r.saisi) continue;
    if (r.teamAId == null || r.teamBId == null) continue; // exempt
    const A = map.get(r.teamAId);
    const B = map.get(r.teamBId);
    if (!A || !B) continue;

    let sa = r.scoreA ?? 0;
    let sb = r.scoreB ?? 0;

    // Gestion des forfaits : l'équipe au forfait marque 0, l'adversaire gagne.
    if (r.forfaitA && !r.forfaitB) {
      sa = 0;
      sb = TOTAL_POINTS;
    } else if (r.forfaitB && !r.forfaitA) {
      sb = 0;
      sa = TOTAL_POINTS;
    }

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

  // Confrontations directes : pour chaque paire d'équipes, qui a gagné ?
  // (clé "petitId-grandId" → id du vainqueur, ou 0 si nul)
  const directes = new Map<string, number>();
  for (const r of rencontres) {
    if (!r.saisi || r.teamAId == null || r.teamBId == null) continue;
    let sa = r.scoreA ?? 0;
    let sb = r.scoreB ?? 0;
    if (r.forfaitA && !r.forfaitB) {
      sa = 0;
      sb = TOTAL_POINTS;
    } else if (r.forfaitB && !r.forfaitA) {
      sa = TOTAL_POINTS;
      sb = 0;
    }
    const key =
      r.teamAId < r.teamBId
        ? `${r.teamAId}-${r.teamBId}`
        : `${r.teamBId}-${r.teamAId}`;
    const winner = sa > sb ? r.teamAId : sa < sb ? r.teamBId : 0;
    directes.set(key, winner);
  }

  function vainqueurDirect(aId: number, bId: number): number {
    const key = aId < bId ? `${aId}-${bId}` : `${bId}-${aId}`;
    return directes.get(key) ?? 0; // 0 = nul ou pas encore joué
  }

  // Tri :
  // 1. Ordre manuel de l'organisateur (si renseigné)
  // 2. Points total
  // 3. Égalité à deux : CONFRONTATION DIRECTE (le vainqueur passe devant,
  //    même avec un moins bon goal-average) ; si nul → goal-average
  // 4. Différence (Pour − Contre), puis Points pour, puis numéro
  lignes.sort((a, b) => {
    // Ordre manuel prioritaire
    if (a.manuel > 0 || b.manuel > 0) {
      if (a.manuel > 0 && b.manuel > 0) return a.manuel - b.manuel;
      return a.manuel > 0 ? -1 : 1;
    }
    if (b.pointsTotal !== a.pointsTotal) return b.pointsTotal - a.pointsTotal;
    // Égalité de points : confrontation directe
    const w = vainqueurDirect(a.teamId, b.teamId);
    if (w === a.teamId) return -1;
    if (w === b.teamId) return 1;
    // Match nul entre elles (ou non joué) : goal-average
    if (b.difference !== a.difference) return b.difference - a.difference;
    if (b.pointsPour !== a.pointsPour) return b.pointsPour - a.pointsPour;
    return a.numero - b.numero;
  });

  return lignes;
}
