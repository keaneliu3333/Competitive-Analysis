#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeComparisonSummary } from "../server.mjs";

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

function assert(condition, message) {
  if (!condition) fail(message);
}

function chineseLength(value) {
  return Array.from(String(value || "")).length;
}

const script = readRequired("script.js");
const server = readRequired("server.mjs");
const readme = readRequired("README.md");
const acceptance = readRequired("docs/mvp-acceptance.md");
const traceability = readRequired("docs/requirements-traceability.md");

const longSummary = "产品功能、关键参数、使用感受、价格梯度、Top3卖点。".repeat(120);
const clipped = normalizeComparisonSummary(longSummary);
assert(chineseLength(clipped) <= 500, "normalizeComparisonSummary must cap summary at 500 characters");
assert(clipped.length > 0, "normalizeComparisonSummary must keep non-empty text");

const spaced = normalizeComparisonSummary("产品功能   关键参数\n\n\n使用感受");
assert(!spaced.includes("   "), "normalizeComparisonSummary must normalize repeated spaces");
assert(!spaced.includes("\n\n\n"), "normalizeComparisonSummary must normalize repeated blank lines");

for (const token of [
  "function localSummary",
  "功能上",
  "参数对比建议重点看",
  "使用感受上",
  "价格从",
  "Top3",
  "normalizeComparisonSummary",
]) {
  assertIncludes(script, token, "client comparison summary");
}

for (const token of [
  "500 个中文字符以内",
  "产品功能",
  "关键参数",
  "使用感受",
  "定位建议",
  "待验证短板",
  "differenceFields",
  "价格梯度",
  "Top3 卖点",
  "cleaner_compare_summary",
]) {
  assertIncludes(server, token, "server comparison prompt");
}

for (const token of [
  "500 字以内",
  "产品功能",
  "关键参数",
  "使用感受",
]) {
  assertIncludes(readme, token, "README comparison summary documentation");
  assertIncludes(acceptance, token, "MVP acceptance comparison summary documentation");
}

for (const token of [
  "500 字以内多维总结",
  "产品功能、关键参数、价格梯度、Top3 卖点和使用感受",
  "normalizeComparisonSummary",
]) {
  assertIncludes(traceability, token, "traceability comparison summary coverage");
}

if (failures.length) {
  console.error("Summary verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Summary verification passed.");
console.log("- Checked 500-character cap, prompt dimensions, local fallback wording, and documentation coverage.");
