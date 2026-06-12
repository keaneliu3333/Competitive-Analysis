# API 与队列迁移矩阵

这份矩阵把当前 `server.mjs` 的无依赖 API 映射到正式系统中的 Next.js Route Handlers、Prisma 实体和 Redis/BullMQ jobs。迁移时以行为等价为第一目标，再逐步拆细资源。

## Route Handlers

| 当前 API | 目标 Route Handler | 权限 | 同步/异步 | 主要 Prisma 实体 | 迁移说明 |
| --- | --- | --- | --- | --- | --- |
| `GET /api/health` | `GET /api/health` | public | 同步 | `ApiUsageLog` optional | 返回服务状态、模型、成本单价配置和访问控制状态。 |
| `GET /api/state` | `GET /api/products`、`GET /api/feature-modules`、`GET /api/saved-views`、`GET /api/audit-logs` | `viewer` | 同步 | `Product`、`FeatureModule`、`FeatureField`、`SavedView`、`AuditLog` | 替代单个 JSON state，按资源拆分；兼容期可保留聚合读接口。 |
| `PUT /api/state` | `POST/PATCH /api/products`、`POST/PATCH /api/feature-fields`、`POST /api/imports/data-package` | `editor` | 同步 + 异步 | `Product`、`ProductFeatureValue`、`FeatureField`、`SavedView`、`AuditLog` | 普通编辑同步写入；完整数据包导入进入 `data-package-import` job。 |
| `GET /api/usage` | `GET /api/usage` | `viewer` | 同步 | `ApiUsageLog` | 按 provider、模型、状态、时间范围和成本汇总查询。 |
| `POST /api/fetch-metadata` | `POST /api/source-pages/fetch` | `viewer` | 异步优先 | `SourcePage`、`MediaAsset` | 创建 `metadata-fetch` job；简单页面可同步返回初始结果。 |
| `POST /api/analyze` | `POST /api/analysis-runs` | `analyst` | 异步 | `AnalysisRun`、`SourcePage`、`MediaAsset`、`Product`、`ProductFeatureValue`、`SellingPoint`、`ApiUsageLog` | 创建 `analysis-run` job；文本型抽取默认 DeepSeek，图片/长图/URL 图片候选默认 Qwen-VL，原始 PDF 未转图片时保留 fallback 和人工复核状态。 |
| `POST /api/compare` | `POST /api/comparison-runs` | `analyst` | 同步 | `AnalysisRun`、`ApiUsageLog` | 生成 500 字以内总结，按 `COMPARE_AI_PROVIDER` 优先 DeepSeek 或 OpenAI，记录 provider、模型、usage、字段范围和产品集合。 |

## 新增资源 API

| 目标 API | 权限 | 实体 | 说明 |
| --- | --- | --- | --- |
| `GET /api/products` | `viewer` | `Product` | 支持关键词、品牌、品类、状态、渠道、价格段、置信度和字段筛选。 |
| `POST /api/products` | `editor` | `Product`、`PriceSnapshot`、`AuditLog` | 手动新增产品，写初始价格快照和审计。 |
| `PATCH /api/products/:id` | `editor` | `Product`、`ProductFeatureValue`、`PriceSnapshot`、`AuditLog` | 编辑产品基础信息和字段值；价格变化写快照。 |
| `POST /api/products/:id/confirm` | `analyst` | `Product`、`ProductFeatureValue`、`AnalysisRun`、`AuditLog` | 确认产品或字段低置信结果。 |
| `GET/POST/PATCH /api/feature-modules` | `editor` | `FeatureModule`、`FeatureField` | 管理模块、字段、排序和枚举选项。 |
| `DELETE /api/feature-fields/:id` | `editor` | `FeatureField`、`ProductFeatureValue` | 软删除字段，保留历史产品值。 |
| `GET/POST/DELETE /api/saved-views` | `viewer/editor` | `SavedView` | 保存和恢复工作视图。 |
| `GET /api/roadmap-items` | `viewer` | `RoadmapItem`、`Product`、`SellingPoint` | 按品牌、季度、品类和状态查询路线图。 |
| `POST /api/exports` | `viewer` | `Product`、`RoadmapItem`、`AnalysisRun` | 创建 Excel、SVG、PDF、CSV 或交接包导出任务。 |
| `GET /api/audit-logs` | `admin` | `AuditLog` | 查询人工编辑、AI 入库、导入导出和权限变更。 |

## BullMQ Jobs

| Job 名称 | 触发来源 | 输入摘要 | 输出 | 失败策略 |
| --- | --- | --- | --- | --- |
| `metadata-fetch` | `POST /api/source-pages/fetch` | URL、提交人、来源类型 | `SourcePage`、图片候选、价格候选、文案片段 | 不绕过限制；失败写 error，允许截图/PDF 兜底。 |
| `playwright-screenshot` | metadata job 或人工触发 | URL、viewport、等待策略 | 截图 `MediaAsset`、状态码、重定向链 | 遇到登录、验证码、付费墙直接失败并记录原因。 |
| `analysis-run` | `POST /api/analysis-runs` | sourcePageId、上传媒体、featureFields、examples、provider policy | `AnalysisRun`、产品草稿、字段值、Top3 卖点、provider、usage | Qwen-VL 图片识别失败或原始 PDF 未转图片时写 fallback，进入人工复核；DeepSeek 仅用于文本复核/总结任务。 |
| `data-package-import` | `POST /api/imports/data-package` | JSON 数据包、操作者 | 导入产品、字段、历史、视图、审计和比较历史 | 导入前生成备份；对账失败则回滚事务。 |
| `csv-import` | CSV 上传 | CSV 文件、字段映射 | 新增/更新产品和导入报告 | 行级校验，失败行写入报告。 |
| `export-build` | `POST /api/exports` | 导出类型、筛选条件、产品集合 | Excel/SVG/PDF/CSV/Markdown artifact | 失败保留 job error，可重试。 |

## 迁移顺序

1. 先实现只读资源 API，并让前端读取 PostgreSQL 数据。
2. 将产品编辑、自定义字段和保存视图写入 Prisma，同时保留 JSON 数据包导出作为回滚。
3. 将 metadata 和 AI 分析改为 BullMQ jobs，前端轮询 job 状态。
4. 将导出构建迁移为 `export-build` job，保留当前前端导出作为 fallback。
5. 切换权限体系到组织账号和角色，停用共享 `APP_ACCESS_TOKEN`。

## 验收门槛

- 现有 `node scripts/verify-release.mjs` 通过。
- Route Handler 返回结构与当前工作台需要的字段兼容。
- 所有写操作产生 `AuditLog`。
- 所有 OpenAI 备用调用产生 `ApiUsageLog`。
- 所有 DeepSeek 调用产生 `ApiUsageLog`，并能按 provider 导出。
- 所有 Qwen-VL 调用产生 `ApiUsageLog`，并能按 provider 导出。
- 所有异步 job 可查看状态、错误、重试次数和输出摘要。
