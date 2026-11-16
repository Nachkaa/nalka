# SS-002: serialize Secret Santa draws and notifications

## Goal

One event cannot replace a draw while another request is still publishing its notifications. A delayed or repeated request based on an older draw cannot replace the newer one. Preserve organizer authorization, explicit redraw confirmation, participant eligibility and assignment secrecy.

## Constraints and approach

- No schema change or production migration.
- Hold a PostgreSQL session advisory lock on a dedicated `pg` connection across assignment persistence and notifications. Do not hold an open Prisma write transaction during SMTP delivery. Competing requests return a busy result immediately; ending the session releases its lock, including after a process exit.
- Current production and CI connect directly to PostgreSQL. A session-affine connection is required; transaction-pooling proxies are unsupported for this lock connection. Use `DIRECT_URL` when supplied, otherwise `DATABASE_URL`.
- Send an opaque SHA-256 revision of assignment IDs to organizers only. Check the expected revision inside a short transaction, after locking the event module row. This also rejects duplicate requests that arrive after the advisory lock has been released.
- Commit assignments before sending email. Keep the advisory lock until every notification attempt finishes. Check lock-connection health before each send; stop sending if that connection is lost.
- Preserve committed assignments when mail fails and report a non-sensitive failure count. No automatic redraw or email retry; SMTP cannot provide exactly-once delivery after an ambiguous acknowledgement.
- Membership changes and account deletion during a draw remain QA-005; this change does not redefine attendance or gift participation.

## Implementation

1. Add feature-local revision and PostgreSQL lock helpers.
2. Guard the real server action, including stale requests and notification failures.
3. Provide the organizer revision through server-rendered module props and update the client busy/stale/success states.
4. Extend action regressions and add actual PostgreSQL concurrency tests in CI. Exercise the lock dependency in the packaged artifact.

## Verification

- Concurrent confirmed redraws and first draws; requests delayed until after completion; independent events.
- Authorization and confirmation checks still prevent writes/emails; rollback and SMTP failures release the lock; assignment data is absent from error logs.
- PostgreSQL integration tests use only the explicitly enabled `nalka_ci` fixture database and stub email delivery.
- Typecheck, lint, production build, existing release gate and packaged artifact verification.

## Rollback / limits

Code rollback requires no data rollback. An interrupted process may leave a committed draw with partially delivered mail; its assignments remain authoritative and are not silently replaced. A disconnected lock session stops further notification attempts; already accepted SMTP mail cannot be recalled. Reusing a fresh revision and explicitly confirming a later redraw remains supported.
