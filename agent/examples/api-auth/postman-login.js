// Postman — Post-response script of the login request.
// Adapt the expected status and response schema to the actual API.
pm.environment.unset("accessToken");
pm.environment.unset("refreshToken");

pm.test("Login returns a valid access token", function () {
  pm.response.to.have.status(200);
  const data = pm.response.json();
  pm.expect(data.accessToken, "accessToken").to.be.a("string").and.not.empty;
});

if (pm.response.code === 200) {
  const data = pm.response.json();
  if (typeof data.accessToken === "string" && data.accessToken.length > 0) {
    pm.environment.set("accessToken", data.accessToken);
    if (typeof data.refreshToken === "string" && data.refreshToken.length > 0) {
      pm.environment.set("refreshToken", data.refreshToken);
    }
  } else {
    throw new Error("Login response has no usable access token");
  }
} else {
  throw new Error("Login failed: no token retained");
}
