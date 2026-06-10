#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function run(command) {
  const startedAt = Date.now();
  const executable = command[0] === "node" ? process.execPath : command[0];
  const args = command[0] === "node" ? command.slice(1) : command.slice(1);
  try {
    const output = execFileSync(executable, args, {
      cwd: root,
      encoding: "utf8",
      stdio: "pipe",
    });
    return {
      command: command.join(" "),
      ok: true,
      durationMs: Date.now() - startedAt,
      output: output.trim(),
    };
  } catch (error) {
    return {
      command: command.join(" "),
      ok: false,
      durationMs: Date.now() - startedAt,
      output: `${error.stdout || ""}${error.stderr || ""}`.trim() || error.message,
    };
  }
}

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function fenced(value) {
  return `\`\`\`text\n${String(value || "-").slice(0, 4000)}\n\`\`\``;
}

const commands = [
  ["node", "--check", "script.js"],
  ["node", "--check", "server.mjs"],
  ["node", "--check", "scripts/verify-access.mjs"],
  ["node", "--check", "scripts/verify-mvp.mjs"],
  ["node", "--check", "scripts/verify-runtime.mjs"],
  ["node", "--check", "scripts/verify-traceability.mjs"],
  ["node", "--check", "scripts/verify-exports.mjs"],
  ["node", "--check", "scripts/verify-summary.mjs"],
  ["node", "--check", "scripts/verify-data-package.mjs"],
  ["node", "--check", "scripts/verify-internal-trial.mjs"],
  ["node", "--check", "scripts/verify-formalization-plan.mjs"],
  ["node", "--check", "scripts/verify-api-migration-map.mjs"],
  ["node", "--check", "scripts/generate-migration-reconciliation.mjs"],
  ["node", "--check", "scripts/generate-model-eval-report.mjs"],
  ["node", "--check", "scripts/generate-smoke-checklist.mjs"],
  ["node", "--check", "scripts/generate-internal-trial-pack.mjs"],
  ["node", "scripts/verify-access.mjs"],
  ["node", "scripts/verify-mvp.mjs"],
  ["node", "scripts/verify-runtime.mjs"],
  ["node", "scripts/verify-traceability.mjs"],
  ["node", "scripts/verify-exports.mjs"],
  ["node", "scripts/verify-summary.mjs"],
  ["node", "scripts/verify-data-package.mjs"],
  ["node", "scripts/verify-internal-trial.mjs"],
  ["node", "scripts/verify-formalization-plan.mjs"],
  ["node", "scripts/verify-api-migration-map.mjs"],
  ["node", "scripts/generate-migration-reconciliation.mjs"],
  ["node", "scripts/generate-model-eval-report.mjs"],
  ["node", "scripts/generate-smoke-checklist.mjs"],
  ["node", "scripts/generate-internal-trial-pack.mjs"],
];

const results = commands.map(run);
const generatedAt = new Date();
const dateStamp = generatedAt.toISOString().slice(0, 10);
const reportDir = join(root, "reports");
mkdirSync(reportDir, { recursive: true });

const acceptance = read("docs/mvp-acceptance.md");
const traceability = read("docs/requirements-traceability.md");
const summary = results.every((result) => result.ok) ? "通过" : "失败";
const lines = [
  "# 清洁电器竞品分析 MVP 测试报告",
  "",
  `生成时间：${generatedAt.toISOString()}`,
  `总体结果：${summary}`,
  "",
  "## 自动验收结果",
  "",
  "| 命令 | 结果 | 耗时 |",
  "| --- | --- | --- |",
  ...results.map((result) => `| \`${result.command}\` | ${result.ok ? "通过" : "失败"} | ${result.durationMs}ms |`),
  "",
  "## 命令输出",
  "",
  ...results.flatMap((result) => [
    `### ${result.command}`,
    "",
    fenced(result.output),
    "",
  ]),
  "## MVP 验收清单快照",
  "",
  acceptance,
  "",
  "## 需求追踪矩阵快照",
  "",
  traceability,
  "",
];

const outputPath = join(reportDir, `mvp-test-report-${dateStamp}.md`);
writeFileSync(outputPath, lines.join("\n"), "utf8");

if (!results.every((result) => result.ok)) {
  console.error(`MVP test report failed: ${outputPath}`);
  process.exit(1);
}

console.log(`MVP test report generated: ${outputPath}`);
