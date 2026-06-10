# MVP 验收清单

这份清单用于确认当前无依赖 MVP 是否覆盖扫地机、洗地机、吸尘器竞品分析的核心交付要求。

## 核心范围

- UI/UX：工作台首页直接进入产品库、筛选、AI 导入、型号对比和品牌路线图，不做营销页。
- 筛选：支持关键词、品类、品牌、渠道、上市状态、自定义价格段、AI 置信度和自定义功能参数筛选。
- 自定义元素：支持新增模块和字段，字段类型包含文本、数字、布尔、枚举、价格、图片。
- 详情页分析：支持 URL 预抓取、多张图片、长图切片、PDF 上传和补充说明，并通过 OpenAI Responses API 进行结构化抽取。
- 型号对比：支持从已添加产品选择 2-5 个型号，输出参数矩阵、差异高亮和 500 字以内中文总结。
- 总结口径：总结应覆盖产品功能、关键参数、价格梯度、Top3 卖点和使用感受，不超过 500 个中文字符。
- 路线图：支持品牌、品类、状态、季度筛选；路线图卡片包含产品图、价格、Top3 优先级卖点、状态和来源。
- 导出：支持产品库 Excel、型号对比 Excel、路线图 Excel、路线图 SVG、当前路线图打印/PDF、各品牌分页 PDF、数据包、CSV 模板、审计、用量、质量问题、MVP 验收清单和 Markdown 交接包导出。
- 复核与追溯：AI 结果有置信度、待确认队列、字段级确认、分析记录、价格快照、审计日志和数据质量检查。
- 内部部署与正式功能使用：支持本地持久化、读写访问令牌、OpenAI/DeepSeek 用量日志、成本估算、部署交接说明和正式功能使用运行手册/使用包生成。

## 验收命令

```bash
node scripts/verify-release.mjs
```

发布验收总入口会依次运行本地环境预检、完整 MVP 自动验收并生成测试报告。需要只跑核心自动验收时，可运行：

```bash
node scripts/verify-mvp.mjs
```

该命令会串联语法检查、工作台功能静态检查、访问令牌检查、成本日志检查、元数据抓取检查、离线 eval 模板检查和本地 HTTP 运行时检查。运行时检查通过内存请求注入覆盖首页、静态资源、只读 API、AI 详情页失败兜底和对比总结失败兜底，不依赖固定端口或外网。
需求逐条映射见 `docs/requirements-traceability.md`，并由 `node scripts/verify-traceability.mjs` 检查。
导出结构由 `node scripts/verify-exports.mjs` 专项检查，覆盖产品库 Excel、型号对比 Excel、路线图 Excel、路线图 SVG 和各品牌分页 PDF 的关键结构。
500 字总结由 `node scripts/verify-summary.mjs` 专项检查，覆盖字符上限、产品功能、关键参数、使用感受、价格梯度和 Top3 卖点口径。
数据包交接由 `node scripts/verify-data-package.mjs` 专项检查，覆盖完整 JSON、保存视图、导入前备份和自定义字段历史值保留。
正式功能使用准备由 `node scripts/verify-formal-use.mjs` 专项检查，覆盖使用运行手册、启动清单、使用包、反馈模板、Go/No-Go 标准、无网页试用模块约束和部署交接。
人工冒烟清单可通过 `node scripts/generate-smoke-checklist.mjs` 生成到 `reports/`，用于记录浏览器验收环境、状态、证据和结论。
启动本地服务后可运行 `SMOKE_BASE_URL=http://127.0.0.1:4173 node scripts/verify-formal-use-browser.mjs`，自动覆盖筛选、自定义字段、AI 导入兜底、型号对比和 500 字以内总结、路线图导出、数据包导入导出、审计/用量日志，并生成 `reports/formal-use-browser-smoke-*.json`。
正式功能使用包可通过 `node scripts/generate-formal-use-pack.mjs` 生成到 `reports/`，用于组织使用任务和归档使用反馈。
交付前可运行 `node scripts/generate-test-report.mjs`，在 `reports/` 生成带时间戳的 Markdown 测试报告。
启动前可运行 `node scripts/check-local-env.mjs` 做本地环境预检。
提交前可运行 `node scripts/verify-hygiene.mjs` 做密钥和本地生成物卫生检查。

## 人工冒烟

在可以访问浏览器的环境中，再补充以下人工操作：

- 输入关键词、品类和价格段后，产品表结果随筛选变化。
- 添加一个自定义枚举字段，在产品详情中编辑后出现在筛选和对比矩阵中。
- 上传一张详情页长图或 PDF，确认能进入 AI 分析流程；未配置 OpenAI 时应出现兜底结果和待确认状态。
- 选择 2-5 个型号生成 500 字以内总结，并导出对比表。
- 切换路线图筛选，分别导出 Excel、SVG、当前路线图 PDF 和各品牌 PDF。
- 导出数据包后重新导入，确认产品、自定义字段、分析记录、审计日志和保存视图仍在。
- 导出 Markdown 交接包，确认状态、风险、验收命令和下一阶段建议完整。
