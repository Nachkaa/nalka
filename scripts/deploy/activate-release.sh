#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

sha=${1:?Expected commit SHA}
release_id=${2:?Expected release ID}
checksum=${3:?Expected archive checksum}
[[ "$sha" =~ ^[a-f0-9]{40}$ && "$release_id" =~ ^${sha}-[0-9]+-[0-9]+$ && "$checksum" =~ ^[a-f0-9]{64}$ ]] || exit 2
deploy_root=${NALKA_DEPLOY_ROOT:-/home/deploy/app/nalka-deploy}
node_bin=${NALKA_NODE:-/home/deploy/.nvm/versions/node/v22.21.1/bin/node}
public_url=${NALKA_PUBLIC_URL:-https://nalka.fr}
archive="$deploy_root/incoming/$release_id.tar.gz"
release="$deploy_root/releases/$release_id"
preview_started=0
switched=0
previous=

exec 9>"$deploy_root/deploy.lock"
flock -n 9 || { echo "Another deployment is running." >&2; exit 1; }
[[ -x "$node_bin" && -r "$deploy_root/shared/runtime.env" && -L "$deploy_root/current" ]]
if grep -Eq '^[[:space:]]*(export[[:space:]]+)?(NODE_ENV|HOSTNAME|PORT|NALKA_RELEASE_SHA|NALKA_VERIFY_PRODUCTION)[[:space:]]*=' "$deploy_root/shared/runtime.env"; then
  echo "Runtime environment contains reserved deployment variables." >&2
  exit 1
fi
previous=$(readlink -f "$deploy_root/current")
[[ -d "$previous" && ! -e "$release" ]]
printf '%s  %s\n' "$checksum" "$archive" | sha256sum --check --status

cleanup() {
  result=$?
  trap - EXIT INT TERM HUP
  if (( preview_started )); then
    sudo -n /usr/local/sbin/nalka-release-service preview-stop "$release_id" || result=1
  fi
  if (( result != 0 && switched )); then
    echo "Release check failed; restoring the previous release." >&2
    ln -sT "$previous" "$deploy_root/rollback.$release_id"
    mv -Tf "$deploy_root/rollback.$release_id" "$deploy_root/current"
    if sudo -n /usr/local/sbin/nalka-release-service restart &&
      curl --fail --silent --retry 8 --retry-connrefused --retry-delay 2 --max-time 10 http://127.0.0.1:3000/login >/dev/null; then
      echo "Previous release restored." >&2
    else
      echo "Rollback needs attention: inspect nalka.service on the VPS." >&2
    fi
  fi
  exit "$result"
}
trap cleanup EXIT
trap 'exit 1' INT TERM HUP

mkdir "$release"
tar -xzf "$archive" -C "$release" --no-same-owner
[[ -f "$release/server.js" && -f "$release/.deploy/release.env" ]]
for kind in gift-images event-images; do
  [[ -d "$deploy_root/shared/$kind" && ! -e "$release/public/$kind" ]]
  ln -s "$deploy_root/shared/$kind" "$release/public/$kind"
done

NALKA_VERIFY_PRODUCTION=1 timeout 45 "$node_bin" --env-file="$deploy_root/shared/runtime.env" "$release/.deploy/verify-release.mjs" "$sha"
preview_started=1
sudo -n /usr/local/sbin/nalka-release-service preview-start "$release_id"
"$node_bin" "$release/.deploy/health-check.mjs" http://127.0.0.1:3001 "$sha"
sudo -n /usr/local/sbin/nalka-release-service preview-stop "$release_id"
preview_started=0

ln -sT "$release" "$deploy_root/current.$release_id"
switched=1
mv -Tf "$deploy_root/current.$release_id" "$deploy_root/current"
sudo -n /usr/local/sbin/nalka-release-service restart
"$node_bin" "$release/.deploy/health-check.mjs" http://127.0.0.1:3000 "$sha"
"$node_bin" "$release/.deploy/health-check.mjs" "$public_url" "$sha"
ln -sT "$previous" "$deploy_root/previous.$release_id"
mv -Tf "$deploy_root/previous.$release_id" "$deploy_root/previous"
echo "Production release $sha verified."
