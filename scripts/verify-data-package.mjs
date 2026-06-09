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

function assertNotIncludes(source, needle, label) {
  if (source.includes(needle)) fail(`${label} must not include: ${needle}`);
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
const deployment = readRequired("docs/deployment.md");
const traceability = readRequired("docs/requirements-traceability.md");

const payloadBody = functionBody(script, "dataPackagePayload");
for (const token of [
  "schemaVersion: 1",
  "exportedAt: nowIso()",
  'app: "cleaner-competitive-workbench"',
  "productCount: state.products.length",
  "state",
  "savedViews",
]) {
  assertIncludes(payloadBody, token, "data package payload");
}

const exportBody = functionBody(script, "exportDataPackage");
for (const token of [
  "dataPackagePayload()",
  "cleaner-workbench-",
  "JSON.stringify(payload, null, 2)",
  "application/json;charset=utf-8",
]) {
  assertIncludes(exportBody, token, "data package export");
}

const backupBody = functionBody(script, "backupBeforeDataPackageImport");
for (const token of [
  "dataPackagePayload()",
  'backupReason: "before-data-package-import"',
  "cleaner-workbench-backup-before-import-",
]) {
  assertIncludes(backupBody, token, "data package import backup");
}

const importBody = functionBody(script, "importDataPackage");
for (const token of [
  "JSON.parse(await file.text())",
  "payload.state || payload",
  "Array.isArray(incomingState.products)",
  "Array.isArray(incomingState.modules)",
  "backupBeforeDataPackageImport()",
  "state = mergeState(incomingState)",
  "savedViews = Array.isArray(payload.savedViews) ? payload.savedViews : []",
  "localStorage.setItem(STORAGE_KEY",
  "localStorage.setItem(VIEW_KEY",
  "queuePersist()",
]) {
  assertIncludes(importBody, token, "data package import");
}

const deleteFieldBody = functionBody(script, "deleteFeatureField");
for (const token of [
  "历史产品值会保留在数据包中",
  "state.modules = state.modules",
  "state.compareFieldKeys",
  "state.filters.featureField",
]) {
  assertIncludes(deleteFieldBody, token, "custom field deletion");
}
for (const forbidden of [
  "delete product.features",
  "delete p.features",
  "product.features[fieldKey]",
  "features[fieldKey] = undefined",
]) {
  assertNotIncludes(deleteFieldBody, forbidden, "custom field deletion");
}

for (const token of [
  "数据包交接",
  "完整 JSON 数据包",
  "自定义模块",
  "分析记录",
  "审计记录",
  "保存的工作视图",
  "删除不会清空历史产品值",
]) {
  assertIncludes(readme, token, "README data package documentation");
}

for (const token of [
  "数据包",
  "导出数据包后重新导入",
  "产品、自定义字段、分析记录、审计日志和保存视图仍在",
]) {
  assertIncludes(acceptance, token, "MVP acceptance data package coverage");
}

for (const token of [
  "导出数据包",
  "backup-before-import",
  "误导入时可用它恢复",
]) {
  assertIncludes(deployment, token, "deployment data package handoff");
}

for (const token of [
  "竞品功能对比模块自定义、元素自定义",
  "删除保留历史值",
  "完整数据包导入导出",
]) {
  assertIncludes(traceability, token, "traceability data package coverage");
}

if (failures.length) {
  console.error("Data package verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Data package verification passed.");
console.log("- Checked JSON handoff payload, import backup, saved views, and custom field history preservation.");
