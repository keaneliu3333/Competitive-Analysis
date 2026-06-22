#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function readRequired(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) {
    throw new Error(`Missing required file: ${path}`);
  }
  return readFileSync(fullPath, "utf8");
}

function assertIncludes(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`${label} missing: ${expected}`);
  }
}

const traceability = readRequired("docs/requirements-traceability.md");
const script = readRequired("script.js");
const server = readRequired("server.mjs");
const index = readRequired("index.html");
const runtimeVerifier = readRequired("scripts/verify-runtime.mjs");
const mvpVerifier = readRequired("scripts/verify-mvp.mjs");
const releaseVerifier = readRequired("scripts/verify-release.mjs");
const exportVerifier = readRequired("scripts/verify-exports.mjs");
const summaryVerifier = readRequired("scripts/verify-summary.mjs");
const dataPackageVerifier = readRequired("scripts/verify-data-package.mjs");
const formalizationVerifier = readRequired("scripts/verify-formalization-plan.mjs");
const apiMigrationVerifier = readRequired("scripts/verify-api-migration-map.mjs");
const smokeChecklistGenerator = readRequired("scripts/generate-smoke-checklist.mjs");

for (const requirement of [
  "简洁明了的 UI/UX 交互",
  "品类筛选、价格段自定义和筛选",
  "竞品功能对比模块自定义、元素自定义",
  "导出 Excel",
  "各品牌路线图带产品图、价格、Top3 优先级卖点",
  "电商、官网详情页抓取分析",
  "图片格式详情页识别",
  "自然语言理解功能参数",
  "产品型号对比",
  "500 字以内多维总结",
  "更完善的补充功能",
]) {
  assertIncludes(traceability, requirement, "requirements traceability matrix");
}

for (const token of [
  "categoryFilterDropdown",
  "brandFilterDropdown",
  "minPrice",
  "maxPrice",
  "sourceImage",
  "comparePicker",
  "roadmapBoard",
  "exportDataPackage",
]) {
  assertIncludes(index, token, "index.html traceability target");
}

for (const token of [
  "featureFilterMatches",
  "sliceLongImageAttachment",
  "filesToAnalysisAttachments",
  "mergeCustomFeatures",
  "normalizeComparisonSummary",
  "brandRoadmapReportHtml",
  "dataPackagePayload",
]) {
  assertIncludes(script, token, "script.js traceability target");
}

for (const token of [
  "/api/fetch-metadata",
  "/api/analyze",
  "/api/compare",
  "input_image",
  "input_file",
  "customFeatures",
  "500 个中文字符以内",
]) {
  assertIncludes(server, token, "server.mjs traceability target");
}

for (const token of ["AI fallback APIs", "customFeatures", "exportDataPackage"]) {
  assertIncludes(runtimeVerifier, token, "runtime verifier traceability");
}

assertIncludes(mvpVerifier, "scripts/verify-traceability.mjs", "MVP verifier traceability inclusion");

for (const token of [
  "Release readiness verification",
  "scripts/check-local-env.mjs",
  "scripts/verify-mvp.mjs",
  "scripts/verify-exports.mjs",
  "scripts/verify-summary.mjs",
  "scripts/verify-data-package.mjs",
  "scripts/verify-formalization-plan.mjs",
  "scripts/verify-api-migration-map.mjs",
  "scripts/generate-smoke-checklist.mjs",
]) {
  assertIncludes(releaseVerifier, token, "release verifier traceability");
}

for (const token of ["Export verification passed", "Top3 优先级卖点", "brandRoadmapReportHtml"]) {
  assertIncludes(exportVerifier, token, "export verifier traceability");
}

for (const token of ["Summary verification passed", "500-character cap", "产品功能", "使用感受"]) {
  assertIncludes(summaryVerifier, token, "summary verifier traceability");
}

for (const token of ["Data package verification passed", "custom field history preservation", "backupBeforeDataPackageImport"]) {
  assertIncludes(dataPackageVerifier, token, "data package verifier traceability");
}

for (const token of ["Formalization plan verification passed", "Route Handlers", "release gates"]) {
  assertIncludes(formalizationVerifier, token, "formalization verifier traceability");
}

for (const token of ["API migration map verification passed", "POST /api/analyze", "analysis-run"]) {
  assertIncludes(apiMigrationVerifier, token, "API migration verifier traceability");
}

for (const token of ["Manual smoke checklist generated", "启动与首页", "交接与审计"]) {
  assertIncludes(smokeChecklistGenerator, token, "manual smoke checklist traceability");
}

console.log("Traceability verification passed.");
