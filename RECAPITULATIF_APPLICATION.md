# Iwadu Cash — Récapitulatif complet de l'application

## 1. Positionnement
Iwadu Cash est une SaaS française de gestion de budget personnel, hébergée temporairement sur Vercel (**https://cash-bsg.vercel.app**), avec le code sur GitHub (**StephBouss/CashBSG**, remote `cashbsg`, branche `master`). Objectif : donner à un particulier une vue complète de ses finances (revenus, dépenses, épargne, objectifs) avec un accompagnement par IA ("Iwadu").

## 2. Stack technique
- **Frontend** : React 18 + TypeScript + Vite, Tailwind CSS (thème glassmorphism piloté par variables CSS), react-router-dom v7, TanStack Query v5, react-hook-form + zod, Recharts, Framer Motion, date-fns.
- **Backend** : Supabase (Postgres + Auth + Realtime + Row Level Security + Edge Functions + Storage).
- **IA** : API DeepSeek, appelée via une Edge Function (`ai-advisor`), avec suivi des tokens consommés.
- **Déploiement** : Vercel (avec `vercel.json` pour le rewrite SPA), CLI Supabase liée au projet pour les migrations et fonctions.
- **Tests** : Vitest pour les fonctions pures (`calculations`, `formatters`, `plan`, etc.), Playwright utilisé en scripts jetables pour les vérifications end-to-end.

## 3. Pages et fonctionnalités

| Page | Rôle |
|---|---|
| **Dashboard** | Vue d'ensemble (KPIs, tendances mensuelles, barre de progression d'onboarding) |
| **Revenus** | Saisie et suivi des revenus par catégorie |
| **Dépenses** | Suivi des factures avec échéance, priorité, statut (payé/à venir/en retard), édition inline |
| **Tracker** | Module simple de dépenses instantanées (nom, catégorie, montant — sans date/heure à saisir), mis en avant dans la sidebar (effet glassmorphism jaune) |
| **Finances** | Comptes d'épargne/investissement multiples, alimentation par montant fixe ou % d'un revenu, historique des mouvements, gestion de la Dîme |
| **Objectifs** | Objectifs financiers (icône, couleur, montant cible, échéance, contribution mensuelle) — **création, édition et suppression** |
| **Rapports** | Historique et analyses sur plusieurs mois |
| **Iwadu** (conseiller IA) | Chat avec DeepSeek, débloqué seulement après onboarding complet |
| **Paramètres** | Thème, devise, pays, fuseau horaire, pourcentage de dîme |
| **Administration** | Réservé aux comptes `is_admin` |
| **Mise à niveau** | Changement de plan (Free → Essentiel/Pro) |
| **Pages légales** | CGU, Mentions légales, Politique de confidentialité |

### Détail des modules récemment enrichis
- **Objectifs et Épargne/Investissement** : possibilité de **modifier** une entrée après création (bouton crayon réutilisant la modale de création en mode édition) — Dépenses avait déjà cette capacité.
- **Onboarding** : à la première visite, une barre de progression sobre (non intrusive) suit 3 étapes obligatoires — nom/prénom, un revenu, une dépense — plus un champ WhatsApp facultatif. Les étapes complétées s'affichent barrées. Tant que les 3 étapes ne sont pas remplies, Iwadu reste verrouillé dans la sidebar (icône cadenas) avec un message reformulé, non intrusif.
- **Administration** : KPIs globaux (comptes totaux, revenus/dépenses agrégés du mois, messages IA, tokens IA consommés, objectifs atteints), détail par utilisateur (y compris tokens IA par personne), répartition par devise et par plan, détail des objectifs de tous les comptes — le tout via l'Edge Function `admin-dashboard` (clé service_role côté serveur).

## 4. Modèle de données (Supabase, 14 migrations)
- `profiles` : nom, devise, langue, % dîme, thème, pays, `plan` (free/essentiel/pro), `plan_expires_at`, `is_admin`, `whatsapp`.
- `categories`, `incomes`, `expenses`, `tithes` (dîme) — socle initial avec RLS "owner".
- `goals` — objectifs financiers.
- `ai_messages` — historique des échanges avec l'IA, `tokens_used` par message.
- `savings_accounts` / `savings_movements` — épargne et investissement, avec règles de contribution (montant fixe ou %).
- `expense_tracker` — module Tracker (indépendant de `expenses`).
- `client_errors` — journalisation des erreurs front (remplace un Sentry externe).
- `upgrade_requests` — demandes de changement de plan (traitement manuel en attendant un vrai prestataire de paiement).
- `notifications` — rappels in-app (échéance d'abonnement à 15/10/5/0 jours), générés côté client avec clé de dédoublonnage.

Toutes les tables sensibles ont RLS activée avec policy "owner" (`auth.uid() = user_id`), sauf les données admin exposées via Edge Function avec vérification `is_admin`.

## 5. Système de plans / abonnement
- 3 plans : **Free** (gratuit), **Essentiel** (5 000 FCFA/mois), **Pro** (15 000 FCFA/mois), gérés via `src/lib/plan.ts`.
- Gating centralisé : `canAccessFullHistory` (historique complet réservé au payant) — **`canAccessGoals` est actuellement désactivé** (retourne toujours `true`), à la demande explicite pour laisser Objectifs ouvert à tous les plans temporairement.
- Bouton "Mettre à niveau" dans la sidebar → page dédiée → soumission d'une `upgrade_request`, traitement manuel par l'admin (pas encore de vraie intégration de paiement — choix explicitement reporté).
- Notifications automatiques de fin d'abonnement (15/10/5/0 jours avant expiration).

## 6. Sécurité et infra
- RLS partout, clé `service_role` seulement côté Edge Functions.
- Allowlist CORS via secret `ALLOWED_ORIGINS`.
- `vercel.json` avec rewrite SPA pour éviter les 404 en navigation directe.
- Compte admin unique conservé après suppression des comptes de test (`competencesnouvelles@gmail.com`).
- Favicon remplacé par le logo Iwadu Cash.

## 7. État actuel / points en attente
- Choix d'un vrai prestataire de paiement (Stripe / Mobile Money) — reporté.
- Réactivation du gating plan sur Objectifs — à faire plus tard, un seul changement dans `plan.ts`.
- Achat/config d'un nom de domaine définitif après la phase de test utilisateurs (1 mois).
- Configuration email Supabase — explicitement hors périmètre.

---
*Document généré le 31/07/2026.*
