#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const baseUrl = readArg("--base-url") || process.env.SMOKE_BASE_URL || "http://127.0.0.1:4173";
const dateStamp = readArg("--date") || new Date().toISOString().slice(0, 10);
const prepareDir = readArg("--prepare-dir");
const prepareCompareDir = readArg("--prepare-compare-dir");
const finalizeDir = readArg("--finalize-dir");
const casesPath = join(root, "evals", "sample-cases.json");
const resultsPath = join(root, "reports", `eval-calibration-results-${dateStamp}.csv`);
const backupPath = join(root, "reports", `eval-calibration-results-${dateStamp}.before-run.csv`);
const statePath = join(root, "data", "workbench-state.json");

const csvHeaders = [
  "caseId",
  "category",
  "sourceType",
  "sourceFormat",
  "sourceRef",
  "expectedBrand",
  "expectedModel",
  "priceRangeCny",
  "requiredFeatures",
  "topSellingPointKeywords",
  "minConfidence",
  "summaryMaxChars",
  "openaiExtractionStatus",
  "observedBrand",
  "observedModel",
  "observedCategory",
  "observedPrice",
  "observedConfidence",
  "evidencePass",
  "requiredFeaturesPass",
  "topSellingPointsPass",
  "deepseekSummaryStatus",
  "summaryChars",
  "summaryCoversFunction",
  "summaryCoversParams",
  "summaryCoversExperience",
  "localFallbackStatus",
  "manualReviewRequired",
  "manualFix",
  "result",
  "owner",
  "notes",
];

function readArg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : "";
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function cleanCell(value) {
  return String(value ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function csvCell(value) {
  const text = cleanCell(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function joinList(value) {
  return Array.isArray(value) ? value.join("、") : "";
}

function sourceRef(testCase) {
  const source = testCase.source || {};
  return source.type === "url" ? source.url || "" : source.path || "";
}

function sourceFormat(testCase) {
  const source = testCase.source || {};
  if (source.type === "url") return "url";
  if (source.format) return source.format;
  return /\.pdf$/i.test(source.path || "") ? "pdf" : "long-image";
}

function priceRange(testCase) {
  const range = testCase.expected?.priceRange;
  if (!range) return "";
  return `${range.currency || "CNY"} ${range.min}-${range.max}`;
}

function asText(value) {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function textIncludes(haystack, needle) {
  return asText(haystack).toLowerCase().includes(asText(needle).toLowerCase());
}

function normalize(value) {
  return asText(value).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "");
}

function fieldHasValue(value) {
  if (value == null) return false;
  if (typeof value === "boolean") return value === true;
  const text = cleanCell(value);
  return Boolean(text) && !/待确认|未知|不确定|n\/a|unknown/i.test(text);
}

function priceInRange(value, range) {
  const price = Number(value || 0);
  if (!price || !range) return "no";
  return price >= Number(range.min || 0) && price <= Number(range.max || Number.MAX_SAFE_INTEGER) ? "yes" : "no";
}

function matchExpected(observed, expected) {
  const observedText = normalize(observed);
  const expectedText = normalize(expected);
  if (!observedText || !expectedText) return false;
  return observedText.includes(expectedText) || expectedText.includes(observedText);
}

function matchKeywords(product, keywords) {
  const evidenceText = [
    product?.brand,
    product?.name,
    product?.model,
    product?.category,
    product?.price,
    JSON.stringify(product?.features || {}),
    JSON.stringify(product?.customFeatures || []),
    (product?.sellingPoints || []).map((point) => `${point.title || ""} ${point.evidence || ""}`).join(" "),
  ].join(" ");
  const hits = (keywords || []).filter((keyword) => textIncludes(evidenceText, keyword));
  if (!keywords?.length) return { status: "yes", hits };
  if (hits.length === keywords.length) return { status: "yes", hits };
  if (hits.length >= Math.ceil(keywords.length / 2)) return { status: "partial", hits };
  return { status: "no", hits };
}

function requiredFeaturesPass(product, requiredFeatures) {
  const features = product?.features || {};
  const custom = Object.fromEntries((product?.customFeatures || []).map((item) => [item.key, item.value]));
  const missing = (requiredFeatures || []).filter((key) => !fieldHasValue(features[key] ?? custom[key]));
  if (!missing.length) return { status: "yes", missing };
  if (missing.length < (requiredFeatures || []).length) return { status: "partial", missing };
  return { status: "no", missing };
}

function sellingPointEvidencePass(product) {
  const points = product?.sellingPoints || [];
  if (points.length < 3) return "no";
  const valid = points.filter((point) => fieldHasValue(point.title) && fieldHasValue(point.evidence));
  return valid.length >= 3 ? "yes" : valid.length ? "partial" : "no";
}

function extractionStatus(payload) {
  if (payload?.analysisMeta?.status === "fallback") return "fallback";
  if (payload?.warning) return "fallback-warning";
  if (payload?.product?.reviewRequired) return "ok-review-required";
  return "ok";
}

function manualReviewRequired(product, testCase, status, featurePass, keywordPass, brandPass, modelPass, categoryPass, pricePass) {
  const confidence = Number(product?.confidence || 0);
  const minConfidence = Number(testCase.acceptance?.minConfidence || 0);
  return [
    status !== "ok",
    product?.reviewRequired === true,
    confidence < minConfidence,
    featurePass !== "yes",
    keywordPass === "no",
    !brandPass,
    !modelPass,
    !categoryPass,
    pricePass !== "yes",
  ].some(Boolean)
    ? "yes"
    : "no";
}

function resultFor(row) {
  const blocking = [
    row.openaiExtractionStatus === "fallback",
    row.openaiExtractionStatus === "fallback-warning",
    row.evidencePass !== "yes",
    row.requiredFeaturesPass !== "yes",
    row.topSellingPointsPass === "no",
    row.manualReviewRequired === "yes",
    row.deepseekSummaryStatus.includes("fallback"),
    row.summaryCoversFunction !== "yes",
    row.summaryCoversParams !== "yes",
    row.summaryCoversExperience !== "yes",
    Number(row.summaryChars || 0) > Number(row.summaryMaxChars || 500),
  ];
  return blocking.some(Boolean) ? "needs-review" : "go";
}

async function postJson(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180000);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok && !payload.product) {
      throw new Error(payload.error || `HTTP ${response.status}`);
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

function defaultFeatureFields() {
  return [
    { key: "suction", module: "清洁能力", name: "吸力", type: "text" },
    { key: "mopPressure", module: "清洁能力", name: "拖地压力", type: "text" },
    { key: "edgeCleaning", module: "清洁能力", name: "贴边清洁", type: "boolean" },
    { key: "navigation", module: "导航避障", name: "导航方案", type: "text" },
    { key: "obstacle", module: "导航避障", name: "避障能力", type: "text" },
    { key: "base", module: "基站能力", name: "基站", type: "text" },
    { key: "hotWash", module: "基站能力", name: "热水洗拖布", type: "boolean" },
    { key: "dustCollection", module: "基站能力", name: "自动集尘", type: "boolean" },
    { key: "battery", module: "体验与售后", name: "续航", type: "text" },
    { key: "noise", module: "体验与售后", name: "噪音", type: "text" },
    { key: "app", module: "体验与售后", name: "APP/语音", type: "text" },
  ];
}

function featureFieldsFromState(statePayload) {
  const modules = statePayload?.state?.modules || statePayload?.modules || [];
  const fields = modules.flatMap((module) =>
    (module.fields || []).map((field) => ({
      key: field.key,
      module: module.name || field.module || "自定义模块",
      name: field.name,
      type: field.type || "text",
      options: field.options || [],
    })),
  );
  return fields.length ? fields : defaultFeatureFields();
}

function examplesFromState(statePayload, category) {
  const products = statePayload?.state?.products || statePayload?.products || [];
  return products
    .filter((product) => !category || product.category === category)
    .filter((product) => product.brand && product.model && product.confidence >= 70)
    .slice(0, 3)
    .map((product) => ({
      brand: product.brand,
      model: product.model,
      category: product.category,
      price: product.price,
      features: product.features || {},
      topSellingPoints: (product.sellingPoints || []).slice(0, 3).map((point) => point.title || point),
    }));
}

function readStatePayload() {
  if (!existsSync(statePath)) return {};
  try {
    return readJson(statePath);
  } catch {
    return {};
  }
}

function sourceNotes(testCase) {
  const source = testCase.source || {};
  const parts = [
    `Case ID: ${testCase.id}`,
    `期望品类: ${testCase.category}`,
    `期望品牌型号: ${testCase.expected?.brand || ""} ${testCase.expected?.model || ""}`,
    `必查功能字段: ${joinList(testCase.expected?.requiredFeatures)}`,
    `Top3 卖点关键词: ${joinList(testCase.expected?.topSellingPointKeywords)}`,
    source.notes || "",
  ];

  if (source.type === "file" && source.path && /\.svg$/i.test(source.path)) {
    const text = readFileSync(join(root, source.path), "utf8")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
    parts.push(`长图夹具文字摘录: ${text}`);
  }

  return parts.filter(Boolean).join("\n");
}

function fileAttachment(testCase) {
  const source = testCase.source || {};
  if (source.type !== "file" || !source.path || !/\.pdf$/i.test(source.path)) return null;
  const path = join(root, source.path);
  const data = readFileSync(path);
  return {
    filename: basename(source.path),
    mimeType: "application/pdf",
    size: data.length,
    fileDataUrl: `data:application/pdf;base64,${data.toString("base64")}`,
  };
}

function analysisPayloadForCase(testCase, statePayload) {
  const source = testCase.source || {};
  const payload = {
    sourceUrl: source.url || "",
    notes: sourceNotes(testCase),
    featureFields: featureFieldsFromState(statePayload),
    analysisExamples: examplesFromState(statePayload, testCase.category),
    sourceMetadata: {
      url: source.url || "",
      title: `${testCase.expected?.brand || ""} ${testCase.expected?.model || ""}`.trim(),
      description: source.notes || "",
    },
  };
  const attachment = fileAttachment(testCase);
  if (attachment) payload.fileAttachment = attachment;
  return payload;
}

function productRow(testCase, payload) {
  const product = payload.product || payload || {};
  const status = extractionStatus(payload);
  const required = requiredFeaturesPass(product, testCase.expected?.requiredFeatures || []);
  const keywords = matchKeywords(product, testCase.expected?.topSellingPointKeywords || []);
  const brandPass = matchExpected(product.brand, testCase.expected?.brand);
  const modelPass = matchExpected(product.model || product.name, testCase.expected?.model);
  const categoryPass = product.category === testCase.category;
  const pricePass = priceInRange(product.price, testCase.expected?.priceRange);
  const reviewRequired = manualReviewRequired(
    product,
    testCase,
    status,
    required.status,
    keywords.status,
    brandPass,
    modelPass,
    categoryPass,
    pricePass,
  );
  const notes = [
    `provider=${payload.analysisMeta?.provider || "unknown"}`,
    `model=${payload.analysisMeta?.model || "unknown"}`,
    `brandPass=${brandPass ? "yes" : "no"}`,
    `modelPass=${modelPass ? "yes" : "no"}`,
    `categoryPass=${categoryPass ? "yes" : "no"}`,
    `pricePass=${pricePass}`,
    required.missing.length ? `missingFeatures=${required.missing.join("/")}` : "",
    keywords.hits.length ? `keywordHits=${keywords.hits.join("/")}` : "keywordHits=none",
    payload.warning ? `warning=${payload.warning}` : "",
  ];

  const row = {
    caseId: testCase.id,
    category: testCase.category,
    sourceType: testCase.source?.type || "",
    sourceFormat: sourceFormat(testCase),
    sourceRef: sourceRef(testCase),
    expectedBrand: testCase.expected?.brand || "",
    expectedModel: testCase.expected?.model || "",
    priceRangeCny: priceRange(testCase),
    requiredFeatures: joinList(testCase.expected?.requiredFeatures),
    topSellingPointKeywords: joinList(testCase.expected?.topSellingPointKeywords),
    minConfidence: testCase.acceptance?.minConfidence || "",
    summaryMaxChars: testCase.acceptance?.summaryMaxChars || 500,
    openaiExtractionStatus: status,
    observedBrand: product.brand || "",
    observedModel: product.model || product.name || "",
    observedCategory: product.category || "",
    observedPrice: product.price ?? "",
    observedConfidence: product.confidence ?? "",
    evidencePass: sellingPointEvidencePass(product),
    requiredFeaturesPass: required.status,
    topSellingPointsPass: keywords.status,
    deepseekSummaryStatus: "pending",
    summaryChars: "",
    summaryCoversFunction: "pending",
    summaryCoversParams: "pending",
    summaryCoversExperience: "pending",
    localFallbackStatus: status.includes("fallback") ? "yes" : "no",
    manualReviewRequired: reviewRequired,
    manualFix: reviewRequired === "yes" ? "需要人工复核低置信/缺失字段后再进入 M5" : "",
    result: "pending",
    owner: "Codex",
    notes: notes.filter(Boolean).join("; "),
    product,
  };
  return row;
}

function summaryChecks(summary, maxChars) {
  const chars = Array.from(summary || "").length;
  return {
    chars,
    functionPass: /功能|清洁|吸力|拖地|避障|基站|过滤|除尘|边角|APP|应用/.test(summary || "") ? "yes" : "no",
    paramsPass: /参数|Pa|AW|分钟|续航|dB|价格|元|水箱|热水|集尘|功率|mm|°F|℃|LCD/.test(summary || "") ? "yes" : "no",
    experiencePass: /体验|使用|噪音|维护|自清洁|省心|易用|场景|家庭|待验证|短板/.test(summary || "") ? "yes" : "no",
    lengthPass: chars <= Number(maxChars || 500),
  };
}

async function run() {
  if (!existsSync(casesPath)) throw new Error(`Missing ${casesPath}`);
  mkdirSync(join(root, "reports"), { recursive: true });
  if (existsSync(resultsPath) && !existsSync(backupPath)) {
    writeFileSync(backupPath, readFileSync(resultsPath));
  }

  const health = await getJson("/api/health");
  const statePayload = await getJson("/api/state").catch(() => ({}));
  const casesPayload = readJson(casesPath);
  const cases = casesPayload.cases || [];
  const featureFields = featureFieldsFromState(statePayload);
  const rows = [];

  console.log(`Eval calibration started: ${cases.length} cases, base=${baseUrl}`);
  console.log(`Providers: extraction=${health.aiProvider || "openai"} compare=${health.compareProvider || "openai"}`);

  for (const testCase of cases) {
    const source = testCase.source || {};
    const payload = {
      sourceUrl: source.url || "",
      notes: sourceNotes(testCase),
      featureFields,
      analysisExamples: examplesFromState(statePayload, testCase.category),
      sourceMetadata: {
        url: source.url || "",
        title: `${testCase.expected?.brand || ""} ${testCase.expected?.model || ""}`.trim(),
        description: source.notes || "",
      },
    };
    const attachment = fileAttachment(testCase);
    if (attachment) payload.fileAttachment = attachment;

    try {
      const analysis = await postJson("/api/analyze", payload);
      const row = productRow(testCase, analysis);
      rows.push(row);
      console.log(`${testCase.id}: ${row.openaiExtractionStatus}, ${row.observedBrand} ${row.observedModel}, review=${row.manualReviewRequired}`);
    } catch (error) {
      rows.push({
        caseId: testCase.id,
        category: testCase.category,
        sourceType: source.type || "",
        sourceFormat: sourceFormat(testCase),
        sourceRef: sourceRef(testCase),
        expectedBrand: testCase.expected?.brand || "",
        expectedModel: testCase.expected?.model || "",
        priceRangeCny: priceRange(testCase),
        requiredFeatures: joinList(testCase.expected?.requiredFeatures),
        topSellingPointKeywords: joinList(testCase.expected?.topSellingPointKeywords),
        minConfidence: testCase.acceptance?.minConfidence || "",
        summaryMaxChars: testCase.acceptance?.summaryMaxChars || 500,
        openaiExtractionStatus: "request-error",
        observedBrand: "",
        observedModel: "",
        observedCategory: "",
        observedPrice: "",
        observedConfidence: "",
        evidencePass: "no",
        requiredFeaturesPass: "no",
        topSellingPointsPass: "no",
        deepseekSummaryStatus: "pending",
        summaryChars: "",
        summaryCoversFunction: "pending",
        summaryCoversParams: "pending",
        summaryCoversExperience: "pending",
        localFallbackStatus: "yes",
        manualReviewRequired: "yes",
        manualFix: "请求失败，需要确认本地服务、网络或模型配置",
        result: "needs-review",
        owner: "Codex",
        notes: `error=${error.message}`,
        product: null,
      });
      console.log(`${testCase.id}: request-error ${error.message}`);
    }
  }

  const byCategory = new Map();
  for (const row of rows) {
    if (!row.product) continue;
    const list = byCategory.get(row.category) || [];
    list.push(row);
    byCategory.set(row.category, list);
  }

  for (const [category, categoryRows] of byCategory.entries()) {
    const products = categoryRows.map((row) => row.product).slice(0, 5);
    let summaryPayload = { summary: "", analysisMeta: { provider: health.compareProvider || "openai" } };
    try {
      summaryPayload = await postJson("/api/compare", { products });
    } catch (error) {
      summaryPayload = { summary: "", analysisMeta: { provider: health.compareProvider || "openai" }, warning: error.message };
    }
    const summary = summaryPayload.summary || "";
    const checks = summaryChecks(summary, categoryRows[0]?.summaryMaxChars || 500);
    const provider = summaryPayload.analysisMeta?.provider || health.compareProvider || "openai";
    const summaryStatus = summary ? `${provider}-ok` : `${provider}-fallback-empty`;
    for (const row of categoryRows) {
      row.deepseekSummaryStatus = summaryStatus;
      row.summaryChars = checks.chars;
      row.summaryCoversFunction = checks.functionPass;
      row.summaryCoversParams = checks.paramsPass;
      row.summaryCoversExperience = checks.experiencePass;
      row.notes = [row.notes, `summaryProvider=${provider}`, summaryPayload.warning ? `summaryWarning=${summaryPayload.warning}` : ""]
        .filter(Boolean)
        .join("; ");
    }
    console.log(`${category}: summary ${summaryStatus}, chars=${checks.chars}`);
  }

  for (const row of rows) {
    row.result = row.result === "needs-review" ? row.result : resultFor(row);
    delete row.product;
  }

  const csv = [
    csvHeaders.map(csvCell).join(","),
    ...rows.map((row) => csvHeaders.map((header) => csvCell(row[header])).join(",")),
  ].join("\n");
  writeFileSync(resultsPath, `\uFEFF${csv}\n`, "utf8");

  const resultCounts = rows.reduce((acc, row) => {
    acc[row.result] = (acc[row.result] || 0) + 1;
    return acc;
  }, {});
  const reviewCount = rows.filter((row) => row.manualReviewRequired === "yes").length;
  console.log(`Eval calibration results written: ${resultsPath}`);
  console.log(`Backup: ${existsSync(backupPath) ? backupPath : "not created"}`);
  console.log(`Result counts: ${JSON.stringify(resultCounts)}, manualReview=${reviewCount}`);
}

function prepareAnalysisRequests(dir) {
  const casesPayload = readJson(casesPath);
  const cases = casesPayload.cases || [];
  const statePayload = readStatePayload();
  const analyzeDir = join(root, dir, "analyze");
  mkdirSync(analyzeDir, { recursive: true });
  for (const testCase of cases) {
    writeJson(join(analyzeDir, `${testCase.id}.json`), analysisPayloadForCase(testCase, statePayload));
  }
  writeJson(join(root, dir, "manifest.json"), {
    baseUrl,
    dateStamp,
    cases: cases.map((testCase) => ({ id: testCase.id, category: testCase.category })),
  });
  console.log(`Prepared ${cases.length} analyze request file(s): ${analyzeDir}`);
}

function prepareCompareRequests(dir) {
  const casesPayload = readJson(casesPath);
  const cases = casesPayload.cases || [];
  const analyzeResponseDir = join(root, dir, "responses", "analyze");
  const compareDir = join(root, dir, "compare");
  mkdirSync(compareDir, { recursive: true });
  const byCategory = new Map();

  for (const testCase of cases) {
    const responsePath = join(analyzeResponseDir, `${testCase.id}.json`);
    if (!existsSync(responsePath)) continue;
    const response = readJson(responsePath);
    if (!response.product) continue;
    const list = byCategory.get(testCase.category) || [];
    list.push(response.product);
    byCategory.set(testCase.category, list);
  }

  const compareCases = [];
  for (const [category, products] of byCategory.entries()) {
    const filename = `${encodeURIComponent(category)}.json`;
    writeJson(join(compareDir, filename), { products: products.slice(0, 5) });
    compareCases.push({ category, filename });
  }
  writeJson(join(root, dir, "compare-manifest.json"), { baseUrl, dateStamp, compareCases });
  console.log(`Prepared ${compareCases.length} compare request file(s): ${compareDir}`);
}

function finalizeFromDir(dir) {
  if (!existsSync(casesPath)) throw new Error(`Missing ${casesPath}`);
  mkdirSync(join(root, "reports"), { recursive: true });
  if (existsSync(resultsPath) && !existsSync(backupPath)) {
    writeFileSync(backupPath, readFileSync(resultsPath));
  }

  const casesPayload = readJson(casesPath);
  const cases = casesPayload.cases || [];
  const analyzeResponseDir = join(root, dir, "responses", "analyze");
  const compareResponseDir = join(root, dir, "responses", "compare");
  const compareManifestPath = join(root, dir, "compare-manifest.json");
  const rows = cases.map((testCase) => {
    const responsePath = join(analyzeResponseDir, `${testCase.id}.json`);
    if (!existsSync(responsePath)) {
      return productRow(testCase, {
        product: null,
        analysisMeta: { status: "fallback" },
        warning: "缺少 analyze 响应文件",
      });
    }
    return productRow(testCase, readJson(responsePath));
  });

  const compareManifest = existsSync(compareManifestPath) ? readJson(compareManifestPath) : { compareCases: [] };
  for (const item of compareManifest.compareCases || []) {
    const responsePath = join(compareResponseDir, item.filename);
    const summaryPayload = existsSync(responsePath)
      ? readJson(responsePath)
      : { summary: "", analysisMeta: { provider: "unknown" }, warning: "缺少 compare 响应文件" };
    const categoryRows = rows.filter((row) => row.category === item.category);
    const checks = summaryChecks(summaryPayload.summary || "", categoryRows[0]?.summaryMaxChars || 500);
    const provider = summaryPayload.analysisMeta?.provider || "unknown";
    const summaryStatus = summaryPayload.summary ? `${provider}-ok` : `${provider}-fallback-empty`;
    for (const row of categoryRows) {
      row.deepseekSummaryStatus = summaryStatus;
      row.summaryChars = checks.chars;
      row.summaryCoversFunction = checks.functionPass;
      row.summaryCoversParams = checks.paramsPass;
      row.summaryCoversExperience = checks.experiencePass;
      row.notes = [row.notes, `summaryProvider=${provider}`, summaryPayload.warning ? `summaryWarning=${summaryPayload.warning}` : ""]
        .filter(Boolean)
        .join("; ");
    }
  }

  for (const row of rows) {
    if (row.deepseekSummaryStatus === "pending") {
      row.deepseekSummaryStatus = "missing";
      row.summaryChars = 0;
      row.summaryCoversFunction = "no";
      row.summaryCoversParams = "no";
      row.summaryCoversExperience = "no";
    }
    row.result = resultFor(row);
    delete row.product;
  }

  const csv = [
    csvHeaders.map(csvCell).join(","),
    ...rows.map((row) => csvHeaders.map((header) => csvCell(row[header])).join(",")),
  ].join("\n");
  writeFileSync(resultsPath, `\uFEFF${csv}\n`, "utf8");

  const resultCounts = rows.reduce((acc, row) => {
    acc[row.result] = (acc[row.result] || 0) + 1;
    return acc;
  }, {});
  const reviewCount = rows.filter((row) => row.manualReviewRequired === "yes").length;
  console.log(`Eval calibration results written: ${resultsPath}`);
  console.log(`Backup: ${existsSync(backupPath) ? backupPath : "not created"}`);
  console.log(`Result counts: ${JSON.stringify(resultCounts)}, manualReview=${reviewCount}`);
}

const entrypoint = prepareDir
  ? () => prepareAnalysisRequests(prepareDir)
  : prepareCompareDir
    ? () => prepareCompareRequests(prepareCompareDir)
    : finalizeDir
      ? () => finalizeFromDir(finalizeDir)
      : run;

Promise.resolve()
  .then(entrypoint)
  .catch((error) => {
  console.error(`Eval calibration failed: ${error.message}`);
  process.exit(1);
  });
