import { createServer } from "node:http";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { connect as tlsConnect } from "node:tls";
import { fileURLToPath, pathToFileURL } from "node:url";

const modulePath = fileURLToPath(import.meta.url);
const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const env = loadEnv();
const host = env.HOST || "127.0.0.1";
const statePath = join(root, "data", "workbench-state.json");
const usagePath = join(root, "data", "api-usage.json");
const maxAnalysisFileBytes = 100 * 1024 * 1024;
const maxJsonBodyBytes = 140 * 1024 * 1024;
const maxModelImageDataUrlChars = 4_000_000;
const maxModelImageCount = 32;
const maxAutoSourceImageCount = Number(env.AUTO_SOURCE_IMAGE_COUNT || 4);
const maxAutoSourceImageBytes = Number(env.AUTO_SOURCE_IMAGE_BYTES || Math.floor(2.5 * 1024 * 1024));
const maxAutoSourceImageDataUrlChars = Number(env.AUTO_SOURCE_IMAGE_DATA_URL_CHARS || 3_000_000);
const minAutoSourceImageWidth = Number(env.AUTO_SOURCE_IMAGE_MIN_WIDTH || 640);
const minAutoSourceImageShortEdge = Number(env.AUTO_SOURCE_IMAGE_MIN_SHORT_EDGE || 320);
const minAutoSourceImagePixels = Number(env.AUTO_SOURCE_IMAGE_MIN_PIXELS || 250_000);
const browserScreenshotWidth = Number(env.BROWSER_FETCH_SCREENSHOT_WIDTH || 1365);
const browserScreenshotHeight = Number(env.BROWSER_FETCH_SCREENSHOT_HEIGHT || 1600);
const maxBrowserScreenshotCount = Math.min(maxModelImageCount, Number(env.BROWSER_FETCH_SCREENSHOT_COUNT || 32));
const maxBrowserScreenshotScrollHeight = Number(env.BROWSER_FETCH_SCREENSHOT_MAX_SCROLL_HEIGHT || 60000);
const browserFetchDomReadTimeoutMs = Number(env.BROWSER_FETCH_DOM_READ_TIMEOUT_MS || 8000);
const browserFetchScreenshotTimeoutMs = Number(env.BROWSER_FETCH_SCREENSHOT_TIMEOUT_MS || 10000);
const browserFetchCollectTimeoutMs = Number(env.BROWSER_FETCH_COLLECT_TIMEOUT_MS || 120000);
const browserFetchSessions = new Map();
const browserFetchProfileRootDir = env.BROWSER_FETCH_PROFILE_DIR || join(root, ".tmp", "browser-fetch-profile");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
};

function loadEnv() {
  const result = { ...process.env };
  const envPath = join(root, ".env.local");
  if (!existsSync(envPath)) return result;
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!(key in result)) {
      result[key] = rest.join("=").replace(/^["']|["']$/g, "");
    }
  }
  return result;
}

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data));
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function accessTokens() {
  return {
    legacy: env.APP_ACCESS_TOKEN || "",
    read: env.APP_READ_TOKEN || "",
    write: env.APP_WRITE_TOKEN || "",
  };
}

function hasConfiguredAccessToken() {
  const tokens = accessTokens();
  return Boolean(tokens.legacy || tokens.read || tokens.write);
}

function isReadAuthorized(request) {
  const tokens = accessTokens();
  if (!hasConfiguredAccessToken()) return true;
  const token = request.headers["x-app-token"] || "";
  return Boolean(token && [tokens.legacy, tokens.read, tokens.write].includes(token));
}

function isWriteAuthorized(request) {
  const tokens = accessTokens();
  if (!hasConfiguredAccessToken()) return true;
  const token = request.headers["x-app-token"] || "";
  if (!token) return false;
  if (tokens.write && token === tokens.write) return true;
  return Boolean(tokens.legacy && token === tokens.legacy);
}

function accessStatus() {
  const tokens = accessTokens();
  return {
    accessTokenRequired: hasConfiguredAccessToken(),
    readTokenRequired: Boolean(tokens.read || tokens.write || tokens.legacy),
    writeTokenRequired: Boolean(tokens.write || tokens.legacy || tokens.read),
    readWriteSplitEnabled: Boolean(tokens.read || tokens.write),
  };
}

function configuredBaseUrl(key, fallback) {
  return String(env[key] || fallback).replace(/\/+$/, "");
}

function openAIResponsesUrl() {
  return `${configuredBaseUrl("OPENAI_BASE_URL", "https://api.openai.com/v1")}/responses`;
}

function deepSeekChatUrl() {
  return `${configuredBaseUrl("DEEPSEEK_BASE_URL", "https://api.deepseek.com")}/chat/completions`;
}

function qwenChatUrl() {
  return `${configuredBaseUrl("QWEN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")}/chat/completions`;
}

function aiRequestTimeoutMs(provider = "") {
  const value = Number(provider === "qwen" ? env.QWEN_REQUEST_TIMEOUT_MS || env.AI_REQUEST_TIMEOUT_MS || 60000 : env.AI_REQUEST_TIMEOUT_MS || 60000);
  if (!Number.isFinite(value) || value <= 0) return 60000;
  return Math.min(Math.max(value, 5000), 180000);
}

function aiProxyUrl() {
  return env.AI_HTTPS_PROXY || env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy || "";
}

function proxyStatus() {
  const proxy = aiProxyUrl();
  if (!proxy) return { configured: false };
  try {
    const url = new URL(proxy);
    return { configured: true, protocol: url.protocol.replace(":", ""), host: url.hostname, port: url.port || "80" };
  } catch {
    return { configured: true, protocol: "invalid", host: "", port: "" };
  }
}

function responseLike(statusCode, body) {
  return {
    ok: statusCode >= 200 && statusCode < 300,
    status: statusCode,
    json: async () => JSON.parse(body || "{}"),
  };
}

function collectResponse(response) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    response.on("data", (chunk) => chunks.push(chunk));
    response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    response.on("error", reject);
  });
}

function proxyAuthHeader(proxyUrl) {
  if (!proxyUrl.username && !proxyUrl.password) return "";
  return `Basic ${Buffer.from(`${decodeURIComponent(proxyUrl.username)}:${decodeURIComponent(proxyUrl.password)}`).toString("base64")}`;
}

function fetchJsonViaHttpProxy(url, options, proxy, signal) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const proxyUrl = new URL(proxy);
    if (target.protocol !== "https:" || !["http:", "https:"].includes(proxyUrl.protocol)) {
      reject(new Error("Only HTTPS targets through HTTP(S) proxy are supported"));
      return;
    }
    const targetPort = target.port || "443";
    const proxyPort = proxyUrl.port || (proxyUrl.protocol === "https:" ? "443" : "80");
    const connectRequest = httpRequest({
      host: proxyUrl.hostname,
      port: proxyPort,
      method: "CONNECT",
      path: `${target.hostname}:${targetPort}`,
      headers: {
        Host: `${target.hostname}:${targetPort}`,
        ...(proxyAuthHeader(proxyUrl) ? { "Proxy-Authorization": proxyAuthHeader(proxyUrl) } : {}),
      },
    });
    let settled = false;
    const cleanup = () => {
      signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      connectRequest.destroy(new Error("AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    connectRequest.on("connect", (response, socket) => {
      if (response.statusCode !== 200) {
        cleanup();
        socket.destroy();
        reject(new Error(`Proxy CONNECT failed with HTTP ${response.statusCode}`));
        return;
      }
      const tlsSocket = tlsConnect({ socket, servername: target.hostname });
      tlsSocket.once("secureConnect", () => {
        const request = httpsRequest({
          host: target.hostname,
          port: targetPort,
          method: options.method || "GET",
          path: `${target.pathname}${target.search}`,
          headers: options.headers || {},
          createConnection: () => tlsSocket,
        }, async (providerResponse) => {
          try {
            const body = await collectResponse(providerResponse);
            cleanup();
            settled = true;
            resolve(responseLike(providerResponse.statusCode || 0, body));
          } catch (error) {
            cleanup();
            reject(error);
          }
        });
        request.on("error", (error) => {
          cleanup();
          if (!settled) reject(error);
        });
        if (options.body) request.write(options.body);
        request.end();
      });
      tlsSocket.on("error", (error) => {
        cleanup();
        reject(error);
      });
    });
    connectRequest.on("error", (error) => {
      cleanup();
      reject(error);
    });
    connectRequest.end();
  });
}

function providerNetworkMessage(provider, url, error) {
  const service = provider === "deepseek" ? "DeepSeek" : provider === "qwen" ? "Qwen-VL" : "OpenAI";
  const baseUrlKey = provider === "deepseek" ? "DEEPSEEK_BASE_URL" : provider === "qwen" ? "QWEN_BASE_URL" : "OPENAI_BASE_URL";
  const proxyHint = aiProxyUrl() ? "当前已配置代理，请确认代理程序正在运行。" : "如浏览器能访问但终端不行，可在 .env.local 配置 HTTPS_PROXY=http://127.0.0.1:9090。";
  const endpoint = (() => {
    try {
      return new URL(url).origin;
    } catch {
      return url;
    }
  })();
  const raw = error?.cause?.code || error?.code || error?.message || "network error";
  if (error?.name === "AbortError") {
    return `${service} 请求超时（${aiRequestTimeoutMs(provider)}ms）：无法连接 ${endpoint}。请检查网络、代理，或在 .env.local 配置可访问的 ${baseUrlKey}。${proxyHint}`;
  }
  return `${service} 网络请求失败：无法连接 ${endpoint}（${raw}）。请检查当前网络是否能访问该服务，或在 .env.local 配置可访问的 ${baseUrlKey}。${proxyHint}`;
}

async function fetchProviderJson(provider, url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), aiRequestTimeoutMs(provider));
  try {
    const proxy = aiProxyUrl();
    const response = proxy
      ? await fetchJsonViaHttpProxy(url, options, proxy, controller.signal)
      : await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  } catch (error) {
    throw new Error(providerNetworkMessage(provider, url, error));
  } finally {
    clearTimeout(timer);
  }
}

function requireAccess(request, response, scope = "read") {
  const authorized = scope === "write" ? isWriteAuthorized(request) : isReadAuthorized(request);
  if (authorized) return true;
  sendJson(response, scope === "write" ? 403 : 401, {
    error: scope === "write" ? "Forbidden" : "Unauthorized",
    scope,
    message:
      scope === "write"
        ? "需要写入访问令牌。请在本地配置 APP_WRITE_TOKEN，或使用兼容的 APP_ACCESS_TOKEN。"
        : "需要访问令牌。请在本地配置 APP_READ_TOKEN、APP_WRITE_TOKEN 或 APP_ACCESS_TOKEN，并在页面输入访问令牌。",
  });
  return false;
}

function numberEnv(name) {
  const value = Number(env[name]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function usageTokens(usage = {}) {
  const inputTokens = Number(usage.input_tokens ?? usage.prompt_tokens ?? 0);
  const outputTokens = Number(usage.output_tokens ?? usage.completion_tokens ?? 0);
  const totalTokens = Number(usage.total_tokens ?? inputTokens + outputTokens);
  return {
    inputTokens: Number.isFinite(inputTokens) ? inputTokens : 0,
    outputTokens: Number.isFinite(outputTokens) ? outputTokens : 0,
    totalTokens: Number.isFinite(totalTokens) ? totalTokens : 0,
  };
}

function costPricingConfig() {
  const inputUsdPer1M = numberEnv("OPENAI_INPUT_USD_PER_1M") || numberEnv("AI_INPUT_USD_PER_1M");
  const outputUsdPer1M = numberEnv("OPENAI_OUTPUT_USD_PER_1M") || numberEnv("AI_OUTPUT_USD_PER_1M");
  const totalUsdPer1M = numberEnv("OPENAI_TOTAL_USD_PER_1M") || numberEnv("AI_TOTAL_USD_PER_1M");
  return {
    inputUsdPer1M,
    outputUsdPer1M,
    totalUsdPer1M,
    configured: Boolean((inputUsdPer1M && outputUsdPer1M) || totalUsdPer1M),
  };
}

function estimateApiCostUsd(usage) {
  if (!usage) return null;
  const pricing = costPricingConfig();
  if (!pricing.configured) return null;
  const { inputTokens, outputTokens, totalTokens } = usageTokens(usage);
  let estimatedCost = 0;
  if (pricing.inputUsdPer1M || pricing.outputUsdPer1M) {
    estimatedCost += (inputTokens / 1_000_000) * Number(pricing.inputUsdPer1M || 0);
    estimatedCost += (outputTokens / 1_000_000) * Number(pricing.outputUsdPer1M || 0);
  } else {
    estimatedCost = (totalTokens / 1_000_000) * Number(pricing.totalUsdPer1M || 0);
  }
  return Number(estimatedCost.toFixed(6));
}

function enrichUsageRecord(record) {
  const estimatedCostUsd = record.estimatedCostUsd ?? estimateApiCostUsd(record.usage);
  return {
    provider: record.provider || providerFromModel(record.model),
    ...record,
    estimatedCostUsd,
    costEstimateSource: estimatedCostUsd == null ? "not_configured" : "env_rate_per_1m_tokens",
  };
}

function providerFromModel(model = "") {
  const normalized = String(model || "").toLowerCase();
  if (normalized.includes("deepseek")) return "deepseek";
  if (normalized.includes("qwen") || normalized.includes("dashscope")) return "qwen";
  if (normalized.includes("gpt") || normalized.includes("o1") || normalized.includes("o3") || normalized.includes("o4")) return "openai";
  return "unknown";
}

async function readJson(request) {
  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of request) {
    totalBytes += chunk.length;
    if (totalBytes > maxJsonBodyBytes) {
      throw new HttpError(413, "JSON request body exceeds the 140MB limit.");
    }
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new HttpError(400, "Invalid JSON request body.");
  }
}

async function readWorkbenchState() {
  if (!existsSync(statePath)) return null;
  return JSON.parse(await readFile(statePath, "utf8"));
}

async function writeWorkbenchState(payload) {
  await mkdir(join(root, "data"), { recursive: true });
  await writeFile(
    statePath,
    JSON.stringify(
      {
        ...payload,
        savedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
}

async function appendApiUsage(entry) {
  await mkdir(join(root, "data"), { recursive: true });
  let usage = [];
  if (existsSync(usagePath)) {
    try {
      usage = JSON.parse(await readFile(usagePath, "utf8"));
    } catch {
      usage = [];
    }
  }
  const estimatedCostUsd = estimateApiCostUsd(entry.usage);
  usage.unshift({
    id: `usage-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    ...entry,
    estimatedCostUsd,
    costEstimateSource: estimatedCostUsd == null ? "not_configured" : "env_rate_per_1m_tokens",
  });
  await writeFile(usagePath, JSON.stringify(usage.slice(0, 500), null, 2));
}

async function readApiUsage() {
  if (!existsSync(usagePath)) return [];
  try {
    return JSON.parse(await readFile(usagePath, "utf8"));
  } catch {
    return [];
  }
}

function fallbackProduct(input = {}) {
  const source = input.sourceUrl || "";
  const notes = input.notes || "";
  const sourceMetadata = input.sourceMetadata || {};
  const customFeatures = Object.fromEntries(
    sanitizeFeatureFields(input.featureFields).map((field) => [field.key, field.type === "boolean" ? null : "待确认"]),
  );
  const category = /洗地|wash|floor/i.test(source + notes)
    ? "洗地机"
    : /吸尘|vacuum|stick/i.test(source + notes)
      ? "吸尘器"
      : "扫地机";
  return {
    brand: "待确认品牌",
    name: sourceMetadata.title || (sourceMetadata.itemId ? `${sourceMetadata.platform || "电商"}商品 ${sourceMetadata.itemId}` : "AI 待确认产品"),
    model: sourceMetadata.itemId ? `商品ID ${sourceMetadata.itemId}` : "待确认型号",
    category,
    price: 0,
    channel: sourceMetadata.channel || (source.includes("jd") ? "京东" : source.includes("tmall") ? "天猫" : "官网"),
    status: "待确认",
    image: sourceMetadata.image || sourceMetadata.imageCandidates?.[0] || "",
    confidence: 52,
    reviewRequired: true,
    sourceUrl: source,
    sourceMetadata: {
      ...sourceMetadata,
      ...(sanitizeFileAttachment(input.fileAttachment)
        ? { uploadedFile: sanitizeFileAttachment(input.fileAttachment) }
        : {}),
    },
    quarter: "未规划",
    features: {
      suction: "待确认",
      mopPressure: "待确认",
      edgeCleaning: null,
      navigation: "待确认",
      obstacle: "待确认",
      base: "待确认",
      hotWash: null,
      dustCollection: null,
      battery: "待确认",
      noise: "待确认",
      app: "待确认",
      ...customFeatures,
    },
    customFeatures: sanitizeFeatureFields(input.featureFields).map((field) => ({
      key: field.key,
      value: field.type === "boolean" ? null : "待确认",
      evidence: "AI 分析不可用或未找到字段证据",
      confidence: 35,
    })),
    sellingPoints: [
      { title: "待确认核心卖点", evidence: "AI 分析不可用或输入信息不足" },
      { title: "待确认价格策略", evidence: "需要人工核对详情页价格口径" },
      { title: "待确认功能差异", evidence: "建议补充清晰详情页图片或截图" },
    ],
  };
}

async function fetchMetadata(url) {
  if (!url) return {};
  const parsedUrl = normalizeFetchUrl(url);
  const commerceFallback = metadataFromCommerceUrl(parsedUrl);
  let response;
  try {
    response = await fetch(parsedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 CompetitiveAnalysisBot/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
  } catch (error) {
    if (commerceFallback) {
      return {
        ...commerceFallback,
        fetchMode: "commerce-url-fallback",
        fetchWarning: `页面抓取失败，已保留 URL 可识别信息：${error.message}`,
      };
    }
    throw error;
  }
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) {
    if (commerceFallback) {
      return {
        ...commerceFallback,
        fetchMode: "commerce-url-fallback",
        fetchWarning: `页面返回 HTTP ${response.status}，已保留 URL 可识别信息；建议补充详情页截图或长图。`,
        httpStatus: response.status,
        contentType,
        finalUrl: response.url || parsedUrl,
      };
    }
    throw new Error(`页面返回 HTTP ${response.status}，请确认 URL 可公开访问。`);
  }
  const html = await response.text();
  const title = decodeHtml(
    html.match(/<title[^>]*>(.*?)<\/title>/is)?.[1]?.replace(/\s+/g, " ").trim() ||
      metaContent(html, ["og:title", "twitter:title", "title"]),
  );
  const description = decodeHtml(metaContent(html, ["description", "og:description", "twitter:description"]));
  const jsonLd = extractJsonLdObjects(html);
  const structuredPrice = priceFromJsonLd(jsonLd);
  const metaPrice = priceFromMeta(html);
  const textPrice = priceFromText(html);
  const imageCandidates = extractImageCandidates(html, parsedUrl);
  const priceCandidates = uniquePriceCandidates([structuredPrice, metaPrice, textPrice, ...pricesFromText(html)]);
  const priceCandidate = priceCandidates[0];
  const textSnippets = uniqueStrings([...extractTextSnippets(html), ...(commerceFallback?.textSnippets || [])], 12);
  return {
    ...(commerceFallback || {}),
    title: title || commerceFallback?.title || "",
    description: description || commerceFallback?.description || "",
    image: imageCandidates[0] || "",
    imageCandidates,
    price: priceCandidate?.price ?? null,
    currency: priceCandidate?.currency || "CNY",
    priceSource: priceCandidate?.source || "",
    priceCandidates,
    textSnippets,
    htmlBytes: Buffer.byteLength(html, "utf8"),
    fetchMode: commerceFallback && !title && !description && !textSnippets.length ? "commerce-url-fallback" : "html",
    fetchWarning: contentType && !/html|xml|text/i.test(contentType) ? `页面类型是 ${contentType}，可能不是标准详情页 HTML。` : commerceFallback?.fetchWarning || "",
    httpStatus: response.status,
    contentType,
    finalUrl: response.url || parsedUrl,
    url: parsedUrl,
  };
}

async function loadPlaywright() {
  const bundledPath =
    "/Users/apple/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js";
  const candidates = [env.PLAYWRIGHT_MODULE_PATH, existsSync(bundledPath) ? bundledPath : null, "playwright"].filter(Boolean);
  const errors = [];
  for (const candidate of candidates) {
    try {
      if (candidate.startsWith("/") || candidate.startsWith(".")) {
        return await import(pathToFileURL(resolve(candidate)).href);
      }
      return await import(candidate);
    } catch (error) {
      errors.push(`${candidate}: ${error.message}`);
    }
  }
  throw new HttpError(
    503,
    `本机没有可用的浏览器抓取组件。请配置 PLAYWRIGHT_MODULE_PATH，或继续上传详情页截图/长图。尝试路径：${errors.join(" | ")}`,
  );
}

async function closeBrowserFetchSession(sessionId) {
  const session = browserFetchSessions.get(sessionId);
  if (!session) return;
  browserFetchSessions.delete(sessionId);
  await session.context?.close?.().catch(() => {});
}

async function closeStaleBrowserFetchSessions() {
  const staleBefore = Date.now() - 30 * 60 * 1000;
  for (const [sessionId, session] of browserFetchSessions.entries()) {
    if (session.createdAt < staleBefore) await closeBrowserFetchSession(sessionId);
  }
}

function existingBrowserPath(paths) {
  return paths.find((path) => path && existsSync(path)) || "";
}

function browserExecutablePaths() {
  const programFiles = process.env.PROGRAMFILES || "C:\\Program Files";
  const programFilesX86 = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
  const localAppData = process.env.LOCALAPPDATA || "";
  return {
    chrome: [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
      join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
      localAppData ? join(localAppData, "Google", "Chrome", "Application", "chrome.exe") : "",
    ],
    edge: [
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      join(programFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
      join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe"),
      localAppData ? join(localAppData, "Microsoft", "Edge", "Application", "msedge.exe") : "",
    ],
  };
}

function browserFetchCandidates() {
  const candidates = [];
  const customExecutablePath = env.BROWSER_EXECUTABLE_PATH || env.CHROME_EXECUTABLE_PATH || "";
  if (customExecutablePath) {
    candidates.push({
      id: "custom",
      label: "自定义 Chrome/Edge",
      executablePath: customExecutablePath,
      source: env.BROWSER_EXECUTABLE_PATH ? "BROWSER_EXECUTABLE_PATH" : "CHROME_EXECUTABLE_PATH",
    });
  }
  const executablePaths = browserExecutablePaths();
  const chromePath = existingBrowserPath(executablePaths.chrome);
  if (chromePath) {
    candidates.push({
      id: "chrome",
      label: "Google Chrome",
      executablePath: chromePath,
      source: chromePath,
    });
  }
  const edgePath = existingBrowserPath(executablePaths.edge);
  if (edgePath) {
    candidates.push({
      id: "edge",
      label: "Microsoft Edge",
      executablePath: edgePath,
      source: edgePath,
    });
  }
  candidates.push({
    id: "chromium",
    label: "Playwright Chromium",
    executablePath: "",
    source: "Playwright bundled Chromium",
  });
  return candidates;
}

async function launchBrowserFetchContext(chromium, launchOptions) {
  const errors = [];
  for (const candidate of browserFetchCandidates()) {
    const userDataDir = join(browserFetchProfileRootDir, candidate.id);
    await mkdir(userDataDir, { recursive: true });
    try {
      const options = { ...launchOptions };
      if (candidate.executablePath) options.executablePath = candidate.executablePath;
      const context = await chromium.launchPersistentContext(userDataDir, options);
      return { context, browserLabel: candidate.label, browserSource: candidate.source };
    } catch (error) {
      errors.push(`${candidate.label}: ${error.message}`);
    }
  }
  throw new HttpError(
    503,
    `无法打开本机浏览器。已按顺序尝试 Google Chrome、Microsoft Edge、Playwright Chromium。请安装 Chrome/Edge，或上传详情页截图/长图。失败原因：${errors.join(" | ")}`,
  );
}

async function startBrowserFetch(input = {}) {
  const url = normalizeFetchUrl(input.url);
  await closeStaleBrowserFetchSessions();
  if (browserFetchSessions.size) {
    throw new HttpError(409, "已有一个浏览器详情页获取窗口在进行中。请先继续获取或取消当前会话。");
  }
  const playwrightModule = await loadPlaywright();
  const { chromium } = playwrightModule.default || playwrightModule;
  const launchOptions = {
    headless: env.BROWSER_FETCH_HEADLESS === "1",
    chromiumSandbox: env.BROWSER_FETCH_DISABLE_SANDBOX !== "1",
    viewport: { width: 1365, height: 1800 },
  };
  const { context, browserLabel, browserSource } = await launchBrowserFetchContext(chromium, launchOptions);
  const page = context.pages()[0] || (await context.newPage());
  let navigationWarning = "";
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  } catch (error) {
    navigationWarning = `浏览器已打开，但页面加载未完成：${error.message}`;
  }
  const sessionId = `browser-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  browserFetchSessions.set(sessionId, {
    context,
    page,
    originalUrl: url,
    browserLabel,
    browserSource,
    createdAt: Date.now(),
  });
  return {
    sessionId,
    url,
    currentUrl: page.url(),
    title: await page.title().catch(() => ""),
    browserLabel,
    browserSource,
    navigationWarning,
    message: `已使用 ${browserLabel} 打开浏览器窗口。请在浏览器里登录或完成验证，确认停留在目标详情页后回到工作台点击“继续获取”。`,
  };
}

async function collectBrowserFetch(input = {}) {
  const sessionId = String(input.sessionId || "");
  const session = browserFetchSessions.get(sessionId);
  if (!session) throw new HttpError(404, "浏览器获取会话已失效，请重新打开浏览器获取。");
  const { page, originalUrl } = session;
  try {
    const collectDeadlineAt = Date.now() + browserFetchCollectTimeoutMs;
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const snapshot = await withTimeout(page.evaluate(() => {
      const cleanText = (value) => String(value || "").replace(/\s+/g, " ").trim();
      const unique = (items, limit) => {
        const seen = new Set();
        const result = [];
        for (const item of items) {
          const text = cleanText(item);
          if (!text || seen.has(text)) continue;
          seen.add(text);
          result.push(text);
          if (result.length >= limit) break;
        }
        return result;
      };
      const skuSelector = [
        '[class*="sku" i]',
        '[id*="sku" i]',
        '[class*="spec" i]',
        '[id*="spec" i]',
        '[class*="prop" i]',
        '[id*="prop" i]',
        '[class*="selected" i]',
        '[class*="active" i]',
        '[class*="current" i]',
        '[class*="checked" i]',
        '[aria-selected="true"]',
        '[aria-checked="true"]',
      ].join(",");
      const skuCandidates = Array.from(document.querySelectorAll(skuSelector))
        .slice(0, 240)
        .map((element) => {
          const optionText = cleanText(element.textContent).slice(0, 180);
          const parentText = cleanText(element.closest("li,dd,dl,section,div")?.textContent || "").slice(0, 220);
          const labelText = cleanText(
            element.getAttribute("title") ||
              element.getAttribute("aria-label") ||
              element.getAttribute("data-value") ||
              element.getAttribute("data-name") ||
              element.getAttribute("data-title") ||
              "",
          ).slice(0, 180);
          const stateText = [
            element.className,
            element.id,
            element.getAttribute("aria-selected"),
            element.getAttribute("aria-checked"),
            element.getAttribute("data-spm-anchor-id"),
          ]
            .map(cleanText)
            .join(" ");
          return { optionText, parentText, labelText, stateText };
        })
        .filter((item) => item.optionText || item.parentText || item.labelText);
      const selectedSkuTexts = unique(
        skuCandidates
          .filter((item) => /selected|active|current|checked|true|select|choose|已选|选中/.test(item.stateText))
          .flatMap((item) => [item.parentText, item.optionText, item.labelText]),
        12,
      );
      const skuTextSnippets = unique(
        skuCandidates.flatMap((item) => [item.parentText, item.optionText, item.labelText]),
        16,
      );
      return {
        title: document.title || "",
        url: location.href,
        description:
          document.querySelector('meta[name="description"]')?.getAttribute("content") ||
          document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
          "",
        text: cleanText(document.body?.textContent || "").slice(0, 240000),
        html: document.documentElement?.outerHTML?.slice(0, 700000) || "",
        selectedSkuTexts,
        skuTextSnippets,
        images: Array.from(document.images || [])
          .map((image) => ({
            src: image.currentSrc || image.src || image.getAttribute("data-src") || image.getAttribute("data-original") || "",
            alt: image.alt || "",
            className: String(image.className || ""),
            id: image.id || "",
            width: image.naturalWidth || image.width || 0,
            height: image.naturalHeight || image.height || 0,
            parentClassName: String(image.parentElement?.className || ""),
          }))
          .filter((image) => image.src)
          .filter(Boolean)
          .slice(0, 80),
      };
    }), browserFetchDomReadTimeoutMs, "详情页 DOM 读取超时，已改用 URL 和截图继续。").catch((error) => ({
      title: "",
      url: page.url(),
      description: "",
      text: "",
      html: "",
      images: [],
      selectedSkuTexts: [],
      skuTextSnippets: [],
      fetchWarnings: [error.message],
    }));
    const screenshots = await captureBrowserPageScreenshots(page, collectDeadlineAt);
    snapshot.sourceScreenshotDataUrls = screenshots.dataUrls;
    snapshot.sourceScreenshotFetch = {
      count: screenshots.dataUrls.length,
      pageHeight: screenshots.pageHeight,
      viewportWidth: screenshots.viewportWidth,
      viewportHeight: screenshots.viewportHeight,
      positions: screenshots.positions,
      warnings: [...(snapshot.fetchWarnings || []), ...screenshots.warnings].slice(0, 10),
    };
    return metadataFromBrowserSnapshot(snapshot, originalUrl);
  } finally {
    await closeBrowserFetchSession(sessionId);
  }
}

function withTimeout(promise, timeoutMs, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), Math.max(1, timeoutMs));
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function selectScreenshotPositions(allPositions, limit) {
  if (allPositions.length <= limit) return allPositions;
  const selected = new Set([allPositions[0], allPositions[allPositions.length - 1]]);
  for (let index = 1; selected.size < limit && index < limit - 1; index += 1) {
    selected.add(allPositions[Math.round((index * (allPositions.length - 1)) / (limit - 1))]);
  }
  return [...selected].sort((a, b) => a - b).slice(0, limit);
}

async function screenshotDataUrl(page) {
  const qualities = [76, 64, 52, 42, 34];
  for (const quality of qualities) {
    const buffer = await withTimeout(
      page.screenshot({
        type: "jpeg",
        quality,
        fullPage: false,
        animations: "disabled",
        caret: "hide",
      }),
      browserFetchScreenshotTimeoutMs,
      `单张截图超过 ${Math.round(browserFetchScreenshotTimeoutMs / 1000)} 秒，已跳过。`,
    );
    const dataUrl = `data:image/jpeg;base64,${buffer.toString("base64")}`;
    if (dataUrl.length <= maxAutoSourceImageDataUrlChars && dataUrl.length <= maxModelImageDataUrlChars) {
      return { dataUrl, quality };
    }
  }
  return null;
}

async function captureBrowserPageScreenshots(page, collectDeadlineAt = Date.now() + browserFetchCollectTimeoutMs) {
  const warnings = [];
  await page.setViewportSize({ width: browserScreenshotWidth, height: browserScreenshotHeight }).catch((error) => {
    warnings.push(`设置截图视口失败：${error.message}`);
  });
  const readMetrics = () =>
    withTimeout(
      page.evaluate(() => {
        const body = document.body;
        const doc = document.documentElement;
        return {
          scrollHeight: Math.max(body?.scrollHeight || 0, body?.offsetHeight || 0, doc?.clientHeight || 0, doc?.scrollHeight || 0, doc?.offsetHeight || 0),
          viewportWidth: window.innerWidth || document.documentElement.clientWidth || 0,
          viewportHeight: window.innerHeight || document.documentElement.clientHeight || 0,
        };
      }),
      Math.min(browserFetchDomReadTimeoutMs, Math.max(1000, collectDeadlineAt - Date.now())),
      "详情页高度读取超时，已按单屏截图继续。",
    );
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  await page.waitForTimeout(500).catch(() => {});
  const initialMetrics = await readMetrics().catch(() => ({
    scrollHeight: browserScreenshotHeight,
    viewportWidth: browserScreenshotWidth,
    viewportHeight: browserScreenshotHeight,
  }));
  await warmUpLazyLoadedPage(page, initialMetrics.scrollHeight, collectDeadlineAt, warnings);
  const metrics = await readMetrics().catch(() => initialMetrics);
  const viewportHeight = Math.max(320, Math.min(Number(metrics.viewportHeight || browserScreenshotHeight), browserScreenshotHeight));
  const actualScrollHeight = Math.max(viewportHeight, Number(metrics.scrollHeight || viewportHeight));
  const pageHeight = Math.max(viewportHeight, Math.min(actualScrollHeight, maxBrowserScreenshotScrollHeight));
  const clippedByHeight = actualScrollHeight > pageHeight;
  if (clippedByHeight) {
    warnings.push(`详情页高度约 ${actualScrollHeight}px，当前最多覆盖前 ${pageHeight}px；如后半段参数缺失，请上传长图补充。`);
  }
  const fullPositionCount = Math.max(1, Math.ceil(pageHeight / viewportHeight));
  if (fullPositionCount > maxBrowserScreenshotCount) {
    warnings.push(`详情页需要约 ${fullPositionCount} 张截图，当前模型最多发送 ${maxBrowserScreenshotCount} 张，已按整页均匀抽样。`);
  }
  const step = viewportHeight;
  const allPositions = [];
  for (let y = 0; y < pageHeight; y += step) {
    allPositions.push(Math.max(0, Math.min(y, Math.max(0, pageHeight - viewportHeight))));
  }
  allPositions.push(Math.max(0, pageHeight - viewportHeight));
  const positions = selectScreenshotPositions(uniqueStrings(allPositions.map(String), 200).map(Number), maxBrowserScreenshotCount);
  const dataUrls = [];
  const capturedPositions = [];
  for (const y of positions) {
    if (Date.now() >= collectDeadlineAt) {
      warnings.push("整页截图达到时间上限，已返回已截取的部分截图。");
      break;
    }
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y).catch(() => {});
    await page.waitForTimeout(450).catch(() => {});
    const shot = await screenshotDataUrl(page).catch((error) => {
      warnings.push(`截图失败：${error.message}`);
      return null;
    });
    if (!shot) {
      warnings.push(`截图 ${y}px 超过模型单图限制，已跳过`);
      continue;
    }
    dataUrls.push(shot.dataUrl);
    capturedPositions.push({ y, quality: shot.quality });
  }
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  return {
    dataUrls,
    pageHeight,
    actualScrollHeight,
    clippedByHeight,
    sampled: fullPositionCount > maxBrowserScreenshotCount,
    viewportWidth: Number(metrics.viewportWidth || browserScreenshotWidth),
    viewportHeight,
    positions: capturedPositions,
    warnings: warnings.slice(0, 10),
  };
}

async function warmUpLazyLoadedPage(page, scrollHeight, collectDeadlineAt, warnings) {
  const viewportHeight = browserScreenshotHeight;
  const targetHeight = Math.min(Math.max(Number(scrollHeight || viewportHeight), viewportHeight), maxBrowserScreenshotScrollHeight);
  const warmupStep = Math.max(480, Math.floor(viewportHeight * 0.85));
  let steps = 0;
  for (let y = 0; y < targetHeight; y += warmupStep) {
    if (Date.now() >= collectDeadlineAt - browserFetchScreenshotTimeoutMs) {
      warnings.push("详情页预滚动达到时间上限，可能仍有懒加载内容未展开。");
      break;
    }
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y).catch(() => {});
    await page.waitForTimeout(220).catch(() => {});
    steps += 1;
    if (steps >= 80) break;
  }
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
}

function metadataFromBrowserSnapshot(snapshot = {}, originalUrl = "") {
  const currentUrl = snapshot.url || originalUrl;
  const commerceFallback = metadataFromCommerceUrl(currentUrl) || metadataFromCommerceUrl(originalUrl) || {};
  const html = snapshot.html || "";
  const text = snapshot.text || "";
  const jsonLd = extractJsonLdObjects(html);
  const imageCandidates = normalizeProductImageCandidates([...(snapshot.images || []), ...extractImageCandidates(html, currentUrl)], currentUrl);
  const priceCandidates = uniquePriceCandidates([
    priceFromJsonLd(jsonLd),
    priceFromMeta(html),
    priceFromText(html),
    priceFromText(text),
    ...pricesFromText(html),
    ...pricesFromText(text),
  ]);
  const priceCandidate = priceCandidates[0];
  const textSnippets = uniqueStrings([...extractTextSnippets(html), ...extractTextSnippets(text), ...(commerceFallback.textSnippets || [])], 12);
  const selectedSkuTexts = uniqueStrings([...(commerceFallback.selectedSkuTexts || []), ...(snapshot.selectedSkuTexts || [])], 12);
  const skuTextSnippets = uniqueStrings([...(commerceFallback.skuTextSnippets || []), ...(snapshot.skuTextSnippets || [])], 16);
  const blocked = /验证码|安全验证|登录后|请登录|当前页面异常|内容太火爆|请刷新|访问受限|滑块验证/.test(text);
  const fetchWarning = blocked
    ? "浏览器页面仍像是登录、验证或异常页面；请在浏览器窗口完成登录/验证并停留在真实详情页后重新获取。"
    : "";
  return {
    ...commerceFallback,
    title: decodeHtml(snapshot.title || commerceFallback.title || ""),
    description: decodeHtml(snapshot.description || commerceFallback.description || ""),
    image: imageCandidates[0] || "",
    imageCandidates,
    price: priceCandidate?.price ?? null,
    currency: priceCandidate?.currency || "CNY",
    priceSource: priceCandidate?.source || "",
    priceCandidates,
    textSnippets,
    selectedSkuTexts,
    skuTextSnippets,
    sourceScreenshotDataUrls: Array.isArray(snapshot.sourceScreenshotDataUrls) ? snapshot.sourceScreenshotDataUrls.slice(0, maxBrowserScreenshotCount) : [],
    sourceScreenshotFetch: snapshot.sourceScreenshotFetch || null,
    htmlBytes: Buffer.byteLength(html, "utf8"),
    fetchMode: "browser",
    browserAssisted: true,
    fetchWarning,
    finalUrl: currentUrl,
    url: originalUrl || currentUrl,
  };
}

function normalizeFetchUrl(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl || "").trim());
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("只支持 http 或 https 开头的详情页 URL。");
    }
    return parsed.toString();
  } catch (error) {
    throw new HttpError(400, error.message.includes("只支持") ? error.message : "详情页 URL 格式不正确，请粘贴完整链接。");
  }
}

function metadataFromCommerceUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    const jdPathId =
      host.includes("jd.") || host.endsWith("jd.com")
        ? parsed.pathname.match(/\/(?:product\/)?(\d{5,})\.html/i)?.[1] || parsed.pathname.match(/\/product\/(\d{5,})/i)?.[1] || ""
        : "";
    const pddGoodsId = parsed.searchParams.get("goods_id") || parsed.searchParams.get("goodsId") || "";
    const amazonAsin =
      host.includes("amazon.") ? parsed.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i)?.[1] || "" : "";
    const itemId = parsed.searchParams.get("id") || parsed.searchParams.get("itemId") || jdPathId || pddGoodsId || amazonAsin || "";
    const skuId = parsed.searchParams.get("skuId") || parsed.searchParams.get("sku") || "";
    const platform = host.includes("tmall")
      ? "天猫"
      : host.includes("taobao")
        ? "淘宝"
        : host.includes("jd.") || host.endsWith("jd.com")
          ? "京东"
          : host.includes("yangkeduo") || host.includes("pinduoduo")
            ? "拼多多"
            : host.includes("amazon.")
              ? "Amazon"
              : host.includes("suning")
                ? "苏宁"
                : host.includes("douyin")
                  ? "抖音电商"
                  : host.includes("kuaishou")
                    ? "快手电商"
          : "";
    if (!platform) return null;
    const canonicalUrl =
      platform === "京东"
        ? itemId
          ? `https://item.jd.com/${itemId}.html`
          : rawUrl
        : platform === "拼多多"
          ? pddGoodsId
            ? `${parsed.origin}${parsed.pathname}?goods_id=${encodeURIComponent(pddGoodsId)}`
            : rawUrl
          : platform === "Amazon"
            ? amazonAsin
              ? `${parsed.origin}/dp/${amazonAsin}`
              : rawUrl
            : itemId || skuId
              ? `${parsed.origin}${parsed.pathname}?${new URLSearchParams(
                  Object.fromEntries(
                    [
                      ["id", itemId],
                      ["skuId", skuId],
                    ].filter(([, value]) => value),
                  ),
                ).toString()}`
              : rawUrl;
    const textSnippets = uniqueStrings(
      [
        `平台：${platform}`,
        itemId ? `商品 ID：${itemId}` : "",
        skuId ? `SKU ID：${skuId}` : "",
        !itemId && !skuId ? "链接已识别为电商详情页，但未能从链接中提取商品 ID。" : "",
        canonicalUrl && canonicalUrl !== rawUrl ? `标准化链接：${canonicalUrl}` : "",
        "页面可能需要登录或动态加载；如未抓到价格、参数和详情图，请上传详情页截图或长图补充分析。",
      ],
      8,
    );
    const selectedSkuTexts = uniqueStrings([skuId ? `当前 URL SKU ID：${skuId}` : ""], 4);
    const skuTextSnippets = uniqueStrings(
      [
        itemId ? `SPU 商品 ID：${itemId}` : "",
        skuId ? `当前 SKU ID：${skuId}` : "",
        skuId ? "同一商品链接可能包含多个 SKU，请以当前 SKU 对应的规格、版本和型号为准。" : "",
      ],
      8,
    );
    return {
      title: `${platform}商品${itemId ? ` ${itemId}` : ""}`,
      description: `${platform}详情页链接已识别；动态详情、价格、参数和图片可能需要截图或长图兜底。`,
      image: "",
      imageCandidates: [],
      price: null,
      currency: "CNY",
      priceSource: "",
      priceCandidates: [],
      textSnippets,
      selectedSkuTexts,
      skuTextSnippets,
      platform,
      channel: platform,
      itemId,
      skuId,
      canonicalUrl,
      fetchWarning: `${platform}页面通常会动态加载或限制服务端抓取；如果预览缺少价格、参数或详情图，请上传截图/长图继续分析。`,
      url: rawUrl,
    };
  } catch {
    return null;
  }
}

function uniqueStrings(values, limit = 12) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const item = String(value || "").trim();
    if (!item || seen.has(item)) continue;
    seen.add(item);
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}

function extractImageCandidates(html, baseUrl) {
  const imageAttributePattern =
    /\b(?:src|data-src|data-original|data-original-src|data-lazy-src|data-lazy|data-ks-lazyload|data-lazyload|poster)=["']([^"']+)["']/gi;
  const srcsetAttributePattern = /\b(?:srcset|data-srcset)=["']([^"']+)["']/gi;
  const imageTags = [...html.matchAll(/<(?:img|source|picture|video)\b[^>]*>/gi)].map((match) => match[0]);
  const candidates = [
    { src: metaContent(html, ["og:image", "twitter:image", "image"]), kind: "meta-product-image" },
    ...imageTags.flatMap((tag) => [
      ...[...tag.matchAll(imageAttributePattern)].map((match) => imageCandidateFromTag(match[1], tag)),
      ...[...tag.matchAll(srcsetAttributePattern)]
        .flatMap((match) => match[1].split(",").map((item) => item.trim().split(/\s+/)[0]))
        .map((src) => imageCandidateFromTag(src, tag)),
    ]),
  ];
  return normalizeProductImageCandidates(candidates, baseUrl);
}

function imageCandidateFromTag(src, tag = "") {
  return {
    src,
    alt: attrValue(tag, "alt"),
    className: attrValue(tag, "class"),
    id: attrValue(tag, "id"),
    width: Number(attrValue(tag, "width") || 0),
    height: Number(attrValue(tag, "height") || 0),
    kind: tag,
  };
}

function attrValue(tag, name) {
  const match = String(tag || "").match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"));
  return match?.[1] || "";
}

function normalizeProductImageCandidates(candidates, baseUrl, limit = 12) {
  const scored = [];
  const seen = new Set();
  for (const [index, candidate] of candidates.entries()) {
    const item = typeof candidate === "string" ? { src: candidate } : candidate || {};
    const url = absoluteUrl(decodeHtml(item.src || item.url || ""), baseUrl);
    if (!/^https?:\/\//i.test(url) || /\.(gif|ico|js|css|map)(?:[?#].*)?$/i.test(url)) continue;
    if (seen.has(url)) continue;
    const context = `${url} ${item.alt || ""} ${item.className || ""} ${item.id || ""} ${item.parentClassName || ""} ${item.kind || ""}`;
    const lower = context.toLowerCase();
    if (/\b(logo|icon|sprite|avatar|qrcode|qr|captcha|blank|transparent|placeholder|loading)\b/i.test(context)) continue;
    const width = Number(item.width || 0);
    const height = Number(item.height || 0);
    if (width && height && (Math.min(width, height) < 80 || width * height < 12000)) continue;
    let score = 100 - index / 1000;
    if (/og:image|twitter:image|meta-product-image/i.test(context)) score += 80;
    if (/商品|产品|主图|详情|sku|goods|product|item|main|gallery|thumb|booth|magnifier|spec|hero/i.test(context)) score += 60;
    if (/alicdn|tbcdn|360buyimg|jdimg|pinduoduo|yangkeduo|alicdn|amazon|media-amazon|alicdn|alicdn\.com|img\.alicdn/i.test(lower)) score += 20;
    if (width && height) score += Math.min(40, Math.log10(width * height) * 8);
    if (/banner|coupon|promo|activity|ad-|ads|shop|store|brand|badge|nav|footer|header|recommend|floor|babel/i.test(lower)) score -= 45;
    scored.push({ url, score });
    seen.add(url);
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.url);
}

function uniquePriceCandidates(candidates) {
  const seen = new Set();
  const result = [];
  for (const candidate of candidates) {
    if (!candidate?.price) continue;
    const key = `${candidate.currency || "CNY"}-${candidate.price}-${candidate.source || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      price: candidate.price,
      currency: candidate.currency || "CNY",
      source: candidate.source || "unknown",
    });
    if (result.length >= 8) break;
  }
  return result;
}

function htmlToText(html) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<(br|p|div|section|article|li|tr|h[1-6])\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
}

function extractTextSnippets(html) {
  const keywords = /吸力|Pa|kPa|拖布|热水|烘干|集尘|基站|导航|避障|续航|电池|水箱|噪音|APP|语音|贴边|滚刷|自清洁|价格|到手价|清洁/i;
  const snippets = htmlToText(html)
    .split(/[\n。；;]/)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length >= 12 && item.length <= 180)
    .filter((item) => keywords.test(item))
    .sort((a, b) => Number(keywords.test(b)) - Number(keywords.test(a)));
  return uniqueStrings(snippets, 12);
}

function metaContent(html, names) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `<meta[^>]+(?:property|name|itemprop)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["']${escaped}["'][^>]*>`,
      "i",
    );
    const match = html.match(pattern);
    const value = match?.[1] || match?.[2];
    if (value) return value.trim();
  }
  return "";
}

function decodeHtml(value = "") {
  return String(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#47;|&#x2F;/gi, "/")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(value, baseUrl) {
  if (!value) return "";
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function normalizePrice(value) {
  const number = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function extractJsonLdObjects(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const objects = [];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(decodeHtml(block[1]));
      objects.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch {
      // Invalid JSON-LD is common on commerce pages; other metadata paths remain available.
    }
  }
  return objects.flatMap((item) => (Array.isArray(item?.["@graph"]) ? item["@graph"] : [item]));
}

function priceFromJsonLd(objects) {
  for (const item of objects) {
    const offers = Array.isArray(item?.offers) ? item.offers : item?.offers ? [item.offers] : [];
    for (const offer of offers) {
      const price = normalizePrice(offer?.price || offer?.lowPrice || offer?.highPrice);
      if (price) return { price, currency: offer?.priceCurrency || "CNY", source: "json-ld" };
    }
  }
  return null;
}

function priceFromMeta(html) {
  const price =
    normalizePrice(metaContent(html, ["product:price:amount", "og:price:amount", "price", "twitter:data1"])) ||
    normalizePrice(html.match(/["']price["']\s*:\s*["']?([\d.]+)/i)?.[1]);
  if (!price) return null;
  const currency = metaContent(html, ["product:price:currency", "og:price:currency", "priceCurrency"]) || "CNY";
  return { price, currency, source: "meta" };
}

function priceFromText(html) {
  const text = htmlToText(html);
  const match = text.match(/(?:¥|￥|RMB|CNY)\s*([1-9]\d{1,5}(?:\.\d{1,2})?)/i);
  const price = normalizePrice(match?.[1]);
  return price ? { price, currency: "CNY", source: "text" } : null;
}

function pricesFromText(html) {
  const text = htmlToText(html);
  const candidates = [];
  for (const match of text.matchAll(/(?:¥|￥|RMB|CNY)\s*([1-9]\d{1,5}(?:\.\d{1,2})?)/gi)) {
    const price = normalizePrice(match[1]);
    if (price) candidates.push({ price, currency: "CNY", source: "text" });
  }
  for (const match of html.matchAll(/["'](?:price|salePrice|finalPrice)["']\s*:\s*["']?([1-9]\d{1,5}(?:\.\d{1,2})?)/gi)) {
    const price = normalizePrice(match[1]);
    if (price) candidates.push({ price, currency: "CNY", source: "embedded-json" });
  }
  return candidates;
}

function outputTextFromResponse(data) {
  if (data.output_text) return data.output_text;
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" || content.type === "text") chunks.push(content.text);
    }
  }
  return chunks.join("\n");
}

function sanitizeFileAttachment(fileAttachment) {
  if (!fileAttachment?.fileDataUrl) return null;
  return {
    filename: fileAttachment.filename || "detail.pdf",
    mimeType: fileAttachment.mimeType || "application/pdf",
    size: Number(fileAttachment.size || 0),
  };
}

function validatePdfAttachment(fileAttachment) {
  if (!fileAttachment) return null;
  const sanitized = sanitizeFileAttachment(fileAttachment);
  if (!sanitized) return null;
  if (sanitized.mimeType !== "application/pdf" && !/\.pdf$/i.test(sanitized.filename)) {
    throw new Error("Only PDF file attachments are supported.");
  }
  if (sanitized.size > maxAnalysisFileBytes) {
    throw new Error("PDF attachment exceeds the 100MB limit.");
  }
  if (!String(fileAttachment.fileDataUrl).startsWith("data:application/pdf;base64,")) {
    throw new Error("PDF attachment must be a base64 data URL.");
  }
  return {
    ...sanitized,
    fileData: String(fileAttachment.fileDataUrl).replace(/^data:application\/pdf;base64,/, ""),
  };
}

function normalizeImageDataUrls({ imageDataUrl, imageDataUrls }) {
  const urls = Array.isArray(imageDataUrls) ? imageDataUrls : imageDataUrl ? [imageDataUrl] : [];
  return urls.filter((url) => typeof url === "string" && url.startsWith("data:image/")).slice(0, maxModelImageCount);
}

function normalizeRemoteImageUrls(values, limit = 4) {
  const urls = Array.isArray(values) ? values : values ? [values] : [];
  return uniqueStrings(
    urls.filter((url) => /^https?:\/\//i.test(String(url || "")) && !/\.(gif|ico)(?:[?#].*)?$/i.test(String(url))),
    limit,
  );
}

function analysisSourceImageUrls(metadata = {}) {
  return normalizeRemoteImageUrls([metadata.image, ...(metadata.imageCandidates || [])], 4);
}

function imageMimeTypeFromUrl(url) {
  const pathname = new URL(url).pathname.toLowerCase();
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
  return "";
}

function normalizeImageMimeType(contentType = "", url = "") {
  const mimeType = String(contentType).split(";")[0].trim().toLowerCase() || imageMimeTypeFromUrl(url);
  if (["image/jpeg", "image/png", "image/webp"].includes(mimeType)) return mimeType;
  return "";
}

function readThreeByteLittleEndian(buffer, offset) {
  return buffer[offset] + (buffer[offset + 1] << 8) + (buffer[offset + 2] << 16);
}

function imageDimensionsFromBytes(buffer, mimeType = "") {
  if (!Buffer.isBuffer(buffer) || buffer.length < 24) return null;
  if (mimeType === "image/png" && buffer.toString("ascii", 1, 4) === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (mimeType === "image/jpeg" && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (length < 2) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      offset += 2 + length;
    }
  }
  if (mimeType === "image/webp" && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    const chunkType = buffer.toString("ascii", 12, 16);
    if (chunkType === "VP8X" && buffer.length >= 30) {
      return { width: readThreeByteLittleEndian(buffer, 24) + 1, height: readThreeByteLittleEndian(buffer, 27) + 1 };
    }
    if (chunkType === "VP8L" && buffer.length >= 25 && buffer[20] === 0x2f) {
      const b0 = buffer[21];
      const b1 = buffer[22];
      const b2 = buffer[23];
      const b3 = buffer[24];
      return {
        width: 1 + (((b1 & 0x3f) << 8) | b0),
        height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
      };
    }
    if (chunkType === "VP8 " && buffer.length >= 30) {
      return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    }
  }
  return null;
}

function isAutoSourceImageLargeEnough(dimensions) {
  if (!dimensions?.width || !dimensions?.height) return true;
  const width = Number(dimensions.width || 0);
  const height = Number(dimensions.height || 0);
  return width >= minAutoSourceImageWidth && Math.min(width, height) >= minAutoSourceImageShortEdge && width * height >= minAutoSourceImagePixels;
}

async function fetchRemoteImageDataUrls(values, { referer = "", limit = maxAutoSourceImageCount } = {}) {
  const imageUrls = normalizeRemoteImageUrls(values, limit);
  const dataUrls = [];
  const fetchedUrls = [];
  const fetchedDimensions = [];
  const warnings = [];
  for (const url of imageUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 CompetitiveAnalysisImageFetcher/1.0",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          ...(referer ? { Referer: referer } : {}),
        },
        redirect: "follow",
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) {
        warnings.push(`${url} 返回 HTTP ${response.status}`);
        continue;
      }
      const mimeType = normalizeImageMimeType(response.headers.get("content-type"), response.url || url);
      if (!mimeType) {
        warnings.push(`${url} 不是可识别的商品图片类型`);
        continue;
      }
      const contentLength = Number(response.headers.get("content-length") || 0);
      if (contentLength > maxAutoSourceImageBytes) {
        warnings.push(`${url} 图片过大，已跳过`);
        continue;
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length) {
        warnings.push(`${url} 图片为空，已跳过`);
        continue;
      }
      if (bytes.length > maxAutoSourceImageBytes) {
        warnings.push(`${url} 图片过大，已跳过`);
        continue;
      }
      const dimensions = imageDimensionsFromBytes(bytes, mimeType);
      if (!isAutoSourceImageLargeEnough(dimensions)) {
        warnings.push(`${url} 图片尺寸太小（${dimensions.width}x${dimensions.height}），已跳过`);
        continue;
      }
      const dataUrl = `data:${mimeType};base64,${bytes.toString("base64")}`;
      if (dataUrl.length > maxAutoSourceImageDataUrlChars || dataUrl.length > maxModelImageDataUrlChars) {
        warnings.push(`${url} 图片超过模型单图限制，已跳过`);
        continue;
      }
      dataUrls.push(dataUrl);
      fetchedUrls.push(response.url || url);
      fetchedDimensions.push(dimensions || null);
    } catch (error) {
      warnings.push(`${url} 下载失败：${error.message}`);
    }
  }
  return {
    dataUrls,
    fetchedUrls,
    fetchedDimensions,
    warnings: warnings.slice(0, 6),
    candidateCount: imageUrls.length,
  };
}

function meaningfulTextSnippets(metadata = {}) {
  return (metadata.textSnippets || []).filter(
    (snippet) =>
      !/^(平台：|商品 ID：|SKU ID：|标准化链接：)/.test(String(snippet || "")) &&
      !/动态加载|上传详情页截图|上传截图|链接已识别|未能从链接中提取商品 ID|页面可能需要登录/.test(String(snippet || "")),
  );
}

function hasMeaningfulSourceEvidence(metadata = {}) {
  if (metadata.price || metadata.priceCandidates?.length) return true;
  if (meaningfulTextSnippets(metadata).length) return true;
  if (!metadata.fetchWarning && metadata.sourceScreenshotDataUrls?.length) return true;
  if (!metadata.fetchWarning && metadata.fetchMode !== "commerce-url-fallback" && metadata.imageCandidates?.length) return true;
  return false;
}

function hasManualAnalysisEvidence(input = {}, uploadedFile, imageUrls = []) {
  return Boolean(uploadedFile || imageUrls.length || String(input.notes || "").trim().length >= 12);
}

function assertEnoughAnalysisEvidence(input = {}, metadata = {}, uploadedFile, imageUrls = []) {
  if (!input.sourceUrl || hasManualAnalysisEvidence(input, uploadedFile, imageUrls)) return;
  if (hasMeaningfulSourceEvidence(metadata)) return;
  const platformText = metadata.platform ? `${metadata.platform} ` : "";
  throw new HttpError(
    422,
    `未获取到${platformText}有效详情页图片和内容：没有商品名、价格、参数或可用于视觉识别的详情图。不能只读取文字完成分析；请使用“打开浏览器获取”完成登录/验证后继续，或上传合格尺寸的详情页截图/长图。`,
  );
}

function inputModalities({ imageDataUrl, imageDataUrls, remoteImageUrls, fileAttachment }) {
  const modalities = ["text"];
  if (normalizeImageDataUrls({ imageDataUrl, imageDataUrls }).length) modalities.push("image");
  if (normalizeRemoteImageUrls(remoteImageUrls).length) modalities.push("remote_image");
  if (fileAttachment) modalities.push("file");
  return modalities;
}

function sanitizeFeatureFields(featureFields) {
  if (!Array.isArray(featureFields)) return [];
  return featureFields
    .filter((field) => field?.key && field?.name)
    .slice(0, 80)
    .map((field) => {
      const type = ["text", "number", "boolean", "enum", "price", "image"].includes(field.type) ? field.type : "text";
      const options = Array.isArray(field.options)
        ? Array.from(new Set(field.options.map((option) => String(option || "").trim()).filter(Boolean))).slice(0, 20)
        : [];
      return {
        key: String(field.key).slice(0, 80),
        module: String(field.module || "自定义模块").slice(0, 80),
        name: String(field.name).slice(0, 80),
        type,
        options: type === "enum" ? options.map((option) => option.slice(0, 60)) : [],
      };
    });
}

function sanitizeAnalysisExamples(examples) {
  if (!Array.isArray(examples)) return [];
  return examples
    .filter((example) => example?.model && example?.category)
    .slice(0, 3)
    .map((example) => ({
      brand: String(example.brand || "").slice(0, 80),
      model: String(example.model || "").slice(0, 80),
      category: ["扫地机", "洗地机", "吸尘器"].includes(example.category) ? example.category : "扫地机",
      price: Number(example.price || 0),
      features: Object.fromEntries(
        Object.entries(example.features || {})
          .slice(0, 12)
          .map(([key, value]) => [String(key).slice(0, 80), String(value ?? "").slice(0, 120)]),
      ),
      topSellingPoints: Array.isArray(example.topSellingPoints)
        ? example.topSellingPoints.slice(0, 3).map((point) => String(point || "").slice(0, 80))
        : [],
    }));
}

function modelProviderStatus() {
  const openaiModel = env.OPENAI_MODEL || "gpt-5.4-mini";
  const deepseekModel = env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  const qwenModel = env.QWEN_MODEL || "qwen-vl-max";
  const compareProvider = normalizeTextProvider(env.COMPARE_AI_PROVIDER || env.AI_PROVIDER || "deepseek");
  const visionProvider = normalizeVisionProvider(env.VISION_PROVIDER || "qwen");
  return {
    defaultProvider: normalizeTextProvider(env.AI_PROVIDER || "deepseek"),
    compareProvider,
    visionProvider,
    providers: {
      openai: {
        configured: Boolean(env.OPENAI_API_KEY),
        model: openaiModel,
        supportsVisionFile: true,
      },
      deepseek: {
        configured: Boolean(env.DEEPSEEK_API_KEY),
        model: deepseekModel,
        supportsVisionFile: false,
      },
      qwen: {
        configured: Boolean(env.QWEN_API_KEY),
        model: qwenModel,
        supportsVisionFile: true,
        supportsDirectPdf: false,
      },
    },
  };
}

function normalizeTextProvider(provider) {
  return String(provider || "").toLowerCase() === "openai" ? "openai" : "deepseek";
}

function normalizeVisionProvider(provider) {
  return String(provider || "").toLowerCase() === "openai" ? "openai" : "qwen";
}

function providerModel(provider) {
  if (provider === "deepseek") return env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  if (provider === "qwen") return env.QWEN_MODEL || "qwen-vl-max";
  return env.OPENAI_MODEL || "gpt-5.4-mini";
}

function usageInputModalities({ imageDataUrls, remoteImageUrls, fileAttachment, provider }) {
  return inputModalities({ imageDataUrls, remoteImageUrls, fileAttachment }).map((item) => `${provider}:${item}`);
}

function schemaPrompt(prompt, schemaName, schema) {
  return [
    prompt,
    "",
    `必须只输出 JSON，不要 Markdown。JSON 必须符合 schema ${schemaName}:`,
    JSON.stringify(schema),
  ].join("\n");
}

async function callOpenAIJson({ prompt, imageDataUrl, imageDataUrls, remoteImageUrls, fileAttachment, schemaName, schema }) {
  const apiKey = env.OPENAI_API_KEY;
  const provider = "openai";
  const model = providerModel(provider);
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const pdfAttachment = validatePdfAttachment(fileAttachment);
  const imageUrls = normalizeImageDataUrls({ imageDataUrl, imageDataUrls });
  const sourceImageUrls = normalizeRemoteImageUrls(remoteImageUrls);
  const content = [{ type: "input_text", text: prompt }];
  for (const imageUrl of [...imageUrls, ...sourceImageUrls]) {
    content.push({ type: "input_image", image_url: imageUrl });
  }
  if (pdfAttachment) {
    content.push({
      type: "input_file",
      filename: pdfAttachment.filename,
      file_data: pdfAttachment.fileData,
    });
  }

  let response;
  let data;
  try {
    ({ response, data } = await fetchProviderJson(provider, openAIResponsesUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [{ role: "user", content }],
        text: {
          format: {
            type: "json_schema",
            name: schemaName,
            schema,
            strict: true,
          },
        },
      }),
    }));
  } catch (error) {
    await appendApiUsage({
      provider,
      schemaName,
      model,
      status: "error",
      error: error.message,
      inputModalities: usageInputModalities({ imageDataUrls: imageUrls, remoteImageUrls: sourceImageUrls, fileAttachment: pdfAttachment, provider }),
    });
    throw error;
  }
  if (!response.ok) {
    const message = data.error?.message || `OpenAI request failed with ${response.status}`;
    await appendApiUsage({
      provider,
      schemaName,
      model,
      status: "error",
      error: message,
      inputModalities: usageInputModalities({ imageDataUrls: imageUrls, remoteImageUrls: sourceImageUrls, fileAttachment: pdfAttachment, provider }),
    });
    throw new Error(message);
  }
  const text = outputTextFromResponse(data);
  await appendApiUsage({
    provider,
    schemaName,
    model: data.model || model,
    status: "ok",
    responseId: data.id || "",
    usage: data.usage || null,
    inputModalities: usageInputModalities({ imageDataUrls: imageUrls, remoteImageUrls: sourceImageUrls, fileAttachment: pdfAttachment, provider }),
  });
  return {
    json: JSON.parse(text),
    meta: {
      responseId: data.id || "",
      model: data.model || model,
      provider,
      usage: data.usage || null,
      schemaName,
    },
  };
}

async function callDeepSeekJson({ prompt, schemaName, schema }) {
  const provider = "deepseek";
  const apiKey = env.DEEPSEEK_API_KEY;
  const model = providerModel(provider);
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }
  let response;
  let data;
  try {
    ({ response, data } = await fetchProviderJson(provider, deepSeekChatUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "你是清洁电器竞品分析助手，只输出严格 JSON。" },
          { role: "user", content: schemaPrompt(prompt, schemaName, schema) },
        ],
        response_format: { type: "json_object" },
        stream: false,
      }),
    }));
  } catch (error) {
    await appendApiUsage({
      provider,
      schemaName,
      model,
      status: "error",
      error: error.message,
      inputModalities: ["deepseek:text"],
    });
    throw error;
  }
  if (!response.ok) {
    const message = data.error?.message || `DeepSeek request failed with ${response.status}`;
    await appendApiUsage({
      provider,
      schemaName,
      model,
      status: "error",
      error: message,
      inputModalities: ["deepseek:text"],
    });
    throw new Error(message);
  }
  const text = data.choices?.[0]?.message?.content || "";
  await appendApiUsage({
    provider,
    schemaName,
    model: data.model || model,
    status: "ok",
    responseId: data.id || "",
    usage: data.usage || null,
    inputModalities: ["deepseek:text"],
  });
  return {
    json: JSON.parse(text),
    meta: {
      responseId: data.id || "",
      model: data.model || model,
      provider,
      usage: data.usage || null,
      schemaName,
    },
  };
}

async function callQwenVisionJson({ prompt, imageDataUrl, imageDataUrls, remoteImageUrls, fileAttachment, schemaName, schema }) {
  const provider = "qwen";
  const apiKey = env.QWEN_API_KEY;
  const model = providerModel(provider);
  if (!apiKey) {
    throw new Error("QWEN_API_KEY is not configured");
  }

  const pdfAttachment = validatePdfAttachment(fileAttachment);
  const imageUrls = normalizeImageDataUrls({ imageDataUrl, imageDataUrls });
  const sourceImageUrls = normalizeRemoteImageUrls(remoteImageUrls);
  if (pdfAttachment && imageUrls.length === 0 && sourceImageUrls.length === 0) {
    throw new Error("Qwen-VL 当前只接收图片输入；请把 PDF 页面转成长图/截图上传，或进入人工复核。");
  }

  const content = [{ type: "text", text: schemaPrompt(prompt, schemaName, schema) }];
  for (const imageUrl of [...imageUrls, ...sourceImageUrls]) {
    content.push({ type: "image_url", image_url: { url: imageUrl } });
  }

  let response;
  let data;
  try {
    ({ response, data } = await fetchProviderJson(provider, qwenChatUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "你是清洁电器竞品分析视觉助手，擅长从中文电商详情页图片中抽取参数，只输出严格 JSON。" },
          { role: "user", content },
        ],
        response_format: { type: "json_object" },
        stream: false,
      }),
    }));
  } catch (error) {
    await appendApiUsage({
      provider,
      schemaName,
      model,
      status: "error",
      error: error.message,
      inputModalities: usageInputModalities({ imageDataUrls: imageUrls, remoteImageUrls: sourceImageUrls, fileAttachment: pdfAttachment, provider }),
    });
    throw error;
  }
  if (!response.ok) {
    const message = data.error?.message || `Qwen-VL request failed with ${response.status}`;
    await appendApiUsage({
      provider,
      schemaName,
      model,
      status: "error",
      error: message,
      inputModalities: usageInputModalities({ imageDataUrls: imageUrls, remoteImageUrls: sourceImageUrls, fileAttachment: pdfAttachment, provider }),
    });
    throw new Error(message);
  }
  const text = data.choices?.[0]?.message?.content || "";
  await appendApiUsage({
    provider,
    schemaName,
    model: data.model || model,
    status: "ok",
    responseId: data.id || "",
    usage: data.usage || null,
    inputModalities: usageInputModalities({ imageDataUrls: imageUrls, remoteImageUrls: sourceImageUrls, fileAttachment: pdfAttachment, provider }),
  });
  return {
    json: JSON.parse(text),
    meta: {
      responseId: data.id || "",
      model: data.model || model,
      provider,
      usage: data.usage || null,
      schemaName,
    },
  };
}

async function callModelJson({ task = "analysis_with_vision_file", prompt, imageDataUrl, imageDataUrls, remoteImageUrls, fileAttachment, schemaName, schema }) {
  const uploadedImageUrls = normalizeImageDataUrls({ imageDataUrl, imageDataUrls });
  const sourceImageUrls = normalizeRemoteImageUrls(remoteImageUrls);
  const hasVisionInput = Boolean(fileAttachment || uploadedImageUrls.length || sourceImageUrls.length);
  const providerStatus = modelProviderStatus();
  const preferredProvider =
    task === "compare_summary_text"
      ? providerStatus.compareProvider
      : hasVisionInput
        ? providerStatus.visionProvider
        : providerStatus.defaultProvider;
  if (preferredProvider === "deepseek") {
    if (hasVisionInput) {
      throw new Error("DeepSeek 当前配置只处理文本 JSON 分析，不能直接读取图片或 PDF；请配置 Qwen-VL 视觉 provider，或进入人工复核。");
    }
    return callDeepSeekJson({ prompt, schemaName, schema });
  }
  if (preferredProvider === "qwen") {
    if (!hasVisionInput) {
      throw new Error("Qwen-VL 当前只用于图片、长图或详情页图片候选识别；纯文本任务请使用 DeepSeek。");
    }
    return callQwenVisionJson({ prompt, imageDataUrl, imageDataUrls, remoteImageUrls: sourceImageUrls, fileAttachment, schemaName, schema });
  }
  return callOpenAIJson({ prompt, imageDataUrl, imageDataUrls, remoteImageUrls, fileAttachment, schemaName, schema });
}

async function analyzeProduct(input) {
  const metadata = input.sourceMetadata || (await fetchMetadata(input.sourceUrl).catch(() => ({})));
  const uploadedFile = sanitizeFileAttachment(input.fileAttachment);
  const featureFields = sanitizeFeatureFields(input.featureFields);
  const analysisExamples = sanitizeAnalysisExamples(input.analysisExamples);
  const uploadedImageUrls = normalizeImageDataUrls(input);
  const sourceScreenshotDataUrls = normalizeImageDataUrls({ imageDataUrls: metadata.sourceScreenshotDataUrls || [] });
  const sourceImageUrls = analysisSourceImageUrls(metadata);
  const downloadedSourceImages = await fetchRemoteImageDataUrls(sourceImageUrls, {
    referer: input.sourceUrl || metadata.finalUrl || metadata.url || "",
  });
  const modelImageDataUrls = [...uploadedImageUrls, ...sourceScreenshotDataUrls, ...downloadedSourceImages.dataUrls].slice(0, maxModelImageCount);
  assertEnoughAnalysisEvidence(input, metadata, uploadedFile, modelImageDataUrls);
  const oversizedImageUrl = modelImageDataUrls.find((imageUrl) => imageUrl.length > maxModelImageDataUrlChars);
  if (oversizedImageUrl) {
    throw new Error("上传图片超过 AI 接口单张图片限制，请把详情页拆成多张截图，或压缩图片宽度后重新上传。");
  }
  if (
    input.sourceUrl &&
    !downloadedSourceImages.dataUrls.length &&
    !sourceScreenshotDataUrls.length &&
    !uploadedImageUrls.length &&
    !uploadedFile
  ) {
    const sizeHint = `图片要求：宽度至少 ${minAutoSourceImageWidth}px，短边至少 ${minAutoSourceImageShortEdge}px，像素量至少 ${minAutoSourceImagePixels}。`;
    if (!sourceImageUrls.length) {
      throw new HttpError(
        422,
        `未获取到可用于视觉识别的详情页图片，不能只读取文字完成分析。${sizeHint}请使用“打开浏览器获取”登录后继续，或上传详情页截图/长图。`,
      );
    }
    throw new HttpError(
      422,
      `已发现 ${sourceImageUrls.length} 张详情页图片候选，但都无法自动下载成符合视觉识别尺寸的图片。${sizeHint}请使用“打开浏览器获取”登录后继续，或上传详情页截图/长图。`,
    );
  }
  const prompt = [
    "你是清洁电器竞品分析师，请从官网或电商详情页信息中抽取结构化产品资料。",
    "品类只允许：扫地机、洗地机、吸尘器。",
    "需要输出可人工复核的低幻觉结果；不确定字段用待确认并降低 confidence。",
    "Top3 sellingPoints 要按竞品优先级排序，每条包含 title 和 evidence。",
    "如果输入包含 PDF、上传图片或自动下载的详情页图片，请优先从图片中的详情页文案、参数表、价格和商品图证据抽取。",
    "同一 SPU 商品下可能存在多个 SKU；型号和版本必须优先参考当前 URL skuId、页面已选 SKU/规格/版本、截图里的选中规格，不要只按 SPU 主标题或泛称填写。",
    "不要把平台货号、内部 SKU 或商品编码当成正式型号，例如云鲸/NARWAL 的 YJC034、YJCC034 这类编码；若标题同时出现“扫地机器人 JX 水箱版”等销售型号，应输出 JX 水箱版。",
    "image 字段只能使用页面中明确出现的产品图 URL；没有可靠 URL 时返回空字符串，不要生成虚构图片。",
    "customFeatures 必须只使用下方自定义字段列表里的 key；没有证据时 value 填待确认、confidence 降低。",
    "enum 类型的 customFeatures 应优先从字段 options 中选择取值；详情页没有明确证据时填待确认。",
    `URL: ${input.sourceUrl || "无"}`,
    `页面标题: ${metadata.title || "无"}`,
    `页面描述: ${metadata.description || "无"}`,
    `SPU 商品 ID: ${metadata.itemId || "无"}`,
    `当前 SKU ID: ${metadata.skuId || "无"}`,
    `当前选中 SKU/规格证据: ${metadata.selectedSkuTexts?.length ? JSON.stringify(metadata.selectedSkuTexts.slice(0, 12)) : "[]"}`,
    `SKU/版本候选文案: ${metadata.skuTextSnippets?.length ? JSON.stringify(metadata.skuTextSnippets.slice(0, 12)) : "[]"}`,
    `预抓取价格: ${metadata.price ? `${metadata.currency || "CNY"} ${metadata.price} (${metadata.priceSource || "unknown"})` : "无"}`,
    `价格候选: ${metadata.priceCandidates?.length ? JSON.stringify(metadata.priceCandidates.slice(0, 8)) : "[]"}`,
    `图片候选数: ${metadata.imageCandidates?.length || 0}`,
    `自动下载详情页图片数: ${downloadedSourceImages.dataUrls.length}/${sourceImageUrls.length}`,
    `自动下载图片来源: ${downloadedSourceImages.fetchedUrls.length ? JSON.stringify(downloadedSourceImages.fetchedUrls.slice(0, 4)) : "[]"}`,
    `自动下载图片尺寸: ${downloadedSourceImages.fetchedDimensions.length ? JSON.stringify(downloadedSourceImages.fetchedDimensions.slice(0, 4)) : "[]"}`,
    `浏览器整页截图数: ${sourceScreenshotDataUrls.length}`,
    `浏览器截图范围: ${metadata.sourceScreenshotFetch ? JSON.stringify(metadata.sourceScreenshotFetch) : "无"}`,
    `详情页图片下载问题: ${downloadedSourceImages.warnings.length ? JSON.stringify(downloadedSourceImages.warnings) : "[]"}`,
    `页面文案证据片段: ${metadata.textSnippets?.length ? JSON.stringify(metadata.textSnippets.slice(0, 12)) : "[]"}`,
    `上传图片数: ${uploadedImageUrls.length}`,
    `上传附件: ${uploadedFile ? `${uploadedFile.filename} (${uploadedFile.mimeType}, ${uploadedFile.size} bytes)` : "无"}`,
    `自定义字段列表: ${featureFields.length ? JSON.stringify(featureFields) : "[]"}`,
    `高置信人工确认示例: ${analysisExamples.length ? JSON.stringify(analysisExamples) : "[]"}`,
    `用户补充: ${input.notes || "无"}`,
  ].join("\n");

  const schema = {
    type: "object",
    additionalProperties: false,
    required: [
      "brand",
      "name",
      "model",
      "category",
      "price",
      "channel",
      "status",
      "image",
      "confidence",
      "reviewRequired",
      "sourceUrl",
      "quarter",
      "features",
      "customFeatures",
      "sellingPoints",
    ],
    properties: {
      brand: { type: "string" },
      name: { type: "string" },
      model: { type: "string" },
      category: { type: "string", enum: ["扫地机", "洗地机", "吸尘器"] },
      price: { type: "number" },
      channel: { type: "string" },
      status: { type: "string" },
      image: { type: "string" },
      confidence: { type: "number", minimum: 0, maximum: 100 },
      reviewRequired: { type: "boolean" },
      sourceUrl: { type: "string" },
      quarter: { type: "string" },
      features: {
        type: "object",
        additionalProperties: false,
        required: [
          "suction",
          "mopPressure",
          "edgeCleaning",
          "navigation",
          "obstacle",
          "base",
          "hotWash",
          "dustCollection",
          "battery",
          "noise",
          "app",
        ],
        properties: {
          suction: { type: "string" },
          mopPressure: { type: "string" },
          edgeCleaning: { type: ["boolean", "null"] },
          navigation: { type: "string" },
          obstacle: { type: "string" },
          base: { type: "string" },
          hotWash: { type: ["boolean", "null"] },
          dustCollection: { type: ["boolean", "null"] },
          battery: { type: "string" },
          noise: { type: "string" },
          app: { type: "string" },
        },
      },
      customFeatures: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["key", "value", "evidence", "confidence"],
          properties: {
            key: { type: "string" },
            value: { type: ["string", "number", "boolean", "null"] },
            evidence: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 100 },
          },
        },
      },
      sellingPoints: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "evidence"],
          properties: {
            title: { type: "string" },
            evidence: { type: "string" },
          },
        },
      },
    },
  };

  const { json: product, meta } = await callModelJson({
    task: "analysis_with_vision_file",
    prompt,
    imageDataUrl: input.imageDataUrl,
    imageDataUrls: modelImageDataUrls,
    remoteImageUrls: modelImageDataUrls.length ? [] : sourceImageUrls,
    fileAttachment: input.fileAttachment,
    schemaName: "cleaner_product_analysis",
    schema,
  });
  const { sourceScreenshotDataUrls: _sourceScreenshotDataUrls, ...persistedMetadata } = metadata;
  return {
    product: {
      ...product,
      sourceMetadata: {
        ...persistedMetadata,
        url: input.sourceUrl || metadata.url || "",
        sourceScreenshotFetch: {
          ...(metadata.sourceScreenshotFetch || {}),
          usedCount: sourceScreenshotDataUrls.length,
        },
        sourceImageFetch: {
          candidateCount: downloadedSourceImages.candidateCount,
          fetchedCount: downloadedSourceImages.dataUrls.length,
          fetchedUrls: downloadedSourceImages.fetchedUrls,
          fetchedDimensions: downloadedSourceImages.fetchedDimensions,
          warnings: downloadedSourceImages.warnings,
        },
        ...(uploadedFile ? { uploadedFile } : {}),
      },
    },
    analysisMeta: meta,
  };
}

async function compareProducts(products) {
  const comparePayload = normalizeComparePayload(products);
  const prompt = [
    "你是清洁电器产品经理，请基于输入产品输出 500 个中文字符以内的竞争对标总结。",
    "必须从产品功能、关键参数、使用感受三个方面总结，并补充定位建议或待验证短板。",
    "优先引用 differenceFields 中的功能参数差异，并结合价格梯度和 Top3 卖点，不要泛泛而谈。",
    "只输出 summary 字段，不要项目符号，不要超过 500 个中文字符。",
    JSON.stringify(comparePayload, null, 2),
  ].join("\n");

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["summary"],
    properties: {
      summary: { type: "string" },
    },
  };

  const { json, meta } = await callModelJson({
    task: "compare_summary_text",
    prompt,
    schemaName: "cleaner_compare_summary",
    schema,
  });
  return { summary: normalizeComparisonSummary(json.summary), analysisMeta: meta };
}

function normalizeComparePayload(input) {
  if (Array.isArray(input)) {
    return {
      products: input.map((product) => ({
        brand: product.brand,
        model: product.model,
        category: product.category,
        price: product.price,
        status: product.status,
        confidence: product.confidence,
        topSellingPoints: (product.sellingPoints || []).slice(0, 3).map((point) => point.title || point),
      })),
      differenceFields: [],
    };
  }
  return {
    products: Array.isArray(input?.products) ? input.products.slice(0, 5) : [],
    differenceFields: Array.isArray(input?.differenceFields) ? input.differenceFields.slice(0, 12) : [],
  };
}

function normalizeComparisonSummary(summary, maxChars = 500) {
  const normalized = String(summary || "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!normalized) return "";
  if (Array.from(normalized).length <= maxChars) return normalized;
  const chars = Array.from(normalized);
  const clipped = chars.slice(0, maxChars).join("");
  const sentenceEnd = Math.max(clipped.lastIndexOf("。"), clipped.lastIndexOf("；"), clipped.lastIndexOf("，"));
  if (sentenceEnd >= Math.floor(maxChars * 0.72)) return clipped.slice(0, sentenceEnd + 1);
  return `${chars.slice(0, Math.max(1, maxChars - 1)).join("")}…`;
}

async function handleApi(request, response, pathname) {
  if (pathname === "/api/health") {
    const providerStatus = modelProviderStatus();
    sendJson(response, 200, {
      ok: true,
      openaiConfigured: Boolean(env.OPENAI_API_KEY),
      deepseekConfigured: Boolean(env.DEEPSEEK_API_KEY),
      qwenConfigured: Boolean(env.QWEN_API_KEY),
      openaiBaseUrlConfigured: Boolean(env.OPENAI_BASE_URL),
      qwenBaseUrlConfigured: Boolean(env.QWEN_BASE_URL),
      aiProxyConfigured: proxyStatus().configured,
      aiProxy: proxyStatus(),
      aiRequestTimeoutMs: aiRequestTimeoutMs(),
      qwenRequestTimeoutMs: aiRequestTimeoutMs("qwen"),
      model: providerStatus.providers.openai.model,
      deepseekModel: providerStatus.providers.deepseek.model,
      qwenModel: providerStatus.providers.qwen.model,
      aiProvider: providerStatus.defaultProvider,
      compareProvider: providerStatus.compareProvider,
      visionProvider: providerStatus.visionProvider,
      providers: providerStatus.providers,
      ...accessStatus(),
      costPricingConfigured: costPricingConfig().configured,
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/usage") {
    if (!requireAccess(request, response, "read")) return;
    const usage = await readApiUsage();
    const enrichedUsage = usage.map(enrichUsageRecord);
    const estimatedTotalCostUsd = enrichedUsage.reduce((sum, record) => sum + Number(record.estimatedCostUsd || 0), 0);
    sendJson(response, 200, {
      count: usage.length,
      recent: enrichedUsage.slice(0, 25),
      estimatedTotalCostUsd: Number(estimatedTotalCostUsd.toFixed(6)),
      costPricingConfigured: costPricingConfig().configured,
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/state") {
    if (!requireAccess(request, response, "read")) return;
    sendJson(response, 200, (await readWorkbenchState()) || { state: null, savedViews: [] });
    return;
  }

  if (request.method === "PUT" && pathname === "/api/state") {
    if (!requireAccess(request, response, "write")) return;
    const input = await readJson(request);
    await writeWorkbenchState({
      state: input.state || null,
      savedViews: Array.isArray(input.savedViews) ? input.savedViews : [],
    });
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "POST" && pathname === "/api/analyze") {
    if (!requireAccess(request, response, "write")) return;
    const input = await readJson(request);
    try {
      sendJson(response, 200, await analyzeProduct(input));
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(response, error.status, { error: error.message });
        return;
      }
      const providerStatus = modelProviderStatus();
      const hasVisionInput = Boolean(
        sanitizeFileAttachment(input.fileAttachment) ||
          normalizeImageDataUrls(input).length ||
          analysisSourceImageUrls(input.sourceMetadata || {}).length,
      );
      const fallbackProvider = hasVisionInput ? providerStatus.visionProvider : providerStatus.defaultProvider;
      sendJson(response, 200, {
        product: fallbackProduct(input),
        analysisMeta: {
          model: providerModel(fallbackProvider),
          provider: fallbackProvider,
          status: "fallback",
          usage: null,
        },
        warning: `已使用人工复核兜底结果：${error.message}`,
      });
    }
    return;
  }

  if (request.method === "POST" && pathname === "/api/compare") {
    if (!requireAccess(request, response, "write")) return;
    const input = await readJson(request);
    try {
      const result = await compareProducts(input.products || []);
      sendJson(response, 200, result);
    } catch {
      sendJson(response, 200, {
        summary: "",
      });
    }
    return;
  }

  if (request.method === "POST" && pathname === "/api/fetch-metadata") {
    if (!requireAccess(request, response, "read")) return;
    const input = await readJson(request);
    try {
      sendJson(response, 200, await fetchMetadata(input.url));
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return;
  }

  if (request.method === "POST" && pathname === "/api/browser-fetch/start") {
    if (!requireAccess(request, response, "read")) return;
    const input = await readJson(request);
    try {
      sendJson(response, 200, await startBrowserFetch(input));
    } catch (error) {
      sendJson(response, error instanceof HttpError ? error.status : 500, { error: error.message });
    }
    return;
  }

  if (request.method === "POST" && pathname === "/api/browser-fetch/collect") {
    if (!requireAccess(request, response, "read")) return;
    const input = await readJson(request);
    try {
      sendJson(response, 200, await collectBrowserFetch(input));
    } catch (error) {
      sendJson(response, error instanceof HttpError ? error.status : 500, { error: error.message });
    }
    return;
  }

  if (request.method === "POST" && pathname === "/api/browser-fetch/cancel") {
    if (!requireAccess(request, response, "read")) return;
    const input = await readJson(request);
    await closeBrowserFetchSession(String(input.sessionId || ""));
    sendJson(response, 200, { ok: true });
    return;
  }

  sendJson(response, 404, { error: "Not found" });
}

async function serveStatic(request, response, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const normalized = normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = resolve(join(root, normalized));
  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  try {
    const file = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(file);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

function createAppServer() {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      if (url.pathname.startsWith("/api/")) {
        await handleApi(request, response, url.pathname);
        return;
      }
      await serveStatic(request, response, url.pathname);
    } catch (error) {
      const status = Number(error.status || 500);
      sendJson(response, status, { error: error.message || "Internal server error" });
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  createAppServer().listen(port, host, () => {
    console.log(`Cleaner competitive workbench running at http://${host}:${port}`);
  });
}

export {
  accessStatus,
  costPricingConfig,
  createAppServer,
  enrichUsageRecord,
  estimateApiCostUsd,
  extractImageCandidates,
  extractTextSnippets,
  fetchRemoteImageDataUrls,
  isReadAuthorized,
  isWriteAuthorized,
  metadataFromCommerceUrl,
  normalizeComparisonSummary,
  pricesFromText,
  usageTokens,
};
