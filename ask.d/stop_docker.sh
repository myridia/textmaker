#!/bin/sh

# id: 3
# group: MAINTENANCE
# desc: Stop - Docker services

TASK_DIR=$(cd "$(dirname "$0")" && pwd)
. "$TASK_DIR/lib.sh"

printf "  Stop — Docker services\n"
compose down
