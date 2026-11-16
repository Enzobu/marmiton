#!/usr/bin/env bash
set -euo pipefail
temp_dir="$(mktemp -d)"
trap 'rm -rf "$temp_dir"' EXIT

cat > "$temp_dir/curl" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
output=''
url=''
while (( $# )); do
  case "$1" in
    -o) output="$2"; shift ;;
    https://*) url="$1" ;;
  esac
  shift
done
printf '%s\n' "$url" >> "$MOCK_CALLS"
case "$url" in
  */api/compose.one)
    printf '{"branch":"%s"}' "${MOCK_BRANCH:-main}" > "$output"
    printf 200 ;;
  */api/compose.deploy)
    default_reply='{"success":true,"message":"Deployment queued","composeId":"fixture"}'
    printf '%s' "${MOCK_REPLY-$default_reply}" > "$output"
    printf '%s' "${MOCK_STATUS:-200}" ;;
  *) exit 1 ;;
esac
MOCK
chmod +x "$temp_dir/curl"
export PATH="$temp_dir:$PATH"
export DOKPLOY_URL=https://dokploy.example.invalid DOKPLOY_COMPOSE_ID=fixture DOKPLOY_API_KEY=fixture
export EXPECTED_SOURCE_REF=refs/heads/main MOCK_CALLS="$temp_dir/calls"
bash scripts/dokploy_deploy.sh
test "$(wc -l < "$MOCK_CALLS")" -eq 2
MOCK_REPLY=true bash scripts/dokploy_deploy.sh

if MOCK_STATUS=500 bash scripts/dokploy_deploy.sh > "$temp_dir/http-error" 2>&1; then
  echo 'An HTTP deployment error was accepted' >&2
  exit 1
fi
grep -q 'Deploy trigger failed (HTTP 500)' "$temp_dir/http-error"

if MOCK_REPLY='{"success":false}' bash scripts/dokploy_deploy.sh > "$temp_dir/rejected" 2>&1; then
  echo 'A rejected deployment was accepted' >&2
  exit 1
fi
grep -q 'Dokploy did not confirm acceptance' "$temp_dir/rejected"

: > "$MOCK_CALLS"
if MOCK_BRANCH=dev bash scripts/dokploy_deploy.sh > "$temp_dir/wrong-branch" 2>&1; then
  echo 'A Compose tracking dev was accepted' >&2
  exit 1
fi
grep -q 'Dokploy source must target main' "$temp_dir/wrong-branch"
test "$(wc -l < "$MOCK_CALLS")" -eq 1
