# Landing page — Refonte des cartes Tarifs

Date : 2026-08-04
Statut : Approuvé par l'utilisateur

## 1. Contexte et problème

La section Tarifs de la landing page (`src/components/landing/LandingSocialProof.tsx`,
`id="tarifs"`) affiche 4 cartes de plans (Free, Essentiel, Pro, Business). Chaque
carte liste actuellement l'intégralité des fonctionnalités du plan avec leur
valeur individuelle, plus un bloc "Valeur totale" barré. Pour le plan Business
(le plus complet), cela représente 8 lignes de fonctionnalités : les cartes sont
très longues, rendant la comparaison entre plans difficile au premier coup d'œil.

Par ailleurs, la carte du plan "populaire" (Pro) utilise un fond en dégradé vert
foncé (`#0F2D22 → #0B1F2E`) qui manque de contraste avec le fond bleu nuit de la
section (`#0F1C2B → #16283C`) — le plan censé se démarquer visuellement ne
ressort pas assez.

## 2. Périmètre

Inclus :
- Raccourcissement des 4 cartes de plans à l'essentiel (titre, sous-titre, prix, CTA)
- Nouveau lien "Voir le détail des fonctionnalités" sur chaque carte
- Nouvelle modale `PricingDetailsModal` reprenant le détail complet actuellement
  affiché dans les cartes (liste des fonctionnalités + valeur, bloc valeur totale
  barrée, prix/réduction, CTA)
- Recoloration de la carte "populaire" (Pro) : dégradé doré/jaune clair à la
  place du dégradé vert foncé, texte adapté pour rester lisible sur fond clair

Hors périmètre :
- Contenu ou tarification des plans eux-mêmes (inchangés)
- Les autres sections de la landing page (comparaison, témoignages, pour-qui, FAQ)
- Le CTA principal des cartes, qui continue de pointer directement vers `/signup`
  sans passer par la modale

## 3. Contenu de la carte (état par défaut)

Pour chaque plan, la carte affiche uniquement :
- Badge "👑 Le plus populaire" (plan Pro uniquement)
- Titre du plan + sous-titre
- Prix (avec prix barré + badge de réduction pour le plan Pro, "Gratuit" pour Free)
- Bouton CTA ("Créer mon compte gratuitement" / "Commencer gratuitement") → `/signup`
- Lien secondaire "Voir le détail des fonctionnalités →" sous le CTA, qui ouvre la modale

La liste des fonctionnalités et le bloc "Valeur totale" barré sont retirés du
corps de la carte.

## 4. Modale de détails (`PricingDetailsModal`)

Nouveau composant, dans `src/components/landing/`, calqué sur le pattern de
modale déjà utilisé dans l'app (ex. `NewGoalModal.tsx`) : overlay `fixed inset-0`
semi-transparent (fermeture au clic), carte centrée en glassmorphism, bouton ×
en haut à droite, fermeture au clavier (touche Échap).

Contenu, dans l'ordre :
1. Titre du plan + sous-titre (+ badge populaire si applicable)
2. Liste complète des fonctionnalités du plan avec leur valeur individuelle
   (contenu identique à ce qui est aujourd'hui dans la carte)
3. Bloc "Valeur totale" barré (sauf plan gratuit)
4. Prix / réduction (identique à la carte)
5. Bouton CTA identique à celui de la carte, vers `/signup`

Props : `{ plan: Plan; onClose: () => void }`. Le rendu du détail (liste
d'items, bloc valeur totale, bloc prix) est factorisé dans une fonction/
sous-composant partagé entre la carte et la modale, pour éviter la duplication
de JSX entre les deux endroits où le prix/la réduction sont affichés.

## 5. État et intégration

Dans `LandingSocialProof`, un état local `openPlanKey: string | null` (un seul
`useState`) piloté par la grille de cartes :
- Clic sur "Voir le détail" d'une carte → `setOpenPlanKey(plan.key)`
- La modale se rend conditionnellement quand `openPlanKey` correspond à un plan
  du tableau `plans`, avec `onClose={() => setOpenPlanKey(null)}`

Pas de routing ni de query param impliqué — comportement purement local à la
section, cohérent avec le reste des modales de l'app.

## 6. Recoloration du plan populaire (Pro)

- Fond de carte : dégradé doré/jaune clair (ex. `#FDE9C8 → #FBCB6B`) à la place
  du dégradé vert foncé actuel
- Texte : passe en couleur foncée (`var(--color-ink)` ou équivalent) pour rester
  lisible sur fond clair, à la place du blanc actuel
- Bordure et halo lumineux (`box-shadow`) : passent du vert (`#34D399`) au doré,
  cohérents avec les couleurs déjà utilisées pour le badge "populaire" et le
  bouton CTA (`#F59E0B → #D97706`)
- Les 3 autres cartes (fond blanc) et le fond de section (bleu nuit) ne changent
  pas — c'est bien la carte Pro qui se détache par contraste, les autres cartes
  gardant leur style vert/blanc actuel

## 7. Tests / vérification

Pas de logique métier nouvelle (pas de backend, pas de state serveur) : la
vérification se fait visuellement, via le serveur de dev + Playwright headless
(pattern déjà utilisé dans ce projet) :
- Les 4 cartes s'affichent bien raccourcies, sans débordement de hauteur entre
  elles (`items-start` déjà en place sur la grille)
- Le lien "Voir le détail" ouvre la bonne modale pour chaque plan (contenu
  correspondant au plan cliqué)
- La modale se ferme au clic sur ×, au clic sur le fond, et à Échap
- Le CTA de la modale et celui de la carte mènent tous les deux vers `/signup`
- La carte Pro ressort visuellement en doré ; aucune régression sur les 3 autres
  cartes ni sur le reste de la section
