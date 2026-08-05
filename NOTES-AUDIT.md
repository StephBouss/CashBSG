# Notes d'audit — problèmes découverts hors périmètre du chantier en cours

Fichier prévu par l'instruction générale n°2 de `CORRECTIONS-IWADU-CASH.md` :
consigner ici tout problème découvert pendant un chantier mais qui ne relève
pas de son périmètre, sans le corriger sur le moment.

---

## `src/lib/plan.test.ts` — test désynchronisé de l'implémentation (préexistant)

**Découvert pendant** : C0.1 (suppression de la Dîme), lors de l'exécution de
`npm run test` pour valider le chantier.

**Constat** : `plan.test.ts` teste `canAccessGoals("free")` en attendant
`false`, alors que `src/lib/plan.ts` retourne désormais toujours `true`
(gating volontairement désactivé, décision produit documentée en commentaire
dans `plan.ts` — voir aussi C6.1 de `CORRECTIONS-IWADU-CASH.md`, qui prévoit
de réactiver ce gating avec une limite de 2 objectifs en Free). Ce test échoue
donc déjà sur `master`, indépendamment de tout changement fait dans cette
itération.

**Pourquoi non corrigé ici** : hors périmètre de C0.1 (nettoyage Dîme) et de
la Phase 1 (sécurité) traitées dans cette itération. La correction naturelle
(aligner le test sur le comportement actuel, ou réactiver le gating) relève
de C6.1, phase explicitement reportée.

**Action suggérée pour C6.1** : au moment de réactiver `canAccessGoals` avec
la limite « 2 objectifs en Free », remettre ce test en cohérence avec le
comportement alors implémenté.

---

## Vulnérabilités npm préexistantes (brace-expansion, postcss, react-router)

**Découvert pendant** : C7.3 (parcours Playwright), lors de l'installation de
`@playwright/test` comme devDependency (`npm audit` déclenché automatiquement
par `npm install`).

**Constat** : `npm audit` remonte 4 vulnérabilités (1 modérée, 3 hautes) sur
des dépendances déjà présentes avant ce chantier — `brace-expansion` (via
`typescript-eslint`), `postcss`, et `react-router` (CSRF en mode RSC, non
utilisé par cette app en SPA classique). Aucune n'est introduite par
`@playwright/test`.

**Pourquoi non corrigé ici** : hors périmètre de C7.3. `npm audit fix` risque
de faire monter `react-router-dom` vers une version majeure différente sans
revue — à traiter dans un chantier dédié aux dépendances (proche de C7.4, qui
touche déjà le nettoyage de dépendances mortes).

---

## Contrastes de couleur insuffisants sur les couleurs de marque (C7.6)

**Découvert pendant** : C7.6 (accessibilité), en mesurant au script (formule
de contraste WCAG) les combinaisons texte/fond du thème clair par défaut.

**Constat** : `--color-muted-foreground`/`--color-text-secondary` (texte
secondaire semi-transparent) a été corrigé dans ce chantier (opacité 0.55 →
0.65, cf. `src/index.css`). En revanche, plusieurs usages des couleurs de
marque restent sous 4,5:1 en thème clair par défaut :
- Texte blanc sur bouton `--color-primary` (`#10b981`) : contraste ≈ 2,5:1
  (boutons "Ajouter", "Créer", "Valider", etc., texte `text-sm font-medium`
  — trop petit/pas assez gras pour bénéficier du seuil réduit "grand texte").
- `--color-primary` utilisé comme couleur de texte (liens actifs, montants
  mis en avant) sur fond carte : contraste ≈ 2,4:1.
- `--color-danger` (`#ef4444`) utilisé comme couleur de texte (messages
  d'erreur `text-xs text-danger`) sur fond carte : contraste ≈ 3,6:1.

**Pourquoi non corrigé ici** : contrairement au texte secondaire (simple
ajustement d'opacité), corriger ces cas obligerait à assombrir les couleurs
de marque (vert primaire, rouge danger) utilisées comme fond ET comme texte
dans toute l'app (boutons, badges, icônes, liens) — une décision de
design/branding avec un impact visuel large, pas un simple correctif de
code. Hors périmètre d'un chantier d'audit technique.

**Action suggérée** : décision produit à prendre — soit assombrir légèrement
`--color-primary`/`--color-danger` pour les usages texte (ex : introduire
`--color-primary-text`/`--color-danger-text`, des variantes plus foncées
dédiées au texte, distinctes des couleurs de fond), soit accepter le
contraste actuel en le compensant par la taille/graisse du texte (seuil WCAG
AA "grand texte" = 3:1 dès 18,7px, ou 14px en gras).
