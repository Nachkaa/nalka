# Checklist Go/No-Go — Lancement module Budget

Source : `docs/audit/budget/03-roadmap.md` §6

---

## P0 Critique (tous requis)

- [ ] PR-05 mergée : Budget auto-créé à l'activation du module (A1)
- [ ] PR-04 mergée : `currency` supprimé, `EXPENSES` → `BUDGET` (A2, A3)
- [ ] PR-06 mergée : paiement démarquable + `PaymentLog` opérationnel (A4)
- [ ] PR-09 déployée : email rappel paiements dus fonctionnel en prod (A23)
- [ ] PR-10 mergée : `allowSkip` activé sur l'onboarding
- [ ] PR-08 mergée : transaction `Serializable` + unicité vendor (A9, A10)
- [ ] PR-07 mergée : validation `amount ≤ committedAmount` (A8)

## P0 Polish (≥ 80 % requis)

- [ ] PR-01 mergée : accents corrects, "Prestataire", "Engagé"
- [ ] PR-02 mergée : `inputMode="decimal"`, `type="date"`, champs obligatoires
- [ ] PR-03 mergée : dates vides masquées, "Réglé le" conditionnel
- [ ] PR-03b mergée : tableau responsive mobile

## Conditions complémentaires

- [ ] ≥ 3 entretiens utilisateurs réalisés, retours intégrés ou documentés
- [ ] PostHog instrumenté sur les 6 KPIs (voir 03-roadmap.md §3)
- [ ] Politique de rétention RGPD documentée minimalement avant tout DPA (A21)
- [ ] `QuoteAttachment.fileUrl` validé côté serveur — whitelist `https://` (A22)
- [ ] `/api/debug/my-events` supprimé
