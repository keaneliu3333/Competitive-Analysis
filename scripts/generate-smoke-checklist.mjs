#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const generatedAt = new Date();
const dateStamp = generatedAt.toISOString().slice(0, 10);
const reportDir = join(root, "reports");
mkdirSync(reportDir, { recursive: true });

const checks = [
  {
    area: "启动与首页",
    steps: [
      "运行 `node scripts/check-local-env.mjs`，确认端口、data/、配置模板和访问令牌状态。",
      "运行 `node server.mjs`，打开 `http://localhost:4173`。",
      "确认首屏直接进入工作台，可看到产品库、筛选、AI 导入、型号对比、路线图和 MVP 就绪度。",
    ],
    expected: "首页无空白、无明显重叠，核心模块可直接操作。",
  },
  {
    area: "筛选工作台",
    steps: [
      "输入关键词，组合选择品类、品牌、渠道、上市状态和自定义价格段。",
      "选择一个自定义功能字段，切换操作符和值。",
      "保存当前工作视图后刷新页面，再恢复该视图。",
    ],
    expected: "产品表结果、列显隐、排序、对比选择和路线图筛选随视图正确恢复。",
  },
  {
    area: "自定义字段",
    steps: [
      "新增一个枚举字段，并设置 2-3 个选项。",
      "在产品详情中录入该字段，确认它出现在筛选器、对比字段选择和导出列里。",
      "重命名该字段，再删除该字段配置。",
    ],
    expected: "字段配置可调整；删除字段后历史产品值保留在数据包中，不再显示在筛选、对比和导出里。",
  },
  {
    area: "详情页与 AI 导入",
    steps: [
      "输入一个批准使用的官网或电商详情页 URL，点击预抓取。",
      "上传一张详情页长图或 PDF，填写补充说明后开始分析。",
      "未配置 OpenAI 或请求失败时，确认系统返回待人工确认兜底结果。",
    ],
    expected: "页面标题、图片候选、价格候选、文案证据和字段置信度可追溯；低置信字段进入复核队列。",
  },
  {
    area: "型号对比",
    steps: [
      "选择 2-5 个型号，勾选一组核心功能字段。",
      "生成竞争对标总结。",
      "导出对比表 Excel。",
    ],
    expected: "矩阵有差异高亮；总结不超过 500 个中文字符，并覆盖产品功能、关键参数、使用感受、价格梯度和 Top3 卖点。",
  },
  {
    area: "路线图导出",
    steps: [
      "切换品牌、品类、状态和季度筛选。",
      "导出路线图 Excel 和 SVG。",
      "分别打开当前路线图打印/PDF和各品牌分页 PDF。",
    ],
    expected: "路线图卡片包含产品图、价格、Top3 优先级卖点、状态和来源；各品牌分页不溢出。",
  },
  {
    area: "交接与审计",
    steps: [
      "导出产品库 Excel、质量问题 CSV、审计 CSV、用量 CSV、MVP 验收 CSV 和 Markdown 交接包。",
      "导出完整数据包 JSON，再导入该数据包。",
      "确认导入前自动下载 backup-before-import 备份。",
    ],
    expected: "产品、自定义模块、分析记录、审计日志、保存视图和比较历史可恢复；交接包包含状态、风险、命令和下一阶段建议。",
  },
  {
    area: "正式功能使用反馈",
    steps: [
      "打开 `docs/internal-trial-runbook.md`，确认使用目标、角色、任务和 Go/No-Go 标准。",
      "运行 `node scripts/generate-formal-use-pack.mjs` 生成当天试用包。",
      "按使用包反馈模板记录 UI、AI、导出、数据恢复和权限问题。",
    ],
    expected: "试用人、资料类型、完成任务、阻塞问题、可后续优化和 Go/No-Go 建议都有记录。",
  },
];

const lines = [
  "# 清洁电器竞品分析 MVP 人工冒烟清单",
  "",
  `生成时间：${generatedAt.toISOString()}`,
  "",
  "## 环境记录",
  "",
  "- 验收人：",
  "- 浏览器：",
  "- 服务地址：",
  "- OpenAI 配置状态：",
  "- DeepSeek 配置状态：",
  "- 访问令牌模式：未配置 / APP_ACCESS_TOKEN / APP_READ_TOKEN + APP_WRITE_TOKEN",
  "- 数据样例来源：内置样例 / 批量导入 / 真实 URL / 截图或 PDF",
  "",
  "## 前置命令",
  "",
  "```bash",
  "node scripts/verify-release.mjs",
  "node scripts/check-local-env.mjs",
  "node server.mjs",
  "```",
  "",
  "## 检查项",
  "",
  ...checks.flatMap((check, index) => [
    `### ${index + 1}. ${check.area}`,
    "",
    "- 状态：待验收 / 通过 / 未通过 / 阻塞",
    "- 证据截图或导出文件：",
    "- 步骤：",
    ...check.steps.map((step) => `  - [ ] ${step}`),
    `- 期望结果：${check.expected}`,
    "- 备注：",
    "",
  ]),
  "## 结论",
  "",
  "- 总体结论：通过 / 未通过 / 阻塞",
  "- 正式功能使用 Go/No-Go：Go / No-Go",
  "- 必须修复问题：",
  "- 可后续优化问题：",
  "- 交接人确认：",
  "",
];

const outputPath = join(reportDir, `manual-smoke-checklist-${dateStamp}.md`);
writeFileSync(outputPath, lines.join("\n"), "utf8");

console.log(`Manual smoke checklist generated: ${outputPath}`);
