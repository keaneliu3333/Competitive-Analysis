import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
}

function readRequired(relativePath) {
  const path = join(root, relativePath);
  if (!existsSync(path)) {
    fail(`Missing required file: ${relativePath}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) fail(`${label} is missing: ${needle}`);
}

function assertRegex(source, pattern, label) {
  if (!pattern.test(source)) fail(`${label} did not match ${pattern}`);
}

function validateStateFile() {
  const statePath = join(root, "data", "workbench-state.json");
  if (!existsSync(statePath)) {
    notes.push("No data/workbench-state.json found; using built-in sample data on first run.");
    return;
  }

  let state;
  try {
    state = JSON.parse(readFileSync(statePath, "utf8"));
  } catch (error) {
    fail(`data/workbench-state.json is not valid JSON: ${error.message}`);
    return;
  }

  const products = Array.isArray(state.products) ? state.products : state.state?.products;
  if (!Array.isArray(products)) {
    fail("data/workbench-state.json must contain a products array.");
    return;
  }

  for (const [index, product] of products.entries()) {
    for (const field of ["id", "brand", "model", "category", "price"]) {
      if (product[field] === undefined || product[field] === "") {
        fail(`Product at index ${index} is missing required field: ${field}`);
      }
    }
  }

  notes.push(`Validated persisted state with ${products.length} product(s).`);
}

const indexHtml = readRequired("index.html");
const scriptJs = readRequired("script.js");
const serverMjs = readRequired("server.mjs");
const envExample = readRequired(".env.example");
const readme = readRequired("README.md");
const gitignore = readRequired(".gitignore");
const deploymentDoc = readRequired("docs/deployment.md");
const accessVerifier = readRequired("scripts/verify-access.mjs");
const costVerifier = readRequired("scripts/verify-costs.mjs");
const metadataVerifier = readRequired("scripts/verify-metadata.mjs");
const evalCases = readRequired("evals/sample-cases.json");
const evalVerifier = readRequired("scripts/verify-evals.mjs");
const mvpVerifier = readRequired("scripts/verify-mvp.mjs");
const runtimeVerifier = readRequired("scripts/verify-runtime.mjs");
const traceabilityVerifier = readRequired("scripts/verify-traceability.mjs");
const traceabilityDoc = readRequired("docs/requirements-traceability.md");
const exportVerifier = readRequired("scripts/verify-exports.mjs");
const summaryVerifier = readRequired("scripts/verify-summary.mjs");
const dataPackageVerifier = readRequired("scripts/verify-data-package.mjs");
const formalizationVerifier = readRequired("scripts/verify-formalization-plan.mjs");
const reportGenerator = readRequired("scripts/generate-test-report.mjs");
const smokeChecklistGenerator = readRequired("scripts/generate-smoke-checklist.mjs");
const localEnvChecker = readRequired("scripts/check-local-env.mjs");
const hygieneVerifier = readRequired("scripts/verify-hygiene.mjs");
const releaseVerifier = readRequired("scripts/verify-release.mjs");

for (const file of [
  "styles.css",
  "assets/robot-vacuum.svg",
  "assets/floor-washer.svg",
  "assets/stick-vacuum.svg",
]) {
  if (!existsSync(join(root, file))) fail(`Missing required file: ${file}`);
}

const requiredElementIds = [
  "keywordSearch",
  "categoryFilters",
  "minPrice",
  "maxPrice",
  "brandFilter",
  "channelFilter",
  "statusFilter",
  "confidenceFilter",
  "featureFilterField",
  "featureFilterOperator",
  "featureFilterValue",
  "qualityPanel",
  "exportQualityCsv",
  "mvpReadiness",
  "exportMvpChecklist",
  "exportHandoffReport",
  "savedViewName",
  "saveView",
  "exportExcel",
  "exportDataPackage",
  "importDataPackage",
  "importCsv",
  "downloadCsvTemplate",
  "createProduct",
  "openImport",
  "fetchSourceMetadata",
  "sourcePreview",
  "reviewQueue",
  "confirmAllReviews",
  "refreshHealth",
  "systemStatus",
  "deleteSavedView",
  "refreshUsage",
  "exportUsageCsv",
  "exportAuditCsv",
  "usageSummary",
  "usageTableBody",
  "auditTableBody",
  "productTableHead",
  "productTableBody",
  "productDetail",
  "comparePicker",
  "compareFieldPicker",
  "selectAllCompareFields",
  "clearCompareFields",
  "comparisonHistory",
  "exportComparisonHistory",
  "generateSummary",
  "exportCompare",
  "moduleName",
  "fieldName",
  "fieldType",
  "fieldOptions",
  "addField",
  "roadmapBrandFilter",
  "roadmapCategoryFilter",
  "roadmapStatusFilter",
  "roadmapQuarterFilter",
  "printRoadmap",
  "printAllBrandRoadmaps",
  "exportRoadmapSvg",
  "exportRoadmap",
  "dataPackageFile",
  "csvImportFile",
];

for (const id of requiredElementIds) {
  assertRegex(indexHtml, new RegExp(`id=["']${id}["']`), `index.html element #${id}`);
}

const requiredClientFunctions = [
  "apiFetch",
  "mergeState",
  "normalizeEnumOptions",
  "normalizeFeatureField",
  "enumOptions",
  "defaultFeatureValue",
  "normalizeProduct",
  "addAudit",
  "addAnalysisRun",
  "addPriceSnapshot",
  "workspaceViewPayload",
  "applyWorkspaceView",
  "saveCurrentView",
  "deleteSavedView",
  "renderHealth",
  "loadHealth",
  "formatUsageValue",
  "formatCostUsd",
  "renderUsage",
  "loadUsage",
  "exportUsageCsv",
  "mvpChecklistItems",
  "renderMvpReadiness",
  "exportMvpChecklistCsv",
  "handoffReportMarkdown",
  "exportHandoffReport",
  "duplicateProductGroups",
  "productQualityIssues",
  "renderQualityPanel",
  "exportQualityCsv",
  "sourceEvidenceText",
  "renderSourceEvidence",
  "renderSourceMetadataEvidence",
  "fieldReviewStatus",
  "isFieldReviewConfirmed",
  "fieldReviewIssues",
  "confirmFieldReview",
  "confirmAllFieldReviews",
  "renderFieldReviewSummary",
  "auditRecords",
  "renderAuditLog",
  "exportAuditCsv",
  "featureFilterMatches",
  "productSearchText",
  "keywordMatches",
  "currentSortColumn",
  "compareSortValues",
  "sortedProducts",
  "getVisibleProducts",
  "toggleProductSort",
  "renderReviewQueue",
  "renderRoadmapSelect",
  "renderRoadmapBrandFilter",
  "getRoadmapProducts",
  "roadmapSourceLabel",
  "roadmapTitle",
  "selectedCompareProducts",
  "allCompareFields",
  "selectedCompareFieldKeys",
  "compareFields",
  "moveArrayItem",
  "moveModule",
  "moveFeatureField",
  "renameFeatureField",
  "editFeatureFieldOptions",
  "deleteFeatureField",
  "analysisFeatureFields",
  "analysisExamples",
  "mergeCustomFeatures",
  "productImageFromAnalysis",
  "productFromAnalysis",
  "duplicateProductKey",
  "findDuplicateProduct",
  "mergeAnalyzedProduct",
  "integrateAnalyzedProduct",
  "fileToAnalysisAttachment",
  "sliceLongImageAttachment",
  "filesToAnalysisAttachments",
  "renderCustomFeatureEvidence",
  "fetchSourceMetadata",
  "normalizeComparisonSummary",
  "comparisonPayload",
  "addComparisonRun",
  "renderComparisonHistory",
  "generateSummary",
  "exportCompare",
  "exportComparisonHistory",
  "exportExcel",
  "exportRoadmap",
  "roadmapSvgDocument",
  "exportRoadmapSvg",
  "roadmapPrintCard",
  "roadmapReportHtml",
  "allBrandRoadmapProducts",
  "brandRoadmapReportHtml",
  "printAllBrandRoadmaps",
  "dataPackagePayload",
  "backupBeforeDataPackageImport",
  "exportDataPackage",
  "importDataPackage",
  "csvCell",
  "downloadCsvTemplate",
  "parseCsv",
  "parseCsvNumber",
  "normalizeCsvCategory",
  "validateCsvRow",
  "importCsvProducts",
];

for (const name of requiredClientFunctions) {
  assertRegex(scriptJs, new RegExp(`function\\s+${name}\\s*\\(|async\\s+function\\s+${name}\\s*\\(`), `script.js function ${name}`);
}

for (const route of [
  "/api/health",
  "/api/state",
  "/api/analyze",
  "/api/compare",
  "/api/fetch-metadata",
  "/api/usage",
]) {
  assertIncludes(serverMjs, route, "server.mjs route");
}

for (const token of [
  "APP_ACCESS_TOKEN",
  "APP_READ_TOKEN",
  "APP_WRITE_TOKEN",
  "accessTokens",
  "isReadAuthorized",
  "isWriteAuthorized",
  "requireAccess",
  "appendApiUsage",
  "costPricingConfig",
  "estimateApiCostUsd",
  "enrichUsageRecord",
  "createAppServer",
  "usageTokens",
  "callOpenAIJson",
  "HttpError",
  "maxJsonBodyBytes",
  "Invalid JSON request body",
  "413",
  "fetchMetadata",
  "normalizeImageDataUrls",
  "metaContent",
  "extractJsonLdObjects",
  "extractImageCandidates",
  "extractTextSnippets",
  "pricesFromText",
  "priceFromJsonLd",
  "priceFromMeta",
  "priceFromText",
  "input_file",
  "file_data",
  "validatePdfAttachment",
  "sanitizeFeatureFields",
  "sanitizeAnalysisExamples",
  "customFeatures",
  "enum 类型的 customFeatures",
  "options",
  "高置信人工确认示例",
  "normalizeRemoteImageUrls",
  "analysisSourceImageUrls",
  "remoteImageUrls",
  "已附加 URL 图片候选数",
  "normalizeComparePayload",
  "differenceFields",
  "OPENAI_INPUT_USD_PER_1M",
  "OPENAI_OUTPUT_USD_PER_1M",
  "estimatedCostUsd",
  "costPricingConfigured",
  "imageCandidates",
  "image 字段只能使用页面中明确出现的产品图 URL",
  "priceCandidates",
  "textSnippets",
  "页面文案证据片段",
  "500 个中文字符以内",
  "使用感受",
]) {
  assertIncludes(serverMjs, token, "server.mjs capability");
}

for (const token of [
  "MAX_ANALYSIS_FILE_BYTES",
  "fileAttachment",
  "application/pdf",
  "imageDataUrls",
  "featureFields",
  "analysisExamples",
  "customFeatureEvidence",
  "image/svg+xml",
  "featureHeaders",
  "featureCells",
  "/api/health",
  "accessTokenRequired",
  "readWriteSplitEnabled",
  "writeTokenRequired",
  "读写分离",
  "写权限",
  "costPricingConfigured",
  "estimatedCostUsd",
  "最近成本",
  "累计成本",
  "quality-issues-",
  "mvp-readiness-",
  "mvp-handoff-",
  "MVP 就绪度",
  "清洁电器竞品分析 MVP 交接包",
  "data-focus-quality",
  "缺少真实产品图",
  "keyword",
  "keywordSearch",
  "功能参数矩阵",
  "Top3 优先级卖点",
  "productSort",
  "data-sort-column",
  "table-sort-button",
  "状态",
  "来源",
  "roadmapCategory",
  "roadmapStatus",
  "roadmapQuarter",
  "cleaner-products-template.csv",
  "openai-usage-",
  "comparison-summaries-",
  "audit-log-",
  "审计日志",
  "backup-before-import",
  "/api/usage",
  "预抓取价格",
  "价格候选",
  "图片候选",
  "文案证据",
  "Source evidence package",
  "来源价格候选",
  "来源文案证据",
  "来源图片候选",
  "field-review-panel",
  "fieldReviewStatus",
  "低置信字段",
  "确认字段证据",
  "data-confirm-field-review",
  "同步确认字段",
  "data-rename-field",
  "data-edit-field-options",
  "data-delete-field",
  "selectedSavedViewIndex",
  "data-compare-field-key",
  "data-move-module",
  "data-move-field",
  "已选功能参数矩阵",
  "枚举字段需要先填写至少一个选项",
  "枚举选项",
  "仅枚举字段需要填写选项",
  "options",
  "发现同品牌同型号产品",
  "AI 更新入库",
  "按品牌+型号匹配更新",
]) {
  assertIncludes(scriptJs, token, "script.js upload capability");
}

assertIncludes(indexHtml, "multiple", "index.html multi-file upload");
assertIncludes(indexHtml, "估算成本", "index.html usage cost column");
assertIncludes(indexHtml, "品牌、型号、卖点、功能、来源", "index.html keyword search placeholder");

for (const ignore of [".env.local", ".env.*.local", "!.env.example", "data/workbench-state.json", "data/api-usage.json", "data/*.json", "reports/"]) {
  assertIncludes(gitignore, ignore, ".gitignore entry");
}

for (const token of ["OPENAI_API_KEY=", "OPENAI_MODEL=gpt-5.4-mini", "APP_READ_TOKEN=", "APP_WRITE_TOKEN=", "PORT=4173"]) {
  assertIncludes(envExample, token, ".env.example");
}

for (const topic of [
  "CSV",
  "下载 CSV 模板",
  "跳过行",
  "APP_ACCESS_TOKEN",
  "APP_READ_TOKEN",
  "APP_WRITE_TOKEN",
  "系统状态",
  "关键词搜索",
  "MVP 交付状态",
  "数据质量检查",
  "重复型号",
  "导出问题",
  "不生成虚构产品图",
  "当前模型",
  "AI 用量日志",
  "AI 样例闭环",
  "品牌+型号识别重复",
  "AI 入库",
  "字段级确认",
  "低置信自定义字段",
  "对比总结历史",
  "审计日志",
  "估算成本",
  "OPENAI_INPUT_USD_PER_1M",
  "OPENAI_OUTPUT_USD_PER_1M",
  "OPENAI_TOTAL_USD_PER_1M",
  "导出最近调用",
  "token usage",
  "70MB",
  "可命名保存/删除",
  "工作视图",
  "对比字段",
  "路线图品牌",
  "排序",
  "价格快照",
  "自定义功能参数",
  "枚举",
  "选项",
  "模块和字段可排序",
  "字段可重命名",
  "删除不会清空历史产品值",
  "价格候选",
  "图片候选",
  "文案证据片段",
  "页面证据包",
  "来源证据包",
  "长图自动切片",
  "多张图片",
  "500 字以内",
  "使用感受",
  "自定义功能差异",
  "已选功能差异",
  "已选功能参数矩阵",
  "品牌路线图",
  "各品牌 PDF",
  "按品牌分页",
  "按品牌、品类、上市状态和季度筛选",
  "路线图图片导出",
  "上市状态",
  "来源",
  "对比表导出",
  "所有自定义功能字段列",
  "导入替换前会自动下载",
  "PDF",
  "input_file",
  "customFeatures",
  "样例校准",
  "verify-evals.mjs",
  "verify-costs.mjs",
  "verify-access.mjs",
  "verify-metadata.mjs",
  "verify-mvp.mjs",
  "verify-runtime.mjs",
  "verify-traceability.mjs",
  "generate-test-report.mjs",
  "check-local-env.mjs",
  "verify-hygiene.mjs",
]) {
  assertIncludes(readme, topic, "README capability");
}

for (const topic of [
  "OPENAI_API_KEY",
  "APP_ACCESS_TOKEN",
  "APP_READ_TOKEN",
  "APP_WRITE_TOKEN",
  "OPENAI_INPUT_USD_PER_1M",
  "OPENAI_TOTAL_USD_PER_1M",
  "估算成本",
  "data/workbench-state.json",
  "backup-before-import",
  "安全边界",
  "正式化迁移路径",
  "evals/sample-cases.json",
  "verify-costs.mjs",
  "verify-access.mjs",
  "verify-metadata.mjs",
  "verify-mvp.mjs",
  "verify-runtime.mjs",
  "verify-traceability.mjs",
  "generate-test-report.mjs",
  "check-local-env.mjs",
  "verify-hygiene.mjs",
]) {
  assertIncludes(deploymentDoc, topic, "deployment document");
}

for (const topic of [
  "Access verification passed",
  "open local mode",
  "read/write split mode",
  "legacy APP_ACCESS_TOKEN mode",
  "wrong-token rejection",
]) {
  assertIncludes(accessVerifier, topic, "access verifier");
}

for (const topic of ["Cost verification passed", "estimateApiCostUsd", "OPENAI_INPUT_USD_PER_1M", "env_rate_per_1m_tokens"]) {
  assertIncludes(costVerifier, topic, "cost verifier");
}

for (const topic of ["Metadata verification passed", "extractImageCandidates", "pricesFromText", "extractTextSnippets"]) {
  assertIncludes(metadataVerifier, topic, "metadata verifier");
}

for (const topic of ["schemaVersion", "requiredFeatures", "topSellingPointKeywords", "summaryMaxChars"]) {
  assertIncludes(evalCases, topic, "eval sample cases");
}

for (const topic of ["coverageTargets", "minCases", "sourceTypes", "robot-url-flagship-base-station", "vacuum-file-pdf-spec-comparison"]) {
  assertIncludes(evalCases, topic, "eval sample coverage");
}

for (const topic of ["Eval verification passed", "at least", "coverageTargets.summaryMaxChars", "requiresEvidence must be true"]) {
  assertIncludes(evalVerifier, topic, "eval verifier");
}

for (const topic of ["MVP verification passed", "docs/mvp-acceptance.md", "500-char comparison summaries", "brandRoadmapReportHtml"]) {
  assertIncludes(mvpVerifier, topic, "MVP verifier");
}

for (const topic of ["Runtime verification passed", "createAppServer", "exportMvpChecklist", "roadmapBoard", "AI fallback APIs"]) {
  assertIncludes(runtimeVerifier, topic, "runtime verifier");
}

for (const topic of ["Traceability verification passed", "docs/requirements-traceability.md", "500 字以内多维总结"]) {
  assertIncludes(traceabilityVerifier, topic, "traceability verifier");
}

for (const topic of ["需求追踪矩阵", "导出 Excel", "电商、官网详情页抓取分析", "自然语言理解功能参数"]) {
  assertIncludes(traceabilityDoc, topic, "traceability document");
}

for (const topic of [
  "Export verification passed",
  "product Excel",
  "comparison Excel",
  "roadmap SVG",
  "all-brand PDF",
]) {
  assertIncludes(exportVerifier, topic, "export verifier");
}

for (const topic of [
  "Summary verification passed",
  "500-character cap",
  "产品功能",
  "使用感受",
]) {
  assertIncludes(summaryVerifier, topic, "summary verifier");
}

for (const topic of [
  "Data package verification passed",
  "JSON handoff payload",
  "saved views",
  "custom field history preservation",
]) {
  assertIncludes(dataPackageVerifier, topic, "data package verifier");
}

for (const topic of [
  "Formalization plan verification passed",
  "Next.js/PostgreSQL/Prisma/Redis/BullMQ",
  "migration phases",
  "release gates",
]) {
  assertIncludes(formalizationVerifier, topic, "formalization plan verifier");
}

for (const topic of [
  "MVP test report generated",
  "docs/requirements-traceability.md",
  "reports",
  "scripts/verify-access.mjs",
  "scripts/verify-exports.mjs",
  "scripts/verify-summary.mjs",
  "scripts/verify-data-package.mjs",
  "scripts/verify-formalization-plan.mjs",
  "scripts/generate-smoke-checklist.mjs",
]) {
  assertIncludes(reportGenerator, topic, "test report generator");
}

for (const topic of [
  "Manual smoke checklist generated",
  "人工冒烟清单",
  "启动与首页",
  "筛选工作台",
  "详情页与 AI 导入",
  "型号对比",
  "路线图导出",
  "交接与审计",
]) {
  assertIncludes(smokeChecklistGenerator, topic, "manual smoke checklist generator");
}

for (const topic of [
  "Local environment check",
  ".env.example",
  "端口",
  "data/ 可写",
  "probeWorkbenchService",
  "端口 ${port} 健康接口",
  "端口 ${port} 首页",
  "清洁电器竞品分析工作台",
]) {
  assertIncludes(localEnvChecker, topic, "local environment checker");
}

for (const topic of ["Hygiene verification passed", "data/*.json", "reports/", "potential secret"]) {
  assertIncludes(hygieneVerifier, topic, "hygiene verifier");
}

for (const topic of [
  "Release readiness verification",
  "scripts/check-local-env.mjs",
  "scripts/verify-mvp.mjs",
  "scripts/verify-exports.mjs",
  "scripts/verify-summary.mjs",
  "scripts/verify-data-package.mjs",
  "scripts/verify-formalization-plan.mjs",
  "scripts/generate-test-report.mjs",
  "scripts/generate-smoke-checklist.mjs",
]) {
  assertIncludes(releaseVerifier, topic, "release verifier");
}

validateStateFile();

if (failures.length) {
  console.error("Workbench verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  if (notes.length) {
    console.error("\nNotes:");
    for (const note of notes) console.error(`- ${note}`);
  }
  process.exit(1);
}

console.log("Workbench verification passed.");
for (const note of notes) console.log(`- ${note}`);
