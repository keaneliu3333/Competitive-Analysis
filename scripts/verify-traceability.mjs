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
  "keywordSearch",
  "minPrice",
  "maxPrice",
  "sourceImage",
  "comparePicker",
  "roadmapBoard",
  "exportHandoffReport",
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
  "handoffReportMarkdown",
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

for (const token of ["AI fallback APIs", "customFeatures", "exportHandoffReport"]) {
  assertIncludes(runtimeVerifier, token, "runtime verifier traceability");
}

assertIncludes(mvpVerifier, "scripts/verify-traceability.mjs", "MVP verifier traceability inclusion");

console.log("Traceability verification passed.");
