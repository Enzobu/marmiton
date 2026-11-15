#!/usr/bin/env bash
# Marmiton-specific Dokploy adapter with verification of the deployed build revision.
set -euo pipefail
set +x

: "${DOKPLOY_URL:?Missing DOKPLOY_URL}"
: "${DOKPLOY_API_KEY:?Missing DOKPLOY_API_KEY}"
: "${DOKPLOY_COMPOSE_ID:?Missing DOKPLOY_COMPOSE_ID}"
: "${EXPECTED_SOURCE_REF:?Missing EXPECTED_SOURCE_REF}"
: "${EXPECTED_COMMIT_SHA:?Missing EXPECTED_COMMIT_SHA}"
: "${APP_VERSION_URL:?Missing APP_VERSION_URL}"

[[ "$DOKPLOY_URL" == https://* ]] || { echo "::error::Dokploy URL must use HTTPS" >&2; exit 1; }
[[ "$EXPECTED_SOURCE_REF" == refs/heads/main ]] || { echo "::error::Only main may be deployed" >&2; exit 1; }

[[ "$EXPECTED_COMMIT_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "::error::Invalid expected SHA" >&2; exit 1; }
[[ "$APP_VERSION_URL" == https://* ]] || { echo "::error::APP_VERSION_URL must use HTTPS" >&2; exit 1; }

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

code="$(curl -sS --connect-timeout 10 --max-time 30 -o "$health_body" -w '%{http_code}' "$APP_VERSION_URL")"
[[ "$code" == 200 ]] || { echo "::error::Application version endpoint failed (HTTP $code)" >&2; exit 1; }
actual_sha="$(jq -er '.sha | strings' "$health_body")"
[[ "$actual_sha" == "$EXPECTED_COMMIT_SHA" ]] || { echo "::error::Deployed SHA differs from the tested SHA" >&2; exit 1; }
echo "Verified Dokploy deployment $id, database connectivity and commit $actual_sha."
