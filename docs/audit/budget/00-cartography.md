# Audit module Budget — Phase 0 : Cartographie

> Lecture seule. Aucune modification de code.
> Date : 2026-05-01

---

## ⚠️ Avertissement préliminaire — malentendu de périmètre

Le brief mentionne Tricount comme référence concurrente et parle de
"suivi des dépenses + équilibrage", "Settlement", "Balance", "split".

**Le module Budget tel qu'il est codé n'est PAS un Tricount.**

C'est un **outil de gestion budgétaire pour organisateur d'événement** :
définir un budget, découper en postes, sourcer des prestataires, comparer
des devis, réserver et suivre les paiements. Il n'y a aucun concept de
dépense partagée entre participants, ni de calcul de dettes.

Ce constat est la question ouverte n°1 (voir section 5).

---

## 1. Schéma de données annoté

### Modèles Prisma

```
Budget
  id             String       PK, cuid
  eventId        String       UNIQUE — one-to-one avec Event
  totalBudget    Decimal(12,2) nullable — budget global de l'événement
  setupStatus    BudgetSetupStatus  NOT_STARTED | STARTED
  currency       String       default "EUR" (non utilisé dynamiquement)
  createdAt/updatedAt

  ── one-to-many ──> BudgetLine[]

  Cascade : Event supprimé → Budget supprimé
  ⚠️  Budget NON créé automatiquement à la création d'un Event
      (route accédée avant init → notFound())
```

```
BudgetLine
  id               String       PK
  budgetId         String       FK → Budget (CASCADE)
  category         BudgetLineCategory  (8 valeurs — voir §1.1)
  label            String       nom libre du poste
  targetAmount     Decimal(12,2) montant cible
  estimatedAmount  Decimal(12,2)? estimation courante (optionnelle)
  sourcingStatus   BudgetLineSourcingStatus  machine d'état (§2)
  internalNote     String?
  selectedQuoteId  String?      UNIQUE FK → Quote (SET NULL)
  createdAt/updatedAt

  ── one-to-many ──> Quote[]      (relation "BudgetLineQuotes")
  ── one-to-many ──> PaymentEntry[]
  ── one-to-one  ──> Quote?       (selectedQuote — backward)

  Index : (budgetId, category), (budgetId, sourcingStatus), selectedQuoteId
```

```
Vendor
  id          String    PK
  eventId     String    FK → Event (CASCADE)  ← vendors sont EVENT-scoped
  name        String
  vendorType  String?
  contactName String?
  email       String?
  phone       String?
  createdAt/updatedAt

  ── one-to-many ──> Quote[]

  Index : (eventId, name)
  ⚠️  Unicité (eventId, name) non contrainte en base — gérée par code
```

```
Quote
  id            String      PK
  budgetLineId  String      FK → BudgetLine (CASCADE)
  vendorId      String      FK → Vendor (CASCADE)
  status        QuoteStatus  AWAITING_RESPONSE | RECEIVED | SELECTED | REJECTED
  amount        Decimal(12,2)? nullable (requis avant sélection)
  scope         String?
  requestedAt   DateTime?
  receivedAt    DateTime?   (requis si status = RECEIVED)
  validUntil    DateTime?
  internalNote  String?
  decisionNote  String?
  createdAt/updatedAt

  ── one-to-many ──> QuoteAttachment[]
  ── one-to-many ──> PaymentEntry[]
  ── one-to-one  ──> BudgetLine?   (selectedByLine — backward)

  Index : (budgetLineId, status), (vendorId, status)
```

```
QuoteAttachment
  id            String    PK
  quoteId       String    FK → Quote (CASCADE)
  fileName      String
  fileUrl       String    URL externe — pas d'upload géré par l'app
  mimeType      String?
  fileSizeBytes Int?
  createdAt

  ⚠️  Fichiers hébergés ailleurs ; si l'URL devient invalide, pièce jointe perdue
```

```
PaymentEntry
  id           String    PK
  budgetLineId String    FK → BudgetLine (CASCADE)
  quoteId      String?   FK → Quote (SET NULL) — survit à la suppression d'un devis
  label        String    ex : "Acompte", "Solde"
  entryType    PaymentEntryType  DEPOSIT | BALANCE | OTHER
  amount       Decimal(12,2)
  dueDate      DateTime
  paidAt       DateTime? null = non réglé
  note         String?
  createdAt/updatedAt

  Index : (budgetLineId, dueDate), quoteId, paidAt
  ⚠️  Un paiement marqué payé ne peut PAS être démarqué (pas de mutation inverse)
  ⚠️  amount peut dépasser le committedAmount — aucune validation côté serveur
```

```
EventExpensesSettings
  id             String   PK
  eventModuleId  String   UNIQUE FK → EventModule (CASCADE)
  (aucun autre champ)     → placeholder vide pour features futures
```

### 1.1 Enums

| Enum | Valeurs |
|---|---|
| BudgetLineCategory | VENUE · FOOD_BEVERAGE · DESIGN_DECORATION · ENTERTAINMENT · LOGISTICS · GUEST_EXPERIENCE · COMMUNICATION · MISCELLANEOUS |
| BudgetLineSourcingStatus | DRAFT · SOURCING · QUOTES_RECEIVED · SELECTED · BOOKED |
| QuoteStatus | AWAITING_RESPONSE · RECEIVED · SELECTED · REJECTED |
| PaymentEntryType | DEPOSIT · BALANCE · OTHER |
| BudgetPaymentStatus | NOT_APPLICABLE · UNPAID · DEPOSIT_PAID · PARTIALLY_PAID · PAID (calculé) |
| BudgetSetupStatus | NOT_STARTED · STARTED |

---

## 2. Machine d'état — BudgetLineSourcingStatus

```
                   [add vendor]          [quote received]
   DRAFT ─────────────────────> SOURCING ──────────────────> QUOTES_RECEIVED
     │                                                              │
     │ (edit line OK)         (edit line OK)              (edit line BLOQUÉ)
     │                                                              │
     │                                                    [select quote]
     │                                                              │
     │                                                              ▼
     │                                               SELECTED ──────────> BOOKED
     │                                                  │  ▲         (add payment OK)
     │                                       [reopen]  │  │         (edit line BLOQUÉ)
     │                                                  ▼  │
     │                                         QUOTES_RECEIVED ou SOURCING
     │                                         (selon devis restants)
     └─────────────────────────────────────────────────────────────────────
```

### État des devis (QuoteStatus)

```
AWAITING_RESPONSE ──[receive]──> RECEIVED ──[select]──> SELECTED
                                    │                       │
                                    └──[reject]──> REJECTED │
                                                            │
                                    ◄──[reopen line]────────┘
                                    (SELECTED → RECEIVED)
```

### Calcul du PaymentStatus (dérivé, non stocké)

```
committedAmount = quoteAmount si status SELECTED/BOOKED, sinon 0
paidAmount      = somme des paymentEntry.amount où paidAt != null

committedAmount == 0          → NOT_APPLICABLE
paidAmount == 0               → UNPAID
0 < paidAmount < committed    → DEPOSIT_PAID (si entry DEPOSIT payé)
                                PARTIALLY_PAID (sinon)
paidAmount >= committed       → PAID
```

---

## 3. Flux utilisateur — diagramme texte

```
INITIALISATION
  Organiser clique "Budget"
  → Budget record existe ? non → notFound() ⚠️ / oui → setup screen
  → Définir budget total (ou ignorer)
  → setupStatus = STARTED

CRÉATION D'UN POSTE
  Organiser crée BudgetLine
  → category + label + targetAmount (requis)
  → estimatedAmount (optionnel)
  → sourcingStatus = DRAFT

SOURCING
  Cas A — Demander un devis :
    add-sourcing-vendor → crée/update Vendor + Quote(AWAITING_RESPONSE)
    → ligne passe SOURCING

  Cas B — Saisir un devis reçu directement :
    add-received-quote → crée Quote(RECEIVED) avec amount
    → ligne passe QUOTES_RECEIVED

  Cas C — Saisir prestataire ET devis en même temps :
    add-received-quote avec vendorName → crée Vendor + Quote(RECEIVED)

SÉLECTION
  Organiser compare les Quote(RECEIVED)
  → select-quote → Quote passe SELECTED, autres RECEIVED restent
  → ligne passe SELECTED

RÉSERVATION
  mark-line-booked → ligne passe BOOKED
  → payments peuvent être ajoutés

SUIVI DES PAIEMENTS
  create-payment-entry (DEPOSIT / BALANCE / OTHER)
  mark-payment-entry-paid → paidAt = now()
  → dashboard recalcule PaymentStatus
```

---

## 4. Tableau fait / partiellement fait / manquant

| Fonctionnalité | État | Notes |
|---|---|---|
| Définition du budget total | ✅ fait | Setup wizard avec skip possible |
| Création de postes budgétaires | ✅ fait | 8 catégories, label libre |
| Machine d'état sourcing | ✅ fait | 5 états, transitions validées, testé |
| Carnet de prestataires (Vendors) | ✅ fait | Event-scoped, déduplication par nom |
| Saisie de demande de devis | ✅ fait | Quote AWAITING_RESPONSE |
| Saisie de devis reçu | ✅ fait | Quote RECEIVED avec montant |
| Sélection du meilleur devis | ✅ fait | Démotion automatique de l'ancien |
| Réouverture d'une sélection | ✅ fait | Fallback status calculé |
| Suivi des paiements (jalons) | ✅ fait | DEPOSIT / BALANCE / OTHER |
| Marquage paiement réglé | ✅ fait | Irréversible actuellement |
| Dashboard récap (totaux, alertes) | ✅ fait | 5 métriques + 6 needs-attention |
| Prochains paiements (7 jours) | ✅ fait | Triés par dueDate |
| Pièces jointes sur devis | ✅ fait (partiel) | URLs seulement, pas d'upload |
| Auto-création Budget à l'init Event | ❌ manquant | risque notFound() |
| Démarquage d'un paiement payé | ❌ manquant | pas de mutation inverse |
| Suppression d'une ligne BOOKED | ❌ manquant | bloqué par UX, cascade existe en DB |
| Suppression / édition d'un devis | ❌ manquant | devis incomplet = bloqué définitivement |
| Validation amount <= committed | ❌ manquant | over-payment possible |
| Dépenses partagées entre participants | ❌ absent | hors périmètre actuel (cf. Q1) |
| Équilibrage de dettes (type Tricount) | ❌ absent | hors périmètre actuel (cf. Q1) |
| Export PDF / Excel | ❌ absent | — |
| Multi-devises actives | ⚠️ partiel | champ `currency` en base, jamais utilisé UI |
| Notifications email sur paiement dû | ❌ absent | — |
| Contrôle d'accès multi-rôles | ⚠️ partiel | organizer-only, pas de viewer/editor |
| Tests unitaires state machine | ✅ fait | workflow.test.mjs (Node assert, 13 tests) |
| Tests E2E / composants | ❌ absent | — |

---

## 5. Questions ouvertes pour le PO

### Q1 — Quel est le vrai périmètre du module ? (bloquant pour la suite de l'audit)

Le module actuel est un **tracker budgétaire d'organisateur** (postes → prestataires
→ devis → réservation → paiements). Ce n'est pas un outil de partage de dépenses
entre participants (pas de split, pas de balance, pas de remboursement entre amis).

Deux produits différents, deux UX entièrement différentes :

| | Module actuel | Tricount-like |
|---|---|---|
| Utilisateur cible | Organisateur seul | Tous les participants |
| Objet | Devis prestataires | Dépenses remboursables |
| Calcul | Suivi paiements jalons | Balance dettes/créances |
| Concurrent réel | Honeybook, Airtable | Tricount, Splitwise |

**Question :** Veut-on garder ce module tel quel (gestion budgétaire pro) ?
Ou ajouter un deuxième module "Dépenses partagées" type Tricount ?
Ou remplacer l'un par l'autre ?

La réponse détermine l'intégralité des phases 1, 2 et 3 de cet audit.

---

### Q2 — Qui peut accéder au module Budget ?

Actuellement : **organizer-only** (lecture + écriture, aucun guest ne voit quoi que ce soit).

Est-ce intentionnel ? Les co-organisateurs d'un événement (si feature multi-orga)
peuvent-ils accéder ? Les participants peuvent-ils voir un résumé budgétaire ?

---

### Q3 — Lifecycle du Budget à la création d'un Event

Le record `Budget` n'est pas créé automatiquement quand un événement est créé.
Si un organisateur navigue vers `/event/[slug]/budget` sans qu'un Budget existe
en base, la route retourne `notFound()`.

Est-ce que la création du Budget doit être déclenchée à l'activation du module
"Dépenses" dans EventModule, ou à la navigation, ou à la création de l'événement ?

---

### Q4 — Pièces jointes sur les devis

Les `QuoteAttachment` stockent des URLs vers des fichiers hébergés ailleurs.
Il n'y a pas d'upload intégré.

Est-ce volontaire (Google Drive, Dropbox) ? Un upload direct est-il prévu ?
Sans hébergement propre, les fichiers peuvent disparaître silencieusement.

---

### Q5 — Paiement irréversible

Un paiement marqué "réglé" (`paidAt` set) ne peut plus être démarqué.
S'il y a une erreur de saisie, l'organisateur est bloqué.

Est-ce une contrainte intentionnelle (audit trail financier) ou un oubli ?

---

### Q6 — Multi-devises

Le champ `currency` existe en base (défaut "EUR") mais n'est jamais utilisé
dynamiquement dans l'UI. Tous les montants s'affichent en EUR.

Est-ce une feature prévue ? Si non, supprimer le champ évite la dette technique.
Si oui, définir à quel niveau la devise est choisie (par événement ? par ligne ?).

---

### Q7 — Nom du module dans la nav

Le module s'appelle `EXPENSES` dans `EventModule` mais la page s'appelle
"Budget" dans l'UI. Les deux termes coexistent dans le code.

Quel est le nom officiel du module pour l'utilisateur final ?
"Budget", "Dépenses", "Finances" ?

---

## 6. Bugs critiques identifiés (à ne pas corriger dans cet audit)

| # | Fichier | Problème | Sévérité |
|---|---|---|---|
| B1 | `get-budget-route-context.ts` | Budget non auto-créé → `notFound()` si module activé sans record Budget | Haute |
| B2 | `create-payment-entry.ts` | Aucune validation `amount <= committedAmount` → over-payment silencieux possible | Moyenne |
| B3 | `mark-payment-entry-paid.ts` | Pas de mutation inverse → erreur de saisie irréparable | Moyenne |
| B4 | `add-received-quote.ts` | Devis sans amount possible (si add-sourcing → jamais mis à jour) → bloqué définitivement sans suppression | Basse |

---

*Fin de la Phase 0. En attente des réponses aux questions Q1–Q7 avant Phase 1.*
