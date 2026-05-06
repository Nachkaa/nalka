# Pivot Provider Cockpit — décidé le 5 mai 2026

## Décision

Le module Budget évolue vers un "Provider Cockpit" :
plateforme de pilotage prestataires pour event managers B2B.

Le budget devient un sous-aspect du suivi prestataires, pas l'inverse.

## Pourquoi ce pivot

- Cible B2B confirmée : wedding planners, event managers, agences
- Le besoin opérationnel n°1 : "qui est booké, qui est en retard, 
  qui doit être chassé, qui est prêt"
- Le budget seul est trop financier — manque la dimension opérationnelle
- Différenciation produit vs solutions financières classiques

## Ce qui change

- "Postes" devient "Prestations"
- Nouveau mental model : Event > Prestation > Provider candidates > 
  Quotes > Selected provider > Booking > Preparation > Delivery > 
  Payments > Documents > Closure
- 11 statuts de cycle de vie (NEEDS_SCOPING → CLOSED)
- Section "À traiter maintenant" priorisée en haut de la Vue Pilotage
- Sub-nav refondue : Pilotage / Budget / Échéances / Documents

## Ce qui ne change pas (pour l'instant)

- Le schéma DB (BudgetLine, Vendor, Quote, PaymentEntry, PaymentLog)
- Le travail Sprint 1 mergé reste fonctionnel
- L'architecture event-scoped

## Calendrier

- Lancement public reporté de juillet vers septembre-octobre 2026
- 6 Sprints UX étalés sur 5-8 semaines selon disponibilité

## Plan

- Sprint UX-1 : Renaming + nav (3-4j)
- Sprint UX-2 : Vue d'ensemble Pilotage (5-7j)
- Sprint UX-3 : Détail prestation (5-7j)
- Sprint UX-4 : Page Échéances (3-4j)
- Sprint UX-5 : Page Documents (3-4j)
- Sprint UX-6 : Champs métier prestataire (refonte DB) (1-2 sem)

## Validation parallèle

Entretiens utilisateurs lancés en S1 (semaine du 5 mai).
Premiers retours attendus en S2-S3 → ajustement des Sprints UX-3 et 
suivants en fonction.

## Référence inspiration

Document interne "Provider Cockpit UX model" — 16 sections.
À conserver dans docs/audit/provider-cockpit/01-ux-model.md