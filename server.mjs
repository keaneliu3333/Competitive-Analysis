import { createServer } from "node:http";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { connect as tlsConnect } from "node:tls";
import { fileURLToPath } from "node:url";

const modulePath = fileURLToPath(import.meta.url);
const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const env = loadEnv();
const statePath = join(root, "data", "workbench-state.json");
const usagePath = join(root, "data", "api-usage.json");
const maxAnalysisFileBytes = 100 * 1024 * 1024;
const maxJsonBodyBytes = 140 * 1024 * 1024;
const maxModelImageDataUrlChars = 4_000_000;
const maxModelImageCount = 32;

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
  const commerceFallback = metadataFromCommerceUrl(url);
  let response;
  try {
    response = await fetch(url, {
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
  const imageCandidates = extractImageCandidates(html, url);
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
    url,
  };
}

function metadataFromCommerceUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    const itemId = parsed.searchParams.get("id") || parsed.searchParams.get("itemId") || "";
    const skuId = parsed.searchParams.get("skuId") || "";
    const platform = host.includes("tmall")
      ? "天猫"
      : host.includes("taobao")
        ? "淘宝"
        : host.includes("jd.")
          ? "京东"
          : "";
    if (!platform || (!itemId && !skuId)) return null;
    const canonicalUrl =
      platform === "京东"
        ? `https://item.jd.com/${itemId || skuId}.html`
        : `${parsed.origin}${parsed.pathname}?${new URLSearchParams(
            Object.fromEntries(
              [
                ["id", itemId],
                ["skuId", skuId],
              ].filter(([, value]) => value),
            ),
          ).toString()}`;
    const textSnippets = uniqueStrings(
      [
        `平台：${platform}`,
        itemId ? `商品 ID：${itemId}` : "",
        skuId ? `SKU ID：${skuId}` : "",
        "页面可能需要登录或动态加载；如未抓到价格、参数和详情图，请上传详情页截图或长图补充分析。",
      ],
      8,
    );
    return {
      title: `${platform}商品${itemId ? ` ${itemId}` : ""}`,
      description: `${platform}详情页链接已识别；动态详情、价格和图片可能需要截图或长图兜底。`,
      image: "",
      imageCandidates: [],
      price: null,
      currency: "CNY",
      priceSource: "",
      priceCandidates: [],
      textSnippets,
      platform,
      channel: platform,
      itemId,
      skuId,
      canonicalUrl,
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
  const candidates = [
    metaContent(html, ["og:image", "twitter:image", "image"]),
    ...[...html.matchAll(/<img\b[^>]*(?:src|data-src|data-original|data-lazy-src)=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]),
    ...[...html.matchAll(/<img\b[^>]*srcset=["']([^"']+)["'][^>]*>/gi)]
      .flatMap((match) => match[1].split(",").map((item) => item.trim().split(/\s+/)[0])),
  ];
  return uniqueStrings(
    candidates
      .map((value) => absoluteUrl(value, baseUrl))
      .filter((value) => /^https?:\/\//i.test(value) && !/\.(gif|ico)(?:[?#].*)?$/i.test(value)),
    12,
  );
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
  const imageUrls = normalizeImageDataUrls(input);
  const oversizedImageUrl = imageUrls.find((imageUrl) => imageUrl.length > maxModelImageDataUrlChars);
  if (oversizedImageUrl) {
    throw new Error("上传图片超过 AI 接口单张图片限制，请把详情页拆成多张截图，或压缩图片宽度后重新上传。");
  }
  const sourceImageUrls = analysisSourceImageUrls(metadata);
  const prompt = [
    "你是清洁电器竞品分析师，请从官网或电商详情页信息中抽取结构化产品资料。",
    "品类只允许：扫地机、洗地机、吸尘器。",
    "需要输出可人工复核的低幻觉结果；不确定字段用待确认并降低 confidence。",
    "Top3 sellingPoints 要按竞品优先级排序，每条包含 title 和 evidence。",
    "如果输入包含 PDF 或图片附件，请优先从附件中的详情页文案、参数表、价格和图片证据抽取。",
    "image 字段只能使用页面中明确出现的产品图 URL；没有可靠 URL 时返回空字符串，不要生成虚构图片。",
    "customFeatures 必须只使用下方自定义字段列表里的 key；没有证据时 value 填待确认、confidence 降低。",
    "enum 类型的 customFeatures 应优先从字段 options 中选择取值；详情页没有明确证据时填待确认。",
    `URL: ${input.sourceUrl || "无"}`,
    `页面标题: ${metadata.title || "无"}`,
    `页面描述: ${metadata.description || "无"}`,
    `预抓取价格: ${metadata.price ? `${metadata.currency || "CNY"} ${metadata.price} (${metadata.priceSource || "unknown"})` : "无"}`,
    `价格候选: ${metadata.priceCandidates?.length ? JSON.stringify(metadata.priceCandidates.slice(0, 8)) : "[]"}`,
    `图片候选数: ${metadata.imageCandidates?.length || 0}`,
    `已附加 URL 图片候选数: ${sourceImageUrls.length}`,
    `页面文案证据片段: ${metadata.textSnippets?.length ? JSON.stringify(metadata.textSnippets.slice(0, 12)) : "[]"}`,
    `上传图片数: ${imageUrls.length}`,
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
    imageDataUrls: input.imageDataUrls,
    remoteImageUrls: sourceImageUrls,
    fileAttachment: input.fileAttachment,
    schemaName: "cleaner_product_analysis",
    schema,
  });
  return {
    product: {
      ...product,
      sourceMetadata: {
        ...metadata,
        url: input.sourceUrl || metadata.url || "",
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
  createAppServer().listen(port, () => {
    console.log(`Cleaner competitive workbench running at http://localhost:${port}`);
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
  isReadAuthorized,
  isWriteAuthorized,
  metadataFromCommerceUrl,
  normalizeComparisonSummary,
  pricesFromText,
  usageTokens,
};
