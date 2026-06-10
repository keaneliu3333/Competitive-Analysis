#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function readRequired(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) {
    failures.push(`Missing required file: ${path}`);
    return "";
  }
  return readFileSync(fullPath, "utf8");
}

function assertIncludes(content, expected, label) {
  if (!content.includes(expected)) failures.push(`${label} missing: ${expected}`);
}

function assertNotIncludes(content, forbidden, label) {
  if (content.includes(forbidden)) failures.push(`${label} must not include: ${forbidden}`);
}

const runbook = readRequired("docs/internal-trial-runbook.md");
const launchChecklist = readRequired("docs/formal-use-launch-checklist.md");
const readme = readRequired("README.md");
const deployment = readRequired("docs/deployment.md");
const indexHtml = readRequired("index.html");
const scriptJs = readRequired("script.js");
const stylesCss = readRequired("styles.css");
const releaseVerifier = readRequired("scripts/verify-release.mjs");
const testReportGenerator = readRequired("scripts/generate-test-report.mjs");
const smokeChecklistGenerator = readRequired("scripts/generate-smoke-checklist.mjs");
const trialPackGenerator = readRequired("scripts/generate-internal-trial-pack.mjs");
const envExample = readRequired(".env.example");
const gitignore = readRequired(".gitignore");

for (const topic of [
  "使用目标",
  "参与角色",
  "使用前置条件",
  "使用数据建议",
  "使用任务",
  "反馈模板",
  "正式功能使用反馈",
  "网页内不增加单独试用模块",
  "Go/No-Go 标准",
  "回滚与备份",
  "不做事项",
  "node scripts/verify-release.mjs",
  "node scripts/check-local-env.mjs",
  "node server.mjs",
  "OPENAI_API_KEY",
  "DEEPSEEK_API_KEY",
  "backup-before-import",
]) {
  assertIncludes(runbook, topic, "internal trial runbook");
}

for (const topic of [
  "正式功能使用启动清单",
  "网页内不增加任何“试用”模块",
  "node scripts/verify-release.mjs",
  "node scripts/verify-hygiene.mjs",
  "trialFeedback",
  "trial-panel",
  "addTrialFeedback",
  "exportTrialFeedback",
  "正式功能确认",
  "使用反馈归档",
]) {
  assertIncludes(launchChecklist, topic, "formal use launch checklist");
}

for (const topic of [
  "正式功能使用运行手册",
  "正式功能使用",
  "formal-use-launch-checklist.md",
  "generate-internal-trial-pack.mjs",
  "verify-internal-trial.mjs",
]) {
  assertIncludes(readme, topic, "README internal trial coverage");
}

for (const topic of [
  "正式功能使用",
  "网页内不增加单独试用模块",
  "docs/internal-trial-runbook.md",
  "docs/formal-use-launch-checklist.md",
  "reports/internal-trial-pack",
]) {
  assertIncludes(deployment, topic, "deployment internal trial coverage");
}

for (const token of [
  "OPENAI_API_KEY=",
  "COMPARE_AI_PROVIDER=deepseek",
  "DEEPSEEK_API_KEY=",
  "APP_READ_TOKEN=",
  "APP_WRITE_TOKEN=",
]) {
  assertIncludes(envExample, token, ".env.example trial config");
}

for (const token of ["data/*.json", "reports/", ".env.local"]) {
  assertIncludes(gitignore, token, ".gitignore internal trial safety");
}

for (const token of [
  "scripts/verify-internal-trial.mjs",
  "scripts/generate-internal-trial-pack.mjs",
]) {
  assertIncludes(releaseVerifier, token, "release verifier internal trial gate");
  assertIncludes(testReportGenerator, token, "test report generator internal trial gate");
}

for (const topic of [
  "Internal trial pack generated",
  "node scripts/verify-release.mjs",
  "Go/No-Go",
  "正式功能使用",
  "正式功能使用启动清单",
  "provider",
  "500 字以内",
]) {
  assertIncludes(trialPackGenerator, topic, "internal trial pack generator");
}

for (const topic of ["正式功能使用", "Go/No-Go", "反馈"]) {
  assertIncludes(smokeChecklistGenerator, topic, "manual smoke checklist internal trial coverage");
}

for (const forbidden of [
  "trialFeedback",
  "trial-panel",
  "addTrialFeedback",
  "exportTrialFeedback",
  "内部试用反馈",
]) {
  assertNotIncludes(indexHtml, forbidden, "index.html no in-page trial module");
  assertNotIncludes(scriptJs, forbidden, "script.js no in-page trial module");
  assertNotIncludes(stylesCss, forbidden, "styles.css no in-page trial module");
}

if (failures.length) {
  console.error("Internal trial verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Internal trial verification passed.");
console.log("- Checked runbook, release gates, generated trial pack, feedback template, env safety, and deployment handoff.");
