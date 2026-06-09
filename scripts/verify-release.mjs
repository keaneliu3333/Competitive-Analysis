#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const root = process.cwd();

const steps = [
  {
    name: "本地环境预检",
    command: ["node", "scripts/check-local-env.mjs"],
  },
  {
    name: "完整 MVP 自动验收",
    command: ["node", "scripts/verify-mvp.mjs"],
  },
  {
    name: "导出结构专项验收",
    command: ["node", "scripts/verify-exports.mjs"],
  },
  {
    name: "500 字总结专项验收",
    command: ["node", "scripts/verify-summary.mjs"],
  },
  {
    name: "数据包交接专项验收",
    command: ["node", "scripts/verify-data-package.mjs"],
  },
  {
    name: "生成 MVP 测试报告",
    command: ["node", "scripts/generate-test-report.mjs"],
  },
];

function runStep(step) {
  const startedAt = Date.now();
  try {
    const output = execFileSync(step.command[0], step.command.slice(1), {
      cwd: root,
      encoding: "utf8",
      stdio: "pipe",
    }).trim();
    return {
      ...step,
      ok: true,
      durationMs: Date.now() - startedAt,
      output,
    };
  } catch (error) {
    return {
      ...step,
      ok: false,
      durationMs: Date.now() - startedAt,
      output: `${error.stdout || ""}${error.stderr || ""}`.trim() || error.message,
    };
  }
}

const results = steps.map(runStep);

console.log("Release readiness verification");
for (const result of results) {
  console.log(`${result.ok ? "OK" : "FAIL"} ${result.name} - ${result.command.join(" ")} (${result.durationMs}ms)`);
  if (result.output) {
    console.log(result.output);
  }
}

if (results.some((result) => !result.ok)) {
  console.error("Release readiness verification failed.");
  process.exit(1);
}

console.log("Release readiness verification passed.");
