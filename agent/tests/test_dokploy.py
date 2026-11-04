"""Offline regression tests for the Dokploy deployment adapter."""
from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "dokploy_deploy.sh"
SHA = "a" * 40

FAKE_CURL = r"""#!/usr/bin/env python3
import json
import os
import sys

args = sys.argv[1:]
output_path = args[args.index("-o") + 1]
mode = os.environ.get("MOCK_MODE", "success")
url = next((a for a in args if a.startswith("https://")), "")

if "compose.one" in url:
    code, payload = 200, {"branch": "main" if mode == "wrong_source" else "v1.2.0"}
elif "compose.deploy" in url:
    code = 500 if mode == "deploy_http_error" else 200
    payload = {} if mode == "no_deployment_id" else {"deploymentId": "dep-new"}
elif "deployment.allByCompose" in url:
    code = 200
    status = "error" if mode == "failed_deployment" else "done"
    payload = [{"deploymentId": "dep-old", "status": "done"}]
    if mode != "stale_deployment":
        payload.append({"deploymentId": "dep-new", "status": status})
else:
    code = 200
    payload = {"sha": "b" * 40 if mode == "wrong_sha" else "a" * 40}

with open(output_path, "w", encoding="utf-8") as output:
    json.dump(payload, output)
sys.stdout.write(str(code))
"""

class DokployAdapterTests(unittest.TestCase):
    def invoke(self, mode: str, *, drop: str | None = None) -> subprocess.CompletedProcess[str]:
        with tempfile.TemporaryDirectory() as directory:
            executable = Path(directory) / "curl"
            executable.write_text(FAKE_CURL, encoding="utf-8")
            executable.chmod(0o755)
            env = os.environ.copy()
            env.update({
                "PATH": directory + os.pathsep + env["PATH"],
                "MOCK_MODE": mode,
                "DOKPLOY_URL": "https://dokploy.example.test",
                "DOKPLOY_API_KEY": "SECRET_TOKEN_NOT_FOR_LOGGING",
                "DOKPLOY_COMPOSE_ID": "compose-example",
                "EXPECTED_SOURCE_REF": "refs/tags/v1.2.0",
                "EXPECTED_COMMIT_SHA": SHA,
                "APP_VERSION_URL": "https://app.example.test/version",
                "DEPLOY_POLL_ATTEMPTS": "1",
                "DEPLOY_POLL_INTERVAL": "0",
            })
            if drop:
                env.pop(drop, None)
            return subprocess.run(["bash", str(SCRIPT)], capture_output=True, text=True, env=env, check=False)

    def test_success_only_when_completed_and_revision_matches(self) -> None:
        result = self.invoke("success")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Verified Dokploy deployment", result.stdout)

    def test_source_mismatch_is_blocked(self) -> None:
        self.assertNotEqual(self.invoke("wrong_source").returncode, 0)

    def test_http_error_is_blocked(self) -> None:
        self.assertNotEqual(self.invoke("deploy_http_error").returncode, 0)

    def test_uncorrelated_response_is_blocked(self) -> None:
        self.assertNotEqual(self.invoke("no_deployment_id").returncode, 0)

    def test_old_success_is_not_accepted(self) -> None:
        self.assertNotEqual(self.invoke("stale_deployment").returncode, 0)

    def test_failed_deployment_is_blocked(self) -> None:
        self.assertNotEqual(self.invoke("failed_deployment").returncode, 0)

    def test_wrong_deployed_sha_is_blocked(self) -> None:
        self.assertNotEqual(self.invoke("wrong_sha").returncode, 0)

    def test_missing_sha_is_blocked(self) -> None:
        self.assertNotEqual(self.invoke("success", drop="EXPECTED_COMMIT_SHA").returncode, 0)

    def test_no_secret_echoed(self) -> None:
        result = self.invoke("success")
        self.assertNotIn("SECRET_TOKEN_NOT_FOR_LOGGING", result.stdout + result.stderr)

if __name__ == "__main__":
    unittest.main()
