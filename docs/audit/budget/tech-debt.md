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
