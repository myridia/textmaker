#!/bin/sh

# id: 1
# group: SETUP
# desc: Check - verify JavaScript and shell syntax

TASK_DIR=$(cd "$(dirname "$0")" && pwd)
. "$TASK_DIR/lib.sh"

printf "  Check — verify JavaScript and shell syntax\n"
node --check "$ROOT/public/js/app.js"
node --check "$ROOT/public/js/main.js"
node "$ROOT/test/generator.test.js"
find "$ROOT" -name '*.sh' -type f -exec bash -n {} +
