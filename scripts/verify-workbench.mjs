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

function assertOrder(source, first, second, label) {
  const firstIndex = source.indexOf(first);
  const secondIndex = source.indexOf(second);
  if (firstIndex === -1 || secondIndex === -1 || firstIndex >= secondIndex) {
    fail(`${label} order is wrong: expected "${first}" before "${second}"`);
  }
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
const formalUseRunbook = readRequired("docs/formal-use-runbook.md");
const formalUseChecklist = readRequired("docs/formal-use-launch-checklist.md");
const accessVerifier = readRequired("scripts/verify-access.mjs");
const costVerifier = readRequired("scripts/verify-costs.mjs");
const stylesCss = readRequired("styles.css");
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
const internalTrialVerifier = readRequired("scripts/verify-formal-use.mjs");
const formalizationVerifier = readRequired("scripts/verify-formalization-plan.mjs");
const apiMigrationVerifier = readRequired("scripts/verify-api-migration-map.mjs");
const reportGenerator = readRequired("scripts/generate-test-report.mjs");
const modelEvalGenerator = readRequired("scripts/generate-model-eval-report.mjs");
const evalCalibrationPackGenerator = readRequired("scripts/generate-eval-calibration-pack.mjs");
const migrationReconciliationGenerator = readRequired("scripts/generate-migration-reconciliation.mjs");
const smokeChecklistGenerator = readRequired("scripts/generate-smoke-checklist.mjs");
const internalTrialPackGenerator = readRequired("scripts/generate-formal-use-pack.mjs");
const formalUseBrowserVerifier = readRequired("scripts/verify-formal-use-browser.mjs");
const localEnvChecker = readRequired("scripts/check-local-env.mjs");
const aiConnectivityChecker = readRequired("scripts/check-ai-connectivity.mjs");
const evalCalibrationRunner = readRequired("scripts/run-eval-calibration.mjs");
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
  "categoryFilterDropdown",
  "categoryFilterToggle",
  "categoryFilterLabel",
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
  "filterSummary",
  "qualityPanel",
  "exportQualityCsv",
  "savedViewName",
  "saveView",
  "exportExcel",
  "exportDataPackage",
  "sidebarToggle",
  "createProduct",
  "fetchSourceMetadata",
  "sourcePreview",
  "analysisStatus",
  "analysisSteps",
  "retryAnalysis",
  "collectBrowserFetch",
  "cancelBrowserFetch",
  "reviewQueue",
  "confirmAllReviews",
  "selectAllReviews",
  "confirmSelectedReviews",
  "deleteSelectedReviews",
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
  "compareKeywordFilter",
  "compareBrandFilter",
  "compareCategoryFilter",
  "compareChannelFilter",
  "compareStatusFilter",
  "compareMinPrice",
  "compareMaxPrice",
  "compareStatus",
  "compareFilteredProducts",
  "compareSimilarProducts",
  "compareFieldPicker",
  "selectAllCompareFields",
  "clearCompareFields",
  "generateSummary",
  "exportCompare",
  "moduleName",
  "fieldName",
  "fieldType",
  "fieldOptions",
  "addField",
  "roadmapBrandDropdown",
  "roadmapBrandToggle",
  "roadmapBrandMenu",
  "roadmapBrandClear",
  "roadmapCategoryFilter",
  "roadmapStatusFilter",
  "roadmapQuarterFilter",
  "printAllBrandRoadmaps",
  "exportRoadmapSvg",
  "exportRoadmap",
  "dataPackageFile",
  "csvImportFile",
];

for (const id of requiredElementIds) {
  assertRegex(indexHtml, new RegExp(`id=["']${id}["']`), `index.html element #${id}`);
}

const expectedWorkspaceOrder = ["products", "roadmap", "import", "quality", "system"];
let lastWorkspaceIndex = -1;
for (const workspace of expectedWorkspaceOrder) {
  const marker = `data-workspace="${workspace}"`;
  const currentIndex = indexHtml.indexOf(marker);
  if (currentIndex === -1) {
    fail(`index.html sidebar workspace is missing: ${workspace}`);
  } else if (currentIndex <= lastWorkspaceIndex) {
    fail(`index.html sidebar workspace order is wrong near: ${workspace}`);
  }
  lastWorkspaceIndex = currentIndex;
}

assertIncludes(indexHtml, "data-analysis-tab=\"products\"", "index.html product analysis library tab");
assertIncludes(indexHtml, "data-analysis-tab=\"compare\"", "index.html product analysis compare tab");
assertIncludes(indexHtml, "产品分析", "index.html unified product analysis navigation");

for (const token of [
  "product-table",
  "product-table-wrap",
  "workspace-nav",
  "sidebar-nav",
  "sidebar-toggle",
  "nav-icon",
  "nav-label",
  "filter-workbench",
  "filter-toolbar",
  "compare-filter-toolbar",
  "advanced-filters",
  "data-workspace=\"products\"",
  "data-workspace-page=\"products\"",
  "data-workspace-page=\"import\"",
  "data-workspace-page=\"system\"",
  "品牌路标",
  "hidden aria-hidden=\"true\"",
  "filterSummary",
  "compareStatus",
  "使用当前筛选结果",
  "同品类相近价位",
  "data-roadmap-mode=\"single\"",
  "data-roadmap-mode=\"compare\"",
  "multi-select",
  "module-manager",
  "usage-table-wrap",
  "audit-table-wrap",
]) {
  assertIncludes(indexHtml, token, "index.html formal workbench layout");
}

for (const token of [
  ".product-table-wrap",
  ".filter-workbench",
  ".filter-toolbar",
  ".compare-filter-toolbar",
  ".sidebar-nav",
  ".workspace-page",
  ".workspace-page.is-active",
  ".filter-summary",
  ".compare-status",
  ".product-table th:first-child",
  ".detail-panel",
  "container-type: inline-size",
  "repeat(auto-fit, minmax(132px, 1fr))",
  "overflow-wrap: anywhere",
  ".quality-priority",
  ".multi-select-toggle",
  ".multi-select-option",
  ".usage-table-wrap",
  ".audit-table-wrap",
  ".review-main",
  ".compare-field-group",
  ".module-manager",
  ".roadmap-price",
  "max-height: 278px",
  "max-height: min(48vh, 430px)",
  "max-height: 500px",
  "max-height: 640px",
  "overscroll-behavior-x: contain",
  "repeat(auto-fit, minmax(210px, 1fr))",
  ".compare-option input",
  ".roadmap-chart",
  ".roadmap-axis",
  ".roadmap-axis-tick",
  ".roadmap-lane",
  ".roadmap-panel .panel-actions",
  "overflow-x: hidden",
  "max-width: 100vw",
  "grid-template-rows: auto minmax(0, 1fr)",
  "var(--roadmap-height",
  "align-items: start",
  "repeating-linear-gradient",
]) {
  assertIncludes(readRequired("styles.css"), token, "styles.css formal workbench layout");
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
  "scrollToWorkspace",
  "updateFilterSoon",
  "productSearchFingerprint",
  "filterSummaryItems",
  "renderFilterSummary",
  "renderCompareStatus",
  "setCompareProducts",
  "compareFilteredProducts",
  "compareSimilarProducts",
  "roadmapPriceScale",
  "renderRoadmapTimeline",
  "renderRoadmapBrandCompare",
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
  "generateSummary",
  "exportCompare",
  "exportExcel",
  "exportRoadmap",
  "roadmapSvgDocument",
  "exportRoadmapSvg",
  "roadmapPrintCard",
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

for (const token of ["openaiBaseUrlConfigured", "qwenBaseUrlConfigured", "aiRequestTimeoutMs", "qwenModel", "visionProvider", "OpenAI 网关", "Qwen 网关", "AI 超时"]) {
  assertIncludes(scriptJs, token, "script.js health status");
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
  "callModelJson",
  "callDeepSeekJson",
  "callQwenVisionJson",
  "modelProviderStatus",
  "compareProvider",
  "visionProvider",
  "DEEPSEEK_API_KEY",
  "DEEPSEEK_MODEL",
  "QWEN_API_KEY",
  "QWEN_MODEL",
  "QWEN_BASE_URL",
  "HttpError",
  "maxJsonBodyBytes",
  "Invalid JSON request body",
  "413",
  "fetchMetadata",
  "startBrowserFetch",
  "collectBrowserFetch",
  "browserExecutablePaths",
  "BROWSER_EXECUTABLE_PATH",
  "BROWSER_FETCH_DISABLE_SANDBOX",
  "chromiumSandbox",
  "CHROME_EXECUTABLE_PATH",
  "Microsoft Edge",
  "msedge.exe",
  "Playwright Chromium",
  "captureBrowserPageScreenshots",
  "metadataFromBrowserSnapshot",
  "fetchRemoteImageDataUrls",
  "sourceImageFetch",
  "sourceScreenshotDataUrls",
  "sourceScreenshotFetch",
  "浏览器整页截图数",
  "自动下载详情页图片数",
  "自动下载图片尺寸",
  "AUTO_SOURCE_IMAGE_MIN_WIDTH",
  "图片尺寸太小",
  "不能只读取文字完成分析",
  "图片过大，已跳过",
  "normalizeImageDataUrls",
  "metaContent",
  "extractJsonLdObjects",
  "extractImageCandidates",
  "normalizeProductImageCandidates",
  "extractTextSnippets",
  "pricesFromText",
  "priceFromJsonLd",
  "priceFromMeta",
  "priceFromText",
  "callQwenVisionJson",
  "Qwen-VL 当前只接收图片输入",
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
  "自动下载详情页图片数",
  "sourceImageFetch",
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
  "maxModelImageDataUrlChars",
  "maxModelImageCount",
  "上传图片超过 AI 接口单张图片限制",
  "\"Cache-Control\": \"no-store\"",
  "500 个中文字符以内",
  "使用感受",
]) {
  assertIncludes(serverMjs, token, "server.mjs capability");
}

for (const token of [
  "MAX_ANALYSIS_FILE_BYTES",
  "MAX_ANALYSIS_IMAGE_DATA_URL_CHARS",
  "MAX_ANALYSIS_IMAGE_WIDTH",
  "MAX_ANALYSIS_IMAGE_COUNT",
  "MIN_ANALYSIS_IMAGE_SLICE_SOURCE_HEIGHT",
  "长图已自动压缩并切成",
  "selectAnalysisImageSlices",
  "已选取",
  "URL.createObjectURL",
  "URL.revokeObjectURL",
  "fileAttachment",
  "application/pdf",
  "imageDataUrls",
  "featureFields",
  "analysisExamples",
  "showSelectedAnalysisFiles",
  "normalizeErrorMessage",
  "正在读取上传文件",
  "文件准备完成",
  "资料已准备完成，正在获取详情页图片并等待 AI 返回",
  "服务已返回，正在整理分析结果",
  "浏览器无法解析图片",
  "image/jpeg",
  "超过 AI 接口单张图片限制",
  "分析中...",
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
  "ai-usage-",
  "DeepSeek",
  "compareProvider",
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
assertIncludes(indexHtml, "role=\"status\"", "index.html analysis progress status");
assertIncludes(indexHtml, "styles.css?v=ai-progress-20260621", "index.html stylesheet cache busting");
assertIncludes(indexHtml, "script.js?v=ai-progress-20260621", "index.html script cache busting");
assertIncludes(indexHtml, "估算成本", "index.html usage cost column");
assertIncludes(indexHtml, "品牌、型号、卖点、功能、来源", "index.html keyword search placeholder");
assertIncludes(indexHtml, "获取详情页信息", "index.html URL fetch analysis action");
assertIncludes(indexHtml, "继续获取", "index.html browser assisted collect action");
assertIncludes(indexHtml, "取消浏览器获取", "index.html browser assisted cancel action");
assertIncludes(indexHtml, "确认所选", "index.html selected review confirm action");
assertIncludes(indexHtml, "删除所选", "index.html selected review delete action");
assertOrder(indexHtml, "id=\"importPanel\"", "id=\"reviewTitle\"", "AI workspace detail ingestion before review queue");
assertOrder(indexHtml, "id=\"compareCategoryFilter\"", "id=\"compareBrandFilter\"", "compare filters category before brand");
assertIncludes(scriptJs, "await runAnalysis();", "script.js auto analysis after metadata fetch");
assertIncludes(scriptJs, "sidebarCollapsed", "script.js sidebar collapse state");
assertIncludes(scriptJs, "sidebarToggle", "script.js sidebar collapse control");
assertIncludes(scriptJs, "page.hidden = !isActive", "script.js workspace exclusive visibility");
assertIncludes(scriptJs, "getCompareCandidateProducts", "script.js compare scoped product candidates");
assertIncludes(scriptJs, "compareModuleRowSpans", "script.js compare matrix groups module rows");
assertIncludes(scriptJs, "compareStrongValueIndexes", "script.js compare matrix highlights stronger values");
assertIncludes(scriptJs, "productDisplayTitle(product)", "script.js compare header uses product title");
assertIncludes(scriptJs, "setRoadmapBrands", "script.js roadmap brand multi-select state");
assertIncludes(scriptJs, "roadmapBrandStyle(product.brand)", "script.js roadmap product brand colors");
assertIncludes(scriptJs, "roadmapBrandStyle(brand)", "script.js roadmap lane brand colors");
assertIncludes(scriptJs, "reviewVisiblePendingItems", "script.js compact review queue display");
assertIncludes(scriptJs, "selectedReviewIds", "script.js selected review state");
assertIncludes(scriptJs, "confirmSelectedReviews", "script.js selected review confirmation");
assertIncludes(scriptJs, "deleteSelectedReviews", "script.js selected review deletion");
assertIncludes(scriptJs, "保存调整", "script.js review detail form submit copy");
assertIncludes(scriptJs, "还有关键信息不能入库", "script.js review detail blocks incomplete confirmation");
assertIncludes(scriptJs, "analysisSteps", "script.js analysis progress steps");
assertIncludes(scriptJs, "showRetryAnalysis", "script.js analysis retry action");
assertIncludes(scriptJs, "resetAnalysisSteps", "script.js analysis progress reset");
assertIncludes(scriptJs, "friendlyAnalysisError", "script.js AI error translation");
assertIncludes(scriptJs, "关键参数/卖点区域截图", "script.js actionable image-limit guidance");
assertIncludes(scriptJs, "focusPendingAnalysisResult", "script.js pending analysis result focus");
assertIncludes(scriptJs, "已进入待确认队列", "script.js pending analysis result status copy");
assertIncludes(scriptJs, "scrollToReviewProduct", "script.js pending review scroll behavior");
assertIncludes(scriptJs, "未获取到", "script.js insufficient URL-only source warning");
assertIncludes(scriptJs, "不会生成空产品", "script.js avoids empty product creation when metadata is weak");
assertIncludes(scriptJs, "/api/browser-fetch/start", "script.js browser assisted fetch start API");
assertIncludes(scriptJs, "/api/browser-fetch/collect", "script.js browser assisted fetch collect API");
assertIncludes(scriptJs, "/api/browser-fetch/cancel", "script.js browser assisted fetch cancel API");
assertIncludes(scriptJs, "source-fetch-meta", "script.js metadata fetch status display");
assertIncludes(scriptJs, "commerce-url-fallback", "script.js commerce fallback warning display");
assertIncludes(scriptJs, "自动下载详情页图片", "script.js analysis status explains automatic detail image fetch");
assertIncludes(scriptJs, "productDisplayTitle", "script.js product library title uses brand and model");
assertIncludes(scriptJs, "normalizedAnalysisProductName", "script.js normalizes generic AI product names");
assertIncludes(scriptJs, "String(brand || \"\").trim()", "script.js product names use raw brand text instead of display labels");
assertIncludes(scriptJs, "T90PRO", "script.js normalizes ECOVACS T90PRO model from Tmall title");
assertIncludes(scriptJs, "正在打开浏览器获取真实详情页", "script.js opens browser fetch when public detail page evidence is missing");
assertIncludes(scriptJs, "继续获取", "script.js tells users to collect after browser login");
assertIncludes(scriptJs, "自动截取整页截图", "script.js browser collect explains full-page screenshots");
assertIncludes(scriptJs, "persistableSourceMetadata", "script.js strips transient screenshot data before persisting products");
assertIncludes(stylesCss, "is-sidebar-collapsed", "styles.css sidebar collapse state");
assertIncludes(stylesCss, ".analysis-step", "styles.css analysis progress steps");
assertIncludes(stylesCss, ".review-select", "styles.css review multi-select control");
assertIncludes(stylesCss, ".compare-module-cell", "styles.css compare grouped module cell");
assertIncludes(stylesCss, ".compare-strong-cell", "styles.css compare strong value highlight");
assertIncludes(stylesCss, "[hidden]", "styles.css hidden workspace hard guard");
assertIncludes(stylesCss, ".brand-dot", "styles.css roadmap brand color dot");
assertIncludes(stylesCss, "var(--brand-color", "styles.css roadmap brand color variables");
assertIncludes(stylesCss, "repeat(auto-fit, minmax(132px, 1fr))", "styles.css adaptive filter toolbar");
assertIncludes(stylesCss, ".review-header-actions", "styles.css review queue header action layout");
assertIncludes(stylesCss, ".review-summary", "styles.css compact review queue summary");
assertIncludes(stylesCss, ".review-item.is-highlighted", "styles.css highlighted pending review item");
assertIncludes(stylesCss, ".source-warning", "styles.css metadata fetch warning display");
assertIncludes(stylesCss, "scroll-snap-type: x proximity", "styles.css compact mobile nav scroller");
assertIncludes(stylesCss, ".products-panel > .panel-header .panel-actions", "styles.css mobile product header actions");
assertIncludes(stylesCss, "@media (max-width: 520px)", "styles.css narrow mobile breakpoint");

for (const ignore of [".env.local", ".env.*.local", "!.env.example", "data/workbench-state.json", "data/api-usage.json", "data/*.json", "reports/", ".tmp/"]) {
  assertIncludes(gitignore, ignore, ".gitignore entry");
}

for (const token of [
  "OPENAI_API_KEY=",
  "OPENAI_MODEL=gpt-5.4-mini",
  "OPENAI_BASE_URL=https://api.openai.com/v1",
  "AI_REQUEST_TIMEOUT_MS=60000",
  "HTTPS_PROXY=",
  "AI_PROVIDER=deepseek",
  "COMPARE_AI_PROVIDER=deepseek",
  "VISION_PROVIDER=qwen",
  "DEEPSEEK_API_KEY=",
  "DEEPSEEK_MODEL=deepseek-v4-flash",
  "QWEN_API_KEY=",
  "QWEN_MODEL=qwen-vl-max",
  "QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1",
  "QWEN_REQUEST_TIMEOUT_MS=60000",
  "BROWSER_EXECUTABLE_PATH=",
  "BROWSER_FETCH_DISABLE_SANDBOX=0",
  "BROWSER_FETCH_SCREENSHOT_COUNT=24",
  "APP_READ_TOKEN=",
  "APP_WRITE_TOKEN=",
  "PORT=4173",
]) {
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
  "审计日志",
  "估算成本",
  "OPENAI_INPUT_USD_PER_1M",
  "OPENAI_OUTPUT_USD_PER_1M",
  "OPENAI_TOTAL_USD_PER_1M",
  "DeepSeek",
  "Qwen-VL",
  "AI_PROVIDER",
  "COMPARE_AI_PROVIDER",
  "VISION_PROVIDER",
  "DEEPSEEK_API_KEY",
  "QWEN_API_KEY",
  "provider",
  "导出最近调用",
  "token usage",
  "140MB",
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
  "按品类、品牌多选、上市状态和半年度周期筛选",
  "路线图图片导出",
  "上市状态",
  "来源",
  "对比表导出",
  "所有自定义功能字段列",
  "导入替换前会自动下载",
  "PDF",
  "Qwen-VL",
  "customFeatures",
  "样例校准",
  "verify-evals.mjs",
  "verify-costs.mjs",
  "verify-access.mjs",
  "verify-metadata.mjs",
  "verify-mvp.mjs",
  "verify-runtime.mjs",
  "verify-traceability.mjs",
  "verify-formal-use.mjs",
  "generate-test-report.mjs",
  "generate-model-eval-report.mjs",
  "generate-eval-calibration-pack.mjs",
  "generate-formal-use-pack.mjs",
  "check-local-env.mjs",
  "check-ai-connectivity.mjs",
  "run-eval-calibration.mjs",
  "verify-hygiene.mjs",
  "verify-formal-use-browser.mjs",
  "ai-connectivity-check",
]) {
  assertIncludes(readme, topic, "README capability");
}

for (const token of [
  "Formal use browser smoke",
  "SMOKE_BASE_URL",
  "responsiveViewports",
  "375",
  "768",
  "1440",
  "no in-page trial module",
  "formal-use-browser-smoke",
  "trialFeedback",
  "数据包导出",
  "路线图导出",
  "型号对比和 500 字总结",
]) {
  assertIncludes(formalUseBrowserVerifier, token, "formal use browser verifier capability");
}

for (const topic of [
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "check-ai-connectivity.mjs",
  "run-eval-calibration.mjs",
  "APP_ACCESS_TOKEN",
  "APP_READ_TOKEN",
  "APP_WRITE_TOKEN",
  "OPENAI_INPUT_USD_PER_1M",
  "OPENAI_TOTAL_USD_PER_1M",
  "DEEPSEEK_API_KEY",
  "QWEN_API_KEY",
  "VISION_PROVIDER",
  "COMPARE_AI_PROVIDER",
  "provider",
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
  "verify-formal-use.mjs",
  "generate-test-report.mjs",
  "generate-model-eval-report.mjs",
  "generate-eval-calibration-pack.mjs",
  "generate-formal-use-pack.mjs",
  "check-local-env.mjs",
  "verify-hygiene.mjs",
]) {
  assertIncludes(deploymentDoc, topic, "deployment document");
}

for (const topic of [
  "正式功能使用运行手册",
  "使用目标",
  "使用任务",
  "正式功能使用反馈",
  "网页内不增加单独试用模块",
]) {
  assertIncludes(formalUseRunbook, topic, "formal use runbook");
}

for (const topic of [
  "正式功能使用启动清单",
  "网页内不增加任何“试用”模块",
  "trialFeedback",
  "trial-panel",
  "正式功能确认",
  "使用反馈归档",
]) {
  assertIncludes(formalUseChecklist, topic, "formal use launch checklist");
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

for (const topic of ["coverageTargets", "minCases", "sourceTypes", "roborock-s8-maxv-ultra", "roborock-h60-ultra"]) {
  assertIncludes(evalCases, topic, "eval sample coverage");
}

for (const topic of ["Eval verification passed", "at least", "coverageTargets.summaryMaxChars", "requiresEvidence must be true", "placeholder"]) {
  assertIncludes(evalVerifier, topic, "eval verifier");
}

for (const topic of ["MVP verification passed", "docs/mvp-acceptance.md", "500-char comparison summaries", "brandRoadmapReportHtml"]) {
  assertIncludes(mvpVerifier, topic, "MVP verifier");
}

for (const topic of ["Runtime verification passed", "createAppServer", "roadmapBoard", "AI fallback APIs"]) {
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
  "Formal use verification passed",
  "docs/formal-use-runbook.md",
  "docs/formal-use-launch-checklist.md",
  "Go/No-Go",
  "scripts/generate-formal-use-pack.mjs",
]) {
  assertIncludes(internalTrialVerifier, topic, "formal use verifier");
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
  "API migration map verification passed",
  "Route Handlers",
  "BullMQ jobs",
  "permissions",
]) {
  assertIncludes(apiMigrationVerifier, topic, "API migration map verifier");
}

for (const topic of [
  "Migration reconciliation report generated",
  "migrationCounts",
  "ProductFeatureValue",
  "PriceSnapshot",
  "ComparisonRun",
]) {
  assertIncludes(migrationReconciliationGenerator, topic, "migration reconciliation generator");
}

for (const topic of [
  "MVP test report generated",
  "docs/requirements-traceability.md",
  "reports",
  "scripts/verify-access.mjs",
  "scripts/verify-exports.mjs",
  "scripts/verify-summary.mjs",
  "scripts/verify-data-package.mjs",
  "scripts/verify-formal-use.mjs",
  "scripts/verify-formalization-plan.mjs",
  "scripts/verify-api-migration-map.mjs",
  "scripts/generate-migration-reconciliation.mjs",
  "scripts/generate-eval-calibration-pack.mjs",
  "scripts/generate-smoke-checklist.mjs",
  "scripts/generate-formal-use-pack.mjs",
  "process.execPath",
]) {
  assertIncludes(reportGenerator, topic, "test report generator");
}

for (const topic of [
  "多模型真实样例评估准备报告",
  "DeepSeek",
  "Qwen-VL",
  "DeepSeek 抽取结果",
  "Qwen-VL 视觉结论",
  "本地兜底结果",
  "人工校准清单",
  "校准记录模板",
  "Case ID",
  "Top3 卖点关键词",
  "Go / No-Go",
  "provider",
  "reports",
]) {
  assertIncludes(modelEvalGenerator, topic, "model eval report generator");
}

for (const topic of [
  "真实样例校准任务包",
  "eval-calibration-results",
  "DeepSeek 文本抽取",
  "Qwen-VL 视觉识别",
  "DeepSeek 总结",
  "本地兜底",
  "Go/No-Go",
  "summaryCoversFunction",
  "requiredFeaturesPass",
  "topSellingPointsPass",
]) {
  assertIncludes(evalCalibrationPackGenerator, topic, "eval calibration pack generator");
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
  "正式功能使用反馈",
  "正式功能人工冒烟清单",
  "使用人",
  "完整数据包 JSON",
  "用量 CSV",
]) {
  assertIncludes(smokeChecklistGenerator, topic, "manual smoke checklist generator");
}
if (smokeChecklistGenerator.includes("试用人")) fail("manual smoke checklist generator must not use 试用人 wording.");

for (const topic of [
  "Formal use pack generated",
  "清洁电器竞品分析正式功能使用包",
  "浏览器冒烟摘要",
  "响应式视口摘要",
  "正式功能使用启动清单",
  "真实样例校准任务包",
  "node scripts/verify-release.mjs",
  "Go/No-Go",
]) {
  assertIncludes(internalTrialPackGenerator, topic, "formal use pack generator");
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
  "HTTPS_PROXY 配置",
  "COMPARE_AI_PROVIDER 配置",
  "VISION_PROVIDER 配置",
  "DEEPSEEK_API_KEY 配置",
  "DEEPSEEK_MODEL 配置",
  "DEEPSEEK_BASE_URL 配置",
  "QWEN_API_KEY 配置",
  "QWEN_MODEL 配置",
  "QWEN_BASE_URL 配置",
]) {
  assertIncludes(localEnvChecker, topic, "local environment checker");
}

for (const topic of [
  "AI connectivity check",
  "OPENAI_BASE_URL",
  "AI_REQUEST_TIMEOUT_MS",
  "HTTPS_PROXY",
  "DEEPSEEK_BASE_URL",
  "QWEN_BASE_URL",
  "QWEN_API_KEY",
  "missing-key",
  "network-error",
  "Report:",
]) {
  assertIncludes(aiConnectivityChecker, topic, "AI connectivity checker");
}

for (const topic of [
  "Eval calibration started",
  "prepare-dir",
  "prepare-compare-dir",
  "finalize-dir",
  "eval-calibration-results",
  "manualReviewRequired",
  "summaryCoversFunction",
  "request-error",
]) {
  assertIncludes(evalCalibrationRunner, topic, "eval calibration runner");
}

for (const topic of ["Hygiene verification passed", "data/*.json", "reports/", ".tmp/", "potential secret"]) {
  assertIncludes(hygieneVerifier, topic, "hygiene verifier");
}

for (const topic of [
  "Release readiness verification",
  "scripts/check-local-env.mjs",
  "scripts/check-ai-connectivity.mjs",
  "scripts/verify-mvp.mjs",
  "scripts/verify-exports.mjs",
  "scripts/verify-summary.mjs",
  "scripts/verify-data-package.mjs",
  "scripts/verify-formal-use.mjs",
  "scripts/verify-formalization-plan.mjs",
  "scripts/verify-api-migration-map.mjs",
  "scripts/generate-migration-reconciliation.mjs",
  "scripts/generate-model-eval-report.mjs",
  "scripts/generate-eval-calibration-pack.mjs",
  "scripts/generate-test-report.mjs",
  "scripts/generate-smoke-checklist.mjs",
  "scripts/generate-formal-use-pack.mjs",
  "process.execPath",
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
