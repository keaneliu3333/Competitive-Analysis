#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const root = process.cwd();
const inputPath = process.argv[2] || join(root, "data", "workbench-state.json");
const reportDir = join(root, "reports");
const generatedAt = new Date();
const dateStamp = generatedAt.toISOString().slice(0, 10);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function stateFromPayload(payload) {
  return payload.state || payload;
}

function countFeatureValues(products) {
  return products.reduce((sum, product) => sum + Object.keys(product.features || {}).length, 0);
}

function countNested(products, key) {
  return products.reduce((sum, product) => sum + (Array.isArray(product[key]) ? product[key].length : 0), 0);
}

function migrationCounts(payload) {
  const state = stateFromPayload(payload);
  const products = Array.isArray(state.products) ? state.products : [];
  const modules = Array.isArray(state.modules) ? state.modules : [];
  const fields = modules.flatMap((module) => (Array.isArray(module.fields) ? module.fields : []));
  return {
    products: products.length,
    brands: unique(products.map((product) => product.brand)).length,
    categories: unique(products.map((product) => product.category)).length,
    featureModules: modules.length,
    featureFields: fields.length,
    productFeatureValues: countFeatureValues(products),
    sellingPoints: countNested(products, "sellingPoints"),
    priceSnapshots: countNested(products, "priceSnapshots"),
    analysisRuns: countNested(products, "analysisRuns"),
    auditLogs: countNested(products, "auditLog"),
    savedViews: Array.isArray(payload.savedViews) ? payload.savedViews.length : 0,
    comparisonRuns: Array.isArray(state.comparisonRuns) ? state.comparisonRuns.length : 0,
  };
}

function markdownTable(counts) {
  const labels = {
    products: "Product",
    brands: "Brand",
    categories: "Category",
    featureModules: "FeatureModule",
    featureFields: "FeatureField",
    productFeatureValues: "ProductFeatureValue",
    sellingPoints: "SellingPoint",
    priceSnapshots: "PriceSnapshot",
    analysisRuns: "AnalysisRun",
    auditLogs: "AuditLog",
    savedViews: "SavedView",
    comparisonRuns: "ComparisonRun",
  };
  return [
    "| 对账项 | 迁移前数量 | 迁移后数量 | 状态 |",
    "| --- | ---: | ---: | --- |",
    ...Object.entries(labels).map(([key, label]) => `| ${label} | ${counts[key]} |  | 待对账 |`),
  ].join("\n");
}

mkdirSync(reportDir, { recursive: true });

let lines;
if (!existsSync(inputPath)) {
  lines = [
    "# 清洁电器竞品分析迁移对账报告",
    "",
    `生成时间：${generatedAt.toISOString()}`,
    `输入文件：${inputPath}`,
    "",
    "状态：未生成数量基线，输入文件不存在。",
    "",
    "请先导出数据包 JSON，或启动当前 MVP 生成 `data/workbench-state.json` 后重试。",
    "",
  ];
} else {
  const payload = readJson(inputPath);
  const counts = migrationCounts(payload);
  lines = [
    "# 清洁电器竞品分析迁移对账报告",
    "",
    `生成时间：${generatedAt.toISOString()}`,
    `输入文件：${basename(inputPath)}`,
    "",
    "## 迁移前数量基线",
    "",
    markdownTable(counts),
    "",
    "## 对账规则",
    "",
    "- 迁移后正式库的产品、品牌、品类、自定义字段、字段值、卖点、价格快照、分析、审计、保存视图和比较历史数量应与迁移前一致。",
    "- 品牌 + 型号去重后，如果数量变化，必须在备注中说明合并原因。",
    "- 对账未通过时，不切换正式读写流量。",
    "- 回滚基线使用同一次导出的完整数据包 JSON。",
    "",
    "## 备注",
    "",
    "- 迁移后数量：",
    "- 差异原因：",
    "- 验收人：",
    "",
  ];
}

const outputPath = join(reportDir, `migration-reconciliation-${dateStamp}.md`);
writeFileSync(outputPath, lines.join("\n"), "utf8");

console.log(`Migration reconciliation report generated: ${outputPath}`);

export { migrationCounts };
