# Nalka production deployment

## Goal and constraints

Deploy a tested `main` commit to the existing Ubuntu VPS without building or installing packages there. Keep the current systemd resource limits, production secrets and uploaded images. Verify the release and database before switching; restore the previous release when readiness or public HTTPS checks fail.

The repository currently has CI only. The VPS, its SSH credentials, sudo policy and production migration history are not accessible from this workspace. Activation therefore requires the one-time setup below; a disabled deploy job must never be reported as a live deployment.

## Implementation plan

1. Build a separate production standalone artifact after the existing release gate, using production public configuration and fixture-only database credentials.
2. Exercise the extracted artifact in CI, including the existing critical smoke tests.
3. Deploy only `main`, with a pinned SSH host key, serialized activation and release-specific health checks.
4. Keep runtime secrets on the VPS. Check migration history read-only; require a separately reviewed migration when the histories differ.
5. Stage before switching, preserve a legacy rollback target, and document configuration and recovery.

## Verification plan

Run the existing typecheck, lint, production build and smoke gate. Add focused deployment tests for schema compatibility, health failures, release activation and rollback; validate shell and workflow syntax. Check the same commit on a branch before updating `main`.

## Rollback and risks

Code rollback cannot undo database migrations; automated deployment must not execute them. Runtime secrets and uploaded files must remain outside immutable artifacts. A first deployment can be blocked by unapplied migrations or missing server configuration, and must leave the running legacy app available.

## Release flow

`Nalka Release Gate` runs the existing checks, then builds a standalone Node.js 22/Linux artifact. The extracted archive must pass readiness, static-asset, authenticated event/invite, privacy and anonymous-draft smoke tests against an isolated CI database. Production runtime secrets are never needed by those jobs.

On `main`, after both jobs succeed and deployment is enabled, GitHub uploads that archive over pinned-host-key SSH. The VPS verifies its checksum, runtime configuration and exact migration history, then starts a bounded preview on `127.0.0.1:3001`. Only after preview readiness does it atomically change `current` and restart `nalka.service`. It checks the exact release SHA, database connectivity, login page and a static asset on both localhost and `https://nalka.fr`. Failure restores the previous symlink and restarts the previous app. The restart causes a brief interruption; this is not a zero-downtime deployment.

The preview is limited to 512 MiB RAM, 128 MiB swap and 25% of one CPU. The live service keeps the recovery limits: 768 MiB RAM, 128 MiB swap and 50% of one CPU. There is no package install or build on the VPS. Neither smoke tests nor the deploy script send production test emails or create production test users.

## One-time VPS setup

Run these steps through the existing trusted SSH session as `deploy`. The fixed paths match the recovered service and Node.js 22.21.1 installation. Review `sudo systemctl cat nalka` privately first: preserve any additional runtime configuration currently supplied by the service.

1. Prepare `/home/deploy/app/nalka-deploy/shared/runtime.env` with the effective production configuration currently used by Nalka, including `.env.local` overrides and any OAuth/cron settings. Use plain `KEY=value` entries compatible with both Node's `--env-file` and systemd's `EnvironmentFile`. Keep this file on the VPS.

   ```bash
   install -d -m 700 /home/deploy/app/nalka-deploy/shared
   touch /home/deploy/app/nalka-deploy/shared/runtime.env
   chmod 600 /home/deploy/app/nalka-deploy/shared/runtime.env
   nano /home/deploy/app/nalka-deploy/shared/runtime.env
   ```

   Required values:

   | Setting                                            | Production value                                                         |
   | -------------------------------------------------- | ------------------------------------------------------------------------ |
   | `DATABASE_URL`                                     | Existing PostgreSQL connection                                           |
   | `AUTH_SECRET` or `NEXTAUTH_SECRET`                 | Existing session secret; preserve it                                     |
   | `AUTH_URL`, `NEXTAUTH_URL`                         | `https://nalka.fr`                                                       |
   | `MAIL_MODE`                                        | `smtp`                                                                   |
   | `MAIL_FROM`                                        | Existing sender                                                          |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Existing SMTP configuration; existing `EMAIL_SERVER_*` aliases also work |

   Do not include `NODE_ENV`, `HOSTNAME`, `PORT`, `NALKA_RELEASE_SHA` or `NALKA_VERIFY_PRODUCTION`: deployment controls them. Preserve any existing valid `NODE_OPTIONS`; remove references to missing preload files. Copy public analytics configuration into the GitHub variables below because Next.js freezes public values during the build.

2. Fetch the reviewed setup scripts without changing the running legacy checkout or its `.next` build:

   ```bash
   git -C /home/deploy/app/nalka fetch origin main
   nalka_setup_dir=$(mktemp -d)
   git -C /home/deploy/app/nalka show origin/main:scripts/deploy/setup-server.sh > "$nalka_setup_dir/setup-server.sh"
   git -C /home/deploy/app/nalka show origin/main:scripts/deploy/service-control.sh > "$nalka_setup_dir/service-control.sh"
   bash "$nalka_setup_dir/setup-server.sh"
   ```

   This installs a late systemd drop-in, a bounded preview service and a root-owned helper with narrowly scoped sudo access. The helper permits only resetting Nalka's failed/start-limit state and restarting it, plus starting/stopping a preview whose release ID passes validation. It preserves the existing legacy build as the first rollback target and links both gift/event upload directories to their existing storage. Setup reloads systemd but does not restart the running app. The script refuses to overwrite an existing setup; resolve a partial setup before rerunning it.

3. Authorize a dedicated GitHub deployment SSH key for `deploy`, using a `restrict` entry in `/home/deploy/.ssh/authorized_keys`. Store the private key in GitHub's `NALKA_SSH_KEY` secret. An existing deployment key may be reused if its access is appropriate; no key belongs in the repository or chat.

4. Pin the server's SSH host key. Compare its fingerprint with the one shown from the trusted VPS session by `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`. Store the verified known-hosts line in `NALKA_SSH_KNOWN_HOSTS`. For a nonstandard port the entry must use `[host]:port`. The workflow never disables host-key checking or trusts a fresh network scan automatically.

## GitHub configuration and activation

In this repository's **Settings → Secrets and variables → Actions**, configure:

| Type                | Name                           | Value                                                           |
| ------------------- | ------------------------------ | --------------------------------------------------------------- |
| Variable            | `NALKA_SSH_HOST`               | VPS IPv4 address or DNS hostname, without `https://`            |
| Variable            | `NALKA_SSH_PORT`               | SSH port; defaults to `22`                                      |
| Secret              | `NALKA_SSH_KEY`                | Dedicated, unencrypted deployment private key                   |
| Secret              | `NALKA_SSH_KNOWN_HOSTS`        | Verified server known-hosts entry                               |
| Variable            | `NEXT_PUBLIC_ENABLE_ANALYTICS` | Existing `true`/`false` value; defaults to `false`              |
| Variable            | `NEXT_PUBLIC_POSTHOG_KEY`      | Existing public project key; required when analytics is enabled |
| Variable            | `NEXT_PUBLIC_POSTHOG_HOST`     | Existing public host; defaults to `https://eu.posthog.com`      |
| Repository variable | `NALKA_DEPLOY_ENABLED`         | Set to `true` **last**, after VPS setup and the other settings  |

The deployment job uses the `production` environment; SSH secrets can alternatively be scoped there. The enable flag must be a repository variable because it is checked before the job starts. Branch and PR builds cannot deploy. Main deployments are serialized and are never automatically cancelled mid-activation; superseded commits are skipped before upload.

After setup, open **Actions → Nalka Release Gate → Run workflow → main**. This runs the checks and deploys the current main commit without a dummy commit. Subsequent pushes to `main` do the same automatically. A skipped deployment job means deployment is disabled, not that the VPS was updated.

If the first deployment reports a schema-history mismatch, keep the running legacy app. Back up PostgreSQL and review pending migrations separately. Do not reset the database or rewrite migration history to make the check pass. Apply compatible migrations through the existing controlled process, then rerun the workflow. Future schema changes need the same review because automatic code rollback does not reverse database changes.

## Verification and recovery

Successful deployment requires `https://nalka.fr/api/health` to return HTTP 200 with `status: "ok"` and the exact deployed commit as `release`. HTTP 503 means database readiness failed. This public endpoint returns no user data, credentials or database details. Mail delivery still needs a controlled live check after deploying MAIL-001/MAIL-002.

Inspect operational state without dumping runtime secrets:

```bash
sudo systemctl status nalka --no-pager -l
sudo systemctl show nalka -p MemoryCurrent -p NRestarts -p ActiveState
readlink -f /home/deploy/app/nalka-deploy/current
curl --fail --silent --show-error https://nalka.fr/api/health
```

An activation failure exits nonzero even when rollback succeeds. Inspect the failed Actions job and the local service before retrying. For a manual code rollback after a successful deployment, wait until no deployment is running, acquire the same lock and restore `previous`:

```bash
(
  set -eu
  nalka_deploy_root=/home/deploy/app/nalka-deploy
  exec 9>"$nalka_deploy_root/deploy.lock"
  flock -n 9
  nalka_previous=$(readlink -f "$nalka_deploy_root/previous")
  test -d "$nalka_previous"
  ln -s "$nalka_previous" "$nalka_deploy_root/current.rollback"
  mv -Tf "$nalka_deploy_root/current.rollback" "$nalka_deploy_root/current"
  sudo -n /usr/local/sbin/nalka-release-service restart
  curl --fail --retry 8 --retry-connrefused --retry-delay 2 --max-time 10 http://127.0.0.1:3000/login
)
```

The first rollback target runs the preserved legacy Next.js build, which has no new health endpoint; verify its login page and service state instead. Keep the legacy checkout and upload directories. Release directories and failed-upload archives are retained for inspection: monitor disk space and remove only old, unreferenced release artifacts under `nalka-deploy`, never `current`, `previous`, `shared` or the original upload storage. GitHub artifacts expire after seven days.
