#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const evalPath = join(root, "evals", "sample-cases.json");
const reportDir = join(root, "reports");
const generatedAt = new Date();
const dateStamp = generatedAt.toISOString().slice(0, 10);

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function cleanCell(value) {
  return String(value ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function markdownCell(value) {
  return cleanCell(value).replace(/\|/g, "/") || "-";
}

function csvCell(value) {
  const text = cleanCell(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function sourceRef(testCase) {
  const source = testCase.source || {};
  if (source.type === "url") return source.url || "";
  return source.path || "";
}

function sourceFormat(testCase) {
  const source = testCase.source || {};
  if (source.type === "url") return "url";
  if (source.format) return source.format;
  if (/\.pdf$/i.test(source.path || "")) return "pdf";
  return "long-image";
}

function joinList(value) {
  return Array.isArray(value) ? value.join("、") : "";
}

function priceRange(testCase) {
  const range = testCase.expected?.priceRange;
  if (!range) return "";
  return `${range.currency || "CNY"} ${range.min}-${range.max}`;
}

const payload = readJson(evalPath, { coverageTargets: {}, cases: [] });
const cases = Array.isArray(payload.cases) ? payload.cases : [];
const categoryCounts = cases.reduce((acc, item) => {
  acc[item.category || "unknown"] = (acc[item.category || "unknown"] || 0) + 1;
  return acc;
}, {});
const sourceCounts = cases.reduce((acc, item) => {
  const key = sourceFormat(item);
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

const csvHeaders = [
  "caseId",
  "category",
  "sourceType",
  "sourceFormat",
  "sourceRef",
  "expectedBrand",
  "expectedModel",
  "priceRangeCny",
  "requiredFeatures",
  "topSellingPointKeywords",
  "minConfidence",
  "summaryMaxChars",
  "openaiExtractionStatus",
  "observedBrand",
  "observedModel",
  "observedCategory",
  "observedPrice",
  "observedConfidence",
  "evidencePass",
  "requiredFeaturesPass",
  "topSellingPointsPass",
  "deepseekSummaryStatus",
  "summaryChars",
  "summaryCoversFunction",
  "summaryCoversParams",
  "summaryCoversExperience",
  "localFallbackStatus",
  "manualReviewRequired",
  "manualFix",
  "result",
  "owner",
  "notes",
];

const csvRows = cases.map((testCase) => [
  testCase.id,
  testCase.category,
  testCase.source?.type,
  sourceFormat(testCase),
  sourceRef(testCase),
  testCase.expected?.brand,
  testCase.expected?.model,
  priceRange(testCase),
  joinList(testCase.expected?.requiredFeatures),
  joinList(testCase.expected?.topSellingPointKeywords),
  testCase.acceptance?.minConfidence,
  testCase.acceptance?.summaryMaxChars || payload.coverageTargets?.summaryMaxChars || 500,
  "todo",
  "",
  "",
  "",
  "",
  "",
  "todo",
  "todo",
  "todo",
  "todo",
  "",
  "todo",
  "todo",
  "todo",
  "todo",
  testCase.acceptance?.requiresManualReviewWhenLowConfidence ? "yes-if-low-confidence" : "no",
  "",
  "todo",
  "",
  "",
]);

const csv = [
  csvHeaders.map(csvCell).join(","),
  ...csvRows.map((row) => row.map(csvCell).join(",")),
].join("\n");

const caseTableRows = cases.map((testCase) => [
  "|",
  markdownCell(testCase.id),
  "|",
  markdownCell(testCase.category),
  "|",
  markdownCell(`${testCase.source?.type || "-"} / ${sourceFormat(testCase)}`),
  "|",
  markdownCell(sourceRef(testCase)),
  "|",
  markdownCell(`${testCase.expected?.brand || "-"} ${testCase.expected?.model || "-"}`),
  "|",
  markdownCell(priceRange(testCase)),
  "|",
  markdownCell(joinList(testCase.expected?.requiredFeatures)),
  "|",
].join(" "));

const mdLines = [
  "# 真实样例校准任务包",
  "",
  `生成时间：${generatedAt.toISOString()}`,
  "",
  "## 用途",
  "",
  "这份任务包用于把真实竞品样例逐条跑通，记录 OpenAI 抽取、DeepSeek 总结、本地兜底、人工修订和 Go/No-Go 结论。网页内不新增试用模块，结果只归档在 reports/ 目录。",
  "",
  "## 覆盖情况",
  "",
  `- 总样例数：${cases.length}`,
  `- 品类覆盖：${Object.entries(categoryCounts).map(([key, value]) => `${key} ${value}`).join("，") || "-"}`,
  `- 来源覆盖：${Object.entries(sourceCounts).map(([key, value]) => `${key} ${value}`).join("，") || "-"}`,
  `- 记录模板：reports/eval-calibration-results-${dateStamp}.csv`,
  "",
  "## 执行步骤",
  "",
  "1. 运行 `node server.mjs`，打开本地工作台。",
  "2. 按下表 Case ID 逐条导入 URL、长图或 PDF。",
  "3. 记录品牌、型号、品类、价格、置信度、Top3 卖点证据和自定义字段命中情况。",
  "4. 对同品类 2-5 个型号生成 500 字以内总结，确认覆盖产品功能、关键参数和使用感受。",
  "5. 把结果填写到 CSV 模板，低置信字段必须进入人工复核或修订。",
  "",
  "## 样例任务清单",
  "",
  "| Case ID | 品类 | 来源 | 来源地址/文件 | 期望品牌型号 | 价格区间 | 必查功能字段 |",
  "| --- | --- | --- | --- | --- | --- | --- |",
  ...caseTableRows,
  "",
  "## Go/No-Go 口径",
  "",
  "- Go：品牌、型号、品类、价格区间、Top3 卖点、自定义字段和 500 字以内总结均可追溯，低置信字段已人工复核。",
  "- No-Go：出现数据丢失、密钥泄露、导出阻塞、无法恢复，或同类样例连续无法完成抽取/总结。",
  "",
  "## 输出文件",
  "",
  `- Markdown：reports/eval-calibration-pack-${dateStamp}.md`,
  `- CSV：reports/eval-calibration-results-${dateStamp}.csv`,
];

mkdirSync(reportDir, { recursive: true });
const markdownPath = join(reportDir, `eval-calibration-pack-${dateStamp}.md`);
const csvPath = join(reportDir, `eval-calibration-results-${dateStamp}.csv`);
writeFileSync(markdownPath, `${mdLines.join("\n")}\n`, "utf8");
writeFileSync(csvPath, `\uFEFF${csv}\n`, "utf8");

console.log(`Eval calibration pack generated: ${markdownPath}`);
console.log(`Eval calibration CSV generated: ${csvPath}`);
