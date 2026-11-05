#!/usr/bin/env bash
# Marmiton-specific Dokploy adapter. Version verification will be added with the API.
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
status_body="$(mktemp)"
health_body="$(mktemp)"
trap 'rm -f "$meta" "$reply" "$status_body" "$health_body"' EXIT
chmod 600 "$meta" "$reply" "$status_body" "$health_body"

code="$(curl -sS --connect-timeout 10 --max-time 30 -o "$meta" -w '%{http_code}' -G "$base/api/compose.one" --data-urlencode "composeId=$DOKPLOY_COMPOSE_ID" -H 'accept: application/json' -H "x-api-key: $DOKPLOY_API_KEY")"
[[ "$code" == 200 ]] || { echo "::error::Compose lookup failed (HTTP $code)" >&2; exit 1; }
branch="$(jq -r '.branch // .customGitBranch // .gitlabBranch // .bitbucketBranch // .giteaBranch // empty' "$meta")"
[[ "$branch" == main ]] || { echo "::error::Dokploy source must target main" >&2; exit 1; }

payload="$(jq -cn --arg id "$DOKPLOY_COMPOSE_ID" '{composeId:$id}')"
code="$(curl -sS --connect-timeout 10 --max-time 60 -o "$reply" -w '%{http_code}' -X POST "$base/api/compose.deploy" -H 'accept: application/json' -H 'Content-Type: application/json' -H "x-api-key: $DOKPLOY_API_KEY" -d "$payload")"
[[ "$code" =~ ^2[0-9][0-9]$ ]] || { echo "::error::Deploy trigger failed (HTTP $code)" >&2; exit 1; }
id="$(jq -r '.deploymentId // .deployment.id // empty' "$reply")"
[[ -n "$id" ]] || { echo "::error::Dokploy returned no correlatable deployment ID" >&2; exit 1; }
echo "Dokploy request accepted; monitoring deployment $id"

attempts="${DEPLOY_POLL_ATTEMPTS:-30}"
interval="${DEPLOY_POLL_INTERVAL:-10}"
[[ "$attempts" =~ ^[0-9]+$ ]] && (( attempts >= 1 && attempts <= 120 )) || exit 1
[[ "$interval" =~ ^[0-9]+$ ]] && (( interval >= 1 && interval <= 60 )) || exit 1
completed=false
for ((i=1; i<=attempts; i++)); do
  code="$(curl -sS --connect-timeout 10 --max-time 30 -o "$status_body" -w '%{http_code}' -G "$base/api/deployment.allByCompose" --data-urlencode "composeId=$DOKPLOY_COMPOSE_ID" -H 'accept: application/json' -H "x-api-key: $DOKPLOY_API_KEY")"
  [[ "$code" == 200 ]] || { echo "::error::Status lookup failed (HTTP $code)" >&2; exit 1; }
  state="$(jq -r --arg id "$id" 'if type=="array" then . elif (.deployments? | type)=="array" then .deployments else [] end | map(select((.deploymentId // .id // "" | tostring) == $id)) | first | .status // empty' "$status_body")"
  case "$state" in
    done|success|succeeded|completed) completed=true; break ;;
    failed|error|canceled|cancelled) echo "::error::Deployment failed ($state)" >&2; exit 1 ;;
    pending|queued|running|building|deploying|'') ;;
    *) echo "::error::Unknown deployment status" >&2; exit 1 ;;
  esac
  if (( i < attempts )); then sleep "$interval"; fi
done
[[ "$completed" == true ]] || { echo "::error::No confirmed successful deployment" >&2; exit 1; }

# Optional availability check: no version/SHA claim until /api/version exists.
if [[ -n "${APP_HEALTH_URL:-}" ]]; then
  [[ "$APP_HEALTH_URL" == https://* ]] || { echo "::error::APP_HEALTH_URL must use HTTPS" >&2; exit 1; }
  code="$(curl -sS --connect-timeout 10 --max-time 30 -o "$health_body" -w '%{http_code}' "$APP_HEALTH_URL")"
  [[ "$code" =~ ^2[0-9][0-9]$ ]] || { echo "::error::Application healthcheck failed (HTTP $code)" >&2; exit 1; }
  echo "Deployment $id finished and application healthcheck succeeded; revision NOT verified."
else
  echo "::warning::Deployment $id finished; healthcheck and deployed revision NOT verified."
fi
