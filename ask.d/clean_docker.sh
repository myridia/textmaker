#!/bin/sh

# id: 4
# group: MAINTENANCE
# desc: Clean - this project's Docker state

TASK_DIR=$(cd "$(dirname "$0")" && pwd)
. "$TASK_DIR/lib.sh"

printf "  Clean — this project's Docker state\n"
compose down --volumes --remove-orphans
