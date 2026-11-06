#!/usr/bin/env bash
# Build the site and publish it to the OCI VM (dellanio-host).
#
#   deploy/deploy.sh             build, upload a new release, switch to it
#   deploy/deploy.sh --rollback  switch back to the previous release
#
# The VM's nginx container (dellanio-site) mounts /var/www/dellanio.com as its
# html root. Each release lands in $ROOT/releases/<timestamp> and $ROOT/current
# points to the live one. The link is relative, so it also resolves inside the
# container; switching and rolling back are instant. The last five releases
# are kept. Settings can be overridden from the environment.
set -euo pipefail

HOST="${HOST:-ubuntu@193.122.206.82}"
KEY="${KEY:-$HOME/.ssh/oci_dellanio}"
ROOT="${ROOT:-/var/www/dellanio.com/site}"
KEEP="${KEEP:-5}"

ssh_run() { ssh -i "$KEY" -o ConnectTimeout=15 "$HOST" "$@"; }

if [[ "${1:-}" == "--rollback" ]]; then
  ssh_run "set -e; cd '$ROOT'; prev=\$(ls -1t releases | sed -n 2p); test -n \"\$prev\" || { echo 'no previous release'; exit 1; }; ln -sfn \"releases/\$prev\" current; echo \"live: \$prev\""
  exit 0
fi

cd "$(dirname "$0")/.."
echo "› building"
npm run build

STAMP="$(date +%Y%m%d-%H%M%S)"
echo "› uploading release $STAMP to $HOST:$ROOT"
tar -C dist -czf - . | ssh_run "set -e; mkdir -p '$ROOT/releases/$STAMP'; tar -xzf - -C '$ROOT/releases/$STAMP'"

echo "› switching current → $STAMP"
ssh_run "set -e; cd '$ROOT'; ln -sfn 'releases/$STAMP' current; cd releases; ls -1t | tail -n +$((KEEP + 1)) | xargs -r rm -rf; echo kept: \$(ls -1t | tr '\n' ' ')"

echo "› done: https://dellanio.com (index.html is no-cache; Cloudflare may hold the old page for a moment)"
