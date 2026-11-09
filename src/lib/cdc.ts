export const TOTAL_POINTS = 36;

export const TYPES_CDC = ["Senior", "Vétéran", "Féminin", "Provençal"] as const;
export type TypeCdc = (typeof TYPES_CDC)[number];

export const POULES = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

// Nombre de poules disponibles par division (structure officielle)
export const DIVISIONS = [
  { division: 1, label: "Division 1", poules: 1 },
  { division: 2, label: "Division 2", poules: 2 },
  { division: 3, label: "Division 3", poules: 4 },
  { division: 4, label: "Division 4", poules: 8 },
] as const;

export type Format = "Doublettes" | "Triplettes";
export const FORMATS: Format[] = ["Doublettes", "Triplettes"];

export type FormatConfig = {
  parties: number;
  joueursParPartie: number;
  pointsParPartie: number;
};

// Une rencontre totalise 36 points :
//  - Doublettes : 3 parties de 2 joueurs, 12 points chacune  -> 3 x 12 = 36
//  - Triplettes : 2 parties de 3 joueurs, 18 points chacune  -> 2 x 18 = 36
export const FORMAT_CONFIG: Record<Format, FormatConfig> = {
  Doublettes: { parties: 3, joueursParPartie: 2, pointsParPartie: 12 },
  Triplettes: { parties: 2, joueursParPartie: 3, pointsParPartie: 18 },
};

// Libellés officiels accentués pour le titre des feuilles de match.
export const TYPE_LABEL: Record<string, string> = {
  Senior: "SÉNIOR",
  Vétéran: "VÉTÉRAN",
  Féminin: "FÉMININ",
  Provençal: "PROVENÇAL",
};

export function typeLabel(typeCdc: string): string {
  return TYPE_LABEL[typeCdc] ?? typeCdc.toUpperCase();
}

export function formatConfig(format: string | null | undefined): FormatConfig {
  return FORMAT_CONFIG[(format as Format) ?? "Doublettes"] ?? FORMAT_CONFIG.Doublettes;
}

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
