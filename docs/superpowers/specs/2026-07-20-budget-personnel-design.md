# Application de budget personnel « Glassmorphism » — Spec de conception

Date : 2026-07-20
Statut : Approuvé par l'utilisateur

## 1. Contexte et objectif

Application web de budget personnel mensuel, en français, en FCFA (XAF), inspirée :
- du modèle de calcul de `Budget_personnel_light.xlsx` (structure des lignes, règle de la dîme, sous-totaux, écarts, solde) ;
- de la mise en page du dashboard « WealthWise » (cartes KPI, graphique Prévu vs Réel, donut de répartition, panneau de recommandations) — repris pour la **structure**, pas pour le style visuel.

Direction visuelle : **Glassmorphism** (verre dépoli, dégradé sombre, accent teal).

## 2. Stack technique

- React 18 + TypeScript + Vite
- Tailwind CSS
- Recharts
- Supabase (Postgres + Auth) — authentification email/mot de passe **et** Google OAuth
- TanStack Query (cache/fetch des données Supabase)
- Zustand (état UI léger : mois/année sélectionnés, sidebar)
- date-fns, Zod (validation des formulaires)
- Déploiement cible : Vercel

## 3. Modèle de données et règles métier

### 3.1 Principe général
Chaque « ligne » de budget (ex. Logement, Nourriture, Épargne) possède, pour un mois donné, une valeur **Prévu** et une valeur **Réel** saisies par l'utilisateur. Tout le reste (dîme, sous-totaux, écarts, solde) est **calculé en temps réel**, jamais stocké.

### 3.2 Catégories personnalisables
Contrairement à l'Excel (postes fixes), l'utilisateur peut ajouter/renommer/archiver ses propres postes dans chacune des 4 sections : `revenu`, `fixe`, `variable`, `epargne`. Les catégories par défaut (reprises de l'Excel) sont créées automatiquement à l'inscription.

### 3.3 Règle de la dîme (centrale, non modifiable)
- Dîme = 20% du **Total revenus** (Prévu et Réel calculés séparément), recalculée automatiquement à chaque changement de revenu.
- L'utilisateur ne peut ni saisir ni modifier ce montant directement.
- Revenu disponible = Total revenus − Dîme.

### 3.4 Calculs dérivés (formules exactes de l'Excel)
- Total revenus = somme des lignes de section `revenu`.
- Sous-total dépenses fixes = somme des lignes de section `fixe`.
- Sous-total dépenses variables = somme des lignes de section `variable`.
- Sous-total épargne = somme des lignes de section `epargne`.
- Total sorties = Dîme + Sous-total fixes + Sous-total variables + Sous-total épargne.
- Solde = Total revenus − Total sorties (positif = mois équilibré, négatif = déficit).
- Écart (par ligne et par total/sous-total) = Réel − Prévu.

Ces formules sont implémentées dans un module unique `lib/calculations.ts`, testé unitairement contre les valeurs de l'exemple Excel fourni (revenus 900 000/850 000 FCFA, dîme 180 000/170 000 FCFA, solde 20 000/-25 000 FCFA).

## 4. Schéma Supabase

```sql
-- Catégories personnalisables par utilisateur
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section text not null check (section in ('revenu','fixe','variable','epargne')),
  name text not null,
  sort_order int not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- Une ligne (Prévu/Réel) par catégorie par mois
create table budget_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  month date not null, -- toujours le 1er du mois
  prevu numeric not null default 0,
  reel numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, month)
);

alter table categories enable row level security;
alter table budget_entries enable row level security;

create policy "categories_owner" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "budget_entries_owner" on budget_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### 4.1 Seed automatique à l'inscription
Une fonction `handle_new_user()` déclenchée par un trigger `on_auth_user_created` (sur `auth.users`) :
1. Insère les catégories par défaut (Revenu principal, Revenu complémentaire, Logement, Transport, Assurances & remboursements, Nourriture, Soins & vie courante, Loisirs & sorties, Imprévus/autres, Épargne, Investissements).
2. Insère 12 mois de `budget_entries` de démonstration pour l'année en cours, avec des valeurs variées (dérivées de l'exemple Excel) pour que les graphiques annuels soient immédiatement lisibles.

La dîme n'est **pas** stockée : elle est dérivée à l'affichage.

## 5. Moteur de calcul (`lib/calculations.ts`)

Module pur (aucune dépendance React/Supabase), testable par Vitest.

```typescript
type Section = 'revenu' | 'fixe' | 'variable' | 'epargne';

interface EntryLine {
  categoryId: string;
  name: string;
  section: Section;
  prevu: number;
  reel: number;
}

interface MonthBudget {
  totalRevenusPrevu: number;
  totalRevenusReel: number;
  dimePrevu: number;
  dimeReel: number;
  revenuDisponiblePrevu: number;
  revenuDisponibleReel: number;
  sousTotalFixesPrevu: number;
  sousTotalFixesReel: number;
  sousTotalVariablesPrevu: number;
  sousTotalVariablesReel: number;
  sousTotalEpargnePrevu: number;
  sousTotalEpargneReel: number;
  totalSortiesPrevu: number;
  totalSortiesReel: number;
  soldePrevu: number;
  soldeReel: number;
  ecarts: Record<string, number>;
}

function computeMonthBudget(lines: EntryLine[]): MonthBudget
```

## 6. KPI et dashboard

**Cartes KPI (5) :**
1. Budget mensuel — Total revenus prévu (+ variation vs mois précédent)
2. Dépenses réelles — Total sorties réel + % du budget consommé
3. Taux d'épargne — (Sous-total épargne réel / Total revenus réel) %, avec indicateur d'objectif
4. Dîme du mois — montant prélevé
5. Solde du mois — vert si positif, rouge si négatif

**Graphiques (Recharts) :**
- `PrevuVsActuelChart` — LineChart 12 mois, deux séries, tooltip custom façon maquette (mois, Budget, Actual)
- `RepartitionDonut` — PieChart en anneau, une couleur par catégorie de sortie, légende avec %
- `EcartsBarChart` — BarChart horizontal, rouge si dépassement, vert sinon

**Panneau recommandations (bonus) :** tri des lignes par écart décroissant (réel > prévu), 2-3 pires postes, suggestion de texte générée côté client.

## 7. Système de design Glassmorphism

- Fond : dégradé sombre `from-slate-900 via-teal-900 to-slate-800`, formes floues `blur-3xl` en arrière-plan
- `GlassCard` : `bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg shadow-black/10`
- Police : Inter, chiffres KPI en `text-3xl font-bold`
- Accent principal : teal (`teal-400`/`teal-500`)
- Montants négatifs : `text-red-400` ; positifs : `text-emerald-400`
- Sidebar translucide fixe à gauche ; grille responsive (`grid-cols-1 md:grid-cols-2 xl:grid-cols-4`)
- Format des montants : séparateur de milliers par espace, suffixe « FCFA », sans décimales (ex. `900 000 FCFA`)

## 8. Arborescence des fichiers

```
budget-personnel/
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── calculations.ts
│   │   ├── calculations.test.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   ├── types/
│   │   └── budget.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCategories.ts
│   │   ├── useBudgetMonth.ts
│   │   ├── useBudgetYear.ts
│   │   └── useBudgetStore.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── GlassCard.tsx
│   │   │   ├── KpiCard.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── MonthPicker.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── AppLayout.tsx
│   │   ├── dashboard/
│   │   │   ├── KpiRow.tsx
│   │   │   ├── PrevuVsActuelChart.tsx
│   │   │   ├── RepartitionDonut.tsx
│   │   │   ├── EcartsBarChart.tsx
│   │   │   └── Recommendations.tsx
│   │   ├── budget/
│   │   │   ├── BudgetTable.tsx
│   │   │   ├── BudgetSection.tsx
│   │   │   └── CategoryRow.tsx
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       └── SignupForm.tsx
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── BudgetPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── SettingsPage.tsx
│   └── router.tsx
├── supabase/
│   ├── migrations/
│   │   └── 0001_init.sql
│   └── seed_data.ts
├── .env.example
├── tailwind.config.ts
├── vite.config.ts
├── package.json
└── README.md
```

## 9. Fonctionnalités attendues

- Sélecteur de mois/année ; chaque mois sauvegardé séparément dans Supabase.
- Saisie Prévu/Réel par ligne, recalcul instantané côté client.
- Authentification Supabase (email/mot de passe + Google OAuth) ; un compte = ses propres budgets.
- Gestion des catégories : ajout, renommage, archivage (soft-delete) par section.
- Vue annuelle agrégée pour les graphiques 12 mois.
- Persistance : rechargement des données au retour de l'utilisateur.
- Responsive mobile → desktop.

## 10. Livrables

1. Code source complet et structuré (`npm install && npm run dev`).
2. Schéma SQL Supabase (migration + policies RLS + trigger de seed).
3. README : installation, variables d'environnement, déploiement Vercel.
4. Seed automatique de données d'exemple à l'inscription (voir §4.1).

## 11. Hors périmètre (explicitement exclu)

- Multi-devise (FCFA uniquement, en dur).
- Internationalisation (français uniquement, pas de système i18n).
- Dîme configurable ou désactivable.
- Import/export de données (CSV, PDF) — non demandé.
