# 正式功能使用启动清单

这份清单用于把当前竞品分析工作台交给内部团队正式使用。网页内不增加任何“试用”模块；网页保持产品库、筛选、AI 导入、型号对比、路线图、导出、审计和用量监控这些正式功能。

## 发布前检查

- 代码状态：`git status --short --branch` 无未提交业务变更。
- 发布验收：`node scripts/verify-release.mjs` 通过。
- 本地环境：`node scripts/check-local-env.mjs` 通过或只存在允许的本机开发警告。
- 浏览器冒烟：启动服务后运行 `SMOKE_BASE_URL=http://127.0.0.1:4173 node scripts/verify-formal-use-browser.mjs`，生成 `reports/formal-use-browser-smoke-*.json`，覆盖 375/768/1440 响应式视口。
- 卫生检查：`node scripts/verify-hygiene.mjs` 通过，确认 `.env.local`、`data/`、`reports/` 不会被提交。
- 页面约束：`index.html`、`script.js`、`styles.css` 不包含 `trialFeedback`、`trial-panel`、`addTrialFeedback`、`exportTrialFeedback` 或 `内部试用反馈`。

## 启动步骤

1. 复制 `.env.example` 为 `.env.local`，配置访问令牌、DeepSeek、Qwen-VL 和端口；OpenAI 只作为可选备用。
2. 运行 `node server.mjs`。
3. 打开 `http://localhost:4173`。
4. 用 `APP_READ_TOKEN` 或 `APP_WRITE_TOKEN` 进入工作台。
5. 导出一次完整数据包，作为正式使用前基线。

## 正式功能确认

- 筛选：品类可搜索多选、品牌可搜索筛选、自定义价格段、渠道、状态、AI 置信度和自定义参数筛选可用。
- 自定义字段：新增、重命名、枚举选项编辑、删除配置和历史值保留可用。
- AI 导入：URL、长图、PDF 兜底、页面证据包、Qwen-VL 视觉识别、低置信复核和人工确认可用。
- 型号对比：至少 2 个型号且不限制上限、已选字段矩阵、差异高亮、500 字以内总结和对比表导出可用。
- 路线图：品类、品牌多选、状态、半年度周期筛选，Excel、SVG 和各品牌分页 PDF 可用。
- 数据包：完整 JSON 导出、导入前备份、导入恢复和保存视图恢复可用。
- 数据交接：完整 JSON 数据包、AI 用量 CSV 和审计 CSV 可导出并可追溯。
- 审计和用量：审计 CSV、AI 用量 CSV、provider、model、status、usage 和 estimatedCostUsd 可追溯。

## 使用反馈归档

- 不在网页里新增反馈或试用模块。
- 使用 `node scripts/generate-formal-use-pack.mjs` 生成正式功能使用包。
- 在 `reports/formal-use-pack-*.md` 的反馈记录区填写问题、改进建议和 Go/No-Go 结论。
- 阻塞问题进入下一批小提交，修复后重新运行 `node scripts/verify-release.mjs`。

## Go/No-Go

Go：

- 发布验收通过。
- 正式功能确认项没有阻塞。
- 数据包备份和恢复通过。
- 密钥、用量、审计和报告归档符合内部安全要求。

No-Go：

- 发布验收失败。
- 页面出现试用模块或试用反馈入口。
- 导入导出、数据包备份、AI 失败兜底或权限令牌存在阻塞。
- 控制台出现影响主流程的 error/pageerror。
