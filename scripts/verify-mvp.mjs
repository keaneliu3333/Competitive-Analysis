#!/usr/bin/env node

import { execFileSync } from "node:child_process";
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

function runNode(args) {
  execFileSync(process.execPath, args, {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
  });
}

const files = {
  envExample: readRequired(".env.example"),
  readme: readRequired("README.md"),
  acceptance: readRequired("docs/mvp-acceptance.md"),
  deployment: readRequired("docs/deployment.md"),
  index: readRequired("index.html"),
  script: readRequired("script.js"),
  server: readRequired("server.mjs"),
  evals: readRequired("evals/sample-cases.json"),
};

for (const path of [
  "assets/robot-vacuum.svg",
  "assets/floor-washer.svg",
  "assets/stick-vacuum.svg",
  "docs/formal-use-runbook.md",
  "docs/formal-use-launch-checklist.md",
  "scripts/verify-workbench.mjs",
  "scripts/verify-access.mjs",
  "scripts/verify-costs.mjs",
  "scripts/verify-metadata.mjs",
  "scripts/verify-evals.mjs",
  "scripts/verify-runtime.mjs",
  "scripts/verify-traceability.mjs",
  "scripts/verify-exports.mjs",
  "scripts/verify-summary.mjs",
  "scripts/verify-data-package.mjs",
  "scripts/verify-formal-use.mjs",
  "scripts/verify-formal-use-browser.mjs",
  "scripts/verify-formalization-plan.mjs",
  "scripts/verify-api-migration-map.mjs",
  "scripts/generate-migration-reconciliation.mjs",
  "scripts/generate-model-eval-report.mjs",
  "scripts/generate-eval-calibration-pack.mjs",
  "scripts/generate-test-report.mjs",
  "scripts/generate-smoke-checklist.mjs",
  "scripts/generate-formal-use-pack.mjs",
  "scripts/check-local-env.mjs",
  "scripts/check-ai-connectivity.mjs",
  "scripts/run-eval-calibration.mjs",
  "scripts/verify-hygiene.mjs",
  "scripts/verify-release.mjs",
]) {
  readRequired(path);
}

for (const token of [
  "OPENAI_API_KEY=",
  "OPENAI_MODEL=gpt-5.4-mini",
  "OPENAI_BASE_URL=https://api.openai.com/v1",
  "AI_REQUEST_TIMEOUT_MS=60000",
  "AI_PROVIDER=deepseek",
  "COMPARE_AI_PROVIDER=deepseek",
  "VISION_PROVIDER=qwen",
  "DEEPSEEK_API_KEY=",
  "DEEPSEEK_MODEL=deepseek-v4-flash",
  "QWEN_API_KEY=",
  "QWEN_MODEL=qwen-vl-max",
  "QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1",
  "QWEN_REQUEST_TIMEOUT_MS=60000",
  "OPENAI_INPUT_USD_PER_1M=",
  "APP_ACCESS_TOKEN=",
  "APP_READ_TOKEN=",
  "APP_WRITE_TOKEN=",
  "PORT=4173",
]) {
  assertIncludes(files.envExample, token, ".env.example");
}

for (const topic of [
  "无依赖 MVP",
  "关键词搜索",
  "自定义价格段",
  "自定义功能参数",
  "多张图片",
  "长图自动切片",
  "PDF",
  "DeepSeek",
  "Qwen-VL",
  "500 字以内",
  "使用感受",
  "各品牌 PDF",
  "数据质量检查",
  "读写访问令牌",
  "部署和运维交接",
  "正式功能使用运行手册",
  "正式功能使用启动清单",
  "正式功能使用包",
  "verify-formal-use-browser.mjs",
  "formal-use-browser-smoke",
  "375/768/1440",
  "已监听端口是否真的返回工作台健康接口和首页",
  "发布验收总入口",
]) {
  assertIncludes(files.readme, topic, "README.md MVP coverage");
}

for (const id of [
  "keywordSearch",
  "minPrice",
  "maxPrice",
  "featureFilterField",
  "filterSummary",
  "sourceUrl",
  "sourceImage",
  "runAnalysis",
  "comparePicker",
  "compareStatus",
  "compareFilteredProducts",
  "compareSimilarProducts",
  "compareFieldPicker",
  "generateSummary",
  "exportCompare",
  "exportExcel",
  "exportRoadmap",
  "exportRoadmapSvg",
  "printRoadmap",
  "printAllBrandRoadmaps",
  "exportDataPackage",
  "downloadCsvTemplate",
  "exportQualityCsv",
]) {
  assertIncludes(files.index, `id="${id}"`, "index.html MVP control");
}

for (const fn of [
  "productSearchText",
  "productSearchFingerprint",
  "featureFilterMatches",
  "getVisibleProducts",
  "updateFilterSoon",
  "filterSummaryItems",
  "renderFilterSummary",
  "renderCompareStatus",
  "setCompareProducts",
  "compareFilteredProducts",
  "compareSimilarProducts",
  "addField",
  "filesToAnalysisAttachments",
  "sliceLongImageAttachment",
  "fetchSourceMetadata",
  "runAnalysis",
  "comparisonPayload",
  "normalizeComparisonSummary",
  "exportCompare",
  "exportExcel",
  "roadmapSvgDocument",
  "brandRoadmapReportHtml",
  "exportDataPackage",
  "importDataPackage",
  "exportQualityCsv",
  "scrollToWorkspace",
  "renderRoadmapTimeline",
  "renderRoadmapBrandCompare",
]) {
  assertIncludes(files.script, `function ${fn}`, "script.js MVP function");
}

for (const token of [
  "/api/analyze",
  "/api/compare",
  "/api/fetch-metadata",
  "openAIResponsesUrl",
  "OPENAI_BASE_URL",
  "input_image",
  "remoteImageUrls",
  "analysisSourceImageUrls",
  "已附加 URL 图片候选数",
  "input_file",
  "json_schema",
  "500 个中文字符以内",
  "APP_READ_TOKEN",
  "APP_WRITE_TOKEN",
  "api-usage.json",
]) {
  assertIncludes(files.server, token, "server.mjs MVP API");
}

for (const topic of [
  "MVP 验收清单",
  "核心范围",
  "node scripts/verify-mvp.mjs",
  "人工冒烟",
  "各品牌 PDF",
  "500 字以内总结",
  "Markdown 交接包",
]) {
  assertIncludes(files.acceptance, topic, "docs/mvp-acceptance.md");
}

for (const topic of [
  "验收检查",
  "node scripts/verify-mvp.mjs",
  "详情页抓取不绕过登录",
  "APP_READ_TOKEN",
  "APP_WRITE_TOKEN",
]) {
  assertIncludes(files.deployment, topic, "docs/deployment.md");
}

const evalConfig = JSON.parse(files.evals);
if (evalConfig.coverageTargets?.summaryMaxChars !== 500) {
  throw new Error("evals/sample-cases.json coverageTargets.summaryMaxChars must be 500");
}
if (!Array.isArray(evalConfig.cases) || evalConfig.cases.length < 10) {
  throw new Error("evals/sample-cases.json must contain at least 10 cases");
}

for (const args of [
  ["--check", "script.js"],
  ["--check", "server.mjs"],
  ["--check", "scripts/verify-workbench.mjs"],
  ["--check", "scripts/verify-access.mjs"],
  ["--check", "scripts/verify-costs.mjs"],
  ["--check", "scripts/verify-metadata.mjs"],
  ["--check", "scripts/verify-evals.mjs"],
  ["--check", "scripts/verify-runtime.mjs"],
  ["--check", "scripts/verify-traceability.mjs"],
  ["--check", "scripts/verify-exports.mjs"],
  ["--check", "scripts/verify-summary.mjs"],
  ["--check", "scripts/verify-data-package.mjs"],
  ["--check", "scripts/verify-formal-use.mjs"],
  ["--check", "scripts/verify-formal-use-browser.mjs"],
  ["--check", "scripts/verify-formalization-plan.mjs"],
  ["--check", "scripts/verify-api-migration-map.mjs"],
  ["--check", "scripts/generate-migration-reconciliation.mjs"],
  ["--check", "scripts/generate-model-eval-report.mjs"],
  ["--check", "scripts/generate-eval-calibration-pack.mjs"],
  ["--check", "scripts/generate-test-report.mjs"],
  ["--check", "scripts/generate-smoke-checklist.mjs"],
  ["--check", "scripts/generate-formal-use-pack.mjs"],
  ["--check", "scripts/check-local-env.mjs"],
  ["--check", "scripts/check-ai-connectivity.mjs"],
  ["--check", "scripts/run-eval-calibration.mjs"],
  ["--check", "scripts/verify-hygiene.mjs"],
  ["--check", "scripts/verify-release.mjs"],
  ["scripts/verify-workbench.mjs"],
  ["scripts/verify-access.mjs"],
  ["scripts/verify-costs.mjs"],
  ["scripts/verify-metadata.mjs"],
  ["scripts/verify-evals.mjs"],
  ["scripts/verify-runtime.mjs"],
  ["scripts/verify-traceability.mjs"],
  ["scripts/verify-exports.mjs"],
  ["scripts/verify-summary.mjs"],
  ["scripts/verify-data-package.mjs"],
  ["scripts/verify-formal-use.mjs"],
  ["scripts/verify-formalization-plan.mjs"],
  ["scripts/verify-api-migration-map.mjs"],
  ["scripts/generate-migration-reconciliation.mjs"],
  ["scripts/generate-model-eval-report.mjs"],
  ["scripts/generate-eval-calibration-pack.mjs"],
  ["scripts/generate-smoke-checklist.mjs"],
  ["scripts/generate-formal-use-pack.mjs"],
  ["scripts/verify-hygiene.mjs"],
]) {
  runNode(args);
}

console.log("MVP verification passed.");
console.log("- Covered filters, custom fields, AI ingestion, 500-char comparison summaries, roadmap exports, auditability, access control, and deployment handoff.");
