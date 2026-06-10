#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

function readRequired(relativePath) {
  const path = join(root, relativePath);
  if (!existsSync(path)) {
    fail(`Missing required file: ${relativePath}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) fail(`${label} missing: ${needle}`);
}

const map = readRequired("docs/api-migration-map.md");
const roadmap = readRequired("docs/formalization-roadmap.md");
const releaseVerifier = readRequired("scripts/verify-release.mjs");
const reportGenerator = readRequired("scripts/generate-test-report.mjs");

for (const token of [
  "GET /api/health",
  "GET /api/state",
  "PUT /api/state",
  "GET /api/usage",
  "POST /api/fetch-metadata",
  "POST /api/analyze",
  "POST /api/compare",
  "GET /api/products",
  "POST /api/products",
  "PATCH /api/products/:id",
  "POST /api/products/:id/confirm",
  "GET/POST/PATCH /api/feature-modules",
  "DELETE /api/feature-fields/:id",
  "GET/POST/DELETE /api/saved-views",
  "GET /api/roadmap-items",
  "POST /api/exports",
  "GET /api/audit-logs",
]) {
  assertIncludes(map, token, "API migration map");
}

for (const token of [
  "metadata-fetch",
  "playwright-screenshot",
  "analysis-run",
  "data-package-import",
  "csv-import",
  "export-build",
  "SourcePage",
  "MediaAsset",
  "AnalysisRun",
  "ApiUsageLog",
  "AuditLog",
  "ProductFeatureValue",
  "BullMQ",
  "Route Handler",
  "APP_ACCESS_TOKEN",
]) {
  assertIncludes(map, token, "API migration map");
}

assertIncludes(roadmap, "docs/api-migration-map.md", "formalization roadmap API map pointer");
assertIncludes(releaseVerifier, "scripts/verify-api-migration-map.mjs", "release verifier API migration inclusion");
assertIncludes(reportGenerator, "scripts/verify-api-migration-map.mjs", "test report API migration inclusion");

if (failures.length) {
  console.error("API migration map verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("API migration map verification passed.");
console.log("- Checked current API mapping, target Route Handlers, resource APIs, BullMQ jobs, permissions, and release gates.");
