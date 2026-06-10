# 部署与运维交接

这份说明面向内部 MVP 部署。当前实现是无依赖静态前端 + Node.js 内置 HTTP 服务，适合单机内部使用；正式多人协作时建议迁移到计划中的 Next.js、PostgreSQL、Prisma 和任务队列架构。

## 环境要求

- Node.js 18+，需要原生 `fetch`。
- 工作目录需要可写入 `data/`，用于保存工作台状态和 API 用量日志。
- 不需要 `npm install`，当前项目没有第三方包依赖。

## 环境变量

复制 `.env.example` 为 `.env.local` 后填写真实值：

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.4-mini
AI_PROVIDER=openai
COMPARE_AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_BASE_URL=https://api.deepseek.com
# OPENAI_INPUT_USD_PER_1M=...
# OPENAI_OUTPUT_USD_PER_1M=...
# OPENAI_TOTAL_USD_PER_1M=...
APP_ACCESS_TOKEN=change-me
# APP_READ_TOKEN=read-only-token
# APP_WRITE_TOKEN=write-token
PORT=4173
```

- `OPENAI_API_KEY`：用于详情页图片/PDF 理解和结构化抽取。
- `OPENAI_MODEL`：默认 `gpt-5.4-mini`，可按项目可用模型调整。
- `AI_PROVIDER`：默认 provider 标记，当前图片/PDF 抽取仍固定走 OpenAI。
- `COMPARE_AI_PROVIDER`：文本型型号对比总结 provider；配置为 `deepseek` 且 `DEEPSEEK_API_KEY` 有效时优先使用 DeepSeek。
- `DEEPSEEK_API_KEY` / `DEEPSEEK_MODEL` / `DEEPSEEK_BASE_URL`：DeepSeek 文本任务配置，默认模型 `deepseek-v4-flash`，默认地址 `https://api.deepseek.com`。
- `OPENAI_INPUT_USD_PER_1M` / `OPENAI_OUTPUT_USD_PER_1M`：可选成本单价，单位为每 100 万输入/输出 token 的美元价格；也可用 `OPENAI_TOTAL_USD_PER_1M` 按总 token 粗算。
- `APP_ACCESS_TOKEN`：兼容内部访问令牌。设置后除 `/api/health` 外的 API 都需要 `X-App-Token`，并同时拥有读写权限。
- `APP_READ_TOKEN` / `APP_WRITE_TOKEN`：可选读写分离令牌。读令牌可查看产品库、用量和预抓取 metadata；写令牌可保存状态、运行 AI 分析和生成对比总结。
- `PORT`：服务端口，默认 `4173`。

不要提交 `.env.local`。`.gitignore` 已忽略 `.env*`。

## 启动

```bash
node server.mjs
```

打开：

```text
http://localhost:4173
```

健康检查：

```text
http://localhost:4173/api/health
```

## 验收检查

每次发布前优先运行：

```bash
node scripts/verify-release.mjs
```

该命令会依次执行本地环境预检、完整 MVP 自动验收，并生成 `reports/` 下的 Markdown 测试报告。需要拆分定位问题时，再运行：

```bash
node --check script.js
node --check server.mjs
node --check scripts/verify-workbench.mjs
node --check scripts/verify-access.mjs
node --check scripts/verify-costs.mjs
node --check scripts/verify-metadata.mjs
node --check scripts/verify-evals.mjs
node --check scripts/verify-exports.mjs
node --check scripts/verify-summary.mjs
node --check scripts/verify-data-package.mjs
node --check scripts/verify-formal-use.mjs
node --check scripts/verify-formal-use-browser.mjs
node --check scripts/generate-model-eval-report.mjs
node --check scripts/generate-smoke-checklist.mjs
node --check scripts/generate-formal-use-pack.mjs
node --check scripts/verify-mvp.mjs
node --check scripts/verify-runtime.mjs
node --check scripts/verify-traceability.mjs
node --check scripts/generate-test-report.mjs
node --check scripts/check-local-env.mjs
node --check scripts/verify-hygiene.mjs
node --check scripts/verify-release.mjs
node scripts/verify-workbench.mjs
node scripts/verify-access.mjs
node scripts/verify-costs.mjs
node scripts/verify-metadata.mjs
node scripts/verify-evals.mjs
node scripts/verify-exports.mjs
node scripts/verify-summary.mjs
node scripts/verify-data-package.mjs
node scripts/verify-formal-use.mjs
node scripts/generate-model-eval-report.mjs
node scripts/generate-smoke-checklist.mjs
node scripts/generate-formal-use-pack.mjs
node scripts/verify-mvp.mjs
node scripts/verify-runtime.mjs
node scripts/verify-traceability.mjs
node scripts/generate-test-report.mjs
node scripts/check-local-env.mjs
node scripts/verify-hygiene.mjs
```

当前环境不能访问 localhost 时，至少保留以上静态验收；可访问浏览器时再运行 `node scripts/generate-smoke-checklist.mjs`，按 `reports/manual-smoke-checklist-*.md` 补充导入、筛选、对比、导出、路线图和用量面板的人工冒烟测试。
启动服务后，可运行 `SMOKE_BASE_URL=http://127.0.0.1:4173 node scripts/verify-formal-use-browser.mjs` 做正式功能浏览器冒烟，结果写入 `reports/formal-use-browser-smoke-*.json`；该脚本会备份并恢复 `data/workbench-state.json` 与 `data/api-usage.json`，并确认网页内不增加单独试用模块。
正式功能使用前运行 `node scripts/verify-formal-use.mjs` 和 `node scripts/generate-formal-use-pack.mjs`，并按 `docs/formal-use-runbook.md` 与 `docs/formal-use-launch-checklist.md` 组织参与角色、使用任务、反馈记录和 Go/No-Go 结论；生成的 `reports/formal-use-pack-*.md` 用于归档使用证据，网页内不增加单独试用模块。
启动前可先运行 `node scripts/check-local-env.mjs`，确认配置模板、数据目录、端口状态，以及已监听端口是否真的返回工作台健康接口和首页。
提交前运行 `node scripts/verify-hygiene.mjs`，确认真实配置、本地数据和生成报告仍被 `.gitignore` 排除。

## 数据与备份

服务端本地数据：

- `data/workbench-state.json`：产品库、自定义模块、筛选配置和保存视图。
- `data/api-usage.json`：OpenAI/DeepSeek 调用摘要、provider、usage、模型、状态、估算成本和错误摘要。

建议每天或每次批量导入前备份 `data/`。页面内也可使用“导出数据包”导出完整 JSON，用于迁移或人工归档。导入数据包会在替换当前工作台前自动下载一份 `backup-before-import` JSON，误导入时可用它恢复。

## 安全边界

- 当前访问控制是单个共享令牌，不是多用户账号体系。
- 详情页抓取不绕过登录、付费墙、验证码或反爬限制。
- PDF 原文不会写入兜底结果；产品记录只保存文件名、类型和大小。
- 服务端 JSON 请求体限制 70MB，PDF 文件限制 50MB。
- API 用量日志不记录 API key 和完整 prompt。

## 故障检查

- 页面显示 OpenAI 未配置：检查 `.env.local` 是否包含 `OPENAI_API_KEY`，重启 `node server.mjs`。
- 页面显示 DeepSeek 未配置：如果要让型号对比总结优先走 DeepSeek，检查 `.env.local` 是否包含 `DEEPSEEK_API_KEY`；不配置时不影响 OpenAI 图片/PDF 抽取。
- 页面显示成本单价未配置：检查 `.env.local` 是否包含 `OPENAI_INPUT_USD_PER_1M` 和 `OPENAI_OUTPUT_USD_PER_1M`，或 `OPENAI_TOTAL_USD_PER_1M`。
- API 返回 401：确认页面输入的访问令牌与 `APP_READ_TOKEN`、`APP_WRITE_TOKEN` 或 `APP_ACCESS_TOKEN` 一致。
- API 返回 403：当前令牌没有写权限，输入 `APP_WRITE_TOKEN` 或兼容的 `APP_ACCESS_TOKEN`。
- 端口已占用但页面 404：运行 `node scripts/check-local-env.mjs`，确认该端口的健康接口和首页是否都来自当前工作台；如果健康接口正常但首页异常，换 `PORT` 启动或停止旧服务。
- 上传 PDF 失败：确认文件小于 50MB，且是 PDF；大文件可先拆页或上传截图。
- URL 预抓取失败：可改用截图/PDF 上传；电商平台页面结构和访问限制可能导致 metadata 不稳定。
- URL 预抓取结果异常：检查导入面板里的图片候选、价格候选和文案证据片段；证据不足时补充上传详情页长图或 PDF。
- 分析结果低置信度：进入待确认队列，人工修订产品字段和 Top3 卖点。

## 正式化迁移路径

详细阶段拆分、数据模型、队列、权限、迁移和回滚策略见 `docs/formalization-roadmap.md`；API 与队列迁移矩阵见 `docs/api-migration-map.md`；字段级 Prisma 草案见 `docs/prisma-schema-draft.prisma`。
迁移前数量基线可运行 `node scripts/generate-migration-reconciliation.mjs` 生成到 `reports/`。

- 后端迁移到 Next.js Route Handlers。
- 数据迁移到 PostgreSQL + Prisma，拆分 Product、SourcePage、MediaAsset、PriceSnapshot、FeatureModule、FeatureField、ProductFeatureValue、SellingPoint、RoadmapItem、AnalysisRun。
- 引入 Redis/BullMQ 处理 URL 抓取、截图、图片切片、PDF 分析和批量导入。
- 将 `APP_ACCESS_TOKEN` 替换为组织账号、角色权限和审计日志。
- 增加真实样例集，用于评估型号、价格、Top3 卖点、参数抽取和 500 字以内对标总结质量。
- `evals/sample-cases.json` 已进入真实样例校准，覆盖扫地机、洗地机、吸尘器以及 URL、长图、PDF 来源；后续补充更多真实样例即可。
