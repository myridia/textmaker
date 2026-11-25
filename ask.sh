#!/bin/sh

ROOT=$(cd "$(dirname "$0")" && pwd)
TASKS_DIR="$ROOT/ask.d"
. "$TASKS_DIR/lib.sh"

task_meta() {
  sed -n "s/^# $2: //p" "$1" | head -n1
}

task_id() {
  task_meta "$1" id
}

group_rank() {
  case "$1" in
    SETUP) printf '1' ;;
    RUN) printf '2' ;;
    MAINTENANCE) printf '3' ;;
    *) printf '4' ;;
  esac
}

list_tasks() {
  for f in "$TASKS_DIR"/*.sh; do
    [ -f "$f" ] || continue
    [ "${f##*/}" = "lib.sh" ] && continue
    group=$(task_meta "$f" group)
    printf '%s|%s|%s|%s|%s\n' "$(group_rank "$group")" "$(task_id "$f")" "$group" "$(task_meta "$f" desc)" "$f"
  done | sort -t'|' -k1,1n -k2,2n
}

show_menu() {
  printf "%s\n" '  ┌─────┬──────────────────────────────────────────────┐'
  printf "%s\n" '  │  ID │ Description                                  │'
  printf "%s\n" '  ├─────┼──────────────────────────────────────────────┤'
  last_group=""
  list_tasks | while IFS='|' read -r rank id group desc file; do
    if [ "$group" != "$last_group" ]; then
      [ -z "$last_group" ] || printf "%s\n" '  ├─────┼──────────────────────────────────────────────┤'
      printf '  │     │ %-44s │\n' "$group"
      last_group=$group
    fi
    printf '  │ %2s  │ %-44s │\n' "$id" "$desc"
  done
  printf "%s\n" '  ├─────┼──────────────────────────────────────────────┤'
  printf '  │ %2s  │ %-44s │\n' "0" "Exit"
  printf "%s\n" '  └─────┴──────────────────────────────────────────────┘'
}

printf "\n  textmaker — Task Runner\n\n"

while true; do
  show_menu

  printf "  Enter Task ID: "
  read task || exit 0

  if [ "$task" = "0" ]; then
    printf "  Goodbye!\n"
    exit 0
  fi

  task=${task#0}
  case "$task" in
    ''|*[!0-9]*)
      printf "  Unknown task: %s\n" "$task"
      sleep 2
      printf "\n"
      continue
      ;;
  esac

  task_file=""
  for f in "$TASKS_DIR"/*.sh; do
    [ -f "$f" ] || continue
    [ "${f##*/}" = "lib.sh" ] && continue
    if [ "$(task_id "$f")" = "$task" ]; then
      task_file=$f
      break
    fi
  done

  if [ -n "$task_file" ]; then
    sh "$task_file"
    rc=$?
    [ "$rc" -eq 0 ] || printf "  Task %s exited with code %s.\n" "$task" "$rc"
  else
    printf "  Unknown task: %s\n" "$task"
  fi

  sleep 2
  printf "\n"
done
