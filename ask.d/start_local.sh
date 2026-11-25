#!/bin/sh

# id: 3
# group: RUN
# desc: Start - local HTTP server (port 8080)

TASK_DIR=$(cd "$(dirname "$0")" && pwd)
. "$TASK_DIR/lib.sh"

printf "  Start — plain JS local HTTP server\n"
printf "  Open http://127.0.0.1:8080\n"
exec python3 -m http.server 8080 --directory "$ROOT/public"
