# Nalka Documentation Cleanup Audit

## Executive verdict

- **Active docs:** `docs/PLANS.md`, `docs/audit/b2b-transition/00-audit.md`, and the live Budget operational docs: `docs/audit/budget/journal.md`, `docs/audit/budget/tech-debt.md`, and `docs/audit/budget/checklist-go-live.md`.
- **Obsolete docs:** `docs/marketing-home.md` is now stale because it documents the private-event homepage direction that the B2B transition audit says to move away from. The two top-level Secret Santa decoupling docs look historical and reference older route/component paths.
- **Duplicated docs:** Budget roadmap/checklist/journal overlap on PR status and launch criteria. Secret Santa audit/checklist overlap as a refactor closure packet. The old `docs/audits/` location was a duplicate structure, but it no longer exists.
- **Risky to delete:** Budget phase audits are risky to delete because they contain architecture rationale, issue IDs, and roadmap context still referenced by checklist and tech-debt. Secret Santa docs are risky to delete until the decoupling is confirmed as fully shipped and no longer useful for regression checks.
- **Should be archived:** Historical Budget phase audits, Secret Santa decoupling docs, and old marketing-home notes should eventually move under an archive namespace, not be deleted immediately.

## Documentation inventory

| File / folder | Current purpose | Status | Reason | Recommended action |
|---|---|---|---|---|
| `docs/` | Documentation root | ACTIVE | Contains planning, audits, and historical notes | Keep |
| `docs/architecture/` | Intended architecture docs folder | DELETE CANDIDATE | Folder is empty | Remove after confirming no pending architecture docs are expected |
| `docs/audit/` | Current audit namespace | ACTIVE | Matches existing `docs/audit/budget/` convention | Keep as canonical audit root |
| `docs/audit/b2b-transition/` | B2B transition audit package | ACTIVE | Correct location for the B2B transition work | Keep |
| `docs/audit/b2b-transition/00-audit.md` | Product/architecture audit for B2B repositioning | ACTIVE | Current strategic audit; replaces misplaced `docs/audits/b2b-transition-audit.md` | Keep as source of truth |
| `docs/audit/b2b-transition/01-docs-cleanup.md` | Documentation cleanup report | ACTIVE | Current report generated from the docs inventory | Keep |
| `docs/audit/budget/` | Budget module audit and sprint notes | ACTIVE | Budget is the strongest current B2B module and still has launch-risk docs | Keep |
| `docs/audit/budget/00-cartography.md` | Initial Budget module cartography | HISTORICAL | Useful source context, but some findings are now fixed or superseded | Archive after Budget launch or add "historical" banner |
| `docs/audit/budget/01-architecture.md` | Budget architecture audit | HISTORICAL | Contains issue IDs A1-A23; some are closed, some remain | Keep until issue status is reconciled, then archive |
| `docs/audit/budget/02-ux.md` | Budget UX audit | HISTORICAL | Useful rationale, but parts were implemented in Sprint 0/1 | Keep until launch checklist is resolved, then archive |
| `docs/audit/budget/03-roadmap.md` | Budget PR roadmap | SUPERSEDED | PR status is now better represented by `journal.md`; roadmap still has original plan and rationale | Keep for now, but mark historical after Sprint 1 |
| `docs/audit/budget/checklist-go-live.md` | Budget launch checklist | ACTIVE | Explicit go/no-go list derived from roadmap | Keep and update as PRs land |
| `docs/audit/budget/journal.md` | Budget execution journal | ACTIVE | Most current source for merged PRs, decisions, and drift | Keep as live operational log |
| `docs/audit/budget/tech-debt.md` | Budget technical debt queue | ACTIVE | Captures known deferred risks and follow-ups | Keep; consider promoting unresolved items into issues later |
| `docs/marketing-home.md` | Old homepage marketing plan | SUPERSEDED | Documents private-event/gift-first positioning; conflicts with B2B direction | Do not delete immediately; archive or rewrite after B2B homepage direction is approved |
| `docs/PLANS.md` | Planning template for risky work | ACTIVE | Referenced by repo workflow and still broadly useful | Keep |
| `docs/secret-santa-decoupling-audit.md` | Secret Santa decoupling notes | HISTORICAL | Short refactor audit; references older `tabs/modules` paths that no longer match current tree | Archive after confirming no regression checklist still uses it |
| `docs/secret-santa-decoupling-checklist.md` | Manual QA checklist for Secret Santa decoupling | HISTORICAL | Useful as regression memory, but top-level location is inconsistent | Move to archive or `docs/audit/secret-santa/` after confirmation |

## Duplicates and overlaps

- `docs/audit/budget/03-roadmap.md` and `docs/audit/budget/checklist-go-live.md` both contain launch criteria. The checklist is the active operational version; the roadmap is planning history.
- `docs/audit/budget/03-roadmap.md` and `docs/audit/budget/journal.md` both discuss PRs. The roadmap says what was planned; the journal says what actually happened.
- `docs/audit/budget/01-architecture.md`, `02-ux.md`, and `tech-debt.md` overlap on unresolved risks. `tech-debt.md` should be the live queue; phase audits should become historical once reconciled.
- `docs/marketing-home.md` conflicts with `docs/audit/b2b-transition/00-audit.md`: the former centers private events, gifts, and Secret Santa; the latter recommends professional event operations, budget, programme, RSVP, polls, and vendors.
- `docs/secret-santa-decoupling-audit.md` and `docs/secret-santa-decoupling-checklist.md` are a pair for the same completed refactor. They are not harmful, but they should not stay as permanent top-level docs.
- The wrong `docs/audits/` folder was a duplicate audit namespace. It is already absent after cleanup.

## Safe cleanup actions

- Keep `docs/audit/` as the only audit namespace.
- Keep `docs/audit/b2b-transition/00-audit.md` as the canonical B2B transition audit.
- Remove `docs/architecture/` if it remains empty and no pending docs are expected there.
- Add a short "historical" banner to `docs/audit/budget/00-cartography.md`, `01-architecture.md`, `02-ux.md`, and `03-roadmap.md` once the current Budget sprint finishes.
- Treat `docs/audit/budget/journal.md`, `tech-debt.md`, and `checklist-go-live.md` as the live Budget docs until launch.
- Move top-level Secret Santa docs into an archive or `docs/audit/secret-santa/` after human confirmation.

## Actions requiring human confirmation

- Delete or archive `docs/marketing-home.md`. It is likely superseded, but it may contain design decisions that still matter for the homepage implementation.
- Archive Budget phase audits. They contain issue IDs and rationale still useful while Budget is under active development.
- Delete or archive `docs/secret-santa-decoupling-audit.md` and `docs/secret-santa-decoupling-checklist.md`. They appear historical, but they may still be useful for regression testing around gifts and Secret Santa.
- Remove `docs/architecture/`. It is empty, but confirm whether the team intentionally reserved it for future architecture notes.
- Collapse Budget roadmap/checklist/journal into fewer docs. This should wait until the active Budget sprint ends, otherwise status history may be lost.

## Recommended final docs structure

```text
docs/
  PLANS.md
  audit/
    b2b-transition/
      00-audit.md
      01-docs-cleanup.md
    budget/
      README.md
      checklist-go-live.md
      journal.md
      tech-debt.md
      archive/
        00-cartography.md
        01-architecture.md
        02-ux.md
        03-roadmap.md
    secret-santa/
      archive/
        decoupling-audit.md
        decoupling-checklist.md
  archive/
    marketing-home.md
```

Notes:

- Add `README.md` files only where they reduce confusion. For Budget, a short index would help explain which docs are live versus historical.
- Do not create a broad documentation system yet. The repo only needs a small, consistent audit structure.
- Keep archival moves explicit in git history instead of deleting planning context.
