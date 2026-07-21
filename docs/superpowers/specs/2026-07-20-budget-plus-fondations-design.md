# Budget+ — Sous-projet 1 : Fondations (Auth, Dashboard, Revenus, Dépenses, Dîme)

Date : 2026-07-20
Statut : Approuvé par l'utilisateur

## 0. Contexte et relation avec le spec précédent

Ce document **remplace intégralement** le spec précédent
(`2026-07-20-budget-personnel-design.md`, commit `a64fbd6`), qui décrivait une
application plus simple (tableau Prévu/Réel façon Excel, dîme fixe à 20%). Budget+
est une application plus large, pensée pour des utilisateurs africains
francophones, avec un design glassmorphism premium et des écrans conçus sur
Banani (import via MCP).

Budget+ couvre à terme : Dashboard, Revenus, Dépenses, Investissements, Épargne,
Objectifs, Calendrier, Rapports, Conseiller IA, Réglages. Le périmètre est trop
large pour un seul cycle spec → plan → implémentation : il est découpé en
sous-projets, chacun brainstormé séparément. **Ce document couvre uniquement le
premier sous-projet : Auth + Dashboard + Revenus + Dépenses + Dîme** — le socle
financier de l'application. Les sous-projets suivants (Investissements, Épargne,
Objectifs, Calendrier, Rapports, Conseiller IA, Réglages avancés) auront chacun
leur propre spec, une fois ce socle validé et fonctionnel.

## 1. Périmètre de ce sous-projet

Écrans inclus :
- Connexion / Inscription (email + mot de passe, et Google OAuth)
- Dashboard (état du mois en cours : KPI, répartition dépenses/revenus)
- Revenus (liste, ajout/édition/suppression)
- Dépenses (liste, ajout/édition/suppression, case à cocher « payée »)
- Dîme (historique, marquage payée/due)

Explicitement hors périmètre pour ce sous-projet (traité dans des sous-projets
futurs) :
- Investissements, Épargne, Objectifs, Calendrier, Rapports, Conseiller IA
- Graphiques historiques 12 mois et panneau de recommandations avancé
- Génération automatique des revenus/dépenses récurrentes à partir du champ
  `frequence` (le champ existe en base mais reste informatif dans ce sous-projet)
- Réglages avancés (le `pourcentage_dime` est modifiable en base dès ce
  sous-projet, mais l'écran Réglages dédié n'est pas construit ici)

## 2. Stack technique

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui (Radix)
- Framer Motion + react-countup (animations, chiffres animés)
- Recharts (donut de répartition dépenses/revenus pour ce sous-projet)
- React Hook Form + Zod (formulaires, validation)
- TanStack Query (cache/fetch Supabase)
- Backend : Supabase (Postgres + Auth + Realtime)
- Déploiement cible : Vercel

Aucun projet Supabase n'existe encore : les migrations de ce spec seront
appliquées lors de la création du projet, en session interactive (le MCP
Supabase nécessite une authentification navigateur non disponible en session
non-interactive).

## 3. Origine des écrans (Banani)

Aucun écran Banani n'existe encore pour Budget+. L'utilisateur va générer les
maquettes (Connexion, Dashboard, Revenus, Dépenses, Dîme) sur Banani et les
exporter via MCP. Le présent spec prépare l'architecture, le schéma de données
et le design system (section 7) qui guideront à la fois les prompts Banani et
l'intégration du markup exporté en composants React/Tailwind. Le plan
d'implémentation détaillé écran par écran sera affiné à mesure que les exports
Banani arrivent.

## 4. Schéma Supabase

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nom text,
  devise text not null default 'FCFA',
  langue text not null default 'fr',
  pourcentage_dime numeric not null default 15,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  type text not null check (type in ('revenu','depense')),
  couleur text,
  icone text,
  created_at timestamptz not null default now()
);

create table incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  nom text not null,
  montant numeric not null check (montant >= 0),
  frequence text, -- informatif uniquement dans ce sous-projet
  date date not null,
  created_at timestamptz not null default now()
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  nom text not null,
  montant numeric not null check (montant >= 0),
  date_echeance date not null,
  priorite text,
  statut text not null check (statut in ('paye','a_venir','en_retard')) default 'a_venir',
  date_paiement timestamptz,
  created_at timestamptz not null default now()
);

create table tithes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  revenu_brut numeric not null default 0,
  pourcentage numeric not null,
  montant numeric not null default 0,
  statut text not null check (statut in ('paye','du')) default 'du',
  date date not null, -- toujours le 1er du mois concerné
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table profiles enable row level security;
alter table categories enable row level security;
alter table incomes enable row level security;
alter table expenses enable row level security;
alter table tithes enable row level security;

create policy "profiles_owner" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "categories_owner" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "incomes_owner" on incomes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expenses_owner" on expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tithes_owner" on tithes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### 4.1 Seed automatique à l'inscription

Un trigger `on_auth_user_created` déclenche `handle_new_user()` qui :
1. Crée la ligne `profiles` (pourcentage_dime = 15 par défaut).
2. Crée les catégories par défaut :
   - Revenu : Salaire, Freelance / Activité annexe
   - Dépense : Logement, Transport, Nourriture, Assurances & remboursements,
     Soins & vie courante, Loisirs & sorties, Imprévus / autres

### 4.2 Realtime

Realtime activé sur `incomes`, `expenses`, `tithes`. Toute insertion, mise à
jour ou suppression sur ces tables pousse un événement que le client utilise
pour invalider le cache TanStack Query correspondant.

## 5. Logique métier

### 5.1 Dîme
- À chaque changement du total des revenus du mois courant, la ligne `tithes`
  du mois (`date` = 1er du mois) est upsert :
  `revenu_brut` = total des revenus du mois, `montant` = `revenu_brut ×
  pourcentage_dime / 100`.
- L'utilisateur peut marquer la dîme du mois comme payée (`statut = 'paye'`),
  ce qui l'ajoute à l'historique consultable sur l'écran Dîme.
- Le `pourcentage_dime` est stocké sur `profiles` et lu par le module de calcul
  à chaque recalcul (pas de valeur codée en dur).

### 5.2 Solde disponible (portée de ce sous-projet)
```
Solde = Σ revenus du mois − Σ dépenses payées du mois − dîme du mois
```
Cette formule sera étendue avec `− épargne − investissements` dans les
sous-projets suivants, dans le même module `calculations.ts` — sans réécrire la
logique existante.

### 5.3 Cycle de mise à jour temps réel
Cocher une dépense → `statut = 'paye'`, `date_paiement = now()` → l'update
Postgres déclenche un événement Realtime → le hook TanStack Query correspondant
est invalidé → `calculations.ts` recalcule solde/totaux → l'UI anime la
transition (react-countup pour les chiffres, Framer Motion pour les cartes).

## 6. Architecture applicative

### 6.1 Module de calcul (`lib/calculations.ts`)
Module pur (aucun import React/Supabase), testé unitairement avec Vitest,
source unique de vérité pour la dîme, le solde et les totaux. Réutilisable tel
quel côté client et, plus tard, côté Edge Function (Deno) pour le Conseiller IA
ou les exports — sans duplication de la logique métier en SQL.

```typescript
interface MonthFinancials {
  totalRevenus: number;
  pourcentageDime: number;
  dime: number;
  totalDepensesPayees: number;
  totalDepensesAVenir: number;
  totalDepensesEnRetard: number;
  solde: number;
}

function computeMonthFinancials(
  incomes: Income[],
  expenses: Expense[],
  pourcentageDime: number
): MonthFinancials
```

### 6.2 Data layer
Hooks TanStack Query : `useProfile`, `useCategories`, `useIncomes(month)`,
`useExpenses(month)`, `useTithe(month)`. Chaque hook s'abonne à son canal
Supabase Realtime correspondant et invalide sa clé de cache sur événement.

### 6.3 Auth
Supabase Auth : email/mot de passe + Google OAuth (bouton « Continuer avec
Google »). Redirection post-connexion vers le Dashboard.

### 6.4 Arborescence des fichiers

```
budget-plus/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── calculations.ts
│   │   ├── calculations.test.ts
│   │   └── formatters.ts        # FCFA, séparateur milliers, dates fr
│   ├── types/
│   │   └── budget.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProfile.ts
│   │   ├── useCategories.ts
│   │   ├── useIncomes.ts
│   │   ├── useExpenses.ts
│   │   └── useTithe.ts
│   ├── components/
│   │   ├── ui/
│   │   │   └── GlassCard.tsx    # + composants shadcn générés au besoin
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── AppLayout.tsx
│   │   ├── dashboard/
│   │   │   ├── KpiRow.tsx
│   │   │   └── RepartitionDonut.tsx
│   │   ├── incomes/
│   │   │   └── IncomeForm.tsx
│   │   ├── expenses/
│   │   │   └── ExpenseForm.tsx
│   │   ├── tithe/
│   │   │   └── TitheHistory.tsx
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       └── SignupForm.tsx
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── IncomesPage.tsx
│   │   ├── ExpensesPage.tsx
│   │   ├── TithePage.tsx
│   │   └── LoginPage.tsx
│   └── router.tsx
├── supabase/
│   └── migrations/
│       └── 0001_init.sql
├── .env.example
├── tailwind.config.ts
├── vite.config.ts
├── package.json
└── README.md
```

## 7. Système de design (guide pour les prompts Banani)

- Fond : dégradé sombre bleu-vert, formes floues (`blur-3xl`) en arrière-plan.
- `GlassCard` : `bg-white/[18-25%] backdrop-blur-[30-40px] border border-white/15
  rounded-3xl` (coins 24px), ombres douces.
- Typo Inter, chiffres KPI en gras, taille large.
- Montants : séparateur de milliers par espace, suffixe « FCFA », sans
  décimales (ex. `900 000 FCFA`).
- Sémantique couleur : payé/positif en vert doux (`emerald`), en retard/négatif
  en rouge doux (`red`).
- Accent principal : à confirmer avec l'utilisateur sur le premier écran Banani
  (Dashboard) — non figé dans ce spec.
- Responsive complet desktop / laptop / tablette / mobile, sans scroll
  horizontal.

## 8. Tests

- Vitest sur `calculations.ts` : cas dérivés de l'exemple historique (revenus
  900 000 FCFA, dîme 15% → 135 000 FCFA, avec dépenses payées variées),
  couvrant notamment le cas solde négatif.
- Pas de tests end-to-end automatisés dans ce sous-projet ; validation visuelle
  du rendu et du responsive via `superpowers-chrome` une fois les écrans Banani
  intégrés.

## 9. Livrables

1. Code source structuré (`npm install && npm run dev`).
2. Migration SQL Supabase (`0001_init.sql`) : tables, RLS, trigger de seed.
3. Module `calculations.ts` + tests Vitest.
4. Écrans Connexion, Dashboard, Revenus, Dépenses, Dîme intégrés à partir des
   exports Banani.
5. README : installation, variables d'environnement, déploiement Vercel.

## 10. Hors périmètre (explicitement exclu de ce sous-projet)

- Investissements, Épargne, Objectifs, Calendrier, Rapports, Conseiller IA
  (sous-projets futurs).
- Génération automatique de revenus/dépenses récurrentes.
- Écran Réglages dédié (le `pourcentage_dime` est modifiable en base mais pas
  encore via une UI dédiée).
- Multi-devise (FCFA uniquement, en dur) et internationalisation (français
  uniquement).
- Import/export de données (CSV, PDF).
