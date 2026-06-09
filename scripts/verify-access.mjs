const failures = [];

function fail(message) {
  failures.push(message);
}

function requestWithToken(token) {
  return { headers: token ? { "x-app-token": token } : {} };
}

async function importServerForScenario(name, env) {
  for (const key of ["APP_ACCESS_TOKEN", "APP_READ_TOKEN", "APP_WRITE_TOKEN"]) {
    if (env[key] == null) {
      delete process.env[key];
    } else {
      process.env[key] = env[key];
    }
  }
  return import(`../server.mjs?access-scenario=${encodeURIComponent(name)}-${Date.now()}-${Math.random()}`);
}

const openServer = await importServerForScenario("open", {
  APP_ACCESS_TOKEN: null,
  APP_READ_TOKEN: null,
  APP_WRITE_TOKEN: null,
});
const openStatus = openServer.accessStatus();
if (openStatus.accessTokenRequired) fail("open local development mode should not require access token");
if (!openServer.isReadAuthorized(requestWithToken(""))) fail("open local development mode should allow read access");
if (!openServer.isWriteAuthorized(requestWithToken(""))) fail("open local development mode should allow write access");

const splitServer = await importServerForScenario("split", {
  APP_ACCESS_TOKEN: null,
  APP_READ_TOKEN: "read-secret",
  APP_WRITE_TOKEN: "write-secret",
});
const splitStatus = splitServer.accessStatus();
if (!splitStatus.accessTokenRequired) fail("access should be required when read/write tokens are configured");
if (!splitStatus.readWriteSplitEnabled) fail("read/write split should be enabled when APP_READ_TOKEN or APP_WRITE_TOKEN is configured");
if (!splitStatus.writeTokenRequired) fail("write token should be required when split tokens are configured");
if (!splitServer.isReadAuthorized(requestWithToken("read-secret"))) fail("read token should authorize read access");
if (splitServer.isWriteAuthorized(requestWithToken("read-secret"))) fail("read token must not authorize write access");
if (!splitServer.isReadAuthorized(requestWithToken("write-secret"))) fail("write token should authorize read access");
if (!splitServer.isWriteAuthorized(requestWithToken("write-secret"))) fail("write token should authorize write access");
if (splitServer.isReadAuthorized(requestWithToken("wrong"))) fail("wrong token must not authorize read access");
if (splitServer.isWriteAuthorized(requestWithToken("wrong"))) fail("wrong token must not authorize write access");
if (splitServer.isReadAuthorized(requestWithToken(""))) fail("missing token must not authorize read access");

const legacyServer = await importServerForScenario("legacy", {
  APP_ACCESS_TOKEN: "legacy-secret",
  APP_READ_TOKEN: null,
  APP_WRITE_TOKEN: null,
});
const legacyStatus = legacyServer.accessStatus();
if (!legacyStatus.accessTokenRequired) fail("legacy APP_ACCESS_TOKEN should require access");
if (legacyStatus.readWriteSplitEnabled) fail("legacy APP_ACCESS_TOKEN should not enable read/write split");
if (!legacyServer.isReadAuthorized(requestWithToken("legacy-secret"))) fail("legacy token should authorize read access");
if (!legacyServer.isWriteAuthorized(requestWithToken("legacy-secret"))) fail("legacy token should authorize write access");
if (legacyServer.isReadAuthorized(requestWithToken("read-secret"))) fail("read token should not work in legacy-only mode");
if (legacyServer.isWriteAuthorized(requestWithToken(""))) fail("missing token must not authorize legacy write access");

if (failures.length) {
  console.error("Access verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Access verification passed.");
console.log("- Checked open local mode, read/write split mode, legacy APP_ACCESS_TOKEN mode, and wrong-token rejection.");
