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

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) {
    fail(`Missing function ${name}`);
    return "";
  }
  const braceStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  fail(`Could not parse function ${name}`);
  return source.slice(start);
}

const script = readRequired("script.js");
const readme = readRequired("README.md");
const acceptance = readRequired("docs/mvp-acceptance.md");
const traceability = readRequired("docs/requirements-traceability.md");

const productExport = functionBody(script, "exportExcel");
for (const token of [
  "产品图",
  "品牌",
  "型号",
  "品类",
  "价格",
  "Top3 卖点",
  "最近价格快照",
  "最近分析",
  "最近操作",
  "来源价格候选",
  "来源文案证据",
  "来源图片候选",
  "application/vnd.ms-excel",
]) {
  assertIncludes(productExport, token, "product Excel export");
}

const compareExport = functionBody(script, "exportCompare");
for (const token of [
  "500 字以内对标总结",
  "产品概览",
  "产品图",
  "价格",
  "Top3 优先级卖点",
  "已选功能参数矩阵",
  "application/vnd.ms-excel",
]) {
  assertIncludes(compareExport, token, "comparison Excel export");
}

const roadmapExport = functionBody(script, "exportRoadmap");
for (const token of [
  "产品图",
  "品牌",
  "型号",
  "品类",
  "价格",
  "状态",
  "来源",
  "Top3 优先级卖点",
  "application/vnd.ms-excel",
]) {
  assertIncludes(roadmapExport, token, "roadmap Excel export");
}

const roadmapSvg = functionBody(script, "roadmapSvgDocument");
for (const token of [
  "<svg",
  "<image",
  "产品图、价格与 Top3 优先级卖点",
  "formatCurrency(product.price)",
  "roadmapSourceLabel(product)",
  "P${index + 1}",
]) {
  assertIncludes(roadmapSvg, token, "roadmap SVG export");
}

const printCard = functionBody(script, "roadmapPrintCard");
for (const token of [
  "<img",
  "formatCurrency(product.price)",
  ".slice(0, 3)",
  "价格快照",
  "来源",
  "分析",
]) {
  assertIncludes(printCard, token, "roadmap print card");
}

const allBrandReport = functionBody(script, "brandRoadmapReportHtml");
for (const token of [
  "brand-page",
  "page-break-after:always",
  "grid-template-columns:repeat(4,minmax(0,1fr))",
  "roadmapPrintCard",
]) {
  assertIncludes(allBrandReport, token, "all-brand roadmap report");
}

for (const token of [
  "产品库和路线图导出为 Excel",
  "对比表导出",
  "路线图图片导出",
  "各品牌 PDF",
]) {
  assertIncludes(readme, token, "README export documentation");
}

for (const token of [
  "产品库 Excel",
  "型号对比 Excel",
  "路线图 Excel",
  "路线图 SVG",
  "各品牌分页 PDF",
]) {
  assertIncludes(acceptance, token, "MVP acceptance export coverage");
}

for (const token of [
  "导出 Excel",
  "各品牌路线图带产品图、价格、Top3 优先级卖点",
  "exportExcel",
  "exportCompare",
  "exportRoadmap",
  "brandRoadmapReportHtml",
]) {
  assertIncludes(traceability, token, "traceability export coverage");
}

if (failures.length) {
  console.error("Export verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Export verification passed.");
console.log("- Checked product Excel, comparison Excel, roadmap Excel, roadmap SVG, and all-brand PDF report structure.");
