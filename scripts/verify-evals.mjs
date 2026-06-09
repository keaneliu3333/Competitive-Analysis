import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const casesPath = join(root, "evals", "sample-cases.json");
const failures = [];

function fail(message) {
  failures.push(message);
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function assertIncludesAll(set, expectedValues, label) {
  for (const value of expectedValues) {
    if (!set.has(value)) fail(`${label} must include ${value}`);
  }
}

if (!existsSync(casesPath)) {
  fail("Missing evals/sample-cases.json");
} else {
  let payload;
  try {
    payload = JSON.parse(readFileSync(casesPath, "utf8"));
  } catch (error) {
    fail(`sample-cases.json is not valid JSON: ${error.message}`);
  }

  if (payload) {
    if (payload.schemaVersion !== 1) fail("sample-cases.json schemaVersion must be 1");
    const cases = Array.isArray(payload.cases) ? payload.cases : [];
    const minCases = Number(payload.coverageTargets?.minCases || 10);
    if (!cases.length) fail("sample-cases.json must contain at least one case");
    if (cases.length < minCases) fail(`sample-cases.json must contain at least ${minCases} cases`);

    const ids = new Set();
    const categories = new Set();
    const sourceTypes = new Set();

    for (const [index, testCase] of cases.entries()) {
      const label = testCase.id || `case-${index}`;
      if (!testCase.id) fail(`${label}: missing id`);
      if (ids.has(testCase.id)) fail(`${label}: duplicate id`);
      if (testCase.id) ids.add(testCase.id);
      if (!["扫地机", "洗地机", "吸尘器"].includes(testCase.category)) fail(`${label}: invalid category`);
      if (testCase.category) categories.add(testCase.category);
      if (!testCase.source?.type) fail(`${label}: missing source.type`);
      if (!["url", "file"].includes(testCase.source?.type)) fail(`${label}: source.type must be url or file`);
      if (testCase.source?.type) sourceTypes.add(testCase.source.type);
      if (testCase.source?.type === "url" && !isValidUrl(testCase.source.url)) fail(`${label}: url source must include a valid http(s) url`);
      if (testCase.source?.type === "file" && !testCase.source.path) fail(`${label}: file source must include path`);
      if (!testCase.expected?.brand) fail(`${label}: missing expected.brand`);
      if (!testCase.expected?.model) fail(`${label}: missing expected.model`);
      const range = testCase.expected?.priceRange;
      if (!range || Number(range.min) < 0 || Number(range.max) < Number(range.min)) fail(`${label}: invalid expected.priceRange`);
      if (range?.currency !== "CNY") fail(`${label}: expected.priceRange.currency must be CNY`);
      if (!Array.isArray(testCase.expected?.requiredFeatures) || !testCase.expected.requiredFeatures.length) {
        fail(`${label}: expected.requiredFeatures must be non-empty`);
      }
      if (!Array.isArray(testCase.expected?.topSellingPointKeywords) || !testCase.expected.topSellingPointKeywords.length) {
        fail(`${label}: expected.topSellingPointKeywords must be non-empty`);
      }
      if (Number(testCase.acceptance?.summaryMaxChars) !== 500) fail(`${label}: acceptance.summaryMaxChars must be 500`);
      if (Number(testCase.acceptance?.minConfidence) < 0 || Number(testCase.acceptance?.minConfidence) > 100) {
        fail(`${label}: acceptance.minConfidence must be 0-100`);
      }
      if (testCase.acceptance?.requiresEvidence !== true) fail(`${label}: acceptance.requiresEvidence must be true`);
      if (testCase.acceptance?.requiresManualReviewWhenLowConfidence !== true) {
        fail(`${label}: acceptance.requiresManualReviewWhenLowConfidence must be true`);
      }
    }

    assertIncludesAll(categories, payload.coverageTargets?.categories || ["扫地机", "洗地机", "吸尘器"], "sample-cases category coverage");
    assertIncludesAll(sourceTypes, payload.coverageTargets?.sourceTypes || ["url", "file"], "sample-cases source type coverage");
    if (Number(payload.coverageTargets?.summaryMaxChars) !== 500) fail("coverageTargets.summaryMaxChars must be 500");
  }
}

if (failures.length) {
  console.error("Eval verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Eval verification passed.");
