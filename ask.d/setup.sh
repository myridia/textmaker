#!/bin/sh

# id: 1
# group: SETUP
# desc: Setup - install npm dependencies

TASK_DIR=$(cd "$(dirname "$0")" && pwd)
. "$TASK_DIR/lib.sh"

printf "  Setup — install npm dependencies\n"
cd "$ROOT/public" || exit 1
npm install
cd "$ROOT/vuejs" || exit 1
npm install
