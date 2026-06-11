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
    name: "正式功能使用准备验收",
    command: ["node", "scripts/verify-formal-use.mjs"],
  },
  {
    name: "正式化迁移计划验收",
    command: ["node", "scripts/verify-formalization-plan.mjs"],
  },
  {
    name: "API 与队列迁移矩阵验收",
    command: ["node", "scripts/verify-api-migration-map.mjs"],
  },
  {
    name: "生成迁移对账报告",
    command: ["node", "scripts/generate-migration-reconciliation.mjs"],
  },
  {
    name: "生成多模型评估准备报告",
    command: ["node", "scripts/generate-model-eval-report.mjs"],
  },
  {
    name: "生成真实样例校准任务包",
    command: ["node", "scripts/generate-eval-calibration-pack.mjs"],
  },
  {
    name: "生成 MVP 测试报告",
    command: ["node", "scripts/generate-test-report.mjs"],
  },
  {
    name: "生成人工冒烟清单",
    command: ["node", "scripts/generate-smoke-checklist.mjs"],
  },
  {
    name: "生成正式功能使用包",
    command: ["node", "scripts/generate-formal-use-pack.mjs"],
  },
];

function runStep(step) {
  const startedAt = Date.now();
  const command = step.command[0] === "node" ? [process.execPath, ...step.command.slice(1)] : step.command;
  try {
    const output = execFileSync(command[0], command.slice(1), {
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
