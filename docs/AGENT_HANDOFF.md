# FESTI-ICE — Relève technique à jour

**Dernière mise à jour :** 2026-10-16, fuseau America/Toronto.
**Dépôt :** `takatakca/festiiceca`, branche de publication `main`.
**Dernier commit de code entièrement validé :** `9b3182d8fe12ed7b13b99acca5d2f413e07dd53f`. Le commit qui contient cette relève est ultérieur; récupérer son SHA exact depuis GitHub.
**Dernière tâche terminée :** dissocier l'enregistrement des paiements du service Resend et compenser les holds de checkout Stripe expiré/non persisté.
**Tâche actuelle :** rétablir la publication de la bonne version sur Vercel; autoriser et vérifier le backend FESTI-ICE, puis compléter les fonctions bloquées.

## Fichiers modifiés dans cette reprise

- `WORKLOG.md` (claim puis clôture).
- `src/lib/checkout.server.ts` : `settleCheckout` protège les paiements avec `paymentProcessingConfigured()`, sans exiger Resend; `deliverOrderTickets` continue de vérifier Resend.
- `tests/payment-readiness.test.ts` : régression de paiement pendant une panne de messagerie.
- `supabase/migrations/20261016200000_checkout_session_compensation.sql` : compensation sûre de hold sans ID de session persisté, après expiration Stripe.
- `tests/sql/checkout-integration-assertions.sql` : cas de compensation et de refus d'une session différente; correction de l'ordre d'évaluation SQL du test; `.github/workflows/database-guards.yml` : application de la migration dans une base jetable avant les assertions.
- `docs/PROJECT_STATUS.md`, `docs/TASK_QUEUE.md`, `docs/AGENT_HANDOFF.md`, `docs/DEPLOYMENT.md`, `docs/DECISIONS.md` mis à jour.

## Vérifications réelles

- Lecture d'`AGENTS.md`, précédente relève, file de tâches, WORKLOG, commits, PRs/issues (aucune ouverte), routes/SQL et CI.
- GitHub Actions commit `9b3182d8`: app CI `38957983237` SUCCESS (installation/lint sémantique/tests Node/build SSR/smoke/Vercel artifact); PostgreSQL CI `38957983184` SUCCESS, intégration migration initiale + compensation, capacité et paiement.
- Échecs intermédiaires `0cc9906e` et `0403b3da` traités: guillemets SQL dollar-quotés, puis test d'effets secondaires exécutés dans des statements SQL distincts. Dernier CI vert, ne pas répéter ces erreurs résolues.
- Vercel `list_deployments`: dernier READY visible `dpl_Bhs6FEcmhLA5xUeoP7473c2kMFAv` au SHA **plus ancien** `e69cfccf66bba66d822095ab37c9a90bf1419ebc`. Aucun READY vérifié pour `9b3182d8`; POST déploiement manuel précédent 403 Forbidden sur `takatakcas-projects`.
- Vercel domaines: seul `festiiceca.vercel.app` est inscrit et vérifié, pas de domaine officiel `.ca`. Aucun GET public avec SHA validé.
- Aucun accès/modification à une production Supabase, aucun paiement/courriel/test scanner réel.

## Blocages et accès requis

1. **Vercel :** droits de déploiement au scope `takatakcas-projects` (403); vérifier/autoriser le connecteur ou l'intégration Git, sans contourner la protection ni force-push. Vérifier la vraie publication SHA puis `/api/health`.
2. **Supabase :** code `supabase/config.toml` = `xsozkxcnjmyjjaorkxlx`; projet Supabase nommé FESTI ICE visible = `anyiaszbjsyrxfgjbwdt` mais sans tables applicatives lors du dernier audit. Ne migrer aucun sans preuve d'autorité et sauvegarde; ne pas créer de projet facturable.
3. **Domaine :** `festiice.ca` vs `festi-ice.ca` non résolu, absent de Vercel. Besoin d'une décision propriétaire fondée sur la configuration DNS; vérifier HTTPS public.
4. **Paiements :** secrets Stripe/Resend et expéditeur authentifié absents des variables projet inspectées auparavant; aucun E2E réel de commande, livraison QR, scan, remboursement ou reprise après panne.
5. **Identité :** le master GROUPE TAKATAK est l'autorité pour l'identité et les droits par produit/entreprise. Le `user_roles` Supabase local ne constitue pas à lui seul un bridge TAKATAK validé. Intégration centrale non prouvée, données interentreprises strictement cloisonnées.
6. **Tâches ouvertes :** résolution auditée des dossiers financiers, reprises d'email après fin des webhooks, météo/replanification et tests charge/accessibilité. Une tentative de création de la migration de résolution a été refusée par l'outil; aucun fichier correspondant n'a été commité.

## Statut réel

**Code :** poussé sur `main`, CI verte pour `9b3182d8`.
**Déploiement :** Vercel READY pour un SHA précédent seulement, accès public non prouvé.
**Ventes :** `FESTIICE_CHECKOUT_ENABLED` doit rester `false`.
**Sécurité :** RPC en repo et tests éphémères, mais dernières migrations non appliquées à la base autorisée.

## Prochaine action exacte

1. Recharger `AGENTS.md`, `WORKLOG.md` et cette relève; comparer `main` SHA, GitHub Actions, déploiement Vercel et exact URL/HTTPS; corriger toute CI régressive.
2. Avec une connexion Vercel réellement autorisée à `takatakcas-projects`, déclencher/vérifier la version `main` actuelle puis `GET /api/health` depuis le domaine officiel vérifié.
3. Identifier le projet Supabase original autorisé, faire sauvegarde, appliquer migrations avec stratégie de rollback, vérifier permissions/RLS et entitlements centralisés TAKATAK.
4. Configurer les vrais secrets côté hébergeur, tester Stripe en environnement de test (paiement→QR→Resend→scan→remboursement), puis poursuivre les modules financiers et météo non terminés.
