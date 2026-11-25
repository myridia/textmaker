#!/bin/sh

ROOT=$(cd "$(dirname "$0")/.." && pwd)

compose() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    docker compose -f "$ROOT/dockers/docker-compose.yml" "$@"
    return
  fi
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "$ROOT/dockers/docker-compose.yml" "$@"
    return
  fi
  printf "  docker compose not found\n"
  return 1
}
