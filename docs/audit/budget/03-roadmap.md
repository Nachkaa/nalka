# Audit module Budget — Phase 3 : Roadmap

> Synthèse actionnable. Les constats sont dans Phase 1 (A1–A23) et Phase 2.
> Hypothèse data : **0 enregistrement en production** — module en développement.
> Conséquence : aucune migration de données utilisateur nécessaire, tous les renames
> sont de simples changements de code.
> Date : 2026-05-01

---

## 1. Découpage par PR — éviter les conflits

Regrouper les changements par périmètre technique, pas par priorité produit.
Chaque PR doit être mergeable indépendamment.

### PR-01 — Constantes et labels (base de tout)
**Fichiers touchés :** `constants.ts`, `serializers.ts`
**Contenu :**
- Correction des accents manquants sur tous les labels (Phase 2 §K.1)
- Rename "Fournisseur" → "Prestataire" dans les constantes et les types TS
- Harmonisation "Retenu" → "Engagé" dans les labels
- Ajout des labels manquants (tooltip textes, empty states — Phase 2 §K.2–K.4)

**Effort :** S (1 j) — **Pas de migration DB, 0 risque de régression**
**Doit passer en premier** car toutes les PR suivantes en dépendent.

---

### PR-02 — Formulaires : UX de saisie
**Fichiers touchés :**
`budget-line-form-dialog.tsx`, `add-sourcing-vendor-dialog.tsx`,
`add-received-quote-dialog.tsx`, `add-payment-entry-dialog.tsx`,
`budget-total-setup-card.tsx`

**Contenu :**
- `inputMode="decimal"` sur tous les `<Input type="number">` (Phase 2 §B, §C)
- `type="datetime-local"` → `type="date"` sur toutes les dates du module (Phase 2 §C, §H)
- Marquage des champs obligatoires : astérisque + légende `* Champs obligatoires` (Phase 2 §B)
- Retrait de "Note de décision" du formulaire `AddReceivedQuoteDialog` (Phase 2 §C.2)
- "Note interne" masquée derrière un accordéon dans `BudgetLineFormDialog` (Phase 2 §B)

**Effort :** S–M (1,5 j)

---

### PR-03 — Affichage : nettoyage visuel
**Fichiers touchés :**
`quote-comparison-list.tsx`, `payment-entry-list.tsx`, `budget-summary-screen.tsx`,
`budget-lines-table.tsx`

**Contenu :**
- Cacher les lignes de dates vides dans les cards devis (Phase 2 §E)
- "Réglé le : …" affiché uniquement si `paidAt !== null` (Phase 2 §G)
- Harmonisation terminologique "Engagé" dans la summary (Phase 2 §F)
- Remplacement de `min-w-[980px]` par une version responsive cards/table (Phase 2 §D) ← effort M, peut être splitté en PR-03b si nécessaire

**Effort :** M (2 j pour le tableau responsive, 0,5 j pour le reste)

---

### PR-04 — Schema DB : suppressions et renommages (A2, A3)
**Fichiers touchés :** `schema.prisma`, nouvelle migration Prisma

**Contenu :**
- Suppression du champ `currency` sur `Budget` (A3, décision PO)
- Renommage `EventModuleKey.EXPENSES` → `EventModuleKey.BUDGET` (A2)
- Mise à jour de toutes les références dans le code (`_shared.ts`, `module-manager.ts`, etc.)

**Effort :** S (1 j) — **0 data en prod → migration instantanée**
**Risque :** Si un seed ou un test hardcode `"EXPENSES"`, il cassera — grep à faire avant merge.

---

### PR-05 — Bug critique : auto-création Budget (A1)
**Fichiers touchés :** `module-manager.ts` (mutation d'activation du module)

**Contenu :**
- Créer automatiquement le record `Budget` lors de l'activation du module `BUDGET`
- Supprimer le `notFound()` sur budget manquant dans `_shared.ts` → remplacer par création lazy en dernier recours

**Effort :** S (0,5 j)

---

### PR-06 — Réversibilité financière (A4 + Phase 2 §G)
**Fichiers touchés :**
`schema.prisma` (nouvelle table `PaymentLog`),
`mark-payment-entry-paid.ts`,
nouvelle mutation `unmark-payment-entry-paid.ts`,
`payment-entry-list.tsx`

**Contenu :**
- Table `PaymentLog (id, paymentEntryId, actorId, action, previousPaidAt, newPaidAt, createdAt)`
- Mutation `markPaymentEntryPaid` : log l'action avant d'écrire
- Nouvelle mutation `unmarkPaymentEntryPaid` : remet `paidAt = null`, log l'action
- Bouton "Démarquer" dans `PaymentEntryList` avec dialog de confirmation
- Bouton "Supprimer" sur paiements non réglés (avec confirmation)

**Effort :** M (2,5 j)
**Dépendance :** PR-01 (labels des confirmations)

---

### PR-07 — Validation montant paiement (A8)
**Fichiers touchés :** `create-payment-entry.ts`

**Contenu :**
- Validation côté serveur : `amount ≤ committedAmount`
- Message d'erreur contextuel avec le montant engagé (Phase 2 §K.3)

**Effort :** S (0,5 j)

---

### PR-08 — Corrections DB mineures (A9, A10)
**Fichiers touchés :** `select-quote.ts`, `schema.prisma`

**Contenu :**
- `$transaction` avec `{ isolationLevel: "Serializable" }` sur `selectQuote` (A9)
- Contrainte `@@unique([eventId, name])` sur `Vendor` + gestion explicite du conflit (A10)

**Effort :** S (0,5 j)

---

### PR-09 — Email rappel paiements dus (A23)
**Fichiers touchés :** nouveau fichier `emails/payment-reminder.tsx` (React Email),
nouveau cron `app/api/cron/payment-reminders/route.ts`

**Contenu :**
- Template React Email : liste des paiements dus dans les 7 jours pour un organisateur
- Cron Vercel (`vercel.json`) ou QStash : déclencher quotidiennement
- Query dédiée : `getPaymentsDueSoon(userId, withinDays)` cross-events
- Respect RGPD : lien de désabonnement dans le footer du mail

**Effort :** M (2,5 j)
**Dépendance :** Décision infrastructure (Vercel Cron vs QStash — voir §3)

---

### PR-10 — allowSkip sur onboarding (Phase 2 §A.1)
**Fichiers touchés :** `budget-first-postes-screen.tsx`

**Contenu :**
- Passer `allowSkip={true}` sur le `BudgetTotalSetupCard`
- Reformuler le texte "Tu as choisi de définir plus tard" → "Pas encore défini"

**Effort :** S (0,5 j — une ligne de prop + un string)

---

## 2. Stratégie de migration

**Hypothèse confirmée : 0 enregistrement en production.**

Toutes les migrations sont **non destructives sans rollback nécessaire** :

| Migration | Type | Risque | Action |
|---|---|---|---|
| Suppression `currency` (PR-04) | Suppression colonne | Nul (0 data) | `prisma migrate dev` direct |
| Rename `EXPENSES` → `BUDGET` (PR-04) | Rename enum value | Nul (0 data) | Migration SQL + grep des références code |
| Ajout `PaymentLog` (PR-06) | Nouvelle table | Nul | `prisma migrate dev` direct |
| Contrainte unique `Vendor` (PR-08) | Ajout contrainte | Nul (0 data) | `prisma migrate dev` direct |

**Si des données apparaissent avant merge de PR-04 :**
Ajouter une étape de backfill dans la migration :
```sql
UPDATE "EventModule" SET "key" = 'BUDGET' WHERE "key" = 'EXPENSES';
```
Vercel déploie les migrations avant le code — ce backfill est safe.

---

## 3. KPIs à instrumenter avant le code

**Outil recommandé : PostHog** (self-hostable, event tracking + funnel + session replay,
SDK Next.js officiel, open source). Alternative légère : Plausible pour le traffic,
PostHog uniquement pour les funnels produit.

Instrumenter **avant** de shipper les PR, pour avoir une baseline dès le premier utilisateur.

| KPI | Événement PostHog | Pourquoi |
|---|---|---|
| Taux de complétion setup | `budget_setup_completed` vs `budget_page_opened` | Valider que l'onboarding ne bloque pas |
| Temps création premier poste | `budget_line_created` avec `$time` depuis `budget_page_opened` | Détecter si le formulaire est trop long |
| Taux d'abandon AddReceivedQuoteDialog | `quote_dialog_opened` vs `quote_created` | Valider la réduction du formulaire (PR-02) |
| Taux lignes avec ≥1 devis sélectionné | `quote_selected` / `budget_line_created` | Mesure de l'engagement cœur du module |
| Open rate emails rappel | Tracking pixel React Email | Valider l'utilité avant d'investir en notifications riches |
| Taux allowSkip utilisé | `budget_setup_skipped` | Calibrer si le skip est vraiment nécessaire |

---

## 4. Plan d'entretiens utilisateurs

**Objectif :** Valider 3 hypothèses de Phase 2 avant de coder les P1.
**Format recommandé :** Version actuelle (pas de maquette) — plus honnête,
évite le biais "c'est beau donc c'est bien". 30 minutes. Enregistrement avec accord.

**5 profils cibles :**

| # | Profil | Hypothèse principale à tester |
|---|---|---|
| 1 | Wedding planner indépendant (5-10 mariages/an) | Terminologie "Prestataire" vs "Fournisseur", structure de postes types |
| 2 | Event manager agence (20-30 events/an) | Templates réutilisables, workflow multi-événements |
| 3 | Chef de projet corporate (2-5 séminaires/an) | Onboarding setup budget, partage avec commanditaire |
| 4 | Organisateur freelance (premier outil pro) | Courbe d'apprentissage globale, compréhension "Engagé" vs "Estimé" |
| 5 | Assistant(e) d'un wedding planner | Saisie de devis, formulaire AddReceivedQuote, mobile en réunion |

**Questions prioritaires :**
1. "Montrez-moi comment vous ajouteriez un devis pour votre traiteur." → Observer les blocages sur AddReceivedQuoteDialog.
2. "Vous avez 5 mariages identiques cette année. Comment vous organisez-vous ?" → Valider le besoin templates.
3. "Votre client veut voir l'avancement du budget. Que feriez-vous ?" → Valider le besoin vue client.
4. "Que signifie 'Engagé' pour vous dans ce contexte ?" → Valider la terminologie.
5. "Vous avez reçu un devis de 4 500 € HT. Où le saisissez-vous ?" → Détecter la confusion TTC/HT.

**Timing :** Idéalement avant Sprint 1, au plus tard entre Sprint 0 et Sprint 1.
Les résultats peuvent invalider ou reprioriser des items P1 (ex : si personne ne comprend les templates, reporter P2).

---

## 5. Roadmap chiffrée

### Sprint 0 — P0 Polish (semaine 1)
> Peut être déployé par n'importe quel dev. Zéro risque. Impact visible immédiat.

| PR | Contenu | Effort | Dev |
|---|---|---|---|
| PR-01 | Constantes, labels, accents | 1 j | 1 dev |
| PR-02 | Formulaires : inputMode, dates, obligatoires | 1,5 j | 1 dev |
| PR-03 (partiel) | Nettoyage affichage (dates vides, réglé le, Engagé) | 1 j | 1 dev |

**Total Sprint 0 : ~3,5 jours-homme**
**Risque de glissement : faible** — uniquement du UI, pas de DB.

---

### Sprint 1 — P0 Critique + Fondations DB (semaines 2–4)
> Prérequis au lancement. Bloque le "go".

| PR | Contenu | Effort | Dépendance |
|---|---|---|---|
| PR-10 | allowSkip onboarding | 0,5 j | PR-01 |
| PR-04 | Migration DB (currency, EXPENSES→BUDGET) | 1 j | — |
| PR-05 | Auto-création Budget (A1) | 0,5 j | PR-04 |
| PR-06 | Réversibilité financière + PaymentLog (A4) | 2,5 j | PR-01 |
| PR-07 | Validation montant paiement (A8) | 0,5 j | — |
| PR-08 | Serializable transaction + unicité Vendor (A9, A10) | 0,5 j | PR-04 |
| PR-09 | Email rappel paiements (A23) | 2,5 j | PR-06 |
| PR-03b | Tableau postes responsive (mobile) | 2 j | PR-01 |

**Total Sprint 1 : ~10 jours-homme**
**Risque de glissement : moyen** — PR-06 (PaymentLog) et PR-09 (email cron)
sont les plus complexes. Buffer recommandé : +2 j.

**Décision infra à trancher avant PR-09 :**
Vercel Cron (gratuit sur Pro, limité à 1/minute) ou QStash (Upstash, payant,
fiable, retry natif). Pour les rappels quotidiens : Vercel Cron suffit en v1.

---

### Sprint 2 — P1 Essentiels B2B (semaines 5–8)
> Différenciation B2B. Peut sortir 2-3 semaines après le lancement.

| Item | Réf. | Effort | Dépendance |
|---|---|---|---|
| Templates prédéfinis (1-2 issus entretiens utilisateurs) | Phase 2 §A.2 | M (2 j) | Entretiens Sprint 0-1 |
| Vue client / lien de partage avec expiration | Phase 2 §I | L (4 j) | A5-A6 matrice rôles |
| Export PDF "présentation client" | Phase 2 §I, A15 | M (2,5 j) | Vue client |
| Matrice de rôles : Option A `budgetViewerPolicy` (A6) | A6 Phase 1 | M (2 j) | PR-04 |
| Barre de progression + hiérarchie dashboard mobile | Phase 2 §F | S (1 j) | PR-03 |
| Total récapitulatif PaymentEntryList | Phase 2 §G | S (0,5 j) | — |

**Total Sprint 2 : ~12 jours-homme**
**Risque de glissement : élevé** sur la vue client (dépend des décisions matrice rôles).
Découpler : livrer l'export PDF avant la vue client interactive si la matrice prend du retard.

---

### Sprint 3+ — P2 et Roadmap future

| Item | Effort estimé | Condition de déclenchement |
|---|---|---|
| Dashboard cross-events agence (A14) | L | ≥ 5 agences actives avec 3+ events |
| Templates sauvegardables par agence | L | Feedback entretiens + ≥ 50 events créés |
| Tableau comparaison devis côte à côte | M | Retour utilisateur post-lancement |
| Audit trail global (A13) | L | Premier client B2B avec exigence contractuelle |
| Notifications devis expiration/relance | M | Open rate rappels paiements > 40 % |
| RGPD / purge automatique (A21) | M | Avant premier DPA signé avec un client B2B |
| Pagination lignes/devis (A11, A12) | M | Premier event avec > 50 lignes |

---

## 6. Critères de lancement — checklist go/no-go

Le module Budget passe en accès public quand **tous les items P0 critique** sont cochés.
Les P0 polish doivent être ≥ 80 % cochés (les accents peuvent attendre un patch rapide).

### Go/No-Go : P0 Critique

- [ ] PR-05 mergé : Budget auto-créé à l'activation du module (A1)
- [ ] PR-04 mergé : migration `currency` supprimé, `BUDGET` renommé (A2, A3)
- [ ] PR-06 mergé : paiement démarquable + `PaymentLog` opérationnel (A4)
- [ ] PR-09 déployé : email rappel paiements dus fonctionnel en prod (A23)
- [ ] PR-10 mergé : `allowSkip` activé sur l'onboarding
- [ ] PR-08 mergé : transaction `Serializable` + unicité vendor (A9, A10)
- [ ] PR-07 mergé : validation `amount ≤ committedAmount` (A8)

### Go/No-Go : P0 Polish (≥ 80 %)

- [ ] PR-01 mergé : accents corrects, "Prestataire", "Engagé"
- [ ] PR-02 mergé : `inputMode="decimal"`, `type="date"`, champs obligatoires
- [ ] PR-03 mergé : dates vides masquées, "Réglé le" conditionnel
- [ ] PR-03b mergé : tableau responsive mobile

### Conditions complémentaires

- [ ] ≥ 3 entretiens utilisateurs réalisés, retours intégrés ou documentés
- [ ] PostHog instrumenté sur les 6 KPIs listés en §3
- [ ] Politique de rétention RGPD documentée (même minimalement) avant tout DPA (A21)
- [ ] `QuoteAttachment.fileUrl` validé côté serveur (A22) — whitelist `https://`
- [ ] `/api/debug/my-events` supprimé (hotfix initial)

---

## 7. Ce qu'on ne fait pas, et pourquoi

| Item écarté | Raison |
|---|---|
| **Module "dépenses partagées" type Tricount** | Hors cible B2B. Produit différent, audience différente. Si besoin émerge : module séparé, pas une extension du Budget actuel. |
| **Multi-devises** | Champ `currency` supprimé (décision PO). À reintroduire avec un vrai besoin client (mariage destination, event international) — pas avant. |
| **OCR / import automatique de devis** | Coût et complexité disproportionnés en v1. L'URL de partage Google Drive couvre 90 % du besoin pour moins de 1 % de l'effort. |
| **Signature électronique** | HoneyBook le fait nativement. Intégrer DocuSign/HelloSign = dette d'intégration pour un besoin qui reste à valider sur la cible. |
| **Application mobile native** | Next.js PWA couvre le besoin "suivi mobile pendant l'événement". App native = ressources de développement ×3 pour un gain marginal en v1. |
| **3 templates génériques "Mariage/Corpo/Soirée"** | Remplacement par 1-2 templates validés par entretiens (décision PO). Templates non calibrés = expérience dégradée pire que l'absence de templates. |
| **Audit trail global dès Sprint 1** | `PaymentLog` suffit pour le lancement. Un audit trail complet (A13) est P2, déclenché par une exigence contractuelle réelle, pas par anticipation. |
| **Upload natif de pièces jointes** | URLs externes (Google Drive/Dropbox) = v1. Upload natif implique stockage (S3, Cloudflare R2), coût, RGPD des fichiers — backlog v1.x. |

---

*Fin de l'audit module Budget (Phase 0 → 3).*
*Documents produits :*
- *`docs/audit/budget/00-cartography.md`*
- *`docs/audit/budget/01-architecture.md`*
- *`docs/audit/budget/02-ux.md`*
- *`docs/audit/budget/03-roadmap.md`*
