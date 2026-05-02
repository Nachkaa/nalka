# Audit module Budget — Phase 1 : Architecture

> Constat uniquement — aucune modification de code.
> Basé sur les décisions PO Phase 0 : cible B2B événementiel, module "gestion budgétaire pro" conservé.
> Date : 2026-05-01

---

## Tableau de synthèse

| # | Problème | Sévérité | Effort | Recommandation |
|---|---|---|---|---|
| A1 | Budget non auto-créé à l'activation du module → `notFound()` | **Haute** | S | Créer le record `Budget` dans la mutation d'activation du module `EXPENSES/BUDGET` |
| A2 | Renommage `EXPENSES` → `BUDGET` absent (dette de nommage) | **Haute** | S | Migration + remplacement de toutes les références dans le code |
| A3 | Champ `currency` fantôme : présent en DB, jamais utilisé en UI | **Haute** | S | Migration de suppression (décision PO) |
| A4 | Paiement irréversible : pas de mutation `unmark-paid` | **Haute** | M | Ajouter mutation + table `PaymentLog` (audit trail, décision PO) |
| A5 | Aucune permission Budget dans l'ACL (`acl.ts`) — accès binaire organizer/non | **Haute** | M | Ajouter entrées ACL `budget:read`, `budget:write`, `budget:delete` et les câbler sur OWNER/ADMIN/MEMBER |
| A6 | Aucun rôle VIEWER pour le Budget — besoin B2B client-commanditaire | **Haute** | L | Concevoir matrice de rôles (§4) avant migration schema |
| A7 | Suppression en cascade irréversible : Event supprimé = historique financier perdu | **Haute** | M | Soft-delete sur Event ou archive Budget avant suppression |
| A8 | Over-payment silencieux : `PaymentEntry.amount` peut dépasser le committed | **Moyenne** | S | Validation côté serveur `amount ≤ committedAmount` dans `create-payment-entry` |
| A9 | Race condition sur `selectQuote` : isolation READ COMMITTED par défaut | **Moyenne** | S | Passer `$transaction([...], { isolationLevel: "Serializable" })` |
| A10 | Vendor dedupliqué par nom uniquement : fusion accidentelle possible | **Moyenne** | S | Unicité en base sur `(eventId, name)` + erreur explicite si conflit |
| A11 | Pas de pagination : `getBudgetSummary` charge tout en mémoire | **Moyenne** | M | Paginer `BudgetLine` (cursor) + agréger les totaux en SQL (COUNT/SUM) |
| A12 | Calculs agrégés en JS (sumMoney en boucle) plutôt qu'en SQL | **Moyenne** | M | Remplacer par `prisma.budgetLine.aggregate()` pour les totaux du dashboard |
| A13 | Aucun audit trail : qui a fait quoi sur une ligne/devis/paiement | **Moyenne** | L | Table `BudgetAuditLog` (actorId, action, entityId, diff JSON, timestamp) |
| A14 | Aucun dashboard cross-events pour une agence (10–30 événements) | **Moyenne** | L | Page `/dashboard/budget` avec vue agrégée multi-événements |
| A15 | Export PDF/Excel absent — besoin critique B2B | **Moyenne** | M | Générer depuis les données Server (React-pdf ou csv simple en v1) |
| A16 | `useTransition` seul : pas d'optimistic UI, full page reload après mutation | **Basse** | M | Ajouter `useOptimistic` sur les listes de lignes/paiements |
| A17 | `revalidatePath` sur 4 chemins fixes : granularité insuffisante à long terme | **Basse** | S | Introduire `revalidateTag` avec tags par `budgetId` |
| A18 | Un seul test runner (`.mjs` Node assert) — hors écosystème Vitest/Jest | **Basse** | S | Migrer `workflow.test.mjs` vers Vitest, ajouter au script `test` |
| A19 | Zéro test d'intégration sur les mutations | **Basse** | L | Tests Vitest sur les mutations avec base de données de test |
| A20 | `@ts-expect-error` dans `acl.ts:46` (hack `error.status`) | **Basse** | S | Typer l'erreur correctement ou utiliser `NextResponse` |
| A21 | RGPD/rétention : pas de politique de conservation, pas de purge automatique, pas de "droit à l'oubli" propre | **Haute** | M | Config de rétention par événement + cron de purge + documentation DPA |
| A22 | `QuoteAttachment.fileUrl` : aucune validation du schème — XSS possible via `javascript:` ou redirect | **Moyenne** | S | Whitelist `https://` côté serveur + `rel="noopener noreferrer"` déjà présent mais insuffisant |
| A23 | Notifications email manquantes : rappel paiement dû, relance devis sans réponse | **Moyenne** | M | Stack déjà disponible (Nodemailer + React Email) ; scheduler via Vercel Cron ou QStash |

---

## 1. Modèle de données

### 1.1 Calcul vs stockage

Il n'y a pas de concept de split entre participants (décision PO confirmée).
Les montants sont **tous stockés** (`Decimal(12,2)`). Les valeurs dérivées
(`committedAmount`, `paidAmount`, `paymentStatus`) sont **calculées en JS côté
serveur** à chaque requête, jamais persistées.

**Implication :** Si la logique de calcul change (ex. un devis SELECTED
contribue-t-il différemment au committed ?), les valeurs affichées changent
immédiatement pour toutes les lignes historiques. Pas de snapshot, pas
d'historique de valeur calculée.

Pour un module B2B, c'est un risque : une rétro-correction de règle de gestion
peut faire paraître un budget équilibré là où il ne l'était pas. **À documenter**
dans les règles métier ou à snapshoter si nécessaire.

### 1.2 Précision monétaire

`Decimal(12,2)` côté Prisma/PostgreSQL ✅ — pas de dérive binaire.

Arithmétique JavaScript en **centimes entiers** (`toCents` / `fromCents`) ✅ — 
évite les erreurs d'arrondi classiques (`0.1 + 0.2 !== 0.3`).

Stockage normalisé via `.toFixed(2)` avant `prisma.update()` ✅.

**Aucun problème ici.** L'approche est correcte et cohérente.

### 1.3 Multi-devises (A3)

Le champ `currency: String @default("EUR")` existe dans le modèle `Budget`
mais n'est jamais lu dynamiquement en UI. `formatMoney()` hardcode
`{ currency: "EUR", locale: "fr-FR" }`.

Le champ est retourné dans tous les snapshots de budget mais ignoré.

**Décision PO : supprimer.** Migration requise. Tant qu'il reste, tout développeur
qui lit le schéma croit que la multi-devise est supportée — dette cognitive.

### 1.4 Soft delete vs hard delete (A7)

Tous les deletes sont en **CASCADE dur** :

```
Event ──(CASCADE)──> Budget ──(CASCADE)──> BudgetLine ──(CASCADE)──> Quote
                                                        ──(CASCADE)──> PaymentEntry
                                     Vendor ──(CASCADE)──> Quote
```

Supprimer un événement = perdre l'intégralité de l'historique financier.
Pour un usage B2B, un organisateur qui clôture un événement "par erreur"
perd les données de facturation.

**Recommandation :** Soft-delete sur `Event` (champ `archivedAt`) ou export
obligatoire avant suppression. La suppression physique reste possible mais
nécessite une confirmation en deux étapes ("Tapez le nom de l'événement").

### 1.5 Race conditions (A9)

La mutation `selectQuote` utilise `prisma.$transaction` avec **3 opérations** :
1. `updateMany` — démotion de l'ancien devis sélectionné → RECEIVED
2. `update` — sélection du nouveau devis → SELECTED
3. `update` — mise à jour de `BudgetLine.selectedQuoteId`

Le problème : l'isolation par défaut de PostgreSQL est **READ COMMITTED**.
Si deux organisateurs (co-orga) lancent `selectQuote` simultanément sur
la même ligne :

```
Tx A lit selectedQuoteId = "quote-X"
Tx B lit selectedQuoteId = "quote-X"
Tx A démotion quote-X → RECEIVED, sélection quote-Y, update ligne
Tx B démotion quote-X → RECEIVED (déjà RECEIVED — inoffensif)
Tx B sélection quote-Z, update ligne.selectedQuoteId = quote-Z
→ Fin : ligne pointe sur quote-Z mais quote-Y est SELECTED aussi ⚠️
```

La contrainte UNIQUE sur `selectedQuoteId` ne protège pas contre ce cas
(les deux écritures sur `budgetLine` portent des `id` différents).

**Fix :** `prisma.$transaction([...], { isolationLevel: "Serializable" })`
ou SELECT FOR UPDATE sur `BudgetLine` en début de transaction.

### 1.6 Vendor deduplication (A10)

Dans `add-sourcing-vendor.ts` et `add-received-quote.ts`, la déduplication
se fait par `findFirst({ where: { eventId, name } })`. Si le nom correspond,
les coordonnées du vendor sont **silencieusement mises à jour**.

Problème : deux prestataires différents avec le même nom (ex. deux
"Traiteur Martin" dans deux régions) seront fusionnés.

L'index `(eventId, name)` n'est pas une contrainte UNIQUE en base
(`@@index` uniquement) — il ne bloque rien, il accélère juste la recherche.

**Fix :** Contrainte `@@unique([eventId, name])` ou déduplication explicite
avec alerte ("Un prestataire avec ce nom existe déjà, voulez-vous le mettre
à jour ou en créer un nouveau ?").

---

## 2. Couche serveur

### 2.1 Server Actions — cohérence

**100% Server Actions**, aucune route API dédiée au module Budget. C'est
cohérent avec le reste du codebase. ✅

Toutes les mutations exportent une fonction `async` marquée `"use server"`
depuis un fichier dédié, appelée directement depuis les composants client.
Pattern uniform et lisible.

### 2.2 Validation Zod (double)

**Schémas définis dans `lib/`** (ex. `budget-line-form.ts`, `sourcing-forms.ts`).

Côté serveur : `schema.safeParse(input)` en tête de chaque mutation ✅  
Côté client : les composants importent les mêmes schémas pour la validation
en temps réel des formulaires ✅

Normalisation argent : `normalizeMoneyInput(value)` = `Number(value).toFixed(2)`
appliquée avant Prisma dans toutes les mutations ✅

**Aucun problème ici.** La double validation est correctement implémentée.

### 2.3 Autorisation

Structure actuelle :
```
requireEnabledModule(key: "EXPENSES", requireOrganizer: true)
  └─ isOrganizerRole(role) = role === "OWNER" || role === "ADMIN"
```

**Ce qui existe dans l'ACL (`acl.ts`) :**

```typescript
const PERM_MIN_ROLE: Record<Permission, Role> = {
  "event:close": "ADMIN",
  "member:kick": "ADMIN",
  "gift:create": "MEMBER",
  "gift:update": "MEMBER",
  "gift:delete": "ADMIN",
  "gift:reserve": "MEMBER",
};
```

**Aucune permission Budget n'est définie dans le système ACL.**
Le module Budget bypasse complètement l'ACL et fait sa propre vérification
`requireOrganizer`. C'est fonctionnel mais incompatible avec la roadmap B2B
multi-rôles (§4).

### 2.4 Pas de calcul d'équilibrage

Conforme à la décision PO (pas de Tricount). ✅

---

## 3. Couche client

### 3.1 State management

**Pattern uniforme :** `useTransition` pour le loading state + Server Action
appelée dans `startTransition`. Pas de `useOptimistic`, pas de SWR, pas de
React Query.

```typescript
// Pattern répété dans les 8 composants action
const [pending, startTransition] = useTransition();

function handleAction() {
  startTransition(async () => {
    const result = await serverAction(input);
    if (!result.ok) setError(result.formError);
  });
}
```

**Conséquence pour l'UX :** Après chaque mutation, l'utilisateur attend le
round-trip serveur + revalidation RSC avant de voir le résultat. Sur une
connexion normale (< 200ms) c'est acceptable. Sur mobile ou réseau dégradé,
chaque action "marquer payé", "sélectionner devis" introduit une latence perçue.

### 3.2 Stratégie de revalidation

Chaque mutation invalide 3 à 4 chemins via `revalidatePath` :

```typescript
revalidatePath(`/event/${eventSlug}/budget`);
revalidatePath(`/event/${eventSlug}/budget/lines`);
revalidatePath(`/event/${eventSlug}/budget/quotes`);
revalidatePath(`/event/${eventSlug}/budget/quotes/${budgetLineId}`);
```

**Problèmes :**
1. `revalidatePath` invalide le cache de **tous les utilisateurs** pour ces URLs.
   Pour un seul événement, c'est acceptable. Pour 30 événements simultanés
   (agence), les invalidations d'un utilisateur A pollue le cache des utilisateurs B.
2. Si deux onglets sont ouverts sur le même budget, le deuxième onglet peut
   afficher des données périmées jusqu'à la prochaine navigation.
3. La granularité "path complet" est lourde — toute la page est re-rendue même
   si seul un bouton change d'état.

**Recommandation :** Introduire `revalidateTag` avec un tag `budget:${budgetId}`.
Toutes les queries incluent `unstable_cache(..., { tags: ['budget:${budgetId}'] })`,
et les mutations invalident uniquement ce tag.

---

## 4. Matrice de rôles B2B (design requis avant implémentation)

### Rôles existants

| Rôle | Définition actuelle |
|---|---|
| OWNER | Créateur de l'événement |
| ADMIN | Co-organisateur avec droits larges |
| MEMBER | Participant standard |

### Proposition pour le module Budget

Le contexte B2B ajoute deux acteurs typiques non couverts :
- **Commanditaire / Client** : peut voir le budget (lecture seule) mais pas l'éditer
- **Assistant organisateur** : peut saisir des devis et paiements mais pas supprimer

| Action Budget | OWNER | ADMIN | BUDGET_VIEWER* | MEMBER |
|---|---|---|---|---|
| Voir le dashboard | ✅ | ✅ | ✅ | ❌ |
| Voir les lignes et devis | ✅ | ✅ | ✅ | ❌ |
| Voir les notes internes | ✅ | ✅ | ❌ | ❌ |
| Créer/modifier une ligne | ✅ | ✅ | ❌ | ❌ |
| Ajouter un devis | ✅ | ✅ | ❌ | ❌ |
| Sélectionner/rejeter un devis | ✅ | ✅ | ❌ | ❌ |
| Marquer une ligne réservée | ✅ | ✅ | ❌ | ❌ |
| Ajouter un paiement | ✅ | ✅ | ❌ | ❌ |
| Marquer un paiement payé | ✅ | ✅ | ❌ | ❌ |
| Supprimer une ligne | ✅ | ❌ | ❌ | ❌ |
| Exporter le budget | ✅ | ✅ | ✅ | ❌ |

*`BUDGET_VIEWER` n'est pas un rôle global EventMember — c'est une permission
spécifique au module Budget, à modéliser comme un champ sur `EventModule`
ou une table de permissions dédiée. Cette décision impacte le schema
(migration requise).

**Options de modélisation :**

**Option A** — Champ `viewerPolicy` sur `EventModule` :
```prisma
model EventModule {
  // ...
  budgetViewerPolicy  BudgetViewerPolicy @default(ORGANIZERS_ONLY)
  // ORGANIZERS_ONLY | ALL_MEMBERS | INVITED_EMAILS
}
```
Simple, pas de table supplémentaire, suffisant pour v1.

**Option B** — Table `EventModulePermission` :
```prisma
model EventModulePermission {
  id           String
  eventModuleId String
  userId        String
  level         PermissionLevel  // READ | WRITE | ADMIN
}
```
Plus flexible, plus complexe. Recommandé si plusieurs modules ont des
permissions différentes (budget, documents, contacts).

**Recommandation : Option A pour le lancement, Option B en v1.1.**

---

## 5. Performance et passage à l'échelle B2B

### 5.1 Profil de charge réaliste (agence B2B)

| Scénario | Lignes | Devis | Paiements | Total rows |
|---|---|---|---|---|
| Petit événement | 10 | 20 | 15 | ~50 |
| Événement standard | 30 | 80 | 60 | ~170 |
| Gros événement (mariage/corpo) | 80 | 200 | 150 | ~430 |
| Limite actuelle (non paginé) | 100 | 300+ | 200+ | **600+** |

### 5.2 Requêtes actuelles (A11, A12)

`getBudgetSummary` et `getBudgetLines` chargent **toutes** les lignes avec
inclusions profondes en une seule requête Prisma :

```
budget → lines[] → quotes[] → (status uniquement)
                 → payments[] → (tous les champs)
                 → selectedQuote → vendor
```

Avec 80 lignes × 10 devis × 5 paiements :
- ~80 lignes + ~800 devis + ~400 paiements = ~1280 rows rapatriées
- Calcul des totaux en boucle JS sur tous les paiements

Pour un événement standard c'est acceptable (< 100ms). Pour un gros événement
corporate ou une agence avec données accumulées, c'est un risque de timeout.

**Recommandation :**
1. Agréger les totaux en SQL : `prisma.paymentEntry.aggregate({ _sum: { amount: true }, where: { paidAt: { not: null } } })`
2. Paginer les lignes avec cursor : `findMany({ take: 20, cursor: { id: lastId } })`
3. Lazy-load les devis et paiements à l'ouverture d'une ligne (accordion)

### 5.3 Absence de dashboard multi-événements (A14)

Une agence avec 30 événements actifs n'a aucune vue consolidée :
- Paiements dus cette semaine sur tous les événements
- Taux d'engagement des budgets (committed / total)
- Alertes prioritaires cross-events

La structure actuelle (toutes les queries scoped à un `eventSlug`) rend
cela techniquement possible (query cross-events avec `userId` comme pivot)
mais non implémenté. C'est un gap produit majeur pour la cible B2B.

---

## 6. Tests et robustesse

### 6.1 Couverture actuelle

`src/features/budget/server/workflow.test.mjs` — 13 tests unitaires sur la
machine d'état (transitions, invariants).

**Runner :** Node.js `assert` natif, pas Jest ni Vitest.  
**Conséquence :** non intégré au pipeline de CI (pas de script `test` dans
`package.json`), ne tourne pas en pre-commit, résultats non rapportés.

### 6.2 Cas limites non couverts

| Cas limite | Couvert ? |
|---|---|
| Sélection simultanée de deux devis (race condition) | ❌ |
| Paiement > committedAmount | ❌ |
| Ligne BOOKED sans paiement défini | ❌ (autorisé, non testé) |
| Budget supprimé pendant une mutation en cours | ❌ |
| Vendor avec même nom créé en concurrence | ❌ |
| Réouverture d'une ligne avec 0 devis restants | ✅ (workflow.test) |
| Sélection d'un devis sans montant | ✅ (workflow.test) |
| Marquage payé d'un paiement déjà payé | ✅ (idempotent côté code) |

### 6.3 Pas de tests de mutation ni d'intégration

Aucun test ne vérifie que les Server Actions produisent les bons effets
en base de données. La confiance actuelle repose entièrement sur TypeScript
strict + relecture manuelle.

---

## 7. Sécurité — points spécifiques

### Pas de fuite cross-events

Toutes les mutations vérifient `assertQuoteInEventChain` /
`assertBudgetLineWritableInEvent` qui remontent jusqu'à `budget.eventId`
et le comparent à l'événement de l'utilisateur. ✅

Il n'est pas possible pour un utilisateur d'accéder aux données d'un autre
événement via manipulation des IDs.

### Notes internes exposées aux ADMIN

Le champ `internalNote` sur les lignes et devis est visible par tous les
ADMIN. Pour un usage agence+commanditaire, si un commanditaire est ADMIN,
il voit les notes internes (marge, commentaires négatifs sur un prestataire).

**À traiter avec la matrice de rôles (§4) : `internalNote` = permission
ORGANIZERS_ONLY.**

### Aucun rate limiting sur les mutations

Une mutation peut être appelée en boucle (spam de création de lignes/devis).
Pas de protection côté Server Action. Acceptable en v1 si l'accès est limité
aux membres d'événements.

---

*Fin de la Phase 1. En attente de validation avant Phase 2 (audit UX).*
