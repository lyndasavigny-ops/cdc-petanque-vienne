export const TOTAL_POINTS = 36;

// Numéro de version affiché sur le site pour vérifier qu'on regarde
// bien la dernière mise à jour.
export const APP_VERSION =
  "v16 — confrontation directe, ordre manuel du classement, barème modifiable";

export const TYPES_CDC = ["Senior", "Vétéran", "Féminin"] as const;
export type TypeCdc = (typeof TYPES_CDC)[number];

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
