#!/bin/sh

# id: 2
# group: RUN
# desc: Start - Docker (port 80)

TASK_DIR=$(cd "$(dirname "$0")" && pwd)
. "$TASK_DIR/lib.sh"

printf "  Start — Docker\n"
compose up -d
printf "  Open http://127.0.0.1\n"
