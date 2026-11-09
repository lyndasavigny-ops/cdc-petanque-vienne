export const TOTAL_POINTS = 36;

// Score imposé en cas de forfait (règlement CDC) :
// l'équipe vainqueur d'un forfait gagne 19 à 0
// (3 points avec un point average de +19).
export const FORFAIT_SCORE = 19;

// Numéro de version affiché sur le site pour vérifier qu'on regarde
// bien la dernière mise à jour.
export const APP_VERSION =
  "v21 — CDC Jeu Provençal (2D+2T), identifiants masqués, Article 12";

export const TYPES_CDC = [
  "Senior",
  "Vétéran",
  "Féminin",
  "Provençal",
] as const;
export type TypeCdc = (typeof TYPES_CDC)[number];

// CDC Jeu Provençal : rencontre en 4 parties (2 doublettes + 2 triplettes,
// pas de tête-à-tête), chaque partie vaut 9 points → total 36 inchangé.
export function isProvencal(typeCdc: string): boolean {
  return typeCdc.toLowerCase().includes("proven");
}

// Nombre de parties d'une rencontre (critère 4 de l'Article 12) :
// Pétanque : 11 (6 TT + 3 D + 2 T) · Provençal : 4 (2 D + 2 T)
export function partiesMax(typeCdc: string): number {
  return isProvencal(typeCdc) ? 4 : 11;
}

export const POULES = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

// Nombre de poules disponibles par division (structure officielle)
export const DIVISIONS = [
  { division: 1, label: "Division 1", poules: 1 },
  { division: 2, label: "Division 2", poules: 2 },
  { division: 3, label: "Division 3", poules: 4 },
  { division: 4, label: "Division 4", poules: 8 },
] as const;

export function poulesForDivision(division: number): string[] {
  const d = DIVISIONS.find((x) => x.division === division);
  const n = d ? d.poules : 1;
  return POULES.slice(0, n);
}

export function championshipName(c: {
  division: number;
  poule: string;
  typeCdc: string;
}): string {
  return `CDC${c.division}_Poule_${c.poule}_${c.typeCdc}`;
}
