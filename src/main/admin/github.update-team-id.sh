#!/usr/bin/env bash

set -euo pipefail

print_usage() {
  echo "Usage: $0 --repo-url <github-html-url> --team-id <team-id>" >&2
  exit 1;
}

REPO_ID=""
TEAM_ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo|--repo-id|--repo-url)
      shift
      [[ $# -gt 0 ]] || print_usage
      REPO_ID="$1"
      ;;
    --team|--team-id)
      shift
      [[ $# -gt 0 ]] || print_usage
      TEAM_ID="$1"
      ;;
    *)
      print_usage
      ;;
  esac
  shift
done

if [[ -z "$REPO_ID" || -z "$TEAM_ID" ]]; then
  print_usage
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL environment variable must be set" >&2
  exit 1
fi

echo "Updating github.repository.team_id for repo '$REPO_ID' to team_id=$TEAM_ID"

# Escape single quotes to avoid breaking SQL literals
TEAM_ID_ESC=${TEAM_ID//\'/''}
REPO_ID_ESC=${REPO_ID//\'/''}

# Some repositories may not have a team assigned; allow unsetting by passing null/NULL
if [[ "$TEAM_ID_ESC" == "null" || "$TEAM_ID_ESC" == "NULL" ]]; then
  # Update github.repository.team_id, matching on lower(html_url)
  RESULT=$(psql "$DATABASE_URL" -X --tuples-only --no-align -c \
    "update github.repository set team_id = NULL where id = lower('$REPO_ID_ESC') returning id, team_id;")
else 
  # Ensure the target team exists
  TEAM_COUNT=$(psql "$DATABASE_URL" -X --tuples-only --no-align -c "select count(1) from team where id = '$TEAM_ID_ESC';")
  TEAM_COUNT=$(echo "$TEAM_COUNT" | tr -d '[:space:]')

  if [[ "$TEAM_COUNT" != "1" ]]; then
    echo "Team with id $TEAM_ID does not exist" >&2
    exit 1
  fi

  # Update github.repository.team_id, matching on lower(html_url)
  RESULT=$(psql "$DATABASE_URL" -X --tuples-only --no-align -c \
    "update github.repository set team_id = '$TEAM_ID_ESC' where id = lower('$REPO_ID_ESC') returning id, team_id;")
fi

if [[ -z "$RESULT" ]]; then
  echo "No github.repository row found with id/html_url '$REPO_ID'" >&2
  exit 1
fi

ROW_COUNT=$(echo "$RESULT" | wc -l | tr -d '[:space:]')
echo "Updated ${ROW_COUNT} row(s)."
