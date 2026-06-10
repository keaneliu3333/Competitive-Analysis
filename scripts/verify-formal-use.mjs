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

const runbook = readRequired("docs/formal-use-runbook.md");
const launchChecklist = readRequired("docs/formal-use-launch-checklist.md");
const readme = readRequired("README.md");
const deployment = readRequired("docs/deployment.md");
const indexHtml = readRequired("index.html");
const scriptJs = readRequired("script.js");
const stylesCss = readRequired("styles.css");
const releaseVerifier = readRequired("scripts/verify-release.mjs");
const testReportGenerator = readRequired("scripts/generate-test-report.mjs");
const smokeChecklistGenerator = readRequired("scripts/generate-smoke-checklist.mjs");
const formalUsePackGenerator = readRequired("scripts/generate-formal-use-pack.mjs");
const browserSmokeVerifier = readRequired("scripts/verify-formal-use-browser.mjs");
const envExample = readRequired(".env.example");
const gitignore = readRequired(".gitignore");

for (const topic of [
  "使用目标",
  "当前版本",
  "参与角色",
  "使用前置条件",
  "使用数据建议",
  "使用任务",
  "反馈模板",
  "正式功能使用反馈",
  "网页内不增加单独试用模块",
  "formal-readiness",
  "formal-handoff",
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
  assertIncludes(runbook, topic, "formal use runbook");
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
  "formal-readiness",
  "formal-handoff",
  "使用反馈归档",
]) {
  assertIncludes(launchChecklist, topic, "formal use launch checklist");
}

for (const topic of [
  "正式功能使用运行手册",
  "正式功能使用",
  "formal-use-launch-checklist.md",
  "generate-formal-use-pack.mjs",
  "verify-formal-use.mjs",
  "verify-formal-use-browser.mjs",
  "formal-use-browser-smoke",
]) {
  assertIncludes(readme, topic, "README formal use coverage");
}

for (const topic of [
  "正式功能使用",
  "网页内不增加单独试用模块",
  "内部正式使用部署",
  "docs/formal-use-runbook.md",
  "docs/formal-use-launch-checklist.md",
  "reports/formal-use-pack",
  "SMOKE_BASE_URL",
  "verify-formal-use-browser.mjs",
]) {
  assertIncludes(deployment, topic, "deployment formal use coverage");
}

for (const token of [
  "OPENAI_API_KEY=",
  "COMPARE_AI_PROVIDER=deepseek",
  "DEEPSEEK_API_KEY=",
  "APP_READ_TOKEN=",
  "APP_WRITE_TOKEN=",
]) {
  assertIncludes(envExample, token, ".env.example formal use config");
}

for (const token of ["data/*.json", "reports/", ".env.local"]) {
  assertIncludes(gitignore, token, ".gitignore formal use safety");
}

for (const token of [
  "scripts/verify-formal-use.mjs",
  "scripts/generate-formal-use-pack.mjs",
]) {
  assertIncludes(releaseVerifier, token, "release verifier formal use gate");
  assertIncludes(testReportGenerator, token, "test report generator formal use gate");
}

for (const topic of [
  "Formal use pack generated",
  "node scripts/verify-release.mjs",
  "Go/No-Go",
  "正式功能使用",
  "正式功能使用启动清单",
  "provider",
  "500 字以内",
  "formal-use-browser-smoke",
  "浏览器冒烟摘要",
  "响应式视口摘要",
  "正式导出命名",
  "browserSmokeStatus",
  "responsiveRows",
]) {
  assertIncludes(formalUsePackGenerator, topic, "formal use pack generator");
}

for (const topic of ["正式功能人工冒烟清单", "正式功能使用", "Go/No-Go", "反馈", "使用人"]) {
  assertIncludes(smokeChecklistGenerator, topic, "manual smoke checklist formal use coverage");
}
assertNotIncludes(smokeChecklistGenerator, "试用人", "manual smoke checklist formal wording");

for (const topic of [
  "Formal use browser smoke",
  "SMOKE_BASE_URL",
  "formal-use-browser-smoke",
  "responsiveViewports",
  "responsiveChecks",
  "no in-page trial module",
  "trialFeedback",
]) {
  assertIncludes(browserSmokeVerifier, topic, "formal use browser smoke verifier");
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
  console.error("Formal use verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Formal use verification passed.");
console.log("- Checked runbook, launch checklist, release gates, generated use pack, env safety, and no in-page trial module.");
