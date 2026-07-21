# Budget+

Application web de finances personnelles pour utilisateurs africains
francophones (FCFA, interface en français), design glassmorphism premium.

Ce dépôt contient le **sous-projet 1** (voir
`docs/superpowers/specs/2026-07-20-budget-plus-fondations-design.md`) :
Auth, Dashboard, Revenus, Dépenses, Dîme. Les autres écrans (Investissements,
Épargne, Objectifs, Calendrier, Rapports, Conseiller IA, Réglages) seront
ajoutés dans des sous-projets suivants.

## Installation

```bash
npm install
cp .env.example .env.local
```

Renseigne `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env.local`
avec les valeurs de ton projet Supabase (Project Settings → API).

## Base de données

Applique la migration `supabase/migrations/0001_init.sql` sur ton projet
Supabase (via le MCP Supabase, le SQL Editor, ou la CLI Supabase). Elle crée
les tables `profiles`, `categories`, `incomes`, `expenses`, `tithes`, active
la Row Level Security, le trigger de seed à l'inscription et le Realtime.

Active aussi Google comme provider OAuth dans Authentication → Providers si tu
veux la connexion « Continuer avec Google ».

## Développement

```bash
npm run dev
```

## Tests

```bash
npm run test
```

## Build

```bash
npm run build
```

## Déploiement

Déploiement cible : Vercel (variables d'environnement `VITE_SUPABASE_URL` et
`VITE_SUPABASE_ANON_KEY` à configurer dans le projet Vercel).
