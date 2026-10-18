#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE="${RGB_BULB_IMAGE:-rgb-bulb-dev}"

if ! podman image exists "$IMAGE"; then
  podman build -f "$REPO/containers/Containerfile" -t "$IMAGE" "$REPO"
fi

TTY_ARGS=()
if [ -t 0 ] && [ -t 1 ]; then TTY_ARGS=(-it); fi

exec podman run --rm "${TTY_ARGS[@]}" \
  -v "$REPO:/work:Z" \
  -v rgb-bulb-node-modules:/work/node_modules \
  -v rgb-bulb-npm-cache:/root/.npm \
  "$IMAGE" "${@:-bash}"
