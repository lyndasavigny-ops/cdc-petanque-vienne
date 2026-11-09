# 🏆 Championnats Des Clubs — Pétanque

Application de gestion des championnats de pétanque (Comité de la Vienne — FFPJP) :
création des poules, tirage, saisie des scores par les clubs, **classement en direct**,
feuilles de match imprimables, partage des accès par SMS.

## ✨ Fonctionnalités
- Championnats multi-divisions (CDC 1–4, poules A–H), formats Doublettes/Triplettes.
- Tirage au sort automatique, journées, feuilles de match (recto/verso, logos).
- Accès par codes : **admin**, **clubs** (saisie de leurs propres matchs), **public** (lecture).
- Verrouillage des scores après validation (seul l'admin peut modifier).
- Classement automatique (Victoire 3 · Nul 2 · Défaite 1 · Forfait 0).
- Sauvegarde CSV / JSON / PDF.

## 🛠️ Stack
- **Next.js** (App Router) · **Drizzle ORM** · **PostgreSQL** (Neon)

## 🚀 Déploiement rapide (GitHub → Neon → Vercel)
1. **Neon** : créez une base → copiez l'URL `postgresql://…?sslmode=require`.
2. **GitHub** : poussez ce code dans un dépôt.
3. **Vercel** : importez le dépôt, ajoutez `DATABASE_URL` (URL Neon) + `MASTER_CODE`, puis **Deploy**.

Les tables sont créées automatiquement au premier démarrage.

## 🔑 Identifiants par défaut
- **Administrateur** : identifiant `admin` · mot de passe `vienne86` (modifiable via `MASTER_CODE`).

## ⚙️ Variables d'environnement
| Variable | Description |
|---|---|
| `DATABASE_URL` | URL de connexion PostgreSQL (Neon) |
| `MASTER_CODE` | Mot de passe administrateur (défaut `vienne86`) |
| `MASTER_IDENT` | Identifiant administrateur (défaut `admin`) |

> ⚠️ Ne commitez jamais le fichier `.env`.
