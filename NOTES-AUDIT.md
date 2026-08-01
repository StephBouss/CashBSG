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
