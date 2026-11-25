#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
sha=${1:?Expected commit SHA}
release_id=${2:?Expected release ID}
checksum=${3:?Expected archive checksum}
[[ "$sha" =~ ^[a-f0-9]{40}$ && "$release_id" =~ ^${sha}-[0-9]+-[0-9]+$ && "$checksum" =~ ^[a-f0-9]{64}$ ]] || exit 2
deploy_root=${NALKA_DEPLOY_ROOT:-/home/deploy/app/nalka-deploy}
node_bin=${NALKA_NODE:-/home/deploy/.nvm/versions/node/v22.21.1/bin/node}
archive="$deploy_root/incoming/$release_id.tar.gz"
exec 9>"$deploy_root/deploy.lock"
flock -n 9 || { echo "Another deployment is running." >&2; exit 1; }
[[ -x "$node_bin" && -r "$deploy_root/shared/runtime.env" && -L "$deploy_root/current" ]]
printf '%s  %s\n' "$checksum" "$archive" | sha256sum --check --status
stage=$(mktemp -d "$deploy_root/incoming/schema-$release_id.XXXXXX")
trap 'rm -rf -- "$stage"' EXIT
tar -xzf "$archive" -C "$stage" --no-same-owner
timeout 45 "$node_bin" --env-file="$deploy_root/shared/runtime.env" "$stage/.deploy/migrate-shared-budget.mjs" "$sha" --apply-reviewed-shared-budget
