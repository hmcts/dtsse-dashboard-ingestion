#!/usr/bin/env bash

set -euo pipefail

print_usage() {
  echo "Usage: $0 --repo-url <github-html-url[,github-html-url...]> --team-id <team-id>" >&2
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

trim() {
  local s="$1"
  # Trim leading whitespace
  s="${s#"${s%%[![:space:]]*}"}"
  # Trim trailing whitespace
  s="${s%"${s##*[![:space:]]}"}"
  printf '%s' "$s"
}

# Split repo ids on commas and trim whitespace. Allow either "repo1, repo2" or "repo1,repo2".
IFS=',' read -r -a REPO_IDS_RAW <<< "$REPO_ID"
REPO_IDS=()
for repo in "${REPO_IDS_RAW[@]}"; do
  repo_trimmed="$(trim "$repo")"
  if [[ -z "$repo_trimmed" ]]; then
    echo "Invalid --repo-id/--repo-url value (empty entry)." >&2
    exit 1
  fi
  REPO_IDS+=("$repo_trimmed")
done

echo "Updating github.repository.team_id for ${#REPO_IDS[@]} repo(s) to team_id=$TEAM_ID"

# Escape single quotes to avoid breaking SQL literals
TEAM_ID_ESC=${TEAM_ID//\'/''}

IS_NULL_TEAM=false
if [[ "$TEAM_ID_ESC" == "null" || "$TEAM_ID_ESC" == "NULL" ]]; then
  IS_NULL_TEAM=true
else
  # Ensure the target team exists (once)
  TEAM_COUNT=$(psql "$DATABASE_URL" -X --tuples-only --no-align -c "select count(1) from team where id = '$TEAM_ID_ESC';")
  TEAM_COUNT=$(echo "$TEAM_COUNT" | tr -d '[:space:]')

  if [[ "$TEAM_COUNT" != "1" ]]; then
    echo "Team with id $TEAM_ID does not exist" >&2
    exit 1
  fi
fi

UPDATED_ROWS=0
MISSING_REPOS=()

for repo_id in "${REPO_IDS[@]}"; do
  REPO_ID_ESC=${repo_id//\'/''}
  echo "- Updating repo '$repo_id'"

  if [[ "$IS_NULL_TEAM" == true ]]; then
    RESULT=$(psql "$DATABASE_URL" -X --tuples-only --no-align -c \
      "update github.repository set team_id = NULL where id = lower('$REPO_ID_ESC') returning id, team_id;")
  else
    RESULT=$(psql "$DATABASE_URL" -X --tuples-only --no-align -c \
      "update github.repository set team_id = '$TEAM_ID_ESC' where id = lower('$REPO_ID_ESC') returning id, team_id;")
  fi

  if [[ -z "$RESULT" ]]; then
    MISSING_REPOS+=("$repo_id")
    continue
  fi

  ROW_COUNT=$(echo "$RESULT" | wc -l | tr -d '[:space:]')
  UPDATED_ROWS=$((UPDATED_ROWS + ROW_COUNT))
done

if [[ ${#MISSING_REPOS[@]} -gt 0 ]]; then
  echo "No github.repository row found with id/html_url for: ${MISSING_REPOS[*]}" >&2
  exit 1
fi

echo "Updated ${UPDATED_ROWS} row(s)."
