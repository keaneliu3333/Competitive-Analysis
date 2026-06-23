#!/usr/bin/env node

import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function invoke(server, { method = "GET", url = "/", headers = {}, body = "" } = {}) {
  return new Promise((resolve, reject) => {
    const handler = server.listeners("request")[0];
    assert(typeof handler === "function", "createAppServer must register a request handler");

    const request = Readable.from(body ? [Buffer.from(body)] : []);
    request.method = method;
    request.url = url;
    request.headers = {
      host: "localhost",
      ...(body ? { "content-type": "application/json", "content-length": Buffer.byteLength(body) } : {}),
      ...headers,
    };

    const chunks = [];
    const response = {
      statusCode: 200,
      headers: {},
      writeHead(statusCode, responseHeaders = {}) {
        this.statusCode = statusCode;
        this.headers = { ...this.headers, ...responseHeaders };
      },
      end(chunk = "") {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        resolve({
          status: this.statusCode,
          headers: this.headers,
          body: Buffer.concat(chunks).toString("utf8"),
        });
      },
    };

    Promise.resolve(handler(request, response)).catch(reject);
  });
}

async function requestJson(server, path) {
  const response = await invoke(server, { url: path });
  assert(response.status >= 200 && response.status < 300, `${path} returned HTTP ${response.status}`);
  return JSON.parse(response.body);
}

async function requestText(server, path) {
  const response = await invoke(server, { url: path });
  assert(response.status >= 200 && response.status < 300, `${path} returned HTTP ${response.status}`);
  return response.body;
}

async function postJson(server, path, payload) {
  const response = await invoke(server, {
    method: "POST",
    url: path,
    body: JSON.stringify(payload),
  });
  assert(response.status >= 200 && response.status < 300, `${path} returned HTTP ${response.status}`);
  return JSON.parse(response.body);
}

const root = process.cwd();
const usagePath = join(root, "data", "api-usage.json");
const usageBackup = existsSync(usagePath) ? await readFile(usagePath, "utf8") : null;

process.env.AI_PROVIDER = "deepseek";
process.env.COMPARE_AI_PROVIDER = "deepseek";
process.env.VISION_PROVIDER = "qwen";
process.env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "runtime-verifier-deepseek-key";
process.env.DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-runtime-verifier";
process.env.QWEN_API_KEY = process.env.QWEN_API_KEY || "runtime-verifier-qwen-key";
process.env.QWEN_MODEL = process.env.QWEN_MODEL || "qwen-runtime-verifier";
process.env.QWEN_BASE_URL = process.env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
process.env.AI_HTTPS_PROXY = "";
process.env.HTTPS_PROXY = "";
process.env.https_proxy = "";
process.env.HTTP_PROXY = "";
process.env.http_proxy = "";

const { createAppServer } = await import("../server.mjs");

const server = createAppServer();
const originalFetch = globalThis.fetch;

try {
  const health = await requestJson(server, "/api/health");
  assert(health.ok === true, "health.ok must be true");
  assert(typeof health.model === "string" && health.model.length > 0, "health.model is required");
  assert(health.compareProvider === "deepseek", "health.compareProvider should expose DeepSeek compare provider in runtime verification");
  assert(health.visionProvider === "qwen", "health.visionProvider should expose Qwen vision provider in runtime verification");
  assert(health.deepseekConfigured === true, "health.deepseekConfigured should be true when DEEPSEEK_API_KEY is set");
  assert(health.qwenConfigured === true, "health.qwenConfigured should be true when QWEN_API_KEY is set");
  assert(health.qwenModel === process.env.QWEN_MODEL, "health.qwenModel should expose configured Qwen model");

  const state = await requestJson(server, "/api/state");
  assert("savedViews" in state, "/api/state must return savedViews");

  const usage = await requestJson(server, "/api/usage");
  assert(Array.isArray(usage.recent), "/api/usage must return recent array");

  const insufficientAnalysis = await invoke(server, {
    method: "POST",
    url: "/api/analyze",
    body: JSON.stringify({
      sourceUrl: "https://detail.tmall.com/item.htm?id=1018823558209",
      sourceMetadata: {
        platform: "天猫",
        title: "天猫商品 1018823558209",
        description: "天猫详情页链接已识别；动态详情、价格、参数和图片可能需要截图或长图兜底。",
        fetchWarning: "天猫页面通常会动态加载或限制服务端抓取。",
        textSnippets: ["平台：天猫", "商品 ID：1018823558209", "页面可能需要登录或动态加载；请上传详情页截图或长图补充分析。"],
        priceCandidates: [],
        imageCandidates: [],
      },
    }),
  });
  assert(insufficientAnalysis.status === 422, "/api/analyze should reject URL-only commerce input without product evidence");
  assert(
    JSON.parse(insufficientAnalysis.body).error.includes("请使用“打开浏览器获取”"),
    "/api/analyze insufficient evidence error should require browser-assisted detail capture",
  );

  const missingBrowserSession = await invoke(server, {
    method: "POST",
    url: "/api/browser-fetch/collect",
    body: JSON.stringify({ sessionId: "missing-session" }),
  });
  assert(missingBrowserSession.status === 404, "/api/browser-fetch/collect should reject missing sessions");
  assert(
    JSON.parse(missingBrowserSession.body).error.includes("会话已失效"),
    "/api/browser-fetch/collect missing session error should be actionable",
  );

  const manualImport = await postJson(server, "/api/manual-capture/import", {
    sourceUrl: "https://item.jd.com/100327075896.html",
    title: "京东测试详情页",
    screenshots: ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w=="],
  });
  assert(manualImport.ok === true, "/api/manual-capture/import should accept extension screenshots");
  assert(manualImport.screenshotCount === 1, "/api/manual-capture/import should report screenshot count");
  const latestManualImport = await requestJson(server, "/api/manual-capture/latest");
  assert(latestManualImport.item?.id === manualImport.id, "/api/manual-capture/latest should return latest extension import");
  assert(latestManualImport.item?.sourceScreenshotDataUrls?.length === 1, "/api/manual-capture/latest should include screenshot data urls");

  const html = await requestText(server, "/");
  for (const token of ["清洁电器竞品分析工作台", "workspace-nav", "filterSummary", "compareStatus", "compareFilteredProducts", "compareSimilarProducts", "sourceImage", "manualCapturePanel", "openExternalBrowser", "refreshManualCapture", "manualCaptureStatus", "comparePicker", "roadmapBoard", "data-roadmap-mode", "exportDataPackage"]) {
    assert(html.includes(token), `index page missing ${token}`);
  }

  const script = await requestText(server, "/script.js");
  for (const token of ["scrollToWorkspace", "renderFilterSummary", "renderCompareStatus", "compareFilteredProducts", "compareSimilarProducts", "renderRoadmapTimeline", "renderRoadmapBrandCompare", "runAnalysis", "shouldUseManualCaptureFlow", "handleAnalysisPaste", "refreshManualCaptureImport", "brandRoadmapReportHtml", "normalizeComparisonSummary"]) {
    assert(script.includes(token), `script.js missing ${token}`);
  }

  const styles = await requestText(server, "/styles.css");
  for (const token of [".filter-summary", ".compare-status", ".compare-option input", ".roadmap-chart", ".roadmap-axis-tick", ".comparison-summary"]) {
    assert(styles.includes(token), `styles.css missing ${token}`);
  }

  globalThis.fetch = async () => {
    throw new Error("runtime verifier blocks external model calls");
  };
  const analysis = await postJson(server, "/api/analyze", {
    sourceUrl: "https://example.com/floor-washer",
    notes: "洗地机详情页，重点关注自清洁和贴边能力。",
    imageDataUrls: ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w=="],
    featureFields: [
      { key: "hotWash", name: "热水洗", type: "boolean" },
      { key: "base", name: "基站", type: "text" },
    ],
  });
  assert(analysis.product?.reviewRequired === true, "/api/analyze fallback must require review");
  assert(analysis.product?.category === "洗地机", "/api/analyze fallback should infer floor washer category");
  assert(analysis.product?.customFeatures?.length === 2, "/api/analyze fallback should preserve custom feature fields");
  assert(analysis.analysisMeta?.status === "fallback", "/api/analyze must return fallback status when model call fails");

  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = String(url);
    assert(requestUrl.includes("/chat/completions"), "Qwen vision analysis should use chat completions endpoint");
    const body = JSON.parse(options.body || "{}");
    assert(body.model === process.env.QWEN_MODEL, "Qwen vision analysis should use configured model");
    const userMessage = body.messages?.find((message) => message.role === "user");
    assert(Array.isArray(userMessage?.content), "Qwen vision analysis should send multimodal user content");
    assert(userMessage.content.some((item) => item.type === "image_url"), "Qwen vision analysis should include image_url input");
    assert(body.response_format?.type === "json_object", "Qwen vision analysis should request JSON object output");
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          id: "qwen-runtime-response",
          model: body.model,
          usage: { prompt_tokens: 180, completion_tokens: 90, total_tokens: 270 },
          choices: [
            {
              message: {
                content: JSON.stringify({
                  brand: "QwenTest",
                  name: "Qwen 视觉测试扫地机",
                  model: "QV1",
                  category: "扫地机",
                  price: 3999,
                  channel: "电商",
                  status: "在售",
                  image: "",
                  confidence: 88,
                  reviewRequired: false,
                  sourceUrl: "https://example.com/qwen-vision",
                  quarter: "2026 Q2",
                  features: {
                    suction: "12000Pa",
                    mopPressure: "待确认",
                    edgeCleaning: true,
                    navigation: "LDS",
                    obstacle: "AI 识别",
                    base: "全能基站",
                    hotWash: true,
                    dustCollection: true,
                    battery: "180min",
                    noise: "约 63dB",
                    app: "地图分区",
                  },
                  customFeatures: [
                    { key: "hotWash", value: true, evidence: "详情页图片显示热水洗", confidence: 88 },
                  ],
                  sellingPoints: [
                    { title: "热水洗拖布", evidence: "详情页图片参数" },
                    { title: "高吸力", evidence: "详情页图片参数" },
                    { title: "全能基站", evidence: "详情页图片参数" },
                  ],
                }),
              },
            },
          ],
        };
      },
    };
  };

  const qwenAnalysis = await postJson(server, "/api/analyze", {
    sourceUrl: "https://example.com/qwen-vision",
    sourceMetadata: { title: "Qwen 视觉测试扫地机", imageCandidates: [] },
    imageDataUrls: ["data:image/png;base64,iVBORw0KGgo="],
    featureFields: [{ key: "hotWash", name: "热水洗", type: "boolean" }],
  });
  assert(qwenAnalysis.product?.model === "QV1", "/api/analyze should return Qwen vision analysis product");
  assert(qwenAnalysis.analysisMeta?.provider === "qwen", "/api/analyze should return Qwen analysis provider for image input");
  assert(qwenAnalysis.analysisMeta?.model === process.env.QWEN_MODEL, "/api/analyze should return configured Qwen model");
  assert(qwenAnalysis.analysisMeta?.usage?.total_tokens === 270, "/api/analyze should return Qwen usage");

  const usageAfterQwen = await requestJson(server, "/api/usage");
  const qwenUsageRecord = usageAfterQwen.recent.find((record) => record.responseId === "qwen-runtime-response");
  assert(qwenUsageRecord?.provider === "qwen", "/api/usage should include Qwen provider record");
  assert(qwenUsageRecord?.model === process.env.QWEN_MODEL, "/api/usage should include Qwen model");
  assert(qwenUsageRecord?.inputModalities?.some((item) => item === "qwen:image"), "/api/usage should include Qwen image modality");

  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = String(url);
    assert(requestUrl.includes("/chat/completions"), "DeepSeek compare summary should use chat completions endpoint");
    const body = JSON.parse(options.body || "{}");
    assert(body.model === process.env.DEEPSEEK_MODEL, "DeepSeek compare summary should use configured model");
    assert(body.response_format?.type === "json_object", "DeepSeek compare summary should request JSON object output");
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          id: "deepseek-runtime-response",
          model: body.model,
          usage: { prompt_tokens: 120, completion_tokens: 80, total_tokens: 200 },
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary:
                    "A1 与 B1 都面向扫地机核心清洁场景。功能上，A1 的全能基站和热水洗拖布更适合少维护、重体验的旗舰定位；B1 主打高吸力和基础基站，适合价格敏感用户。参数上两者价差约 1000 元，应重点核对基站能力、拖布清洁和避障表现。使用感受上，A1 更强调省心，B1 更强调性价比，短板需回到详情页证据复核。",
                }),
              },
            },
          ],
        };
      },
    };
  };

  const comparison = await postJson(server, "/api/compare", {
    products: [
      { brand: "A", model: "A1", category: "扫地机", price: 3999, topSellingPoints: ["热水洗拖布"], differenceFields: [{ name: "基站", value: "全能" }] },
      { brand: "B", model: "B1", category: "扫地机", price: 2999, topSellingPoints: ["高吸力"], differenceFields: [{ name: "基站", value: "基础" }] },
    ],
  });
  assert(comparison.summary.includes("产品功能") || comparison.summary.includes("功能上"), "/api/compare should return DeepSeek summary text");
  assert(Array.from(comparison.summary).length <= 500, "/api/compare summary must stay within 500 Chinese characters");
  assert(comparison.analysisMeta?.provider === "deepseek", "/api/compare should return DeepSeek analysis provider");
  assert(comparison.analysisMeta?.model === process.env.DEEPSEEK_MODEL, "/api/compare should return configured DeepSeek model");
  assert(comparison.analysisMeta?.usage?.total_tokens === 200, "/api/compare should return DeepSeek usage");

  const usageAfterCompare = await requestJson(server, "/api/usage");
  const usageRecord = usageAfterCompare.recent.find((record) => record.responseId === "deepseek-runtime-response");
  assert(usageRecord?.provider === "deepseek", "/api/usage should include DeepSeek provider record");
  assert(usageRecord?.model === process.env.DEEPSEEK_MODEL, "/api/usage should include DeepSeek model");
  assert(usageRecord?.usage?.total_tokens === 200, "/api/usage should include DeepSeek token usage");

  globalThis.fetch = async () => {
    throw new Error("runtime verifier blocks external model calls");
  };
  const fallbackComparison = await postJson(server, "/api/compare", {
    products: [
      { brand: "A", model: "A1", category: "扫地机", price: 3999, topSellingPoints: ["热水洗拖布"] },
      { brand: "B", model: "B1", category: "扫地机", price: 2999, topSellingPoints: ["高吸力"] },
    ],
  });
  assert(fallbackComparison.summary === "", "/api/compare fallback should return an empty summary for local UI fallback");

} finally {
  globalThis.fetch = originalFetch;
  if (usageBackup == null) {
    await rm(usagePath, { force: true });
  } else {
    await mkdir(join(root, "data"), { recursive: true });
    await writeFile(usagePath, usageBackup);
  }
}

console.log("Runtime verification passed.");
console.log("- Checked local HTTP app, static assets, read APIs, AI fallback APIs, Qwen vision routing, and DeepSeek compare usage logging through in-memory request injection.");
