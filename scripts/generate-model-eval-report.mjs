#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const evalPath = join(root, "evals", "sample-cases.json");
const usagePath = join(root, "data", "api-usage.json");
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

const evalConfig = readJson(evalPath, { cases: [] });
const usage = readJson(usagePath, []);
const cases = Array.isArray(evalConfig.cases) ? evalConfig.cases : [];
const providers = usage.reduce((acc, record) => {
  const provider = record.provider || (String(record.model || "").includes("deepseek") ? "deepseek" : "openai");
  acc[provider] = acc[provider] || { total: 0, ok: 0, error: 0, tokens: 0 };
  acc[provider].total += 1;
  if (record.status === "ok") acc[provider].ok += 1;
  if (record.status === "error") acc[provider].error += 1;
  acc[provider].tokens += Number(record.usage?.total_tokens || 0);
  return acc;
}, {});

function countBy(items, fn) {
  return items.reduce((acc, item) => {
    const key = fn(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

const categoryCounts = countBy(cases, (item) => item.category || "unknown");
const sourceCounts = countBy(cases, (item) => item.source?.type || "unknown");
const formatCounts = {
  url: cases.filter((item) => item.source?.type === "url").length,
  longImage: cases.filter((item) => /\.(svg|png|jpe?g|webp)$/i.test(item.source?.path || "")).length,
  pdf: cases.filter((item) => /\.pdf$/i.test(item.source?.path || "")).length,
};

const providerRows = Object.entries(providers).length
  ? Object.entries(providers).map(([provider, stats]) => `| ${provider} | ${stats.total} | ${stats.ok} | ${stats.error} | ${stats.tokens || "-"} |`)
  : ["| - | 0 | 0 | 0 | - |"];

function markdownCell(value) {
  return String(value ?? "-")
    .replace(/\r?\n/g, " ")
    .replace(/\|/g, "/")
    .trim() || "-";
}

function sourceLabel(testCase) {
  const source = testCase.source || {};
  if (source.type === "url") return `URL：${source.url || "-"}`;
  const format = source.format || (/\.(pdf)$/i.test(source.path || "") ? "pdf" : "long-image");
  return `文件：${source.path || "-"} (${format})`;
}

function featureList(testCase) {
  return Array.isArray(testCase.expected?.requiredFeatures) ? testCase.expected.requiredFeatures.join("、") : "-";
}

function sellingPointKeywords(testCase) {
  return Array.isArray(testCase.expected?.topSellingPointKeywords) ? testCase.expected.topSellingPointKeywords.join("、") : "-";
}

function priceRangeLabel(testCase) {
  const range = testCase.expected?.priceRange;
  if (!range) return "-";
  return `${range.currency || "CNY"} ${range.min}-${range.max}`;
}

const caseRows = cases.map((testCase) => [
  "|",
  markdownCell(testCase.id),
  "|",
  markdownCell(testCase.category),
  "|",
  markdownCell(sourceLabel(testCase)),
  "|",
  markdownCell(`${testCase.expected?.brand || "-"} ${testCase.expected?.model || "-"}`),
  "|",
  markdownCell(priceRangeLabel(testCase)),
  "|",
  markdownCell(featureList(testCase)),
  "|",
  markdownCell(sellingPointKeywords(testCase)),
  "|",
  markdownCell(`置信度>=${testCase.acceptance?.minConfidence ?? "-"}，总结<=${testCase.acceptance?.summaryMaxChars ?? 500}字，证据可追溯`),
  "|",
].join(" "));

const lines = [
  "# 多模型真实样例评估准备报告",
  "",
  `生成时间：${generatedAt.toISOString()}`,
  "",
  "## 样例覆盖",
  "",
  `- 总样例数：${cases.length}`,
  `- 品类覆盖：${Object.entries(categoryCounts).map(([key, value]) => `${key} ${value}`).join("，") || "-"}`,
  `- 来源覆盖：${Object.entries(sourceCounts).map(([key, value]) => `${key} ${value}`).join("，") || "-"}`,
  `- 文件形态：URL ${formatCounts.url}，长图 ${formatCounts.longImage}，PDF ${formatCounts.pdf}`,
  "",
  "## Provider 用量快照",
  "",
  "| Provider | 调用数 | 成功 | 失败 | Tokens |",
  "| --- | ---: | ---: | ---: | ---: |",
  ...providerRows,
  "",
  "## 评估口径",
  "",
  "- OpenAI：用于 URL 图片候选、长图、PDF 和结构化抽取评估。",
  "- DeepSeek：用于 500 字以内型号对比总结和低成本文本复核评估。",
  "- 本地兜底：用于 API 缺失或失败时的可用性下限评估。",
  "- 每个真实样例至少检查品牌、型号、品类、价格区间、Top3 卖点证据、自定义字段和总结质量。",
  "",
  "## 人工校准清单",
  "",
  "| Case ID | 品类 | 来源 | 期望品牌/型号 | 价格区间 | 必查功能字段 | Top3 卖点关键词 | 验收门槛 |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ...caseRows,
  "",
  "## 校准记录模板",
  "",
  "| Case ID | OpenAI 抽取结论 | DeepSeek 总结结论 | 本地兜底表现 | 人工修订 | 结论 |",
  "| --- | --- | --- | --- | --- | --- |",
  ...cases.map((testCase) => `| ${markdownCell(testCase.id)} | 待记录 | 待记录 | 待记录 | 待记录 | Go / No-Go |`),
  "",
  "## 下一步",
  "",
  "- 用当前 eval 集逐条运行人工校准，记录 OpenAI 抽取结果、DeepSeek 总结结果和本地兜底结果。",
  "- 对低置信字段回写人工修订，并把修订后的高置信产品作为后续提示词示例。",
];

mkdirSync(reportDir, { recursive: true });
const outputPath = join(reportDir, `model-eval-readiness-${dateStamp}.md`);
writeFileSync(outputPath, `${lines.join("\n")}\n`);
console.log(`Model eval readiness report generated: ${outputPath}`);
