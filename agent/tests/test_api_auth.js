// Offline contract checks for native Postman and Bruno login snippets.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const postman = fs.readFileSync(path.join(root, 'examples/api-auth/postman-login.js'), 'utf8');
const bruno = fs.readFileSync(path.join(root, 'examples/api-auth/bruno-login.js'), 'utf8');

function runPostman(status, body, oldToken = 'old') {
  const env = new Map([['accessToken', oldToken], ['refreshToken', 'oldRefresh']]);
  const response = { code: status, json: () => body, to: { have: { status: (expected) => assert.equal(status, expected) } } };
  const pm = {
    response,
    environment: { set: (k, v) => env.set(k, v), unset: (k) => env.delete(k) },
    test: (_label, fn) => fn(),
    expect: (value) => ({ to: { be: { a: (type) => { assert.equal(typeof value, type); return { and: { not: { empty: undefined } } }; } } } }),
  };
  // Replace the minimal mock for the Chai-style assertion with a precise chain.
  pm.expect = (value) => ({
    to: { be: { a: (type) => {
      assert.equal(typeof value, type);
      return { and: { not: { get empty() { assert.notEqual(value.length, 0); return true; } } } };
    } } },
  });
  let error = null;
  try { vm.runInNewContext(postman, { pm, Error }); } catch (err) { error = err; }
  return { env, error };
}
function runBruno(status, body, oldToken = 'old') {
  const vars = new Map([['accessToken', oldToken], ['refreshToken', 'oldRefresh']]);
  const bru = {
    setVar: (k, v) => vars.set(k, v),
    deleteVar: (k) => vars.delete(k),
    getVar: (k) => vars.get(k),
    setEnvVar: () => { throw new Error('Persistence forbidden'); },
  };
  const res = { getStatus: () => status, getBody: () => body };
  let error = null;
  try { vm.runInNewContext(bruno, { bru, res, Error }); } catch (err) { error = err; }
  return { vars, error };
}
for (const [toolName, invoke, prop] of [
  ['Postman', runPostman, 'env'], ['Bruno', runBruno, 'vars'],
]) {
  test(`${toolName} captures both tokens on valid login`, () => {
    const result = invoke(200, { accessToken: 'freshToken', refreshToken: 'freshRefresh' });
    assert.equal(result.error, null);
    assert.equal(result[prop].get('accessToken'), 'freshToken');
    assert.equal(result[prop].get('refreshToken'), 'freshRefresh');
  });
  test(`${toolName} rejects login error and deletes stale tokens`, () => {
    const result = invoke(401, { message: 'invalid credentials' });
    assert.ok(result.error);
    assert.equal(result[prop].has('accessToken'), false);
    assert.equal(result[prop].has('refreshToken'), false);
  });
  test(`${toolName} rejects missing access token`, () => {
    const result = invoke(200, { refreshToken: 'shouldNotBeKept' });
    assert.ok(result.error);
    assert.equal(result[prop].has('accessToken'), false);
    assert.equal(result[prop].has('refreshToken'), false);
  });
  test(`${toolName} clears previous refresh token when server omits refresh`, () => {
    const result = invoke(200, { accessToken: 'fresh' });
    assert.equal(result.error, null);
    assert.equal(result[prop].get('accessToken'), 'fresh');
    assert.equal(result[prop].has('refreshToken'), false);
  });
}
test('Bruno scripts never persist secrets into environments', () => {
  assert.equal(/bru\.setEnvVar\s*\(/.test(bruno.replace(/\/\/[^\n]*/g, '')), false);
  assert.match(bruno, /bru\.setVar\("accessToken"/);
});
test('Postman scripts use the active environment', () => {
  assert.match(postman, /pm\.environment\.set\("accessToken"/);
  assert.doesNotMatch(postman, /pm\.globals\.set\(/);
});
