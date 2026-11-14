#!/bin/bash
# Install root-owned. Keep the sudo grant limited to these Nalka operations.
set -euo pipefail
if [[ $# == 1 && "$1" == restart ]]; then
  # A failed candidate must not consume the start budget needed by rollback.
  /usr/bin/systemctl reset-failed nalka.service
  exec /usr/bin/systemctl restart nalka.service
fi
if [[ $# == 2 && "$2" =~ ^[a-f0-9]{40}-[0-9]+-[0-9]+$ ]]; then
  case "$1" in
    preview-start) exec /usr/bin/systemctl start "nalka-preview@$2.service" ;;
    preview-stop) exec /usr/bin/systemctl stop "nalka-preview@$2.service" ;;
  esac
fi
echo "Unsupported Nalka service operation." >&2
exit 2
