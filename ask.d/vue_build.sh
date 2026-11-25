#!/bin/sh

# id: 5
# group: BUILD
# desc: Build - Vue production bundle

TASK_DIR=$(cd "$(dirname "$0")" && pwd)
. "$TASK_DIR/lib.sh"

printf "  Build — Vue production bundle\n"
cd "$ROOT/vuejs" || exit 1
npm run build
