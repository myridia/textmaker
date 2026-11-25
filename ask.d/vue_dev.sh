#!/bin/sh

# id: 4
# group: RUN
# desc: Start - Vue dev server

TASK_DIR=$(cd "$(dirname "$0")" && pwd)
. "$TASK_DIR/lib.sh"

printf "  Start — Vue dev server\n"
cd "$ROOT/vuejs" || exit 1
npm run dev
