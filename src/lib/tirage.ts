// Génère un calendrier en poule simple (round-robin) via la méthode du cercle.
// Retourne, pour chaque journée, la liste des rencontres (paires d'index d'équipes).
// Un index === null signifie "exempt" (bye) lorsque le nombre d'équipes est impair.

export type Paire = { a: number | null; b: number | null };

export function roundRobin(nbTeams: number): Paire[][] {
  const teams: (number | null)[] = Array.from({ length: nbTeams }, (_, i) => i);
  if (teams.length % 2 !== 0) {
    teams.push(null); // exempt
  }
  const n = teams.length;
  const rounds = n - 1;
  const half = n / 2;

  const idx = teams.slice();
  const journees: Paire[][] = [];

  for (let r = 0; r < rounds; r++) {
    const paires: Paire[] = [];
    for (let i = 0; i < half; i++) {
      const a = idx[i];
      const b = idx[n - 1 - i];
      // alterner domicile/extérieur pour l'équilibre
      if (r % 2 === 0) {
        paires.push({ a, b });
      } else {
        paires.push({ a: b, b: a });
      }
    }
    journees.push(paires.filter((p) => p.a !== null || p.b !== null));
    // rotation : on fixe le premier, on tourne les autres
    const fixed = idx[0];
    const rest = idx.slice(1);
    rest.unshift(rest.pop() as number | null);
    idx.splice(0, idx.length, fixed, ...rest);
  }

  return journees;
}
