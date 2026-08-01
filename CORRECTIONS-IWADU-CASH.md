# Plan de corrections — Iwadu Cash

Document d'exécution destiné à Claude Code. Il reprend **l'intégralité** des points de l'audit du 01/08/2026, ordonnés par dépendance et par criticité.

---

## Instructions générales (à lire avant de commencer)

1. **Une branche par chantier**, nommée `fix/<id-chantier>` (ex. `fix/C1.1-privileges`). Un commit par étape logique, message explicite. Ne jamais travailler directement sur `master`.
2. **Ne rien modifier hors du périmètre du chantier en cours.** Si un problème est découvert ailleurs, le noter dans un fichier `NOTES-AUDIT.md` à la racine et continuer.
3. **Toute modification de schéma passe par une migration Supabase versionnée** (`supabase migration new <nom>`), jamais par une modification manuelle dans l'interface. Chaque migration doit avoir sa migration descendante documentée en commentaire.
4. **Avant chaque migration destructive** (suppression de colonne ou de table) : faire un export de la table concernée et le conserver dans `backups/` (non commité).
5. **Principe directeur, valable pour tout le document** : le front décide de ce qui est *affiché*, la base de données décide de ce qui est *accessible*. Toute règle qui protège un revenu, un privilège ou une donnée personnelle doit exister en SQL ou en Edge Function. Une vérification en TypeScript côté navigateur n'est jamais suffisante — elle reste utile pour l'ergonomie, mais elle double la règle serveur, elle ne la remplace pas.
6. **Critères d'acceptation** : chaque chantier se termine par la vérification explicite de ses critères. Ne pas passer au suivant tant qu'ils ne sont pas tous verts.
7. **Rapport final** : à la fin de chaque phase, produire un résumé des fichiers modifiés, des migrations créées et des points restés en suspens.

**Ordre d'exécution imposé** : Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7. Les phases 0, 1 et 2 sont bloquantes pour toute ouverture aux utilisateurs.

---

# PHASE 0 — Nettoyage produit

## C0.1 — Suppression complète de la fonctionnalité Dîme

**Objectif** : retirer la dîme de l'application, intégralement, sans laisser de code mort, de colonne orpheline ni de libellé résiduel.

**Étapes**

1. **Recensement préalable.** Lancer une recherche insensible à la casse sur l'ensemble du dépôt pour les termes : `dime`, `dîme`, `tithe`, `tithes`, `tithe_percentage`, `dimePercentage`, `TITHE`. Lister tous les fichiers touchés avant de modifier quoi que ce soit.

2. **Base de données** — nouvelle migration :
   ```sql
   -- Sauvegarder d'abord : select * from tithes;
   drop table if exists public.tithes cascade;
   alter table public.profiles drop column if exists tithe_percentage;
   -- adapter le nom exact de la colonne au schéma réel (ex. dime_percentage)
   ```
   Vérifier au préalable si des vues, triggers, fonctions ou policies référencent ces objets : 
   ```sql
   select routine_name from information_schema.routines where routine_definition ilike '%tithe%';
   select viewname from pg_views where definition ilike '%tithe%';
   ```

3. **Types TypeScript** : régénérer les types Supabase (`supabase gen types typescript`) et supprimer toute interface, type ou champ résiduel.

4. **Front** :
   - Page **Finances** : supprimer le module de gestion de la dîme (composant, onglet, cartes KPI, graphiques associés).
   - Page **Paramètres** : supprimer le champ de pourcentage de dîme et sa validation zod.
   - **Dashboard** et **Rapports** : supprimer tout KPI, ligne de tableau, série de graphique ou libellé lié à la dîme, et vérifier que les totaux restants restent cohérents après retrait.
   - **Onboarding** : vérifier qu'aucune étape n'y fait référence.
   - Supprimer les icônes, couleurs, constantes et entrées de menu devenues inutilisées.

5. **Logique métier** : supprimer les fonctions de calcul correspondantes (probablement dans `src/lib/calculations.ts`) et **leurs tests Vitest**.

6. **Conseiller IA** : retirer toute mention de la dîme du *system prompt* et du contexte financier envoyé à l'Edge Function `ai-advisor`.

7. **Administration** : supprimer les agrégats liés à la dîme de l'Edge Function `admin-dashboard` et de la page correspondante.

8. **Textes** : CGU, politique de confidentialité, page d'accueil, textes marketing, README — retirer toute mention.

**Critères d'acceptation**
- Une recherche sur les 7 termes du point 1 ne renvoie plus aucun résultat dans le dépôt (hors fichier de migration qui documente la suppression).
- `tsc --noEmit` passe sans erreur.
- L'application se lance, et les pages Dashboard, Finances, Rapports, Paramètres s'affichent sans erreur console.
- Aucune requête ne référence plus `tithes`.

---

## C0.2 — Suppression de toute mention de nationalité ou de positionnement national

**Objectif** : l'application n'est associée à aucune nationalité. Aucun texte, métadonnée ou mention légale ne doit en revendiquer une.

**Étapes**

1. Rechercher dans tout le dépôt (code, textes, métadonnées, README, `package.json`, balises `<meta>`, `index.html`, fichiers de traduction) les mentions de nationalité, de pays d'origine ou de rattachement national de l'éditeur, et les supprimer.
2. **Pages légales** : reformuler CGU, mentions légales et politique de confidentialité pour qu'elles décrivent l'éditeur et le service **sans revendiquer de rattachement national**. Ce qui doit y figurer : l'identité de l'éditeur, un contact, l'hébergeur, les traitements de données et les prestataires — pas une nationalité.
3. **Métadonnées** : vérifier `<html lang>`, les balises Open Graph, le titre et la description du site.
4. Vérifier qu'aucun drapeau, symbole ou visuel n'introduit implicitement un rattachement national.

**Critères d'acceptation** : plus aucune occurrence dans le dépôt, pages légales relues et cohérentes.

---

# PHASE 1 — Sécurité (bloquant)

## C1.1 — Protéger les colonnes de privilèges de `profiles` 🔴

**Problème** : une policy RLS « owner » autorise la mise à jour de **toutes** les colonnes de la ligne. Un utilisateur peut donc modifier lui-même `is_admin`, `plan` et `plan_expires_at` depuis la console de son navigateur — donc devenir administrateur ou passer en Pro gratuitement.

**Étapes**

1. **Diagnostiquer** :
   ```sql
   select tablename, policyname, cmd, qual, with_check
   from pg_policies where tablename = 'profiles';
   ```
2. **Poser le trigger de garde** (migration) :
   ```sql
   create or replace function public.protect_profile_privileges()
   returns trigger language plpgsql security definer as $$
   begin
     if auth.role() <> 'service_role' then
       new.is_admin        := old.is_admin;
       new.plan            := old.plan;
       new.plan_expires_at := old.plan_expires_at;
     end if;
     return new;
   end $$;

   create trigger trg_protect_profile_privileges
   before update on public.profiles
   for each row execute function public.protect_profile_privileges();
   ```
3. **Vérifier que l'Edge Function d'upgrade utilise bien `service_role`**, sinon elle ne pourra plus modifier le plan.
4. Passer en revue les **autres tables** : appliquer le même raisonnement partout où une colonne d'une ligne « possédée » par l'utilisateur détermine un droit ou une valeur qu'il ne doit pas fixer lui-même.

**Critères d'acceptation**
- Depuis un client authentifié normal, `update profiles set is_admin = true` s'exécute sans erreur mais **ne change rien**.
- Idem pour `plan` et `plan_expires_at`.
- L'utilisateur peut toujours modifier nom, devise, thème, pays et WhatsApp.

---

## C1.2 — Déplacer le gating de plan côté serveur 🔴

**Problème** : `src/lib/plan.ts` s'exécute dans le navigateur. Masquer un bouton ne protège pas la donnée, qui reste accessible via l'API Supabase directement.

**Étapes**

1. **Créer la fonction SQL de référence** — elle intègre plan **et** expiration dans la même expression, pour qu'il soit impossible de vérifier l'un sans l'autre :
   ```sql
   create or replace function public.has_paid_plan()
   returns boolean language sql stable security definer as $$
     select exists (
       select 1 from public.profiles p
       where p.user_id = auth.uid()
         and p.plan in ('essentiel','pro')
         and (p.plan_expires_at is null or p.plan_expires_at > now())
     );
   $$;
   ```
2. **Réécrire les policies concernées.** Exemple pour l'historique :
   ```sql
   drop policy if exists "owner_select" on public.expenses;
   create policy "history_by_plan" on public.expenses for select using (
     auth.uid() = user_id
     and (
       date >= date_trunc('month', now()) - interval '2 months'
       or public.has_paid_plan()
     )
   );
   ```
   Appliquer le même schéma à `incomes`, `savings_movements` et toute autre table soumise à la limite d'historique.
3. **Conserver `plan.ts`** pour l'affichage, mais le faire lire l'état renvoyé par le serveur — jamais recalculer une autorisation localement.
4. **Toute nouvelle limite de plan** (nombre d'objectifs, de comptes d'épargne, quota IA — voir C6.1) doit être appliquée en base ou en Edge Function.

**Critères d'acceptation**
- Un compte Free interrogeant directement l'API sur une période ancienne ne reçoit **aucune ligne**.
- Un compte payant reçoit tout l'historique.
- Aucune régression d'affichage pour les deux types de comptes.

---

## C1.3 — Rendre l'expiration d'abonnement effective 🟠

**Étapes**

1. La condition d'expiration est déjà dans `has_paid_plan()` (C1.2) : vérifier qu'aucun code ne teste `plan` sans tester `plan_expires_at`.
2. **Tâche planifiée quotidienne** qui remet à `free` les comptes échus, pour que l'état affiché reste cohérent :
   ```sql
   create or replace function public.downgrade_expired_plans()
   returns void language sql security definer as $$
     update public.profiles
     set plan = 'free'
     where plan <> 'free' and plan_expires_at is not null and plan_expires_at < now();
   $$;
   -- planification via pg_cron, tous les jours à 02:00
   select cron.schedule('downgrade-expired', '0 2 * * *', 'select public.downgrade_expired_plans()');
   ```
   Le trigger de C1.1 laisse passer cette écriture puisqu'elle s'exécute en `security definer`. **Le vérifier explicitement en test.**

**Critères d'acceptation** : un compte dont `plan_expires_at` est dans le passé perd ses accès immédiatement (sans rechargement) et repasse en `free` au plus tard le lendemain.

---

## C1.4 — Limitation de débit 🟠

**Objectif** : empêcher qu'un seul compte fasse exploser la facture IA ou inonde la base.

**Étapes**

1. Table de compteurs (migration) :
   ```sql
   create table public.rate_limits (
     user_id uuid not null references auth.users(id) on delete cascade,
     action text not null,
     window_start timestamptz not null,
     count int not null default 0,
     primary key (user_id, action, window_start)
   );
   alter table public.rate_limits enable row level security;
   -- aucune policy pour authenticated : accès service_role uniquement
   ```
2. Fonction utilitaire partagée `checkRateLimit(userId, action, limit, windowMinutes)` appelée **en tout début** de chaque Edge Function, avant tout traitement.
3. Appliquer : `ai-advisor` (voir aussi C3.1), `client_errors` (plafond horaire par utilisateur), `upgrade_requests` (une demande en cours maximum par compte).
4. Retourner un code HTTP 429 avec un message clair, et l'afficher proprement côté front.

**Critères d'acceptation** : au-delà du seuil, l'appel est refusé sans atteindre DeepSeek ni écrire en base.

---

## C1.5 — Durcir le compte administrateur 🟠

**Étapes**

1. Activer la **2FA** sur le compte admin, et la protection contre les mots de passe compromis dans les paramètres Supabase Auth.
2. Créer le journal d'audit :
   ```sql
   create table public.admin_audit_log (
     id bigserial primary key,
     admin_id uuid not null,
     action text not null,
     target text,
     created_at timestamptz not null default now()
   );
   alter table public.admin_audit_log enable row level security;
   ```
3. Écrire une ligne depuis l'Edge Function `admin-dashboard` à chaque consultation et à chaque action sur un compte utilisateur.
4. Vérifier que la vérification `is_admin` est faite **côté serveur** dans l'Edge Function, jamais uniquement côté front.

**Critères d'acceptation** : chaque accès admin laisse une trace ; un compte non-admin appelant l'Edge Function reçoit un refus.

---

## C1.6 — Assainir `client_errors` 🟡

**Étapes**

1. **Filtrer à l'émission** : n'envoyer que message, type d'erreur, route et horodatage. Ne jamais transmettre le contenu des formulaires, les montants, les libellés de transaction ni les paramètres d'URL.
2. **Restreindre la lecture** aux seuls admins (policy `select` conditionnée à `is_admin`), l'insertion restant ouverte à l'utilisateur authentifié.
3. **Purge automatique** au-delà de 30 jours, via pg_cron.
4. Plafond d'insertions par utilisateur et par heure (C1.4).

---

## C1.7 — Tests d'isolation et d'escalade de privilèges 🔴

**C'est le test le plus rentable du projet : à écrire avant tout autre.**

**Contenu attendu** — un test d'intégration qui, avec deux utilisateurs réels créés à la volée :

1. Vérifie, **pour chaque table** (`profiles`, `incomes`, `expenses`, `expense_tracker`, `goals`, `savings_accounts`, `savings_movements`, `ai_messages`, `notifications`, `upgrade_requests`, `client_errors`) que l'utilisateur A ne peut ni lire, ni modifier, ni supprimer une ligne de l'utilisateur B.
2. Vérifie que A ne peut modifier ni son `is_admin`, ni son `plan`, ni son `plan_expires_at`.
3. Vérifie qu'un compte Free ne peut pas lire un historique ancien.
4. Vérifie qu'un compte non-admin ne peut pas appeler `admin-dashboard`.

**Critères d'acceptation** : le test échoue si l'une de ces protections saute. Il doit tourner en CI (C7.1).

---

# PHASE 2 — Intégrité des données

## C2.1 — Fusionner `expense_tracker` dans `expenses` 🟠

**Problème** : deux tables contiennent des dépenses réelles. Soit les KPIs en ignorent une (chiffres faux), soit chaque calcul doit faire l'union (risque d'oubli permanent), et rien ne détecte les doublons.

**Étapes**

1. Migration :
   ```sql
   alter table public.expenses add column source text not null default 'facture'
     check (source in ('facture','tracker'));
   alter table public.expenses alter column due_date drop not null;
   -- rendre nullables les colonnes propres aux factures (priorité, statut)

   insert into public.expenses (user_id, label, category_id, amount, source, created_at)
   select user_id, label, category_id, amount, 'tracker', created_at
   from public.expense_tracker;
   ```
2. **Contrôler les totaux avant/après** : somme par utilisateur des deux tables d'origine = somme de `expenses` après migration. Ne pas poursuivre si l'écart n'est pas nul.
3. Adapter le front : la page Tracker devient un formulaire et une liste filtrés sur `source = 'tracker'`, la page Dépenses sur `source = 'facture'`.
4. Vérifier **toutes** les agrégations (Dashboard, Rapports, `admin-dashboard`) : elles doivent désormais lire `expenses` sans filtre de source, sauf besoin explicite.
5. Supprimer `expense_tracker` seulement après validation complète, dans une migration séparée.
6. Ajouter dans l'interface une phrase explicative distinguant les deux modes de saisie, à l'endroit de la saisie.

**Critères d'acceptation** : Dashboard, Rapports et Administration affichent exactement la somme de toutes les dépenses saisies, quel que soit le mode de saisie.

---

## C2.2 — Types monétaires et formatage 🟠

**Étapes**

1. Vérifier les types :
   ```sql
   select table_name, column_name, data_type, numeric_precision, numeric_scale
   from information_schema.columns
   where table_name in ('incomes','expenses','savings_movements','savings_accounts','goals')
     and (column_name like '%amount%' or column_name like '%montant%' or column_name like '%target%');
   ```
2. Si un type flottant est trouvé : migrer en `numeric(14,2)` (`alter table ... alter column ... type numeric(14,2)`), après sauvegarde.
3. **Formatage** : le FCFA (XAF) n'a pas de sous-unité — aucun affichage de décimales dans cette devise, alors qu'elles sont nécessaires en euro. Centraliser dans `formatters.ts` une fonction unique qui décide du nombre de décimales selon la devise, et l'utiliser partout (aucun `toFixed(2)` en dur dans les composants).
4. Ajouter des tests Vitest sur cette fonction, devise par devise.

---

## C2.3 — Verrouiller le changement de devise 🟡

**Problème** : la devise est stockée sur le profil, pas sur la transaction. La changer réinterprète tout l'historique sans conversion.

**Solution retenue** (la plus simple et suffisante) : bloquer le changement de devise dès qu'au moins un revenu, une dépense ou un mouvement d'épargne existe, avec un message d'explication clair dans les Paramètres. Contrôle à faire **côté serveur** (trigger sur `profiles`), pas seulement dans le formulaire.

---

## C2.4 — Traçabilité et suppression logique 🟡

**Étapes**

1. `created_at` et `updated_at` sur toutes les tables métier, `updated_at` maintenu par trigger générique.
2. Colonne `deleted_at timestamptz` sur `incomes`, `expenses`, `savings_movements`.
3. Adapter les policies et toutes les requêtes pour exclure `deleted_at is not null`.
4. Remplacer les suppressions physiques par des suppressions logiques dans le front.
5. Option utile : une corbeille dans les Paramètres, avec restauration sous 30 jours, puis purge automatique.

---

## C2.5 — Fiabiliser les soldes d'épargne 🟡

**Étapes**

1. Déterminer si le solde de `savings_accounts` est stocké ou calculé.
2. S'il est stocké et mis à jour côté client : le faire maintenir par un **trigger** sur `savings_movements`, ou le remplacer par une **vue** qui le calcule.
3. Ajouter une requête de contrôle (à lancer mensuellement) comparant solde stocké et somme des mouvements.

---

## C2.6 — Contraintes d'intégrité et index 🔵

```sql
-- Contraintes
alter table public.expenses add constraint chk_amount_pos check (amount > 0);
alter table public.incomes  add constraint chk_amount_pos check (amount > 0);
-- règles de contribution en pourcentage
alter table public.savings_accounts add constraint chk_pct check (contribution_percentage between 0 and 100);
-- cascade explicite comptes -> mouvements
-- unicité de la clé de dédoublonnage des notifications
alter table public.notifications add constraint uq_notif_dedup unique (user_id, dedup_key);

-- Index (filtres de toutes les requêtes)
create index if not exists idx_incomes_user_date  on public.incomes (user_id, date);
create index if not exists idx_expenses_user_date on public.expenses (user_id, date);
create index if not exists idx_savmov_user_date   on public.savings_movements (user_id, created_at);
create index if not exists idx_aimsg_user_date    on public.ai_messages (user_id, created_at);
```
Adapter les noms de colonnes au schéma réel. Vérifier avec `explain analyze` qu'une requête de dashboard utilise bien les index.

---

# PHASE 3 — Intelligence artificielle

## C3.1 — Plafonner l'usage et le coût 🟠

**Étapes** (toutes dans l'Edge Function `ai-advisor`, **avant** l'appel externe)

1. **Quota mensuel par plan**, calculé depuis `ai_messages` :
   - Free : 10 messages / mois
   - Essentiel : 100 / mois
   - Pro : illimité raisonné (plafond haut, ex. 1 000, pour couper les abus)
2. **Borner `max_tokens`** dans la requête sortante.
3. **Tronquer l'historique** aux 10 derniers messages : sans cela, le coût de chaque échange croît avec la longueur du fil.
4. **Résumer le contexte financier** au lieu de l'envoyer intégralement (voir C3.2).
5. Afficher côté front le quota restant (« il vous reste N questions ce mois-ci ») — c'est aussi le meilleur levier de conversion.

**Critères d'acceptation** : au-delà du quota, aucun appel n'atteint DeepSeek et l'utilisateur reçoit un message clair proposant la mise à niveau.

---

## C3.2 — Minimiser les données envoyées au prestataire d'IA 🟠

**Étapes**

1. Auditer précisément ce qui est envoyé aujourd'hui dans le prompt.
2. Ne transmettre que ce qui est nécessaire au raisonnement : **catégories, montants agrégés, périodes**. Ni nom, ni email, ni identifiant utilisateur, ni libellé brut de transaction (un libellé peut contenir un nom de personne).
3. Documenter dans le code, en commentaire en tête de fonction, la liste exacte des champs transmis — cette liste doit correspondre à ce que dira la politique de confidentialité (C5.3).

---

## C3.3 — Anti-injection et responsabilité 🟠

**Étapes**

1. **Séparation stricte** : le contexte de données est délimité par des balises et annoncé au modèle comme donnée non fiable, à ne jamais interpréter comme une instruction. Les instructions système sont dans un bloc distinct.
2. **Interdiction explicite dans le *system prompt*** : aucune recommandation de produit financier, d'allocation ou de placement. L'IA analyse le budget passé et propose des arbitrages de dépenses, rien de plus.
3. **Mention permanente et visible** dans l'interface de chat : « Les réponses d'Iwadu sont fournies à titre informatif et ne constituent pas un conseil financier. »
4. L'IA ne doit **jamais** déclencher une écriture en base sans validation explicite de l'utilisateur.

---

## C3.4 — Saisie en langage naturel ou vocale dans le Tracker 🔵

**Objectif produit prioritaire** : c'est le levier n°1 contre l'abandon lié à la saisie manuelle.

**Étapes**

1. Champ de saisie libre (texte, puis dictée) : « j'ai acheté du pain à 500 ».
2. Edge Function dédiée qui demande au modèle une **extraction structurée en JSON strict** : article, quantité, prix, catégorie. Prompt explicite : réponse JSON uniquement, aucun texte autour.
3. **Écran de confirmation** avant enregistrement — l'utilisateur valide ou corrige. Jamais d'écriture directe.
4. Repli propre si l'extraction échoue : basculer sur le formulaire manuel pré-rempli au mieux.
5. Compter ces appels dans le quota IA (C3.1), avec un coût moindre que le chat (`max_tokens` très bas).

---

# PHASE 4 — Infrastructure et fiabilité

## C4.1 — Hébergement conforme 🔴

**Problème** : le plan gratuit de Vercel interdit l'usage commercial. Dès qu'un abonnement est vendu, le projet est en infraction, avec risque de suspension sans préavis.

**Étapes** : soit passer sur un plan Vercel payant, soit migrer vers **Cloudflare Pages** (gratuit, sans restriction d'usage commercial, adapté à une SPA React). En cas de migration : reproduire la règle de réécriture SPA de `vercel.json` (fichier `_redirects` avec `/* /index.html 200`), rebrancher les variables d'environnement, vérifier l'allowlist CORS `ALLOWED_ORIGINS` avec le nouveau domaine.

---

## C4.2 — Notifications générées côté serveur 🟠

**Problème** : les rappels sont produits côté client, donc uniquement si l'utilisateur ouvre l'application — or c'est précisément celui qui ne l'ouvre plus qu'il faut relancer. La fonctionnalité ne remplit pas son objectif.

**Étapes**

1. Fonction SQL qui balaie les abonnements arrivant à échéance (15/10/5/0 jours) et insère les notifications, en s'appuyant sur la contrainte d'unicité `(user_id, dedup_key)` de C2.6 (`on conflict do nothing`).
2. Planification quotidienne via pg_cron, dans la même exécution que `downgrade_expired_plans()` (C1.3).
3. Supprimer entièrement la génération côté client.
4. Prévoir le point d'accroche pour l'envoi email (C4.3) et, plus tard, le canal WhatsApp — ce dernier exige un consentement explicite et un moyen de désinscription.

**Critères d'acceptation** : un compte dont l'abonnement expire dans 10 jours reçoit sa notification même sans se connecter.

---

## C4.3 — SMTP tiers pour les emails transactionnels 🟠

**Problème** : le SMTP par défaut de Supabase est fortement limité et non destiné à la production. À quelques dizaines d'utilisateurs, les emails de confirmation et de réinitialisation de mot de passe cessent de partir — et un utilisateur qui ne peut pas réinitialiser son mot de passe est perdu.

**Étapes** : brancher un fournisseur (Resend, Brevo, Postmark) dans les paramètres Auth de Supabase, configurer SPF et DKIM sur le domaine, personnaliser les gabarits d'email aux couleurs de l'application, puis **tester réellement** inscription, confirmation et réinitialisation de bout en bout.

---

## C4.4 — Sauvegardes et test de restauration 🟠

**Étapes**

1. Vérifier la région du projet Supabase (au plus près des utilisateurs) et la politique de sauvegarde du plan en cours.
2. Mettre en place un **export automatisé hebdomadaire** stocké hors de Supabase.
3. **Restaurer réellement une sauvegarde** sur le projet de staging (C4.5) au moins une fois, et documenter la procédure et le temps nécessaire dans `RUNBOOK.md`.

> Une sauvegarde jamais restaurée n'est pas une sauvegarde.

---

## C4.5 — Environnement de préproduction 🟠

**Étapes** : créer un second projet Supabase (gratuit) en staging, avec un jeu de données factices ; brancher un environnement de déploiement de préproduction ; faire passer **toute** migration par staging avant production. Documenter les deux jeux de variables d'environnement.

---

## C4.6 — Observabilité 🟡

**Étapes**

1. Consulter et conserver les logs des Edge Functions ; logger explicitement les échecs d'appel DeepSeek avec leur code d'erreur et le temps de réponse.
2. Requête planifiée qui alerte en cas de volume anormal d'erreurs sur les dernières 24 h.
3. Regrouper les erreurs de `client_errors` par message dans la page Administration, avec un compteur — sans quoi la table n'est pas exploitable.

---

# PHASE 5 — Conformité et droits des utilisateurs

## C5.1 — Export des données 🟠

Edge Function qui rassemble l'ensemble des données d'un utilisateur (profil, revenus, dépenses, épargne, mouvements, objectifs, historique IA, notifications) et les renvoie en JSON et en CSV. Bouton dédié dans les Paramètres. Limiter à un export par heure (C1.4).

## C5.2 — Suppression de compte 🟠

Suppression complète en autonomie depuis les Paramètres, sans passer par un email à l'administrateur : confirmation explicite (ressaisie du mot de passe ou du libellé du compte), suppression en cascade de toutes les données, puis du compte Auth, via Edge Function en `service_role`. Vérifier qu'aucune table n'échappe à la cascade — notamment `client_errors`, `ai_messages`, `notifications`, `rate_limits` et `upgrade_requests`.

## C5.3 — Politique de confidentialité et registre des traitements 🟡

**Étapes**

1. Créer un tableau (dans le dépôt, fichier `PRIVACY.md`) : donnée collectée → finalité → durée de conservation → prestataire concerné.
2. Y faire figurer nommément **chaque prestataire** avec sa fonction : Supabase (base de données et authentification), l'hébergeur front, **DeepSeek** (conseiller IA), le fournisseur d'emailing.
3. Mettre la page « Politique de confidentialité » de l'application en conformité avec ce tableau — elle doit dire exactement ce que fait le code (voir C3.2).
4. Y ajouter la marche à suivre pour exercer l'accès, l'export et l'effacement (C5.1, C5.2).

## C5.4 — Durées de conservation appliquées 🟡

Traduire chaque durée annoncée en purge automatique planifiée : `client_errors` (30 jours), `ai_messages` (à définir), `notifications` lues (90 jours), comptes inactifs (à définir, avec relance préalable). Une durée annoncée mais jamais appliquée est pire que pas de durée du tout.

---

# PHASE 6 — Produit et modèle économique

## C6.1 — Nouveau découpage des plans 🟠

**Problème** : la seule restriction réelle est l'historique, et `canAccessGoals` est désactivé — un utilisateur Free dispose donc de la quasi-totalité de la valeur.

**Répartition à implémenter** :

| | Free | Essentiel | Pro |
|---|---|---|---|
| Revenus / dépenses | illimité | illimité | illimité |
| Historique | 3 mois | complet | complet |
| Messages IA / mois | 10 | 100 | illimité raisonné |
| Objectifs | 2 | illimité | illimité |
| Comptes d'épargne | 1 | 5 | illimité |
| Export / rapports avancés | — | oui | oui |

**Étapes**

1. Centraliser les limites dans une table de configuration ou une constante serveur — **jamais uniquement dans `plan.ts`**.
2. Appliquer chaque limite en base (policy ou trigger `before insert` qui compte les lignes existantes) ou en Edge Function.
3. **Réactiver `canAccessGoals`** avec la limite de 2 objectifs en Free.
4. Messages d'incitation clairs au moment où la limite est atteinte, pas de blocage muet.

## C6.2 — Alignement de la marque 🟡

Le dépôt s'appelle `CashBSG`, l'URL `cash-bsg.vercel.app`, le produit « Iwadu Cash ». Aligner partout : nom du dépôt, `package.json`, titre et métadonnées du site, favicon, gabarits d'email, textes légaux, futur nom de domaine. À faire **avant** la phase de test, moment où les premiers utilisateurs mémorisent la marque.

## C6.3 — Prolonger l'onboarding au-delà de la première visite 🟡

L'onboarding en 3 étapes est bien conçu mais s'arrête trop tôt. Ajouter : un premier aperçu de rapport généré dès la troisième dépense saisie, une relance à J+3 sur le canal disponible, et un objectif suggéré automatiquement à partir des premières données.

## C6.4 — Indicateurs produit 🟡

Ajouter au dashboard Administration, calculés depuis les données existantes : taux de complétion de l'onboarding, rétention à J7, nombre moyen de saisies par utilisateur actif, répartition des comptes par plan et taux de conversion. Sans ces trois premiers indicateurs, la phase de test ne produira que des impressions.

## C6.5 — Fluidifier le parcours d'upgrade 🟠

En attendant l'intégration d'un agrégateur de paiement mobile : accusé de réception automatique de la demande (email), engagement de délai affiché à l'utilisateur (« activation sous 12 h »), notification à l'administrateur à chaque nouvelle demande, et bouton d'activation en un clic dans la page Administration.

## C6.6 — Dépenses récurrentes 🔵

Modèles de charges fixes générés automatiquement chaque mois (avec validation), pour supprimer la re-saisie des 10 à 15 lignes les plus répétitives.

---

# PHASE 7 — Qualité, tests et performance

## C7.1 — Intégration continue 🟠

Workflow GitHub Actions déclenché à chaque push et pull request : installation, `tsc --noEmit`, lint, `vitest run`, build. Déploiement bloqué si le workflow échoue. Ajouter le test d'isolation RLS (C1.7) au workflow, sur le projet de staging.

## C7.2 — Tests unitaires des règles métier 🟠

Couvrir en priorité : résolution de plan et expiration, agrégations mensuelles, formatage des montants par devise (C2.2), règles de contribution en pourcentage, calcul de progression des objectifs.

## C7.3 — Parcours Playwright versionnés 🟠

Remplacer les scripts jetables par 4 parcours conservés dans le dépôt : inscription et confirmation, saisie d'une dépense, onboarding complet jusqu'au déverrouillage de l'IA, demande d'upgrade. Exécution en CI ou, a minima, avant chaque déploiement.

## C7.4 — Poids du bundle 🟡

Charger Recharts en `lazy` sur les seules pages qui l'utilisent, importer date-fns fonction par fonction, vérifier que Framer Motion n'est pas importé globalement. Mesurer avant/après avec `rollup-plugin-visualizer` et consigner les deux chiffres dans le commit.

## C7.5 — Cache des requêtes 🔵

Définir des `staleTime` explicites par type de donnée (paramètres : long ; transactions : court) pour éviter les re-fetch systématiques au changement d'onglet, coûteux en données mobiles.

## C7.6 — Accessibilité et performance d'affichage 🔵

Vérifier les ratios de contraste des textes sur fonds translucides (cible 4,5:1) et tester le rendu sur un téléphone d'entrée de gamme réel : les effets de flou sont coûteux en GPU. Prévoir une variante à transparence réduite si nécessaire.

## C7.7 — Agrégations administrateur 🟡

Remplacer les agrégations à la volée de `admin-dashboard` par des **vues matérialisées** rafraîchies toutes les heures par tâche planifiée. À faire dès que le nombre de comptes dépasse la centaine.

---

# Checklist de validation finale

À vérifier une par une avant l'ouverture aux utilisateurs :

- [ ] Aucune trace de la fonctionnalité Dîme dans le code, la base, les textes ou l'IA
- [ ] Aucune mention de nationalité nulle part
- [ ] Un utilisateur ne peut modifier ni son `plan` ni son `is_admin` (testé)
- [ ] Un utilisateur ne peut lire aucune donnée d'un autre (testé, table par table)
- [ ] Un abonnement expiré perd ses accès immédiatement
- [ ] Le quota IA est appliqué côté serveur, avant l'appel externe
- [ ] Aucune donnée nominative n'est envoyée au prestataire d'IA
- [ ] Le chat IA affiche la mention « ne constitue pas un conseil financier »
- [ ] Dashboard, Rapports et Administration affichent les mêmes totaux que la somme des saisies
- [ ] Les montants s'affichent sans décimales en FCFA
- [ ] Les notifications d'expiration partent sans que l'utilisateur se connecte
- [ ] Les emails d'inscription et de réinitialisation arrivent de façon fiable
- [ ] L'hébergement est conforme aux conditions du prestataire
- [ ] Une restauration de sauvegarde a été testée pour de vrai
- [ ] L'utilisateur peut exporter et supprimer ses données en autonomie
- [ ] La politique de confidentialité correspond exactement à ce que fait le code
- [ ] La 2FA est active sur le compte administrateur
- [ ] La CI passe au vert avant chaque déploiement

---

# Prompt de démarrage suggéré pour Claude Code

> Lis `CORRECTIONS-IWADU-CASH.md` en entier avant d'écrire la moindre ligne. Commence par la Phase 0, chantier C0.1 : fais d'abord le recensement demandé et présente-moi la liste des fichiers concernés, sans rien modifier. Je validerai avant que tu passes aux modifications. Respecte les instructions générales : une branche par chantier, migrations versionnées, aucune modification hors périmètre, et vérification explicite des critères d'acceptation avant de passer au chantier suivant.
