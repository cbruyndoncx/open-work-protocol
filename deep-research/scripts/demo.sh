#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

AUTO=0
if [[ "${1:-}" == "--auto" ]]; then
  AUTO=1
  shift
fi
if [[ $# -ne 0 ]]; then
  echo "Usage: $0 [--auto]" >&2
  exit 2
fi

export OWP_ADMIN_TOKEN="${OWP_ADMIN_TOKEN:-dev-admin}"
export UV_CACHE_DIR="${UV_CACHE_DIR:-$ROOT_DIR/.uv-cache}"

echo "==> Setting up venv + deps (uv)"
uv venv
source .venv/bin/activate
uv pip install -e .

echo "==> Starting scheduler (poold) on http://127.0.0.1:8787"
rm -f ./pool.db
poold --db ./pool.db --host 127.0.0.1 --port 8787 &
POOL_PID=$!

cleanup() {
  echo "==> Stopping poold (pid=$POOL_PID)"
  kill "$POOL_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

sleep 1

echo "==> Initializing demo repo + importing tasks"
pool admin init-repo demo --max-open-prs 2 --server http://127.0.0.1:8787
pool admin import-tasks ./demo/tasks.yaml --repo demo --server http://127.0.0.1:8787

if [[ "$AUTO" -eq 1 ]]; then
  echo "==> Starting simulated workers (demo mode)"
  pool worker simulate --register --server http://127.0.0.1:8787 --name Alice --skills python,docs --capacity 5 --once &
  W1=$!
  pool worker simulate --register --server http://127.0.0.1:8787 --name Bob --skills typescript --capacity 3 --once &
  W2=$!
  wait "$W1" "$W2" || true
  echo "==> Simulated workers finished"
fi

echo
echo "==> Now open the dashboard:"
echo "    http://127.0.0.1:8787/"
echo
echo "==> Start workers in separate terminals:"
echo "    cd \"$ROOT_DIR\" && source .venv/bin/activate"
echo "    pool worker register --server http://127.0.0.1:8787 --name Alice --skills python,docs --capacity 5"
echo "    pool worker run --server http://127.0.0.1:8787"
echo
echo "    pool worker register --server http://127.0.0.1:8787 --name Bob --skills typescript --capacity 3"
echo "    pool worker run --server http://127.0.0.1:8787"
echo
echo "Press Ctrl+C to stop."

wait "$POOL_PID"
