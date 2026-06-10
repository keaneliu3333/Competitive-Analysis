#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const generatedAt = new Date();
const dateStamp = generatedAt.toISOString().slice(0, 10);
const reportDir = join(root, "reports");
mkdirSync(reportDir, { recursive: true });

function readOptional(path) {
  const fullPath = join(root, path);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

const runbook = readOptional("docs/internal-trial-runbook.md");
const smokeChecklist = readOptional(`reports/manual-smoke-checklist-${dateStamp}.md`);
const modelEval = readOptional(`reports/model-eval-readiness-${dateStamp}.md`);

const lines = [
  "# 清洁电器竞品分析正式功能使用包",
  "",
  `生成时间：${generatedAt.toISOString()}`,
  "",
  "## 使用范围",
  "",
  "- 面向内部产品研究、产品经理、研发和运营进行正式功能使用。",
  "- 当前版本是静态前端 + Node.js 内置服务，不是公开 SaaS。",
  "- 图片/PDF 结构化抽取默认走 OpenAI；文本总结可配置 DeepSeek，失败后回退 OpenAI 或本地兜底。",
  "",
  "## 试用前必须通过",
  "",
  "```bash",
  "node scripts/verify-release.mjs",
  "node scripts/check-local-env.mjs",
  "node scripts/verify-internal-trial.mjs",
  "node server.mjs",
  "```",
  "",
  "## 试用任务摘要",
  "",
  "| 任务 | 证据 | 通过标准 |",
  "| --- | --- | --- |",
  "| 筛选工作台 | 截图或保存视图名称 | 品类、价格段、品牌、渠道、状态和自定义字段组合筛选正确 |",
  "| 自定义字段 | 字段名和导出表 | 字段进入详情、筛选、对比和导出，删除后历史值保留 |",
  "| AI 导入 | 来源链接、截图/PDF 名称、复核记录 | URL、长图、PDF 都能进入待确认或已确认产品记录 |",
  "| 型号对比 | 对比表和总结 | 500 字以内，总结覆盖功能、参数、使用感受、价格和 Top3 卖点 |",
  "| 路线图 | Excel/SVG/PDF | 卡片包含产品图、价格、Top3 卖点、状态和来源 |",
  "| 数据包 | JSON 和 backup-before-import | 导出、导入、备份、审计和保存视图可恢复 |",
  "| 用量审计 | CSV | provider、model、status、usage、estimatedCostUsd 和错误摘要可追溯 |",
  "| 使用反馈 | 使用包记录 | 至少记录 1 条反馈或改进建议，并给出 Go/No-Go 建议 |",
  "",
  "## 反馈记录",
  "",
  "- 试用人：",
  "- 日期：",
  "- 角色：",
  "- 试用资料：URL / 长图 / PDF / CSV / 手工录入",
  "- 阻塞问题：",
  "- UI 优化：",
  "- AI 抽取或总结问题：",
  "- 导出或数据恢复问题：",
  "- 使用包反馈记录编号：",
  "- Go/No-Go 建议：",
  "",
  "## 已生成证据",
  "",
  `- 人工冒烟清单：${smokeChecklist ? `reports/manual-smoke-checklist-${dateStamp}.md` : "未生成"}`,
  `- 多模型评估准备报告：${modelEval ? `reports/model-eval-readiness-${dateStamp}.md` : "未生成"}`,
  "- MVP 测试报告：运行 `node scripts/generate-test-report.mjs` 后查看 `reports/mvp-test-report-*.md`。",
  "",
  "## 运行手册快照",
  "",
  runbook || "未找到 docs/internal-trial-runbook.md",
  "",
];

const outputPath = join(reportDir, `internal-trial-pack-${dateStamp}.md`);
writeFileSync(outputPath, lines.join("\n"), "utf8");

console.log(`Internal trial pack generated: ${outputPath}`);
