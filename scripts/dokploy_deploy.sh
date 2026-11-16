#!/usr/bin/env bash
# Submit the production Compose deployment to Dokploy.
set -euo pipefail
set +x

: "${DOKPLOY_URL:?Missing DOKPLOY_URL}"
: "${DOKPLOY_API_KEY:?Missing DOKPLOY_API_KEY}"
: "${DOKPLOY_COMPOSE_ID:?Missing DOKPLOY_COMPOSE_ID}"
: "${EXPECTED_SOURCE_REF:?Missing EXPECTED_SOURCE_REF}"

[[ "$DOKPLOY_URL" == https://* ]] || { echo "::error::Dokploy URL must use HTTPS" >&2; exit 1; }
[[ "$EXPECTED_SOURCE_REF" == refs/heads/main ]] || { echo "::error::Only main may be deployed" >&2; exit 1; }

base="${DOKPLOY_URL%/}"
meta="$(mktemp)"
reply="$(mktemp)"
trap 'rm -f "$meta" "$reply"' EXIT
chmod 600 "$meta" "$reply"

code="$(curl -sS --connect-timeout 10 --max-time 30 -o "$meta" -w '%{http_code}' -G "$base/api/compose.one" --data-urlencode "composeId=$DOKPLOY_COMPOSE_ID" -H 'accept: application/json' -H "x-api-key: $DOKPLOY_API_KEY")"
[[ "$code" == 200 ]] || { echo "::error::Compose lookup failed (HTTP $code)" >&2; exit 1; }
branch="$(jq -r '.branch // .customGitBranch // .gitlabBranch // .bitbucketBranch // .giteaBranch // empty' "$meta")"
[[ "$branch" == main ]] || { echo "::error::Dokploy source must target main" >&2; exit 1; }

payload="$(jq -cn --arg id "$DOKPLOY_COMPOSE_ID" '{composeId:$id}')"
code="$(curl -sS --connect-timeout 10 --max-time 60 -o "$reply" -w '%{http_code}' -X POST "$base/api/compose.deploy" -H 'accept: application/json' -H 'Content-Type: application/json' -H "x-api-key: $DOKPLOY_API_KEY" -d "$payload")"
[[ "$code" =~ ^2[0-9][0-9]$ ]] || { echo "::error::Deploy trigger failed (HTTP $code)" >&2; exit 1; }
if ! jq -e 'if type == "object" then .success == true else . == true end' "$reply" >/dev/null 2>&1; then
  echo "::error::Dokploy did not confirm acceptance of the deployment request" >&2
  exit 1
fi
echo "Dokploy accepted the deployment request. Check its dashboard for the result."
