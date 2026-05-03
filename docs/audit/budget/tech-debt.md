# Dette technique hors scope — Module Budget

Toute dette détectée pendant une PR mais hors scope est notée ici.
Ne pas corriger in-flight. Traiter en fin de sprint ou en PR dédiée.

---

## TD-01 — iOS Safari : `estimatedAmount` silencieusement à "0.00"

**Sévérité :** Moyenne  
**Découvert dans :** PR-02  

Sur iOS Safari, `<Input type="number" inputMode="decimal">` rejette la virgule
française et set silencieusement `.value = ""`. Pour `estimatedAmount`
(`optionalMoneyStringSchema`), la chaîne vide est normalisée en `"0.00"` sans
erreur visible.  
**Risque B2B :** un poste apparaît "non estimé / gratuit" alors que l'utilisateur
a saisi 4 500.  
**Fix proposé :** passer à `type="text" inputMode="decimal"` + normalisation
virgule→point côté client dans `normalizeMoneyInput`, dans une PR dédiée à la
robustesse mobile.

---

## TD-02 — Warning Prisma 6.18 → 7.x

**Sévérité :** Faible  
**Découvert dans :** PR-04  

Prisma émet un warning lors du build indiquant une deprecation prévue pour la
version 7.x. Aucun impact fonctionnel à court terme.  
**Fix proposé :** traiter lors d'une mise à jour de dépendances dédiée, hors sprint
budget, après vérification du changelog Prisma 7.x.

## TD-03 Budget.totalBudget non nullable

Le champ est `Decimal NOT NULL`. La distinction "budget pas défini" 
vs "budget de 0 €" passe par `setupStatus`, ce qui est correct mais 
non explicite côté schema. Soit migration vers `Decimal?` (nullable), 
soit clarification documentaire dans le schema.

**Sévérité :** Basse. Pas bloquant, mais source de confusion future.

---

## F1 — Pas de CTA "Ajouter un poste" depuis la Vue d'ensemble

**Sévérité :** P1 UX — mauvais onboarding premier usage  
**Découvert dans :** Tests manuels PR-07  
**Référence audit :** Phase 2 §A "Onboarding du module"  
**Sprint cible :** Sprint UX post-Sprint-1

**Constat :** Sur `/budget` (Vue d'ensemble), aucun moyen direct d'ajouter un poste.
L'utilisateur doit découvrir l'onglet "Postes". Particulièrement pénalisant au
premier usage quand le dashboard est vide.

**Solution :**
- Empty state pédagogique sur Vue d'ensemble si aucun poste → CTA "Ajouter votre premier poste"
- Quand des postes existent → bouton "Ajouter un poste" discret en haut de la Vue d'ensemble

---

## F2 — Étape "Marquer comme réservée" : volontaire ou friction ?

**Sévérité :** À décider PO — possible friction non-désirée  
**Découvert dans :** Tests manuels PR-07  
**Référence audit :** Phase 2 §C, Phase 1 state machine (workflow.ts)  
**Sprint cible :** Sprint 2 ou plus tôt selon décision PO

**Constat :** Le workflow impose [Sélectionner devis] → [Marquer BOOKED] → [Ajouter paiement].
La question est ouverte : est-ce un engagement ferme intentionnel (distinct de la sélection)
ou une friction superflue ?

**Options selon décision PO :**
- Si volontaire → améliorer la microcopy ("Une fois réservée, vous pourrez suivre les paiements.")
- Si friction → auto-BOOKED à la sélection, ou permettre paiement sans BOOKED explicite

---

## TD-04 — Sprint Tooling/Tests post-Sprint-1

**Sévérité :** Moyenne — pas bloquant Sprint 1, requis avant lancement public  
**Découvert dans :** PR-07 (interop CJS/ESM Node native trop coûteuse)  
**Deadline :** Avant lancement public mi-juillet 2026  
**Estimation :** 1.5–2 jours

**Contexte :** Sprint 1 tourne en tests manuels uniquement. TypeScript strict +
tests manuels suffisent à court terme, mais pas de filet automatique pour les
régressions. Node native test runner a de la friction avec les path aliases `@/`.

**Scope :**
- Installer Vitest, configurer pour TS + ESM natif
- Tests des invariants critiques par module :
  - Budget : workflow state machine, over-payment, cents math
  - Gifts : reservation logic
  - Polls : voting / closing
- GitHub Actions : build + lint + test à chaque push
- Documenter dans README

**Fix :** Sprint Tooling dédié post-Sprint-1. Ne pas intercaler pendant Sprint 1.
