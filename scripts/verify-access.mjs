process.env.APP_READ_TOKEN = "read-secret";
process.env.APP_WRITE_TOKEN = "write-secret";
delete process.env.APP_ACCESS_TOKEN;

const { accessStatus, isReadAuthorized, isWriteAuthorized } = await import("../server.mjs");

const failures = [];

function fail(message) {
  failures.push(message);
}

function requestWithToken(token) {
  return { headers: token ? { "x-app-token": token } : {} };
}

const status = accessStatus();
if (!status.accessTokenRequired) fail("access should be required when read/write tokens are configured");
if (!status.readWriteSplitEnabled) fail("read/write split should be enabled when APP_READ_TOKEN or APP_WRITE_TOKEN is configured");
if (!status.writeTokenRequired) fail("write token should be required when split tokens are configured");

if (!isReadAuthorized(requestWithToken("read-secret"))) fail("read token should authorize read access");
if (isWriteAuthorized(requestWithToken("read-secret"))) fail("read token must not authorize write access");
if (!isReadAuthorized(requestWithToken("write-secret"))) fail("write token should authorize read access");
if (!isWriteAuthorized(requestWithToken("write-secret"))) fail("write token should authorize write access");
if (isReadAuthorized(requestWithToken("wrong"))) fail("wrong token must not authorize read access");
if (isWriteAuthorized(requestWithToken("wrong"))) fail("wrong token must not authorize write access");
if (isReadAuthorized(requestWithToken(""))) fail("missing token must not authorize read access");

if (failures.length) {
  console.error("Access verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Access verification passed.");
