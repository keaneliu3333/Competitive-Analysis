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

const runbook = readRequired("docs/internal-trial-runbook.md");
const readme = readRequired("README.md");
const deployment = readRequired("docs/deployment.md");
const releaseVerifier = readRequired("scripts/verify-release.mjs");
const testReportGenerator = readRequired("scripts/generate-test-report.mjs");
const smokeChecklistGenerator = readRequired("scripts/generate-smoke-checklist.mjs");
const trialPackGenerator = readRequired("scripts/generate-internal-trial-pack.mjs");
const envExample = readRequired(".env.example");
const gitignore = readRequired(".gitignore");

for (const topic of [
  "试用目标",
  "参与角色",
  "试用前置条件",
  "试用数据建议",
  "试用任务",
  "反馈模板",
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
  "内部试用运行手册",
  "generate-internal-trial-pack.mjs",
  "verify-internal-trial.mjs",
]) {
  assertIncludes(readme, topic, "README internal trial coverage");
}

for (const topic of [
  "内部试用",
  "docs/internal-trial-runbook.md",
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
  "provider",
  "500 字以内",
]) {
  assertIncludes(trialPackGenerator, topic, "internal trial pack generator");
}

for (const topic of ["内部试用", "Go/No-Go", "反馈"]) {
  assertIncludes(smokeChecklistGenerator, topic, "manual smoke checklist internal trial coverage");
}

if (failures.length) {
  console.error("Internal trial verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Internal trial verification passed.");
console.log("- Checked runbook, release gates, generated trial pack, feedback template, env safety, and deployment handoff.");
