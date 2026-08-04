# Refonte des cartes Tarifs (landing page) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raccourcir les 4 cartes de plans de la section Tarifs de la landing page à l'essentiel (titre, prix, CTA), déplacer le détail complet des fonctionnalités dans une nouvelle modale déclenchée par un lien "Voir le détail", et recolorer la carte du plan populaire (Pro) en doré/jaune clair à la place du dégradé vert foncé actuel.

**Architecture:** Extraction du modèle de données pricing (`pricingData.ts`) hors de `LandingSocialProof.tsx`, création d'un sous-composant partagé `PlanPriceBlock` (rendu du prix/réduction, utilisé par la carte ET la modale) et d'un nouveau composant `PricingDetailsModal` (détail complet). `LandingSocialProof.tsx` garde un état local `openPlanKey` pour piloter l'ouverture de la modale.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS (classes utilitaires + styles inline existants), react-router-dom (`Link`), pas de nouvelle dépendance.

## Global Constraints

- Aucune nouvelle dépendance npm — tout se fait avec ce qui est déjà utilisé dans le projet (React, react-router-dom, l'`Icon` maison).
- Pas de framework de test composant dans ce projet (seuls `src/lib/*.test.ts` existent, testent des fonctions pures) : la vérification de ces tâches est **visuelle**, via `npx tsc --noEmit` (types) + Playwright headless (rendu), pas de nouveaux fichiers `*.test.tsx`.
- Couleurs exactes à respecter (issues du spec) : accent doré `#F59E0B` → `#D97706` (dégradés badge/CTA existants, inchangés), fond carte Pro `linear-gradient(160deg, #FDE9C8 0%, #FBCB6B 100%)`, texte/icônes à fort contraste sur fond doré `#B45309`, accent vert inchangé `#10B981` pour les 3 autres plans.
- Le CTA principal de chaque carte (`Link to="/signup"`) garde son comportement actuel : navigation directe, jamais intercepté par la modale.
- Fichier source de référence : `src/components/landing/LandingSocialProof.tsx` (section Pricing : lignes ~31-397 au moment de l'écriture de ce plan).

---

### Task 1 : Extraire le modèle de données pricing dans `pricingData.ts`

**Files:**
- Create: `src/components/landing/pricingData.ts`
- Modify: `src/components/landing/LandingSocialProof.tsx:1-118` (imports + suppression des définitions déplacées)

**Interfaces:**
- Produces : `export interface PricingItem { label: string; valeur: number }`, `export interface Plan { key: string; title: string; subtitle: string; items: PricingItem[]; prixAppel: number; prixBarre?: number; featured: boolean; free: boolean }`, `export const plans: Plan[]`, `export const priceFormatter: Intl.NumberFormat`, `export function totalValeur(items: PricingItem[]): number`

Ce refactor ne change ni le rendu ni le comportement : c'est une pure extraction. Les tâches suivantes construiront dessus.

- [ ] **Step 1 : Créer `src/components/landing/pricingData.ts`**

```ts
export interface PricingItem {
  label: string;
  valeur: number;
}

const essentielItems: PricingItem[] = [
  { label: "Gestion illimitée des revenus", valeur: 50000 },
  { label: "Gestion des dépenses & échéances", valeur: 35000 },
  { label: "Épargne & investissement personnels", valeur: 40000 },
  { label: "Objectifs financiers illimités", valeur: 35000 },
  { label: "Rapports & statistiques détaillés", valeur: 25000 },
  { label: "Historique complet & synchronisation cloud", valeur: 25000 },
  { label: "Sauvegarde sécurisée des données", valeur: 15000 },
];

const gratuitLabels = new Set([
  "Gestion illimitée des revenus",
  "Gestion des dépenses & échéances",
  "Épargne & investissement personnels",
  "Rapports & statistiques détaillés",
  "Sauvegarde sécurisée des données",
]);
const gratuitItems: PricingItem[] = essentielItems.filter((item) => gratuitLabels.has(item.label));

const iaItem: PricingItem = { label: "Assistant IA personnalisé (conseils & analyses)", valeur: 25000 };

const businessItems: PricingItem[] = [
  { label: "Accompagnement prioritaire", valeur: 20000 },
  { label: "Accès anticipé aux nouvelles fonctionnalités", valeur: 10000 },
];

export const priceFormatter = new Intl.NumberFormat("fr-FR");

export function totalValeur(items: PricingItem[]) {
  return items.reduce((sum, item) => sum + item.valeur, 0);
}

export interface Plan {
  key: string;
  title: string;
  subtitle: string;
  items: PricingItem[];
  prixAppel: number;
  /** Prix "avant réduction" affiché barré — uniquement sur l'offre populaire. */
  prixBarre?: number;
  featured: boolean;
  free: boolean;
}

export const plans: Plan[] = [
  {
    key: "gratuit",
    title: "Iwadu Free",
    subtitle: "Pour découvrir Iwadu Cash",
    items: gratuitItems,
    prixAppel: 0,
    featured: false,
    free: true,
  },
  {
    key: "essentiel",
    title: "Iwadu Essentiel",
    subtitle: "Tout ce qu'il faut pour démarrer",
    items: essentielItems,
    prixAppel: 5000,
    featured: false,
    free: false,
  },
  {
    key: "complet",
    title: "Iwadu Pro",
    subtitle: "Tout l'essentiel + l'IA",
    items: [...essentielItems, iaItem],
    prixAppel: 15000,
    prixBarre: 20000,
    featured: true,
    free: false,
  },
  {
    key: "business",
    title: "Iwadu Business",
    subtitle: "Pour aller plus loin, en priorité",
    items: [...essentielItems, iaItem, ...businessItems],
    prixAppel: 25000,
    featured: false,
    free: false,
  },
];
```

- [ ] **Step 2 : Retirer ces définitions de `LandingSocialProof.tsx` et importer depuis le nouveau fichier**

Dans `src/components/landing/LandingSocialProof.tsx`, supprimer entièrement les lignes 31-118 (interfaces `PricingItem`/`Plan`, `essentielItems`, `gratuitLabels`, `gratuitItems`, `iaItem`, `businessItems`, `priceFormatter`, `totalValeur`, `plans`) et ajouter l'import en haut du fichier :

```ts
import { plans, priceFormatter, totalValeur } from "@/components/landing/pricingData";
```

Le reste du fichier (le JSX de la section Pricing) ne change pas dans cette étape — il continue à utiliser `plans`, `priceFormatter`, `totalValeur` exactement comme avant, juste importés au lieu d'être définis localement.

- [ ] **Step 3 : Vérifier les types**

Run: `npx tsc --noEmit`
Expected: aucune erreur (sortie vide, code de sortie 0)

- [ ] **Step 4 : Vérification visuelle de non-régression**

```bash
npm run dev &
timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null; do sleep 1; done'
```

Ouvrir `http://localhost:5173/#tarifs` (ou naviguer puis scroller jusqu'à la section Tarifs) dans un navigateur ou via Playwright headless, et vérifier que les 4 cartes s'affichent **exactement comme avant** (toujours avec la liste complète des fonctionnalités à ce stade — ce refactor ne change que l'origine des données, pas le rendu).

Arrêter le serveur ensuite :
```bash
netstat -ano | grep ':5173' | grep LISTENING | awk '{print $5}' | sort -u | xargs -r -I{} taskkill //F //PID {}
```

- [ ] **Step 5 : Commit**

```bash
git add src/components/landing/pricingData.ts src/components/landing/LandingSocialProof.tsx
git commit -m "refactor: extrait le modèle de données pricing dans pricingData.ts"
```

---

### Task 2 : Raccourcir les cartes + composant `PlanPriceBlock` + recoloration du plan Pro

**Files:**
- Create: `src/components/landing/PlanPriceBlock.tsx`
- Modify: `src/components/landing/LandingSocialProof.tsx` (JSX de la grille de cartes, section `{/* Pricing */}`)

**Interfaces:**
- Consumes : `Plan`, `priceFormatter` depuis `@/components/landing/pricingData` (Task 1)
- Produces : `export function PlanPriceBlock({ plan }: { plan: Plan }): JSX.Element` — utilisé ici dans la carte, et réutilisé tel quel dans `PricingDetailsModal` (Task 3)

- [ ] **Step 1 : Créer `src/components/landing/PlanPriceBlock.tsx`**

```tsx
import type { Plan } from "@/components/landing/pricingData";
import { priceFormatter } from "@/components/landing/pricingData";

interface PlanPriceBlockProps {
  plan: Plan;
}

/** Bloc prix (avec réduction éventuelle) partagé entre la carte et la modale de détail. */
export function PlanPriceBlock({ plan }: PlanPriceBlockProps) {
  const accent = plan.featured ? "#B45309" : "#10B981";

  if (plan.free) {
    return (
      <div className="text-center">
        <p className="font-headings font-semibold" style={{ fontSize: "44px", lineHeight: 1 }}>
          <span style={{ color: accent }}>Gratuit</span>
        </p>
      </div>
    );
  }

  const reduction = plan.prixBarre
    ? Math.round((1 - plan.prixAppel / plan.prixBarre) * 100)
    : null;

  return (
    <div className="text-center">
      {reduction !== null && plan.prixBarre ? (
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-sm line-through text-muted-foreground">
            {priceFormatter.format(plan.prixBarre)} FCFA
          </span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
            style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
          >
            -{reduction}%
          </span>
        </div>
      ) : (
        <p className="text-sm font-medium mb-1 text-muted-foreground">Aujourd&apos;hui, à partir de</p>
      )}
      <p className="font-headings font-semibold" style={{ fontSize: "38px", lineHeight: 1, color: "var(--color-ink)" }}>
        <span style={{ color: accent }}>{priceFormatter.format(plan.prixAppel)}</span>
      </p>
      <p className="text-sm mt-1 text-muted-foreground">FCFA/mois</p>
    </div>
  );
}
```

- [ ] **Step 2 : Réécrire la carte dans `LandingSocialProof.tsx`**

Remplacer tout le bloc JSX de la grille de plans (à l'intérieur de `<GlassSection id="tarifs" ...>`, le `.map((plan, planIndex) => { ... })`) par :

```tsx
{plans.map((plan, planIndex) => (
  <Reveal key={plan.key} delay={planIndex * 140}>
    <div
      className={`rounded-3xl overflow-hidden transition-transform duration-300 relative h-full flex flex-col ${
        plan.featured ? "lg:-translate-y-3 hover:lg:-translate-y-4" : "hover:-translate-y-1.5"
      }`}
      style={{
        background: plan.featured
          ? "linear-gradient(160deg, #FDE9C8 0%, #FBCB6B 100%)"
          : "rgba(255,255,255,0.96)",
        backdropFilter: "blur(40px)",
        border: plan.featured ? "2px solid #F59E0B" : "1px solid rgba(16,185,129,0.3)",
        boxShadow: plan.featured
          ? "0 44px 110px rgba(245,158,11,0.35), 0 8px 32px rgba(0,0,0,0.15)"
          : "0 32px 80px rgba(0,0,0,0.22)",
      }}
    >
      {plan.featured && (
        <div
          className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-xs font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
        >
          👑 Le plus populaire
        </div>
      )}

      <div
        className="px-8 py-6 border-b"
        style={{ borderColor: plan.featured ? "rgba(180,83,9,0.2)" : "rgba(16,185,129,0.15)" }}
      >
        <p
          className="font-headings font-semibold"
          style={{ color: plan.featured ? "#B45309" : "#10B981", fontSize: "22px" }}
        >
          {plan.title}
        </p>
        <p className="text-xs mt-1 text-muted-foreground">{plan.subtitle}</p>
      </div>

      <div className="px-8 py-8 flex-1 flex flex-col">
        <div className="mt-auto">
          <div className="mb-6">
            <PlanPriceBlock plan={plan} />
          </div>

          <Link
            to="/signup"
            className="block text-center w-full py-4 rounded-xl text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-95"
            style={
              plan.featured
                ? { background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 8px 32px rgba(245,158,11,0.4)" }
                : { background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 8px 32px rgba(16,185,129,0.32)" }
            }
          >
            {plan.free ? "Commencer gratuitement" : "Créer mon compte gratuitement"}
          </Link>

          <button type="button" className="block text-center w-full mt-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Voir le détail des fonctionnalités →
          </button>
        </div>
      </div>
    </div>
  </Reveal>
))}
```

Ajouter l'import de `PlanPriceBlock` en haut du fichier :

```ts
import { PlanPriceBlock } from "@/components/landing/PlanPriceBlock";
```

Le bouton "Voir le détail" n'a volontairement pas encore de `onClick` à ce stade : le projet a `noUnusedLocals: true` dans `tsconfig.app.json`, donc introduire un état `openPlanKey` ici sans encore le lire (la lecture arrive avec la modale, Task 3) ferait échouer `tsc --noEmit`. Le câblage complet (état + `onClick` + modale) se fait en une seule fois dans la Task 3.

- [ ] **Step 3 : Vérifier les types**

Run: `npx tsc --noEmit`
Expected: aucune erreur

- [ ] **Step 4 : Vérification visuelle**

```bash
npm run dev &
timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null; do sleep 1; done'
```

Avec Playwright headless (`npx --yes playwright install chromium` si pas déjà fait, puis un script Node important `chromium` de `playwright`), naviguer vers `http://localhost:5173/#tarifs`, capturer un screenshot de la section, et vérifier :
- Les 4 cartes sont nettement plus courtes (plus de liste de fonctionnalités visible sur les cartes)
- La carte "Iwadu Pro" a un fond doré clair (dégradé `#FDE9C8 → #FBCB6B`), pas vert foncé
- Chaque carte affiche : titre, sous-titre, prix, bouton CTA, puis le lien "Voir le détail des fonctionnalités →"
- Aucune erreur dans la console (`page.on("console", ...)`)

Arrêter le serveur ensuite (même commande `taskkill` que Task 1).

- [ ] **Step 5 : Commit**

```bash
git add src/components/landing/PlanPriceBlock.tsx src/components/landing/LandingSocialProof.tsx
git commit -m "feat: raccourcit les cartes Tarifs et recolore le plan populaire en doré"
```

---

### Task 3 : Modale `PricingDetailsModal` + branchement complet

**Files:**
- Create: `src/components/landing/PricingDetailsModal.tsx`
- Modify: `src/components/landing/LandingSocialProof.tsx` (rendu conditionnel de la modale)

**Interfaces:**
- Consumes : `Plan`, `priceFormatter`, `totalValeur` depuis `@/components/landing/pricingData` (Task 1) ; `PlanPriceBlock` depuis `@/components/landing/PlanPriceBlock` (Task 2)
- Produces : `export function PricingDetailsModal({ plan, onClose }: { plan: Plan; onClose: () => void }): JSX.Element` ; l'état `openPlanKey`/`setOpenPlanKey` dans `LandingSocialProof.tsx`, introduit dans cette tâche

- [ ] **Step 1 : Créer `src/components/landing/PricingDetailsModal.tsx`**

```tsx
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import type { Plan } from "@/components/landing/pricingData";
import { priceFormatter, totalValeur } from "@/components/landing/pricingData";
import { PlanPriceBlock } from "@/components/landing/PlanPriceBlock";

interface PricingDetailsModalProps {
  plan: Plan;
  onClose: () => void;
}

export function PricingDetailsModal({ plan, onClose }: PricingDetailsModalProps) {
  const valeurTotale = totalValeur(plan.items);
  const accent = plan.featured ? "#B45309" : "#10B981";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: "rgba(0, 0, 0, 0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl relative p-8"
        style={{
          background: "rgba(255,255,255,0.98)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(16,185,129,0.2)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          type="button"
          aria-label="Fermer"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.06)" }}
        >
          <Icon i="x" size={16} />
        </button>

        {plan.featured && (
          <div
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white mb-3"
            style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
          >
            👑 Le plus populaire
          </div>
        )}

        <p className="font-headings font-semibold" style={{ color: accent, fontSize: "22px" }}>
          {plan.title}
        </p>
        <p className="text-sm text-muted-foreground mt-1 mb-6">{plan.subtitle}</p>

        <div className="flex flex-col gap-3">
          {plan.items.map((item) => (
            <div key={item.label} className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <Icon i="check-circle" size={14} style={{ color: accent, flexShrink: 0, marginTop: "2px" }} />
                <p className="text-sm" style={{ color: "var(--color-ink)", opacity: 0.8 }}>
                  {item.label}
                </p>
              </div>
              {!plan.free && (
                <p className="text-xs font-medium flex-shrink-0 whitespace-nowrap text-muted-foreground">
                  {priceFormatter.format(item.valeur)}
                </p>
              )}
            </div>
          ))}
        </div>

        {!plan.free && (
          <div
            className="py-3 px-4 rounded-lg mt-6 mb-6"
            style={{
              background: plan.featured ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.08)",
              border: plan.featured ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(16,185,129,0.15)",
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
                Valeur totale
              </p>
              <p className="text-base font-semibold line-through" style={{ color: accent }}>
                {priceFormatter.format(valeurTotale)} FCFA
              </p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <PlanPriceBlock plan={plan} />
        </div>

        <Link
          to="/signup"
          className="block text-center w-full py-4 rounded-xl text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-95"
          style={
            plan.featured
              ? { background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 8px 32px rgba(245,158,11,0.4)" }
              : { background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 8px 32px rgba(16,185,129,0.32)" }
          }
        >
          {plan.free ? "Commencer gratuitement" : "Créer mon compte gratuitement"}
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : Brancher l'état, le clic et la modale dans `LandingSocialProof.tsx`**

Ajouter les imports en haut du fichier :

```ts
import { useState } from "react";
import { PricingDetailsModal } from "@/components/landing/PricingDetailsModal";
```

Déclarer l'état en tête de la fonction `LandingSocialProof` :

```ts
export function LandingSocialProof() {
  const [openPlanKey, setOpenPlanKey] = useState<string | null>(null);
  return (
    // ...
```

Ajouter le `onClick` sur le bouton "Voir le détail des fonctionnalités →" créé en Task 2 :

```tsx
<button
  type="button"
  onClick={() => setOpenPlanKey(plan.key)}
  className="block text-center w-full mt-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
>
  Voir le détail des fonctionnalités →
</button>
```

Juste avant la fermeture de `<GlassSection id="tarifs" ...>` (après la `</div>` qui ferme la grille des 4 cartes, toujours à l'intérieur de cette `GlassSection`), ajouter :

```tsx
{openPlanKey && (
  <PricingDetailsModal
    plan={plans.find((p) => p.key === openPlanKey)!}
    onClose={() => setOpenPlanKey(null)}
  />
)}
```

- [ ] **Step 3 : Vérifier les types**

Run: `npx tsc --noEmit`
Expected: aucune erreur

- [ ] **Step 4 : Vérification visuelle complète (Playwright)**

```bash
npm run dev &
timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null; do sleep 1; done'
```

Écrire et exécuter un script Playwright (Node, `import { chromium } from "playwright"`) qui, pour chacune des 4 clés de plan (`gratuit`, `essentiel`, `complet`, `business`) :
1. Navigue vers `http://localhost:5173/`, scroll jusqu'à `#tarifs`
2. Clique sur le bouton "Voir le détail des fonctionnalités →" de la carte correspondante
3. Vérifie que la modale affiche le bon titre de plan (`plan.title`) et le bon nombre de fonctionnalités
4. Capture un screenshot de la modale
5. Vérifie la fermeture par clic sur le bouton × (`page.click('button[aria-label="Fermer"]')`)
6. Rouvre la modale, vérifie la fermeture par clic sur le fond (backdrop)
7. Rouvre la modale, vérifie la fermeture par la touche `Escape`
8. Vérifie que le lien CTA dans la modale a bien `href="/signup"`

Vérifier `console --errors` vide sur l'ensemble du parcours. Confirmer aussi via screenshot que la carte "Iwadu Pro" reste dorée et les 3 autres blanches (pas de régression Task 2).

Arrêter le serveur ensuite (même commande `taskkill` que Task 1).

- [ ] **Step 5 : Commit**

```bash
git add src/components/landing/PricingDetailsModal.tsx src/components/landing/LandingSocialProof.tsx
git commit -m "feat: ajoute la modale de détail des plans tarifaires"
```
