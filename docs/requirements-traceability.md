# 需求追踪矩阵

这份矩阵把原始需求映射到当前 MVP 的实现位置、验证命令和剩余人工验收点。

| 需求 | MVP 覆盖 | 主要实现 | 自动验证 | 人工验收 |
| --- | --- | --- | --- | --- |
| 简洁明了的 UI/UX 交互 | 工作台首页直接展示筛选、产品库、AI 导入、对比、路线图和数据质量，不做营销页 | `index.html`、`styles.css`、`script.js` | `node scripts/verify-runtime.mjs` 检查首页和核心控件；`node scripts/generate-smoke-checklist.mjs` 生成浏览器验收清单 | 打开页面，确认首屏能进入主要工作流，并记录到人工冒烟清单 |
| 品类筛选、价格段自定义和筛选 | 顶部筛选栏支持品类可搜索多选、品牌可搜索筛选、渠道、状态、自定义价格段、AI 置信度和功能字段筛选 | `featureFilterMatches`、`getVisibleProducts` | `node scripts/verify-workbench.mjs`、`node scripts/verify-mvp.mjs` | 修改品类、品牌和价格段，确认产品表结果变化 |
| 竞品功能对比模块自定义、元素自定义 | 支持新增模块、字段、枚举选项、字段排序、字段重命名、字段删除保留历史值 | `addField`、`renderModules`、`renameFeatureField`、`deleteFeatureField` | `node scripts/verify-data-package.mjs`、`node scripts/verify-workbench.mjs` 检查函数、历史保留和文档覆盖 | 新增枚举字段，在产品详情录入并进入对比矩阵 |
| 导出 Excel | 支持产品库、对比表、路线图 `.xls` 导出，包含产品图、价格、卖点、来源证据和自定义字段 | `exportExcel`、`exportCompare`、`exportRoadmap` | `node scripts/verify-exports.mjs`、`node scripts/verify-mvp.mjs` 检查导出入口、关键列和函数 | 打开导出的 `.xls`，确认列和图片链接可读 |
| 各品牌路线图带产品图、价格、Top3 优先级卖点 | 路线图按品类/品牌多选/状态/半年度周期筛选，支持 Excel、SVG、各品牌分页 PDF | `renderRoadmap`、`roadmapSvgDocument`、`brandRoadmapReportHtml` | `node scripts/verify-exports.mjs`、`node scripts/verify-runtime.mjs`、`node scripts/verify-workbench.mjs` | 导出各品牌 PDF，确认每品牌分页、卡片不溢出 |
| 电商、官网详情页抓取分析 | 支持 URL 预抓取标题、描述、图片候选、价格候选、文案片段；最多 4 张可访问详情页图片候选会进入视觉输入；不绕过登录、付费墙、验证码和反爬 | `/api/fetch-metadata`、`fetchMetadata`、`fetchSourceMetadata`、`analysisSourceImageUrls` | `node scripts/verify-metadata.mjs`、`node scripts/verify-runtime.mjs` | 用批准 URL 预抓取，确认来源证据可读 |
| 图片格式详情页识别 | 支持多图上传、URL 图片候选、长图切片、单 PDF 上传；DeepSeek 只做文本抽取，图片/长图/URL 图片候选走 Qwen-VL，原始 PDF 未转图片时进入人工复核兜底 | `filesToAnalysisAttachments`、`sliceLongImageAttachment`、`analysisSourceImageUrls`、`callModelJson`、`callQwenVisionJson` | `node scripts/verify-mvp.mjs` 和 `node scripts/verify-runtime.mjs` 检查上传入口、PDF、URL 图片候选、Qwen 路由和复核兜底能力 | 上传长图确认 Qwen-VL 识别；上传原始 PDF 确认进入待复核 |
| 自然语言理解功能参数 | 当前功能字段随请求发送给模型，返回 `customFeatures`、证据、置信度；低置信字段进入复核 | `analysisFeatureFields`、`mergeCustomFeatures`、`fieldReviewIssues` | `node scripts/verify-runtime.mjs` 检查 AI 失败兜底保留 customFeatures | 用真实详情页校准字段证据和人工确认 |
| 产品型号对比 | 从已添加产品中选择至少 2 个型号且不限制上限，输出参数矩阵、差异高亮和导出表 | `selectedCompareProducts`、`compareFields`、`renderCompare`、`exportCompare` | `node scripts/verify-workbench.mjs` | 选择多个型号，确认矩阵和差异高亮 |
| 500 字以内多维总结 | 总结覆盖产品功能、关键参数、价格梯度、Top3 卖点和使用感受，不超过 500 个中文字符 | `compareProducts`、`localSummary`、`normalizeComparisonSummary` | `node scripts/verify-summary.mjs`、`node scripts/verify-evals.mjs`、`node scripts/verify-runtime.mjs` | 生成总结，确认可读且不超过 500 字 |
| 更完善的补充功能 | 已补充数据质量检查、审计日志、价格快照、AI 用量/成本、完整数据包导入导出和发布验收总入口 | `renderQualityPanel`、`renderAuditLog`、`renderUsage`、`dataPackagePayload`、`scripts/verify-release.mjs` | `node scripts/verify-release.mjs`、`node scripts/verify-data-package.mjs`、`node scripts/verify-mvp.mjs` | 导出质量问题、审计、用量和完整数据包；发布前运行总验收 |

## 验证命令

```bash
node scripts/verify-mvp.mjs
node scripts/verify-release.mjs
node scripts/verify-runtime.mjs
node scripts/verify-workbench.mjs
node scripts/verify-exports.mjs
node scripts/verify-summary.mjs
node scripts/verify-data-package.mjs
node scripts/generate-smoke-checklist.mjs
```

## 边界说明

- 当前 MVP 不做全网自动爬取，只处理用户提供 URL、图片、长图和 PDF。
- URL 预抓取遵守可访问边界，不绕过登录、付费墙、验证码或反爬限制。
- 产品图优先来自详情页或用户上传，不生成虚构产品图。
- 正式多人协作阶段建议迁移到 Next.js、PostgreSQL、Prisma、Redis/BullMQ 和组织级权限系统，详细阶段见 `docs/formalization-roadmap.md`。
