// Bruno — Post-response script of the login request.
// Tokens MUST remain in memory: never use bru.setEnvVar() here.
bru.deleteVar("accessToken");
bru.deleteVar("refreshToken");

if (res.getStatus() !== 200) {
  throw new Error("Login failed: no token retained");
}

const data = res.getBody();
if (!data || typeof data.accessToken !== "string" || data.accessToken.length === 0) {
  throw new Error("Login response has no usable access token");
}
bru.setVar("accessToken", data.accessToken);
if (typeof data.refreshToken === "string" && data.refreshToken.length > 0) {
  bru.setVar("refreshToken", data.refreshToken);
}
