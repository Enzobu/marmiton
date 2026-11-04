#!/usr/bin/env bash
# Fail-closed Dokploy Compose deployment: source check, correlated completion, health and revision.
set -euo pipefail
set +x

: "${DOKPLOY_URL:?Missing DOKPLOY_URL}"
: "${DOKPLOY_API_KEY:?Missing DOKPLOY_API_KEY}"
: "${DOKPLOY_COMPOSE_ID:?Missing DOKPLOY_COMPOSE_ID}"
: "${EXPECTED_SOURCE_REF:?Missing EXPECTED_SOURCE_REF}"
: "${EXPECTED_COMMIT_SHA:?Missing EXPECTED_COMMIT_SHA}"
: "${APP_VERSION_URL:?Missing APP_VERSION_URL}"

case "$DOKPLOY_URL" in https://*) ;; *) echo '::error::Dokploy must use HTTPS' >&2; exit 1;; esac
case "$APP_VERSION_URL" in https://*) ;; *) echo '::error::Version endpoint must use HTTPS' >&2; exit 1;; esac
case "$EXPECTED_SOURCE_REF" in refs/heads/*|refs/tags/*) ;; *) echo '::error::Invalid Git ref' >&2; exit 1;; esac
if [[ ! "$EXPECTED_COMMIT_SHA" =~ ^[a-fA-F0-9]{40}$ ]]; then echo '::error::Invalid expected SHA' >&2; exit 1; fi

base="${DOKPLOY_URL%/}"
meta="$(mktemp)"
reply="$(mktemp)"
status_body="$(mktemp)"
health_body="$(mktemp)"
trap 'rm -f "$meta" "$reply" "$status_body" "$health_body"' EXIT
chmod 600 "$meta" "$reply" "$status_body" "$health_body"

request_code="$(curl --silent --show-error --connect-timeout 10 --max-time 30 -o "$meta" -w '%{http_code}' -G "$base/api/compose.one" --data-urlencode "composeId=$DOKPLOY_COMPOSE_ID" -H 'accept: application/json' -H "x-api-key: $DOKPLOY_API_KEY")"
if [[ "$request_code" != 200 ]]; then echo "::error::Compose lookup failed: HTTP $request_code" >&2; exit 1; fi
actual_branch="$(jq -r '.branch // .customGitBranch // .gitlabBranch // .bitbucketBranch // .giteaBranch // empty' "$meta")"
expected_branch="${EXPECTED_SOURCE_REF#refs/heads/}"
expected_branch="${expected_branch#refs/tags/}"
if [[ -z "$actual_branch" || "$actual_branch" != "$expected_branch" ]]; then
  echo '::error::Dokploy source branch/tag differs from validated ref' >&2
  exit 1
fi

payload="$(jq -cn --arg id "$DOKPLOY_COMPOSE_ID" '{composeId:$id}')"
request_code="$(curl --silent --show-error --connect-timeout 10 --max-time 60 -o "$reply" -w '%{http_code}' -X POST "$base/api/compose.deploy" -H 'accept: application/json' -H 'Content-Type: application/json' -H "x-api-key: $DOKPLOY_API_KEY" -d "$payload")"
if [[ ! "$request_code" =~ ^2[0-9][0-9]$ ]]; then echo "::error::Deploy request refused: HTTP $request_code" >&2; exit 1; fi
echo 'Dokploy deployment request accepted; waiting for completion and version verification'

# Require a deployment ID tied to THIS request. If Dokploy does not return one,
# adapt this adapter to correlate via before/after listing; never accept an older success.
deployment_id="$(jq -r '.deploymentId // .deployment.id // empty' "$reply")"
if [[ -z "$deployment_id" ]]; then echo '::error::No correlatable deployment ID; completion unverified' >&2; exit 1; fi

attempts="${DEPLOY_POLL_ATTEMPTS:-30}"
interval="${DEPLOY_POLL_INTERVAL:-10}"
if [[ ! "$attempts" =~ ^[0-9]+$ || "$attempts" -lt 1 || "$attempts" -gt 120 ]]; then exit 1; fi
if [[ ! "$interval" =~ ^[0-9]+$ || "$interval" -gt 60 ]]; then exit 1; fi
completed=0
for ((i=1; i<=attempts; i++)); do
  request_code="$(curl --silent --show-error --connect-timeout 10 --max-time 30 -o "$status_body" -w '%{http_code}' -G "$base/api/deployment.allByCompose" --data-urlencode "composeId=$DOKPLOY_COMPOSE_ID" -H 'accept: application/json' -H "x-api-key: $DOKPLOY_API_KEY")"
  if [[ "$request_code" != 200 ]]; then echo "::error::Status API failed: HTTP $request_code" >&2; exit 1; fi
  # Accept documented/adapted array forms only; unknown schema fails closed.
  status="$(jq -r --arg id "$deployment_id" 'if type=="array" then . elif (.deployments? | type)=="array" then .deployments else [] end | map(select((.deploymentId // .id // "") == $id)) | first | .status // empty' "$status_body")"
  case "$status" in
    done|success|succeeded|completed) completed=1; break ;;
    error|failed|cancelled|canceled) echo "::error::Dokploy deployment ended with $status" >&2; exit 1 ;;
    running|pending|queued|building|deploying|'') ;;
    *) echo '::error::Unrecognized Dokploy deployment state' >&2; exit 1 ;;
  esac
  if (( i < attempts )); then sleep "$interval"; fi
done
if [[ "$completed" -ne 1 ]]; then echo '::error::Deployment did not reach a confirmed terminal success state' >&2; exit 1; fi

health_code="$(curl --silent --show-error --connect-timeout 10 --max-time 30 -o "$health_body" -w '%{http_code}' "$APP_VERSION_URL")"
if [[ ! "$health_code" =~ ^2[0-9][0-9]$ ]]; then echo "::error::Application health/version failed: HTTP $health_code" >&2; exit 1; fi
actual_sha="$(jq -r '.sha // .commitSha // .gitSha // empty' "$health_body")"
if [[ "${actual_sha,,}" != "${EXPECTED_COMMIT_SHA,,}" ]]; then echo '::error::Deployed SHA differs from the CI-tested SHA' >&2; exit 1; fi
echo "Verified Dokploy deployment $deployment_id, healthy application and commit $EXPECTED_COMMIT_SHA"
