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
case "$url" in
  */api/compose.one) printf '{"branch":"main"}' > "$output" ;;
  */api/compose.deploy) printf '{"deploymentId":"test-deployment"}' > "$output" ;;
  */api/deployment.allByCompose) printf '[{"deploymentId":"other","status":"failed"},{"deploymentId":"test-deployment","status":"done"}]' > "$output" ;;
  */api/version) printf '{"sha":"%s"}' "$RESPONSE_SHA" > "$output" ;;
  *) exit 1 ;;
esac
printf 200
MOCK
chmod +x "$temp_dir/curl"
export PATH="$temp_dir:$PATH"
export DOKPLOY_URL=https://dokploy.example.invalid DOKPLOY_COMPOSE_ID=fixture DOKPLOY_API_KEY=fixture
export EXPECTED_SOURCE_REF=refs/heads/main APP_VERSION_URL=https://api.example.invalid/api/version
export EXPECTED_COMMIT_SHA=1111111111111111111111111111111111111111
RESPONSE_SHA="$EXPECTED_COMMIT_SHA" bash scripts/dokploy_deploy.sh
if RESPONSE_SHA=2222222222222222222222222222222222222222 bash scripts/dokploy_deploy.sh > "$temp_dir/mismatch" 2>&1; then
  echo 'A mismatched SHA was accepted' >&2
  exit 1
fi
grep -q 'Deployed SHA differs' "$temp_dir/mismatch"
