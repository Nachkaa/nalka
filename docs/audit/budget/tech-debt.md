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
