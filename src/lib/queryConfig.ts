/** staleTime/gcTime partagés par catégorie de donnée (C7.5) — évite les
 * re-fetch systématiques au changement d'onglet/focus, coûteux en données
 * mobiles, sans risquer de données périmées :
 * - REFERENCE : quasi-statique (catégories, profil) — changée uniquement
 *   par une mutation de l'utilisateur, qui invalide déjà la query.
 * - LIVE : tenue à jour par un abonnement Supabase Realtime dédié
 *   (postgres_changes) qui invalide la query dès qu'une vraie modification
 *   arrive — un staleTime long ne crée donc pas de risque de péremption.
 * - VOLATILE : agrégat dérivé sans push temps réel dédié — staleTime court
 *   pour rester correct après une mutation faite ailleurs dans l'app.
 */
export const REFERENCE_QUERY_OPTIONS = { staleTime: 30 * 60_000, gcTime: 60 * 60_000 } as const;
export const LIVE_QUERY_OPTIONS = { staleTime: 5 * 60_000, gcTime: 15 * 60_000 } as const;
export const VOLATILE_QUERY_OPTIONS = { staleTime: 30_000, gcTime: 5 * 60_000 } as const;
