# 项目总控与技术债治理

这份文档用于统一判断项目当前阶段、下一步优先级和技术债处理方式。后续改动先看这里，再决定是继续稳态修补，还是进入正式化迁移。

## 当前结论

当前项目处在“内部正式使用准备”阶段，不适合马上整体重写。

最优策略是：

1. 先稳定当前无依赖 MVP，保证真实资料导入、人工复核、型号对比、路线图、导出、审计和用量记录能跑通。
2. 再用小步方式治理技术债，优先解决会影响交付、验证和迁移的问题。
3. 最后再按 `docs/formalization-roadmap.md` 进入 Next.js、PostgreSQL、Prisma、Redis/BullMQ 和账号权限迁移。

## 当前技术栈

| 层级 | 当前实现 | 适合场景 | 主要限制 |
| --- | --- | --- | --- |
| 前端 | `index.html` + `styles.css` + 原生 `script.js` | 快速验证、本地内部使用 | `script.js` 体量大，模块边界不清 |
| 后端 | `server.mjs` + Node.js 内置 HTTP 服务 | 无需安装依赖的本地服务 | API、AI 转发、数据读写、权限集中在一个文件 |
| 数据 | 浏览器 LocalStorage + `data/workbench-state.json` | 单机、小团队、可导出备份 | 不适合多人同时编辑和长期数据治理 |
| AI | DeepSeek 文本、Qwen-VL 视觉、OpenAI 可选备用 | 低成本试运行和人工复核闭环 | 长任务、错误追踪和评估需要更正式的任务系统 |
| 验证 | `scripts/verify-*.mjs` | 发布前自动验收和交接证据 | 真实浏览器和真实样例仍需要人工/半自动补充 |

## 当前里程碑

### 已完成

- 无依赖 MVP：产品库、筛选、自定义字段、AI 解析、待确认、型号对比、品牌路线图、导出、审计、用量记录。
- 本地服务：静态页面、状态保存、AI API 转发、访问令牌、用量日志。
- 验证体系：发布验收、运行时检查、导出检查、总结检查、数据包检查、正式使用检查、卫生检查。
- 正式使用文档：部署交接、正式功能使用手册、启动清单、需求追踪矩阵。
- 正式化规划：Next.js 外壳、PostgreSQL/Prisma、Route Handlers、Redis/BullMQ、Playwright、真实样例评估。

### 当前阶段

- 阶段名称：内部正式使用准备。
- 阶段目标：让真实竞品资料完成一次端到端分析，并生成可归档的验收证据。
- 当前不做：公开 SaaS、多租户、账号注册、全网自动爬取、一次性架构重写。

### 下一阶段进入条件

只有满足下面条件，才进入正式化迁移：

- `node scripts/verify-release.mjs` 通过。
- 至少一轮真实浏览器冒烟通过。
- 已导出正式使用前数据包作为回滚基线。
- 真实样例覆盖 URL、长图、PDF、CSV 和手工录入。
- Go/No-Go 结论明确，没有数据丢失、导出阻塞、密钥泄露或 AI 失败无法兜底的问题。

## 技术债清单

| 优先级 | 技术债 | 不处理的影响 | 建议处理方式 | 当前时机 |
| --- | --- | --- | --- | --- |
| P0 | 项目阶段和路线缺少总控入口 | 后续容易直接跳到大重构，或继续无边界加功能 | 用本文档统一阶段、边界和优先级 | 现在处理 |
| P0 | 发布验收和人工验收需要固定为默认动作 | 改完后无法判断是否真的可交付 | 每次业务改动后跑发布验收，正式使用前跑浏览器冒烟 | 现在处理 |
| P1 | `script.js` 承载过多前端逻辑 | 小改动可能影响筛选、对比、路线图、导出等多个区域 | 先标模块边界；迁移时拆为页面、组件、状态和导出模块 | 近期规划，迁移时落地 |
| P1 | `server.mjs` 同时负责服务、权限、AI、数据和日志 | AI 或权限报错定位成本高 | 先按职责记录边界；迁移时拆为 Route Handlers 和 service 层 | 近期规划，迁移时落地 |
| P1 | 本地 JSON 不适合多人长期使用 | 多人编辑、历史追溯、恢复和审计会变脆弱 | 正式化阶段迁移到 PostgreSQL + Prisma | 迁移阶段 |
| P1 | 共享令牌不是正式权限体系 | 无法做到用户、角色、操作责任归属 | 正式化阶段改为账号和角色权限 | 迁移阶段 |
| P2 | AI 分析和导出仍是同步/半同步流程 | 长图、PDF、URL 抓取和导出失败时不够可追踪 | 正式化阶段引入 Redis/BullMQ 任务队列 | 迁移阶段 |
| P2 | 真实样例评估仍需持续扩充 | AI 结果好坏缺少稳定质量指标 | 扩充 `evals/sample-cases.json`，沉淀人工修订结论 | 正式使用期间持续做 |

### 技术债登记表

这张表用于把第二层技术债落到可执行项。后续新增或修复功能时，先判断是否命中这些项；如果命中，需要同步说明影响模块和验证命令。

| 编号 | 技术债 | 优先级 | 影响模块 | 触发条件 | 当前处理方式 | 对应验证 |
| --- | --- | --- | --- | --- | --- | --- |
| TD-01 | 前端大文件 `script.js` | P1 | 产品库、筛选、AI 解析、待确认、对比、路线图、导出、系统日志 | 单次改动跨 3 个以上前端边界，或继续新增大型 UI 流程 | 当前只标边界，不拆文件；迁移时拆页面、组件、状态和导出工具 | `node --check script.js`、相关专项脚本、浏览器冒烟 |
| TD-02 | 后端大文件 `server.mjs` | P1 | 静态服务、权限、状态读写、metadata、浏览器抓取、AI provider、用量 | 新增 API、AI provider、抓取流程或长耗时任务 | 当前只标边界，不拆文件；迁移时拆 Route Handlers 和 service 层 | `node --check server.mjs`、`node scripts/verify-runtime.mjs` |
| TD-03 | 本地 JSON 状态 | P1 | 产品库、保存视图、自定义字段、审计、用量 | 出现多人编辑、长期数据沉淀、数据恢复要求提高 | 当前保留 JSON + 数据包备份；正式化迁移到 PostgreSQL + Prisma | `node scripts/verify-data-package.mjs`、`node scripts/generate-migration-reconciliation.mjs` |
| TD-04 | 共享访问令牌 | P1 | 读写权限、审计、正式使用交接 | 需要区分用户、角色、操作责任或外部协作 | 当前保留 `APP_READ_TOKEN` / `APP_WRITE_TOKEN`；正式化迁移到账号角色权限 | `node scripts/verify-access.mjs`、`node scripts/check-local-env.mjs` |
| TD-05 | AI 和抓取任务同步化 | P2 | AI 解析、URL metadata、浏览器抓取、长图/PDF、用量日志 | 任务耗时长、失败重试、取消、排队或状态追踪成为刚需 | 当前保留兜底和人工复核；正式化迁移到 Redis/BullMQ | `node scripts/verify-runtime.mjs`、`node scripts/check-ai-connectivity.mjs` |
| TD-06 | 导出任务前端化 | P2 | 产品库导出、对比表、路线图 SVG/PDF、数据包 | 导出变慢、数据量变大、需要后台生成或重试 | 当前保留前端导出；正式化迁移到 `export-build` job | `node scripts/verify-exports.mjs`、浏览器冒烟 |
| TD-07 | 测试偏静态，真实数据仍需人工校准 | P2 | AI 解析、对比总结、真实样例质量 | 新增真实样例、模型切换、字段口径变化 | 扩充 eval 样例和正式使用记录，不用静态检查替代人工校准 | `node scripts/verify-evals.mjs`、`node scripts/run-eval-calibration.mjs` |

### 新功能归属模板

后续新增功能或较大修复前，先用下面模板写清楚归属。这个模板不是形式要求，目的是避免把功能继续塞进大文件深处后无法验证。

```text
需求名称：
当前阶段：MVP 稳定修补 / 内部正式使用准备 / 正式化迁移
归属模块：从 `script.js` 模块边界或 `server.mjs` 模块边界中选择
涉及文件：
是否跨 3 个以上边界：是 / 否
是否改变数据结构：是 / 否
是否影响权限：是 / 否
是否影响 AI、抓取或导出长任务：是 / 否
最小改动方案：
主要风险：
验证命令：
失败时需要用户提供的报错：
```

判断规则：

- 如果只影响 1 个边界，通常可以小改。
- 如果影响 2 个边界，要补对应专项验证。
- 如果影响 3 个以上边界，先写方案，不直接改代码。
- 如果改变数据结构、权限或长任务流程，默认进入正式化迁移评估。

### 高风险流程验证矩阵

这些流程一旦坏了，会直接影响正式使用和数据安全。相关改动必须优先跑对应验证。

| 高风险流程 | 风险说明 | 最低验证命令 | 加强验证 | 成功标准 |
| --- | --- | --- | --- | --- |
| 数据包导入导出 | 影响备份、恢复、迁移和误导入回滚 | `node scripts/verify-data-package.mjs` | 浏览器里导出完整 JSON，再导入同一数据包 | 产品、自定义字段、保存视图、审计和历史值仍在 |
| AI 失败兜底 | 影响真实资料导入，模型失败时不能阻塞主流程 | `node scripts/verify-runtime.mjs` | 上传长图/PDF 或断开 provider 后做浏览器冒烟 | 失败时进入待人工确认，不保存虚假结论 |
| 真实样例评估 | 影响 AI 抽取质量和总结可信度 | `node scripts/verify-evals.mjs` | `node scripts/run-eval-calibration.mjs --base-url http://127.0.0.1:4173 --date YYYY-MM-DD` | 样例覆盖品类和来源，校准结果可归档 |
| 权限与访问令牌 | 影响内部查看、写入和审计边界 | `node scripts/verify-access.mjs` | 使用读令牌和写令牌分别尝试查看/写入 | 读令牌不能写，写令牌可执行写操作 |
| 导出文件 | 影响产品库、对比表、路线图和交接报告 | `node scripts/verify-exports.mjs` | 浏览器手动打开导出的 Excel/SVG/PDF | 文件可打开，关键字段、图片、价格和 Top3 卖点存在 |
| 本地运行环境 | 影响服务启动、端口、配置和数据目录 | `node scripts/check-local-env.mjs` | 启动 `node server.mjs` 后访问 `/api/health` 和首页 | 端口正确、页面可访问、配置不泄露 |
| 发布总验收 | 影响是否可以交付或进入正式使用 | `node scripts/verify-release.mjs` | 补 `SMOKE_BASE_URL=http://127.0.0.1:4173 node scripts/verify-formal-use-browser.mjs` | 自动报告通过，浏览器冒烟无阻塞 |

## 优化顺序

### 第 1 步：管理型技术债

目标是让项目不跑偏。

- 维护本文档。
- README 放总控入口。
- AGENTS.md 要求先判断项目阶段。
- 每次改动说明属于 MVP 稳定、正式使用准备，还是正式化迁移。

### 第 2 步：验证型技术债

目标是让每次改动都能判断成败。

- 小改动至少跑语法检查和相关专项检查。
- 发布前跑 `node scripts/verify-release.mjs`。
- 正式使用前启动服务并跑 `SMOKE_BASE_URL=http://127.0.0.1:4173 node scripts/verify-formal-use-browser.mjs`。
- 无法跑浏览器或 AI 连通性时，要明确记录缺少什么条件。

### 第 3 步：结构型技术债

目标是为迁移做准备，但不在当前 MVP 里大拆。

- 前端边界：产品库、筛选、AI 解析、待确认、型号对比、品牌路线图、导出、审计用量。
- 后端边界：静态服务、权限、状态读写、metadata 抓取、AI provider、用量日志。
- 数据边界：产品、字段、卖点、价格快照、分析记录、审计、保存视图、用量。

#### `script.js` 模块边界

当前 `script.js` 是前端主入口，短期不拆文件，但后续新增功能要先判断归属模块，避免继续无边界膨胀。

| 边界 | 当前职责 | 典型函数/区域 | 后续迁移目标 |
| --- | --- | --- | --- |
| API 与访问令牌 | 读取访问令牌、统一请求后端、处理 401/403 | `getAccessToken`、`setAccessToken`、`apiFetch` | 独立为 API client 和 auth state |
| 本地状态 | 读取、合并、保存产品库和视图状态 | `loadState`、`saveState`、`mergeState`、`hydrateWorkspace`、`queuePersist` | 独立为状态 store，正式化后接资源 API |
| 数据标准化 | 统一产品、字段、型号、季度、卖点等格式 | `normalizeProduct`、`normalizeFeatureField`、`normalizeProductModel`、`textToSellingPoints` | 独立为 domain model 工具 |
| 产品库与筛选 | 产品搜索、筛选、排序、指标、表格、详情 | `getFilteredProducts`、`getVisibleProducts`、`renderFilters`、`renderProductTable`、`renderDetail` | 拆为产品列表、筛选器、详情组件 |
| 数据质量与待确认 | 数据质量问题、低置信字段、人工确认队列 | `productQualityIssues`、`renderQualityPanel`、`fieldReviewIssues`、`renderReviewQueue` | 拆为质量检查和复核工作台 |
| 自定义字段 | 模块、字段、枚举选项、字段删除和历史值保留 | `renderModules`、`addField`、`renameFeatureField`、`deleteFeatureField` | 拆为字段配置模块 |
| 型号对比 | 候选产品、字段选择、差异矩阵、500 字总结 | `selectedCompareProducts`、`compareFields`、`renderCompare`、`generateSummary` | 拆为对比页面和 summary service 调用 |
| 品牌路线图 | 品牌筛选、时间轴、品牌对比、路线图导出 | `getRoadmapProducts`、`renderRoadmap`、`roadmapSvgDocument` | 拆为路线图页面和导出模块 |
| AI 解析 | 文件处理、长图切片、metadata、浏览器抓取、分析入库 | `filesToAnalysisAttachments`、`sliceLongImageAttachment`、`fetchSourceMetadata`、`runAnalysis`、`integrateAnalyzedProduct` | 拆为资料导入、附件处理、分析结果合并 |
| 导入导出 | Excel、CSV、SVG、PDF 打印、数据包导入导出 | `exportExcel`、`exportCompare`、`exportRoadmap`、`exportDataPackage`、`importDataPackage`、`importCsvProducts` | 拆为 export/import utilities，长任务迁到队列 |
| 系统、审计、用量 | 健康状态、审计日志、AI 用量和成本展示 | `renderHealth`、`loadHealth`、`renderAuditLog`、`renderUsage`、`loadUsage` | 拆为系统状态、审计、用量页面 |
| 页面装配 | 绑定事件、切换模块、统一渲染 | `renderWorkspaceShell`、`renderAll`、`bindEvents`、`initialize` | 拆为路由/页面布局和事件入口 |

`script.js` 后续改动规则：

- 小修可直接在当前文件内改，但必须说明属于上表哪个边界。
- 新增功能如果横跨 3 个以上边界，先补方案，不直接写代码。
- 不为了拆文件而拆文件；只有迁移到 Next.js 或功能风险明显升高时再落地拆分。

#### `server.mjs` 模块边界

当前 `server.mjs` 是本地后端主入口，短期保留一个文件，先把职责边界写清楚，便于后续迁移到 Route Handlers 和 service 层。

| 边界 | 当前职责 | 典型函数/接口 | 后续迁移目标 |
| --- | --- | --- | --- |
| 环境和配置 | 读取 `.env.local`、端口、host、模型、代理、成本单价 | `loadEnv`、`configuredBaseUrl`、`aiRequestTimeoutMs`、`costPricingConfig` | 配置模块和运行时 env 校验 |
| HTTP 基础能力 | JSON 响应、请求体读取、静态资源服务、本地 app server | `sendJson`、`readJson`、`serveStatic`、`createAppServer` | Next.js Route Handlers 和静态资源托管 |
| 权限 | 兼容令牌、读写令牌、接口权限判断 | `accessTokens`、`isReadAuthorized`、`isWriteAuthorized`、`requireAccess`、`accessStatus` | 账号、角色、权限中间件 |
| 本地数据读写 | 产品库状态和 API 用量日志文件读写 | `readWorkbenchState`、`writeWorkbenchState`、`appendApiUsage`、`readApiUsage` | PostgreSQL + Prisma repository |
| 用量和成本 | token usage 归一化、成本估算、provider 识别 | `usageTokens`、`estimateApiCostUsd`、`enrichUsageRecord`、`providerFromModel` | `ApiUsageLog` 表和成本报表 |
| metadata 抓取 | URL 规范化、HTML metadata、价格、图片候选、文案片段 | `fetchMetadata`、`normalizeFetchUrl`、`extractImageCandidates`、`extractTextSnippets`、`priceFromText` | `SourcePage` / `MediaAsset` service |
| 浏览器抓取 | Playwright 会话、截图、动态页面采集、取消和回收 | `startBrowserFetch`、`collectBrowserFetch`、`closeBrowserFetchSession`、`captureBrowserPageScreenshots` | BullMQ job + Playwright worker |
| 附件与证据 | PDF/图片校验、远程图片抓取、输入证据充足性判断 | `sanitizeFileAttachment`、`validatePdfAttachment`、`fetchRemoteImageDataUrls`、`assertEnoughAnalysisEvidence` | media service 和 evidence policy |
| AI provider | OpenAI、DeepSeek、Qwen-VL 调用和 provider 路由 | `callOpenAIJson`、`callDeepSeekJson`、`callQwenVisionJson`、`callModelJson` | provider adapters |
| 分析与对比业务 | 产品分析、fallback 产品、型号对比总结 | `analyzeProduct`、`fallbackProduct`、`compareProducts`、`normalizeComparisonSummary` | analysis service 和 comparison service |
| API 路由 | 健康、状态、用量、分析、对比、metadata、浏览器抓取 | `/api/health`、`/api/state`、`/api/usage`、`/api/analyze`、`/api/compare`、`/api/fetch-metadata`、`/api/browser-fetch/*` | 按资源拆分 Route Handlers |

`server.mjs` 后续改动规则：

- 新增 API 前先确认是否已有对应迁移目标，优先补到 `docs/api-migration-map.md`。
- 涉及 AI、metadata、浏览器抓取、导出这类长耗时能力时，默认按“未来队列任务”设计，不继续扩大同步接口。
- 涉及权限或数据结构的变化，要同步更新 README、部署文档、验证脚本和迁移映射。

### 第 4 步：架构迁移

目标是让系统适合多人、长期、真实数据使用。

- Next.js + TypeScript 做正式前端和 Route Handlers。
- PostgreSQL + Prisma 做结构化数据。
- Redis/BullMQ 做 AI、抓取、导入、导出长任务。
- 账号和角色权限替代共享令牌。

## 决策规则

后续遇到新需求，先按下面规则判断：

1. 如果需求是修 bug、补文档、补验收，优先在当前 MVP 上小改。
2. 如果需求是新增小功能，必须说明影响哪个模块，并补对应验证。
3. 如果需求需要改数据结构、权限、任务队列或多人协作，默认放入正式化迁移，不直接塞进当前 MVP。
4. 如果需求会让 `script.js` 或 `server.mjs` 继续明显膨胀，先评估是否应该进入迁移阶段。
5. 如果只是为了“代码更漂亮”，但不会降低交付风险，暂缓。

## 禁止事项

- 不在没有验收基线的情况下大规模重构。
- 不一次性把当前 MVP 重写成 Next.js。
- 不删除现有导出、数据包、审计、兜底和发布验收能力。
- 不把真实 API key、访问令牌、本地数据或生成报告提交到 Git。
- 不绕过登录、付费墙、验证码或平台反爬限制。

## 每次改动后的最低交付说明

每次完成代码或文档变更后，至少说明：

- 改了什么。
- 影响什么。
- 如何验证。
- 如果失败，应该把哪段报错发回来。

涉及业务代码时，优先运行：

```bash
node --check script.js
node --check server.mjs
node scripts/verify-hygiene.mjs
```

发布或正式使用前，再运行：

```bash
node scripts/verify-release.mjs
```
