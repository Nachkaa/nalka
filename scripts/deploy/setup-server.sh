#!/usr/bin/env bash
# Run once as deploy after reviewing docs/deployment.md and preparing runtime.env.
set -euo pipefail
umask 077
[[ $(id -un) == deploy ]]
deploy_root=/home/deploy/app/nalka-deploy
legacy_app=/home/deploy/app/nalka
node_bin=/home/deploy/.nvm/versions/node/v22.21.1/bin/node
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
[[ -x "$node_bin" && -r "$legacy_app/.next/BUILD_ID" && -r "$deploy_root/shared/runtime.env" ]]
[[ ! -e "$deploy_root/current" && ! -L "$deploy_root/current" ]]
[[ ! -e /etc/systemd/system/nalka.service.d/zz-release.conf ]]
[[ ! -e /etc/systemd/system/nalka-preview@.service ]]
[[ ! -e /usr/local/sbin/nalka-release-service ]]
[[ ! -e /etc/sudoers.d/nalka-release ]]
if grep -Eq '^[[:space:]]*(export[[:space:]]+)?(NODE_ENV|HOSTNAME|PORT|NALKA_RELEASE_SHA|NALKA_VERIFY_PRODUCTION)[[:space:]]*=' "$deploy_root/shared/runtime.env"; then
  echo "Remove reserved deployment variables from shared/runtime.env; see docs/deployment.md." >&2
  exit 1
fi
sudo -v
mkdir -p "$deploy_root"/{releases,incoming,shared}
chmod 700 "$deploy_root" "$deploy_root/shared" "$deploy_root/incoming"
chmod 600 "$deploy_root/shared/runtime.env"
for kind in gift-images event-images; do
  mkdir -p "$legacy_app/public/$kind"
  ln -s "$legacy_app/public/$kind" "$deploy_root/shared/$kind"
done
legacy_release="$deploy_root/releases/legacy-$(date +%s)"
mkdir -p "$legacy_release/.deploy"
cat >"$legacy_release/server.js" <<'EOF'
// Preserve the previous Next.js build as the first rollback target.
process.chdir('/home/deploy/app/nalka');
process.argv = [process.execPath, '/home/deploy/app/nalka/node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '3000'];
require('/home/deploy/app/nalka/node_modules/next/dist/bin/next');
EOF
: >"$legacy_release/.deploy/release.env"
ln -s "$legacy_release" "$deploy_root/current"

sudo install -o root -g root -m 755 "$script_dir/service-control.sh" /usr/local/sbin/nalka-release-service
sudo tee /etc/systemd/system/nalka.service.d/zz-release.conf >/dev/null <<'EOF'
[Service]
WorkingDirectory=/home/deploy/app/nalka-deploy/current
EnvironmentFile=
EnvironmentFile=/home/deploy/app/nalka-deploy/shared/runtime.env
EnvironmentFile=/home/deploy/app/nalka-deploy/current/.deploy/release.env
Environment="NODE_ENV=production" "HOSTNAME=127.0.0.1" "PORT=3000"
ExecStartPre=
ExecStart=
ExecStart=/home/deploy/.nvm/versions/node/v22.21.1/bin/node /home/deploy/app/nalka-deploy/current/server.js
MemoryHigh=512M
MemoryMax=768M
MemorySwapMax=128M
CPUQuota=50%
EOF
sudo tee /etc/systemd/system/nalka-preview@.service >/dev/null <<'EOF'
[Unit]
Description=Nalka release readiness check
After=network.target

[Service]
Type=exec
User=deploy
Group=deploy
WorkingDirectory=/home/deploy/app/nalka-deploy/releases/%i
EnvironmentFile=/home/deploy/app/nalka-deploy/shared/runtime.env
EnvironmentFile=/home/deploy/app/nalka-deploy/releases/%i/.deploy/release.env
Environment="NODE_ENV=production" "HOSTNAME=127.0.0.1" "PORT=3001"
ExecStart=/home/deploy/.nvm/versions/node/v22.21.1/bin/node /home/deploy/app/nalka-deploy/releases/%i/server.js
MemoryHigh=384M
MemoryMax=512M
MemorySwapMax=128M
CPUQuota=25%
CPUWeight=20
OOMPolicy=stop
Restart=no
RuntimeMaxSec=5min
EOF
sudoers_tmp=$(mktemp)
trap 'rm -f "$sudoers_tmp"' EXIT
printf 'deploy ALL=(root) NOPASSWD: /usr/local/sbin/nalka-release-service\n' >"$sudoers_tmp"
sudo visudo -cf "$sudoers_tmp"
sudo install -o root -g root -m 440 "$sudoers_tmp" /etc/sudoers.d/nalka-release
sudo systemctl daemon-reload
echo "Nalka deployment setup installed. The running app has not been restarted."
