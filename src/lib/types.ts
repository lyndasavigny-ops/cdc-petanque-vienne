import type { Championship, Team, Journee, Rencontre } from "@/db/schema";

export type ChampionshipDetail = {
  championship: Championship;
  teams: Team[];
  journees: Journee[];
  rencontres: Rencontre[];
};

export type { Championship, Team, Journee, Rencontre };
