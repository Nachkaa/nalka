# Journal d'exécution — Module Budget

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

**Prochaine PR** : PR-03 — Visual cleanup (quote-comparison-list, payment-entry-list, budget-summary-screen responsive)

---

_Format : Date — PR — Statut — Ce qui a dérapé (si applicable) — Prochaine PR_
