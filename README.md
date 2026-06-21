# 清洁电器竞品分析工作台

这是一个无依赖 MVP，用于扫地机、洗地机、吸尘器竞品分析。当前环境没有 `npm`，所以项目使用静态前端和 Node.js 内置 HTTP 服务实现，保留后续迁移到 `Next.js + PostgreSQL + Prisma + Redis/BullMQ` 的边界。

## 功能

- 产品库：品牌、品类、价格、渠道、上市状态、产品图、来源、AI 置信度；AI 入库优先复用详情页主图或图片候选，不生成虚构产品图，并按品牌+型号识别重复产品，确认后更新已有记录并保留分析、审计和价格历史。
- 数据质量检查：集中识别重复型号、缺少价格、缺少来源、缺少真实产品图、低置信待复核、卖点不完整和字段待复核问题，并支持导出问题 CSV。
- 价格快照：产品详情记录最近价格历史，编辑、AI 入库和 CSV 导入会自动追加价格快照。
- 产品维护：支持手动新增、编辑产品基础信息、核心功能参数和 Top3 卖点。
- 筛选工作台：关键词搜索、品类、品牌、渠道、上市状态、自定义价格段、AI 置信度、自定义功能参数、产品库列排序和固定产品列；关键词覆盖品牌、型号、卖点、功能参数和来源证据；可命名保存/删除工作视图，工作视图会恢复筛选、列显隐、排序、对比型号、对比字段和路线图品牌。
- 自定义对比元素：支持新增模块和字段，字段类型包含文本、数字、布尔、枚举、价格、图片；枚举字段可配置和后续编辑选项，产品编辑时以下拉选择录入；模块和字段可排序，字段可重命名或从当前配置删除，删除不会清空历史产品值。
- 型号对比：从产品库选择至少 2 个型号且不限制上限，并勾选本次报告需要的对比字段，输出参数矩阵、差异高亮和 500 字以内的对标总结；总结输入会压缩为价格、Top3 卖点和已选功能差异，覆盖自定义功能差异，并从产品功能、关键参数、使用感受多方面归纳。
- AI 详情页分析：支持 URL、补充说明和页面 metadata 文案抽取，默认调用 DeepSeek 输出结构化产品资料；多张图片、长图自动切片和详情页图片候选默认走 Qwen-VL 视觉识别；PDF 若未转换为页面图片则进入人工复核兜底。
- 页面证据包：URL 预抓取会抽取图片候选、价格候选和详情文案片段，进入 AI 提示词并展示在导入面板，方便人工判断来源质量。
- AI 自定义字段抽取：分析请求会携带当前功能模块字段，模型按字段 key 返回 customFeatures，入库后自动写入对比矩阵并保留证据。
- AI 样例闭环：详情页分析会携带最多 3 个已确认高置信产品作为压缩示例，帮助模型沿用人工修订后的字段口径和卖点表达。
- AI 解析与待确认：AI 详情页解析和待确认队列合并在同一个一级模块内，低置信度、待复核产品或低置信自定义字段可集中查看、单个确认、字段级确认和批量确认，并写入审计记录。
- 分析追踪：详情面板显示页面证据包、最近分析运行、模型/状态/置信度，以及人工编辑、确认、导入等审计时间线。
- 审计日志：集中展示并导出人工编辑、确认、导入、AI 入库等操作，便于内部复盘和交接。
- 系统状态：工作台可查看本地服务、各模型配置、当前模型和读写访问令牌启用状态。
- AI 用量日志：OpenAI/DeepSeek/Qwen-VL 调用会写入本地 `data/api-usage.json`，工作台可查看并导出最近调用的 provider、模型、状态、输入类型、token usage 和错误摘要。
- 品牌路线图：支持单品牌时间和品牌对比两种模式，按品类、品牌多选、上市状态和半年度周期筛选查看；未确认产品不进入路标，页面卡片仅展示产品名称、价格和 Top3 优先级卖点，价格轴按 500/1000 元档位错层。
- 路线图图片导出：当前路线图筛选结果可导出为 SVG 图片，保留产品图、价格、上市状态、来源和 Top3 优先级卖点，便于正式报告交接。
- 对比表导出：当前选择的型号可导出为 Excel 对比表，包含产品图、价格、Top3 优先级卖点、500 字以内总结和已选功能参数矩阵。
- Excel 导出：产品库和路线图导出为 Excel 可打开的 `.xls` 文件，产品库导出包含最近价格快照、最近分析、最近操作、来源证据包和所有自定义功能字段列。
- 数据包交接：支持导出/导入完整 JSON 数据包，包含产品库、自定义模块、分析记录、审计记录和保存的工作视图；导入替换前会自动下载当前工作台备份。
- 批量导入：支持下载当前自定义字段匹配的 CSV 模板，并批量导入产品，按品牌 + 型号更新已有产品或新增产品。
- 各品牌 PDF：各品牌 PDF 会把每个品牌独立分页，保留当前品类、状态和半年度周期筛选。
- 本地持久化：前端状态会同步到 `data/workbench-state.json`，该文件默认不提交到 Git。

## 运行

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

部署和运维交接见 [docs/deployment.md](docs/deployment.md)，正式功能使用运行手册见 [docs/formal-use-runbook.md](docs/formal-use-runbook.md)，正式功能使用启动清单见 [docs/formal-use-launch-checklist.md](docs/formal-use-launch-checklist.md)。

## 验证

发布验收总入口会依次运行本地环境预检、完整 MVP 自动验收并生成测试报告：

```bash
node scripts/verify-release.mjs
```

不依赖浏览器或第三方包的静态验收检查：

```bash
node scripts/verify-mvp.mjs
```

单项检查：

```bash
node scripts/verify-workbench.mjs
```

建议每次改动后同时运行：

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
node --check scripts/generate-eval-calibration-pack.mjs
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
node scripts/generate-eval-calibration-pack.mjs
node scripts/generate-smoke-checklist.mjs
node scripts/generate-formal-use-pack.mjs
node scripts/verify-mvp.mjs
node scripts/verify-runtime.mjs
node scripts/verify-traceability.mjs
node scripts/generate-test-report.mjs
node scripts/check-local-env.mjs
node scripts/verify-hygiene.mjs
```

完整 MVP 验收清单见 [docs/mvp-acceptance.md](docs/mvp-acceptance.md)。
需求逐条映射见 [docs/requirements-traceability.md](docs/requirements-traceability.md)。
测试报告可通过 `node scripts/generate-test-report.mjs` 生成到 `reports/`。
导出结构专项验收可运行 `node scripts/verify-exports.mjs`，检查产品库 Excel、型号对比 Excel、路线图 Excel、路线图 SVG 和各品牌分页 PDF 的关键结构。
500 字总结专项验收可运行 `node scripts/verify-summary.mjs`，检查字符上限、产品功能、关键参数、使用感受、价格梯度和 Top3 卖点口径。
数据包交接专项验收可运行 `node scripts/verify-data-package.mjs`，检查完整 JSON、保存视图、导入前备份和自定义字段历史值保留。
人工浏览器冒烟清单可运行 `node scripts/generate-smoke-checklist.mjs` 生成到 `reports/`，用于记录筛选、自定义字段、AI 导入、对比、路线图、数据包、审计和用量的手工验收结果。
启动本地服务后可运行 `SMOKE_BASE_URL=http://127.0.0.1:4173 node scripts/verify-formal-use-browser.mjs` 执行正式功能浏览器冒烟；报告会写入 `reports/formal-use-browser-smoke-*.json`，覆盖筛选、自定义字段、AI 失败兜底、500 字以内总结、路线图导出、数据包导入导出、审计/用量、375/768/1440 响应式视口，以及网页内不出现试用模块。
正式功能使用包可运行 `node scripts/generate-formal-use-pack.mjs` 生成到 `reports/`，用于组织使用任务、反馈模板、Go/No-Go 标准和使用证据；`node scripts/verify-formal-use.mjs` 会检查正式功能使用手册、发布门、反馈模板、环境安全和部署交接是否完整。
多模型真实样例评估准备报告可运行 `node scripts/generate-model-eval-report.mjs` 生成到 `reports/`，用于对齐 DeepSeek 文本抽取、Qwen-VL 视觉识别、DeepSeek 总结和本地兜底的校准口径。
本地环境预检可运行 `node scripts/check-local-env.mjs`，检查 Node 版本、配置模板、数据目录、端口占用，以及已监听端口是否真的返回工作台健康接口和首页。
AI 链路预检可运行 `node scripts/check-ai-connectivity.mjs --base-url http://127.0.0.1:4173`，检查 OpenAI/DeepSeek/Qwen-VL 网关和本地工作台健康接口是否可达；报告会写入 `reports/ai-connectivity-check-YYYY-MM-DD.json`，不会输出 API Key。
提交前卫生检查可运行 `node scripts/verify-hygiene.mjs`，确认真实配置、本地数据、生成报告不会被误提交，并扫描明显密钥。

`scripts/verify-runtime.mjs` 会通过内存请求注入验证本地 HTTP app，不绑定固定端口；它覆盖首页、静态资源、只读 API、AI 详情页失败兜底和对比总结失败兜底。

## 配置

复制 `.env.example` 为 `.env.local` 后填写真实值：

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.4-mini
OPENAI_BASE_URL=https://api.openai.com/v1
AI_REQUEST_TIMEOUT_MS=60000
# HTTPS_PROXY=http://127.0.0.1:9090
AI_PROVIDER=deepseek
COMPARE_AI_PROVIDER=deepseek
VISION_PROVIDER=qwen
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_BASE_URL=https://api.deepseek.com
QWEN_API_KEY=...
QWEN_MODEL=qwen-vl-max
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_REQUEST_TIMEOUT_MS=60000
# 可选：URL 详情页自动图片过滤阈值
AUTO_SOURCE_IMAGE_COUNT=4
AUTO_SOURCE_IMAGE_MIN_WIDTH=640
AUTO_SOURCE_IMAGE_MIN_SHORT_EDGE=320
AUTO_SOURCE_IMAGE_MIN_PIXELS=250000
# OPENAI_INPUT_USD_PER_1M=...
# OPENAI_OUTPUT_USD_PER_1M=...
# OPENAI_TOTAL_USD_PER_1M=...
APP_ACCESS_TOKEN=change-me
# APP_READ_TOKEN=read-only-token
# APP_WRITE_TOKEN=write-token
```

`OPENAI_MODEL` 可按项目可用模型调整。没有 API key 或请求失败时，系统会返回“待人工确认”的兜底结果，不阻塞产品库流程。如果当前网络无法访问 `api.openai.com`，但浏览器可以访问 ChatGPT，通常是终端/Node 没有走本机代理：保持 `OPENAI_BASE_URL=https://api.openai.com/v1`，在 `.env.local` 增加 `HTTPS_PROXY=http://127.0.0.1:9090`。只有使用 OpenAI 兼容网关服务时，才把 `OPENAI_BASE_URL` 改成网关地址并保留 `/v1` 结尾；`AI_REQUEST_TIMEOUT_MS` 用于控制 AI 请求超时时间。

如果 URL 抓取能打开页面但 AI 仍提示“没有可用于视觉识别的详情页图片”，通常是页面只暴露了 logo、图标、小缩略图或需要登录后的大图。第一选择是上传详情页截图/长图；如果确认详情页里有足够清晰的大图，也可以在 `.env.local` 里调低 `AUTO_SOURCE_IMAGE_MIN_WIDTH`、`AUTO_SOURCE_IMAGE_MIN_SHORT_EDGE` 或 `AUTO_SOURCE_IMAGE_MIN_PIXELS`。

多模型第一阶段改为 DeepSeek + Qwen-VL：

- `analysis_with_vision_file`：URL 文案、metadata、用户补充和结构化 JSON 抽取默认使用 DeepSeek；上传图片、长图切片和 URL 图片候选默认使用 Qwen-VL。
- `compare_summary_text`：`COMPARE_AI_PROVIDER=deepseek` 且 `DEEPSEEK_API_KEY` 已配置时，使用 DeepSeek；未配置或请求失败时回到本地兜底。
- `AI_PROVIDER` 是文本 provider 标记，`VISION_PROVIDER=qwen` 是视觉 provider 标记。DeepSeek 不直接解析图片/PDF；只有原始 PDF 且没有页面图片时会进入人工复核兜底。

AI 接入方式是“后端 API 转发”，不要在网页里直接调用模型：

- 前端页面只请求本项目的 `/api/analyze` 和 `/api/compare`。
- `server.mjs` 从 `.env.local` 读取 `DEEPSEEK_API_KEY` / `QWEN_API_KEY` / 可选 `OPENAI_API_KEY`，再调用对应模型 API。
- DeepSeek 当前用于文本型结构化抽取和型号对比总结；Qwen-VL 用于图片、长图和详情页图片候选识别；原始 PDF 未转换为图片时进入人工复核兜底。
- 配好 DeepSeek 和 Qwen-VL 后，先运行 `node scripts/check-ai-connectivity.mjs --base-url http://127.0.0.1:4173`，再跑 `node scripts/verify-release.mjs`。

`OPENAI_INPUT_USD_PER_1M` 和 `OPENAI_OUTPUT_USD_PER_1M` 用于 AI 用量面板估算成本，单位是每 100 万输入/输出 token 的美元价格；如果只想按总 token 粗算，也可以改用 `OPENAI_TOTAL_USD_PER_1M`。不配置时仍会记录 token usage，但成本显示为未配置。

`APP_ACCESS_TOKEN` 是可选的兼容内部访问令牌。不设置时适合本机开发；设置后除 `/api/health` 外的 API 都需要页面输入同一个令牌，请求会通过 `X-App-Token` 发送。需要只读查看和写入分离时，改用 `APP_READ_TOKEN` 和 `APP_WRITE_TOKEN`：读令牌可查看产品库、用量和预抓取 metadata，写令牌可保存状态、运行 AI 分析和生成对比总结。

详情页上传支持多张图片和单个 PDF。上传图片会交给 Qwen-VL 视觉识别，长图会在前端自动压缩为 JPG 切片，最多发送 32 张图片；URL 预抓取会额外生成图片候选、价格候选和文案证据片段，并把最多 4 张可访问的详情页图片候选交给 Qwen-VL 理解。单个上传文件限制 100MB；如果只有原始 PDF 而没有页面图片，当前会进入人工复核兜底，后续可再补 PDF 转图片流程。服务端 JSON 请求体限制为 140MB，用于覆盖 base64 膨胀并拦截异常大请求。兜底结果不会保存 PDF 原文，只记录文件名、类型和大小用于追溯。

## 数据存储

当前 MVP 使用两层存储：

- 浏览器 `LocalStorage`：用于离线兜底和快速恢复。
- 服务端 `data/workbench-state.json`：用于本机持久化产品库、筛选配置、自定义模块和保存视图。
- 服务端 `data/api-usage.json`：用于记录 AI provider、模型、状态、usage、估算成本和 response id，不记录 API key。

删除 `data/workbench-state.json` 可回到内置样例数据。

## CSV 批量导入

页面顶部可点击“下载 CSV 模板”，模板会自动包含当前所有自定义功能字段的 `feature:<字段key>` 列。布尔字段示例会填“支持”，枚举字段示例会填第一个已配置选项。

CSV 支持中文或英文表头。最小模板：

```csv
品牌,产品名,型号,品类,价格,渠道,上市状态,季度,来源,置信度,卖点1,卖点2,卖点3,feature:hotWash,feature:base
示例品牌,旗舰清洁机器人 X1,X1,扫地机,3999,官网,待确认,2026 Q4,https://example.com,72,热水洗拖布 | 详情页说明,全能基站 | 页面参数,高吸力 | 商品标题,支持,热水洗拖布/烘干/集尘
```

英文表头同样可用：`brand,name,model,category,price,channel,status,quarter,sourceUrl,confidence,sellingPoint1,sellingPoint2,sellingPoint3`。

自定义功能字段使用 `feature:<字段key>`，例如 `feature:hotWash`、`feature:base`。

CSV 导入会校验品牌、型号、品类和价格。缺少品牌/型号、品类无法识别或价格为负数的行会被跳过，导入完成后会提示新增、更新和跳过行数量及前几条原因。

## 后续正式化路径

详细迁移计划见 [docs/formalization-roadmap.md](docs/formalization-roadmap.md)，API 与队列迁移矩阵见 [docs/api-migration-map.md](docs/api-migration-map.md)，Prisma 数据模型草案见 [docs/prisma-schema-draft.prisma](docs/prisma-schema-draft.prisma)。
迁移前数量基线可运行 `node scripts/generate-migration-reconciliation.mjs` 生成到 `reports/`。

- 将 LocalStorage 产品库迁移到 PostgreSQL，按 README 中的实体拆表。
- 将 `server.mjs` 的 `/api/analyze` 和 `/api/compare` 迁移为 Next.js Route Handlers。
- 引入 Playwright 队列抓取详情页截图，并接入 Redis/BullMQ 做异步任务。
- 用 Prisma 管理 `Brand`、`Category`、`Product`、`SourcePage`、`MediaAsset`、`PriceSnapshot`、`FeatureModule`、`FeatureField`、`ProductFeatureValue`、`SellingPoint`、`RoadmapItem`、`AnalysisRun`。
- 增加内部账号权限、人工确认队列、分析日志、成本统计和真实样例评估集。

## 样例校准

`evals/sample-cases.json` 用于沉淀真实详情页样例和验收标准。当前包含 11 个真实竞品校准样例，覆盖扫地机、洗地机、吸尘器，以及 URL、长图和 PDF 来源；验收脚本会阻止回退到 `example.com` 或 placeholder 来源。

```bash
node scripts/verify-evals.mjs
```

生成多模型真实样例评估准备报告后，可按报告里的 Case ID 逐条记录 DeepSeek 文本抽取、Qwen-VL 视觉识别、DeepSeek 总结、本地兜底、人工修订和 Go/No-Go 结论：

```bash
node scripts/generate-model-eval-report.mjs
```

生成真实样例校准任务包和 CSV 记录模板：

```bash
node scripts/generate-eval-calibration-pack.mjs
```

启动本地服务后，可批量跑真实样例校准并写回当天 CSV：

```bash
node scripts/check-ai-connectivity.mjs --base-url http://127.0.0.1:4173
node scripts/run-eval-calibration.mjs --base-url http://127.0.0.1:4173 --date 2026-06-11
```

如果运行环境不能让 Node 直接访问本机端口，可先生成请求文件，再用 `curl` 调用本地接口，最后汇总：

```bash
node scripts/run-eval-calibration.mjs --prepare-dir .tmp/eval-calibration-2026-06-11 --base-url http://127.0.0.1:4173 --date 2026-06-11
node scripts/run-eval-calibration.mjs --prepare-compare-dir .tmp/eval-calibration-2026-06-11 --base-url http://127.0.0.1:4173 --date 2026-06-11
node scripts/run-eval-calibration.mjs --finalize-dir .tmp/eval-calibration-2026-06-11 --base-url http://127.0.0.1:4173 --date 2026-06-11
```

`.tmp/` 只用于本地校准请求/响应中转，已加入 `.gitignore`，不要提交。
