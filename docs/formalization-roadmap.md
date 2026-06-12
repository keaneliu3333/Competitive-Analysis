# 正式化迁移路线图

这份路线图用于把当前无依赖 MVP 迁移到计划中的 `Next.js + PostgreSQL + Prisma + Redis/BullMQ` 正式内部系统。目标不是一次性重写，而是保留当前已验收的业务能力，按阶段替换存储、API、队列和权限。

## 目标边界

- 保留现有 MVP 工作流：产品库、筛选、自定义字段、详情页 AI 分析、型号对比、路线图、导出、审计、用量和交接包。
- AI 能力采用 provider 分层：Qwen-VL 负责图片/长图/URL 图片候选识别，DeepSeek 负责文本总结、低成本复核和二次归纳；OpenAI 保留为可选备用 provider。
- 不做公开注册、多租户计费或全网自动爬取。
- URL 抓取遵守登录、付费墙、验证码、robots 和平台条款边界；抓取不稳定时继续支持截图、长图和 PDF 上传。
- 产品图只使用详情页或用户上传的真实图片，不生成虚构产品图。

## 阶段拆分

### 阶段 1：Next.js 外壳与只读迁移

- 新建 `Next.js + TypeScript + Tailwind + shadcn/ui` 项目。
- 将当前 `index.html`、`styles.css`、`script.js` 拆为页面、组件、hooks 和客户端状态模块。
- 保留当前 JSON 文件作为临时数据源，先迁移首页、筛选、产品表、详情抽屉和路线图只读视图。
- 验收：现有 `node scripts/verify-release.mjs` 仍可通过；人工冒烟清单中首页、筛选、路线图查看项通过。

### 阶段 2：PostgreSQL + Prisma 数据落库

- 建立 Prisma schema，覆盖核心实体：
  - `Brand`、`Category`、`Product`、`SourcePage`、`MediaAsset`、`PriceSnapshot`
  - `FeatureModule`、`FeatureField`、`ProductFeatureValue`
  - `SellingPoint`、`RoadmapItem`、`AnalysisRun`
  - `SavedView`、`AuditLog`、`ApiUsageLog`
- 字段级草案见 `docs/prisma-schema-draft.prisma`，正式项目创建后迁移到 `prisma/schema.prisma`。
- 编写一次性迁移脚本，把 `data/workbench-state.json` 和导出的数据包 JSON 导入 PostgreSQL。
- 产品去重继续沿用品牌 + 型号策略，并保留价格、分析和审计历史。
- 验收：产品、自定义字段、保存视图、审计、分析记录、价格快照和比较历史导入后数量一致。

### 阶段 3：Route Handlers 与权限

- 将 `server.mjs` API 迁移为 Next.js Route Handlers：
  - `GET /api/health`
  - `GET/PUT /api/state` 的正式替代拆分为产品、模块、视图、审计等资源 API
  - `POST /api/fetch-metadata`
  - `POST /api/analyze`
  - `POST /api/compare`
  - `GET /api/usage`
- 详细 API、资源和队列映射见 `docs/api-migration-map.md`。
- 将 `APP_ACCESS_TOKEN` 过渡为内部组织账号与角色权限。
- 最低角色：
  - `viewer`：查看产品库、路线图、用量和导出只读数据。
  - `editor`：编辑产品、自定义字段、保存视图、导入数据包。
  - `analyst`：运行 AI 分析、生成对比总结、确认低置信字段。
  - `admin`：管理用户、角色、模型、成本单价和审计保留策略。
- 验收：读写接口有角色校验；审计日志记录人工编辑、AI 入库、字段确认、导入导出和权限变更。

### 阶段 4：Redis/BullMQ 异步任务

- 引入 Redis/BullMQ 处理长耗时任务：
  - URL metadata 抓取
  - Playwright 页面截图
  - 长图切片和 PDF 分析
  - DeepSeek 文本型结构化抽取
  - DeepSeek 文本总结或复核调用
  - Qwen-VL 图片详情页识别调用
  - 批量 CSV/JSON 导入
  - 路线图和 Excel/PDF 导出包生成
- 每个任务记录状态、重试次数、输入摘要、输出摘要、错误和用量。
- 低置信字段进入人工复核队列，人工修订写回产品库并作为后续示例。
- 验收：任务可重试、可取消、可追溯；失败不阻塞产品库主流程。

### 阶段 5：Playwright 抓取与证据归档

- Playwright 只访问用户提交并允许使用的 URL。
- 对页面保存：
  - 标题、描述、价格候选、图片候选、文案片段
  - 页面截图或关键详情页图片引用
  - 抓取时间、状态码、重定向链、失败原因
- 不绕过登录、付费墙、验证码或反爬限制。
- 验收：SourcePage 和 MediaAsset 可回溯 AI 结论来源；无法抓取时上传截图/PDF 兜底可用。

### 阶段 6：评估、成本和发布

- 将 `evals/sample-cases.json` 替换为批准使用的真实详情页样例。
- 按品类覆盖扫地机、洗地机、吸尘器，按来源覆盖 URL、长图、PDF。
- 指标：
  - 型号、品牌、品类、价格抽取准确率
  - Top3 卖点证据可追溯率
  - 自定义字段低置信率和人工修订率
  - 500 字以内总结的完整性和可读性
  - 单次分析 token 和成本
- 模型评估按 provider 记录：DeepSeek 抽取、DeepSeek 总结、Qwen-VL 图片识别、PDF 复核兜底分别统计成功率、错误和成本。
- 验收：真实样例集通过；成本日志、审计日志、导出和人工复核流程均可追溯。

## 数据迁移策略

- 先冻结一份 `cleaner-workbench-*.json` 数据包，作为回滚基线。
- 运行 JSON 到 PostgreSQL 的导入脚本，导入后生成数量对账报告。
- 可先运行 `node scripts/generate-migration-reconciliation.mjs` 生成迁移前数量基线。
- 对账项：
  - 产品数、品牌数、品类数
  - 自定义模块和字段数
  - 每个产品的功能字段值数
  - Top3 卖点数
  - 价格快照、分析记录、审计记录、保存视图和比较历史
- 对账不通过时，不切换正式读写流量。

## 回滚策略

- 阶段 1-2 保留原静态 MVP 和 JSON 数据包导入导出。
- 正式库迁移前后都导出完整数据包。
- Route Handler 切换采用路径级开关，发现问题时回退到旧 `server.mjs` 本地服务。
- AI 分析和抓取队列失败时回退到上传截图/PDF + 人工确认流程。

## 发布门槛

- `node scripts/verify-release.mjs` 通过。
- `reports/mvp-test-report-*.md` 自动验收结果为通过。
- `reports/manual-smoke-checklist-*.md` 人工冒烟清单完成并通过。
- 真实样例评估集通过，低置信字段可进入人工复核。
- 迁移对账报告通过，且有回滚数据包。
