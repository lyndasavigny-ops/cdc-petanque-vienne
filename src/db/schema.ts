import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

// Un championnat = une poule d'un niveau de CDC (Championnat Des Clubs)
// Ex: CDC3 - Poule C - Senior - Saison 2025
export const championships = pgTable("championships", {
  id: serial("id").primaryKey(),
  saison: text("saison").notNull().default(""), // libellé saison (ex: "2025")
  annee: integer("annee").notNull().default(2025),
  typeCdc: text("type_cdc").notNull().default("Senior"), // Senior / Vétéran / Féminin
  division: integer("division").notNull().default(1), // 1,2,3,4
  poule: text("poule").notNull().default("A"), // A..H
  codeSaisie: text("code_saisie").notNull().default(""), // code d'accès club pour la saisie
  deviceLock: text("device_lock").notNull().default(""), // appareil autorisé (1er qui utilise le code)
  // Barème de points du classement (modifiable par l'organisateur)
  ptsVictoire: integer("pts_victoire").notNull().default(3),
  ptsNul: integer("pts_nul").notNull().default(2),
  ptsDefaite: integer("pts_defaite").notNull().default(1),
  ptsForfait: integer("pts_forfait").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Paramètres applicatifs (identifiant / code organisateur)
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// Co-organisateurs ajoutés par le compte principal (admin).
// Ils ont les droits organisateur mais ne gèrent pas les utilisateurs.
export const appUsers = pgTable("app_users", {
  id: serial("id").primaryKey(),
  identifiant: text("identifiant").notNull(),
  code: text("code").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AppUser = typeof appUsers.$inferSelect;

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  championshipId: integer("championship_id")
    .notNull()
    .references(() => championships.id, { onDelete: "cascade" }),
  numero: integer("numero").notNull(),
  nom: text("nom").notNull(),
  // Rang imposé manuellement par l'organisateur (0 = automatique)
  classementManuel: integer("classement_manuel").notNull().default(0),
});

export const journees = pgTable("journees", {
  id: serial("id").primaryKey(),
  championshipId: integer("championship_id")
    .notNull()
    .references(() => championships.id, { onDelete: "cascade" }),
  numero: integer("numero").notNull(),
  lieu: text("lieu").notNull().default(""),
  dateRencontre: text("date_rencontre").notNull().default(""),
  heure: text("heure").notNull().default(""),
  validee: boolean("validee").notNull().default(false), // journée validée = verrouillée pour les clubs
});

export const rencontres = pgTable("rencontres", {
  id: serial("id").primaryKey(),
  championshipId: integer("championship_id")
    .notNull()
    .references(() => championships.id, { onDelete: "cascade" }),
  journeeId: integer("journee_id")
    .notNull()
    .references(() => journees.id, { onDelete: "cascade" }),
  ordre: integer("ordre").notNull().default(0),
  teamAId: integer("team_a_id").references(() => teams.id, {
    onDelete: "cascade",
  }),
  teamBId: integer("team_b_id").references(() => teams.id, {
    onDelete: "cascade",
  }),
  scoreA: integer("score_a"),
  scoreB: integer("score_b"),
  forfaitA: boolean("forfait_a").notNull().default(false),
  forfaitB: boolean("forfait_b").notNull().default(false),
  saisi: boolean("saisi").notNull().default(false),
});

export type Championship = typeof championships.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Journee = typeof journees.$inferSelect;
export type Rencontre = typeof rencontres.$inferSelect;
