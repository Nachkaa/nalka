# Journal d'exécution — Module Budget

## PR-06 — démarrée le [date]
Sujet : Réversibilité paiements + audit trail PaymentLog
Bug : A4
État : Phase 2 en cours

### Phase 1 confirmé
- markPaymentEntryPaid n'a pas de transaction (à refactor)
- Pas de mutation unpaid (à créer)
- UI one-way (à enrichir avec menu contextuel)
- Schema PaymentLog validé avec note nullable, sans previousAmount

### Décisions
- UI : menu contextuel (Option C)
- Note : champ DB présent, pas dans UI v1
- Transactions sur les 2 mutations

## 2026-05-05 — PR-09 mergée

**PR-09 — Email rappel paiements J-7 + J-1 via Vercel Cron** ✅
- Branche : `budget/sprint-1-pr-09-payment-reminder-email`
- Commits : Phase 2 implémentation complète
- Statut : mergée (build ✓, lint ✓, TypeScript ✓)
- Contenu livré :
  - `src/emails/PaymentReminderEmail.tsx` : template table-based, tokens cohérents InviteEmail, badges J-1/J-7, groupé par event
  - `src/features/budget/server/queries/get-payments-due-soon.ts` : query globale unique, fenêtre ±12h pour absorber timezones, `paidAt: null`, include organizers OWNER + ADMIN
  - `src/features/budget/server/send-payment-reminder.ts` : skip si 0 paiements, groupe par event, formate montants/dates en français, appelle `sendMail`
  - `src/app/api/cron/payment-reminders/route.ts` : auth `Bearer CRON_SECRET`, groupe par organizer en mémoire (no N+1), logs structurés `[PAYMENT_REMINDER]`
  - `vercel.json` : cron quotidien `0 9 * * *` (9h UTC ≈ 11h Paris)
  - `.env.example` : créé, documente `CRON_SECRET` + variables SMTP + AUTH_URL
- Validation : build ✓, lint ✓, TypeScript ✓
- Tests manuels Ethereal : `{"processed":2,"sent":2,"skipped":0}` — multi-organizer (Aurèle + Juliette), greeting personnalisé, montants/dates formatés en français, badges J-1/J-7 visibles
- Auth route : 401 sans Bearer ✓, 401 mauvais token ✓, 200 bon token ✓
- Bug A23 : closed
- Durée réelle : ~2h (vs 2.5j estimé) — réutilisation lib/mail + React Email + Ethereal dev

**Prérequis prod :**
Définir `CRON_SECRET` dans Vercel Dashboard avant déploiement batch fin Sprint 1.

**Décision idempotence :**
Option A retenue (pas de migration). Cron Vercel une fois/jour — double-envoi seulement si relancement manuel. Documenté en tech-debt si besoin confirmé post-lancement.

### Sprint 1 à 6/7 effective sur main
PR-04 ✓, PR-05 ✓, PR-07 ✓, PR-08 ✓, PR-09 ✓, PR-10 ✓ (no-op)
Reste : PR-06 (PaymentLog + démarquage paiements) — ~2-2.5j

## 2026-05-04 — PR-10 vérifiée (no-op)

**PR-10 — Passer l'étape budget total (allowSkip)** ✅ no-op

### Constat
Lors de la vérification empirique, la fonctionnalité "passer l'étape budget total" est déjà disponible — probablement intégrée dans le travail B2B du collaborateur ou présente depuis une PR antérieure.

### Décision
PR-10 marquée no-op. Sprint 1 effectif : PR-04, PR-05, PR-07, PR-08 + travail B2B = 4 PR fonctionnelles + 1 vérification.

### Reste Sprint 1
- PR-06 (PaymentLog + démarquage paiements) — gros morceau ~2-2.5j
- PR-09 (cron email rappel paiements) — ~2j

Sprint 1 à 5/7 vérifiées.

## 2026-05-04 — Travail B2B externe mergé

### Origine
Passe externe par un collaborateur sur le PC en l'absence d'Aurèle.
41 fichiers modifiés + nouveau dossier `docs/audit/b2b-transition/`.

### Découpé en 4 commits logiques
- c628a7b — docs B2B transition + cleanup
- 348dc78 — marketing public (home, sections, SEO)
- acce463 — tunnel création (Budget toggle ajouté + microcopy)
- ff12d7d — module Budget + shell (microcopy + layouts)

### Validation
- Build OK, lint OK
- 6 tests manuels passés (Test 1 critique : PR-05 cohabite avec l'ajout du Budget toggle dans le tunnel — pas de 404)
- Régression-tests PR-07 (over-payment) et PR-08 (vendor unique) toujours OK

### Note
Journal Budget restauré à la version main avant commit (le collaborateur avait modifié le journal Sprint 1 ; gardé propre).

### Sprint 1 à 4/8 mergé
PR-04, PR-05, PR-07, PR-08 ✓
Reste : PR-06 (PaymentLog), PR-09 (cron email), PR-10 (allowSkip)

## 2026-05-03 — PR-07 mergée

**PR-07 — Validation amount ≤ committedAmount sur paiements** ✅
- Branche : `budget/sprint-1-pr-07-validate-payment-amount`
- Commit : `3e0e8db`
- Statut : mergeable (build ✓, lint ✓ — 0 erreur) — code uniquement, aucune migration
- Contenu livré :
  - `calculations.ts` : `toCents`/`fromCents` exportés
  - `workflow.ts` : `PaymentAmountCheckResult` type + `checkPaymentAmountVsCommitted` pure function
  - `tsconfig.json` : `allowImportingTsExtensions: true` (safe — `noEmit: true` déjà présent)
  - `invariants.ts` : `checkPaymentAmountWithinCommitted(tx, args)` DB-backed, relation `payments` (pas `paymentEntries`)
  - `create-payment-entry.ts` : transaction Serializable, `OverPaymentError` class, field error `amount` en français avec montants formatés
- Validation : build ✓, lint ✓, 4 scénarios manuels en dev local
- Durée utile : ~1h (estimé 0.5j) — ~1h supplémentaire perdue sur tooling test
- Bug A8 : closed

**Décision tooling :**
Tentative d'automatisation Node native échouée sur interop CJS/ESM (friction `@/` path alias → Node.js). Décision : pas de tests automatisés pendant Sprint 1. Sprint Tooling dédié post-Sprint-1 couvrira Budget + autres modules avec Vitest + CI.

**Leçon :**
Tests manuels uniquement pour le reste du Sprint 1. Ne pas simuler une infrastructure qu'on n'a pas encore.

**Trouvaille :**
Champ relation Prisma : `payments` (pas `paymentEntries`) — à vérifier systématiquement sur schema avant d'écrire les queries.

## 2026-05-02 — PR-05 mergée

**PR-05 — Auto-création Budget à l'activation du module** ✅
- Branche : `budget/sprint-1-pr-05-auto-create-budget`
- Commit : `c8b85c8`
- Statut : mergeable (build ✓, lint ✓ — 0 erreur) — code uniquement, aucune migration
- Contenu livré :
  - `ensure-budget-exists.ts` (nouveau) : utilitaire idempotent `ensureBudgetForEvent`
  - `event/actions.ts` : job BUDGET étendu — crée aussi le record Budget à la création d'event
  - `module-manager.ts` : refactor BUDGET case, suppression du bloc inline 15 lignes
  - `_shared.ts` : log `[BUDGET_INTEGRITY]` avec `eventId + eventSlug` avant `notFound()`
  - `tech-debt.md` : TD-03 ajouté (`Budget.totalBudget` non nullable)
- Durée réelle : Phase 1 ~20 min + Phase 2 ~30 min = **< 1h** (estimé 0.5 j)
- Dérapage : Phase 1 initiale incorrecte ("fix déjà en place") — corrigée par grep systématique
- Bug A1 : closed (les 2 chemins couverts, factorisé)

**Histoire :**
Première Phase 1 concluait à tort que le fix existait déjà dans `module-manager.ts:240`.
Le grep `prisma\.budget\.create` a révélé le 2ème chemin oublié dans `event/actions.ts`.
Bug latent (StepModules ne propose pas encore Budget au picker) mais correctement patché.

**Leçon :** grep systématique avant Phase 2, même quand l'analyse initiale semble conclusive.

## 2026-05-02 — PR-04 mergée (⚠ déploiement prod groupé fin Sprint 1)

**PR-04 — Migration DB : drop currency + rename EXPENSES → BUDGET** ✅
- Branche : `budget/sprint-1-pr-04-db-rename`
- Commit : `0a29828`
- Statut : mergeable (build ✓, lint ✓) — **prod NON déployée**
- Migrations en attente prod (ordre strict) :
  1. `20260502210415_drop_budget_currency`
  2. `20260502210500_rename_event_module_key_to_budget`
- Procédure de déploiement prod (fin Sprint 1 uniquement) :

```bash
# Sur le VPS
cd /path/to/nalka
git pull origin main
pnpm install
pnpm prisma migrate deploy
pm2 restart nalka
```

- Durée réelle : Codex sandboxé 8m40s + ~30 min finalisation manuelle = **< 1h** (estimé 1 j)
- Notes :
  - Codex a respecté la contrainte ALTER TYPE RENAME VALUE manuelle (pas de drop/recreate)
  - `EventExpensesSettings` maintenu hors scope intentionnellement
  - Warning Prisma 6.18 → 7.x noté en TD-02 (non urgent)
- Dérapage : aucun

## 2026-05-02 — PR-03 mergée

**PR-03 — Visual cleanup + responsive lines view** ✅
- Branche : `budget/sprint-0-pr-03-visual-cleanup`
- Commit : `f9cee0b`
- Statut : mergeable (build ✓, lint ✓ — 0 erreur)
- Contenu livré :
  - `quote-comparison-list.tsx` : dates (`requestedAt`, `receivedAt`, `validUntil`) affichées uniquement si non-null
  - `payment-entry-list.tsx` : "Réglé le" conditionnel sur `isPaid`
  - `budget-summary-screen.tsx` : `"Retenu"` → `BUDGET_METRIC_LABELS.committed` ("Engagé") + helper mis à jour
  - `budget-line-card.tsx` (nouveau) : carte mobile avec Cible / Engagé / Reste à régler conditionnel (BOOKED + paidAmount > 0), badges sourcing + paiement, CTA contextuel
  - `budget-lines-view.tsx` (nouveau) : wrapper `block md:hidden` cartes / `hidden md:block` table
  - `budget-lines-screen.tsx` : swap `BudgetLinesTable` → `BudgetLinesView`
- Dérapage : aucun

## 2026-05-02 — Sprint 0 démarré, PR-01 mergée

**PR-01 — constants + labels** ✅
- Branche : `budget/sprint-0-PR-01-constants-labels`
- Commit : `cb828a4`
- Statut : mergeable (build ✓, lint ✓ — 0 erreur)
- Contenu livré : accents corrigés (15 labels), VENDOR_LABELS (Prestataire), BUDGET_METRIC_LABELS (Engagé), BUDGET_EMPTY_STATE_LABELS, BUDGET_TOOLTIP_LABELS
- Dérapage : aucun
- Durée réelle : ~30 min (estimé 1 j — tâche plus simple que prévu, les nouveaux objets de constantes ne touchent pas de composants existants)

## 2026-05-01 — PR-02 mergeable

**PR-02 — Form UX** ✅
- Branche : `budget/sprint-0-pr-02-form-ux`
- Commit : `7043815`
- Statut : mergeable (build ✓, lint ✓ — 0 erreur)
- Contenu livré :
  - `budget-line-form-dialog.tsx` : `inputMode="decimal"` sur les montants, `type="date"` N/A (pas de champ date), marqueurs `*` sur libellé + montant cible, `aria-required`, note interne en Collapsible ChevronDown, footer avec légende gauche / boutons droite
  - `add-sourcing-vendor-dialog.tsx` : `type="date"` sur "Contacté le", VENDOR_LABELS sur tous les textes prestataire, `*` sur nom prestataire + `aria-required`, footer avec légende
  - `add-received-quote-dialog.tsx` : `inputMode="decimal"` sur montant, `type="date"` sur receivedAt + validUntil, suppression du champ "Note de décision", VENDOR_LABELS, `*` sur montant + reçu le, footer avec légende
  - `add-payment-entry-dialog.tsx` : `inputMode="decimal"` sur montant, `type="date"` sur dueDate, `*` sur libellé + montant + date d'échéance + `aria-required`, footer avec légende
  - `tech-debt.md` : TD-01 ajouté (iOS Safari comma rejection sur `estimatedAmount`)
- Dérapage : contexte compacté en milieu de session — reprise propre sans perte
- Durée réelle : ~1 j (estimé 1 j)

**Prochaine PR** : PR-05



---

_Format : Date — PR — Statut — Ce qui a dérapé (si applicable) — Prochaine PR_

