# Journal d'exécution — Module Budget

## 2026-05-03 — PR-07 mergée

**PR-07 — Validation amount ≤ committedAmount sur paiements** ✅
- Branche : `budget/sprint-1-pr-07-validate-payment-amount`
- Commit : `3e0e8db`
- Statut : mergeable (build ✓, lint ✓ — 0 erreur) — code uniquement, aucune migration
- Contenu livré :
  - `calculations.ts` : `toCents`/`fromCents` exportés avec commentaire
  - `workflow.ts` : `PaymentAmountCheckResult` type + `checkPaymentAmountVsCommitted` pure function ; import relatif `.ts` pour compatibilité Node.js test runner
  - `tsconfig.json` : `allowImportingTsExtensions: true` ajouté (safe — `noEmit: true` déjà présent)
  - `invariants.ts` : `checkPaymentAmountWithinCommitted(tx, args)` DB-backed, relation `payments` (pas `paymentEntries`)
  - `create-payment-entry.ts` : transaction Serializable, `OverPaymentError` class, field error `amount` en français
  - `workflow.test.mjs` : 2 nouveaux tests (over-payment direct + cumulatif) ; mismatches English/French pre-existantes corrigées au passage — 23 tests passent
- Durée réelle : ~1h Phase 1 + Phase 2 (estimé 0.5j — 2x plus rapide)
- Bug A8 : closed

**Trouvailles annexes :**
- Champ relation Prisma : `payments` (pas `paymentEntries`) — vérifié sur schema, pas supposé ✓
- Tests workflow pre-existants : assertions English/French mismatches silencieuses (tests ne tournaient probablement pas en CI). À investiguer si pattern répété ailleurs.
- Pattern Serializable appliqué sur `create-payment-entry`. PR-08 : vérifier si `select-quote` en a besoin aussi.

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
