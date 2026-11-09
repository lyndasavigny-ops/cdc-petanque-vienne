import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
  jsonb,
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
  format: text("format").notNull().default("Doublettes"), // Doublettes | Triplettes
  // Code d'accès administrateur (accès complet)
  adminCode: text("admin_code").notNull().default(""),
  // Barème des points (modifiable par l'admin)
  ptsVictoire: integer("pts_victoire").notNull().default(3),
  ptsNul: integer("pts_nul").notNull().default(2),
  ptsDefaite: integer("pts_defaite").notNull().default(1),
  ptsForfait: integer("pts_forfait").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  championshipId: integer("championship_id")
    .notNull()
    .references(() => championships.id, { onDelete: "cascade" }),
  numero: integer("numero").notNull(),
  nom: text("nom").notNull(),
  // Identifiant (login) + mot de passe (code) du club organisateur
  identifiant: text("identifiant").notNull().default(""),
  code: text("code").notNull().default(""),
  // Classement final manuel (saisi par l'admin pour départager) : 1..N ou vide
  classementFinal: integer("classement_final"),
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
  // Détail des points par partie (3 en doublettes, 2 en triplettes)
  partiesA: jsonb("parties_a").$type<number[]>().default([]),
  partiesB: jsonb("parties_b").$type<number[]>().default([]),
  // Composition de la feuille de match : [{nom, licence}] ordre des parties
  compositionA: jsonb("composition_a")
    .$type<{ nom: string; licence: string }[]>()
    .default([]),
  compositionB: jsonb("composition_b")
    .$type<{ nom: string; licence: string }[]>()
    .default([]),
  forfaitA: boolean("forfait_a").notNull().default(false),
  forfaitB: boolean("forfait_b").notNull().default(false),
  saisi: boolean("saisi").notNull().default(false),
  // Verrouillé après validation par le club : seul l'admin peut modifier.
  verrouille: boolean("verrouille").notNull().default(false),
});

// Utilisateurs supplémentaires ajoutés par l'administrateur.
// Seul l'admin (master) peut en créer / supprimer.
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  identifiant: text("identifiant").notNull().default(""),
  nom: text("nom").notNull().default(""),
  code: text("code").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Championship = typeof championships.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Journee = typeof journees.$inferSelect;
export type Rencontre = typeof rencontres.$inferSelect;
