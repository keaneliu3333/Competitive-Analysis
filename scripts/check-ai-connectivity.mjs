#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { join } from "node:path";
import { connect as tlsConnect } from "node:tls";

const root = process.cwd();
const args = process.argv.slice(2);
const dateStamp = new Date().toISOString().slice(0, 10);
const reportPath = join(root, "reports", `ai-connectivity-check-${dateStamp}.json`);
const env = { ...readEnvFile(join(root, ".env.local")), ...process.env };
const timeoutMs = boundedNumber(env.AI_REQUEST_TIMEOUT_MS, 12000, 5000, 60000);

function readArg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : "";
}

function readEnvFile(path) {
  if (!existsSync(path)) return {};
  const result = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!(key in result)) result[key] = rest.join("=").replace(/^["']|["']$/g, "");
  }
  return result;
}

function boundedNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function configuredBaseUrl(value, fallback) {
  return String(value || fallback).replace(/\/+$/, "");
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return String(value || "");
  }
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

function proxyAuthHeader(proxyUrl) {
  if (!proxyUrl.username && !proxyUrl.password) return "";
  return `Basic ${Buffer.from(`${decodeURIComponent(proxyUrl.username)}:${decodeURIComponent(proxyUrl.password)}`).toString("base64")}`;
}

function fetchJsonViaHttpProxy(endpoint, apiKey, signal) {
  return new Promise((resolve, reject) => {
    const target = new URL(endpoint);
    const proxyUrl = new URL(aiProxyUrl());
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
    const cleanup = () => signal?.removeEventListener("abort", onAbort);
    const onAbort = () => connectRequest.destroy(Object.assign(new Error("AbortError"), { name: "AbortError" }));
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
          method: "GET",
          path: `${target.pathname}${target.search}`,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
          createConnection: () => tlsSocket,
        }, async (providerResponse) => {
          const chunks = [];
          providerResponse.on("data", (chunk) => chunks.push(chunk));
          providerResponse.on("end", () => {
            cleanup();
            resolve({
              ok: providerResponse.statusCode >= 200 && providerResponse.statusCode < 300,
              status: providerResponse.statusCode || 0,
            });
          });
        });
        request.on("error", (error) => {
          cleanup();
          reject(error);
        });
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

function classifyProviderStatus(status) {
  if (status === 200) return "ok";
  if ([401, 403].includes(status)) return "auth-error";
  if (status === 404) return "reachable-but-endpoint-missing";
  if (status >= 400) return "http-error";
  return "unknown";
}

function networkErrorMessage(error) {
  if (error?.name === "AbortError") return `请求超时（${timeoutMs}ms）`;
  return error?.cause?.code || error?.code || error?.message || "network error";
}

async function probeJsonEndpoint({ provider, baseUrl, path, apiKey }) {
  const endpoint = `${baseUrl}${path}`;
  const startedAt = Date.now();
  if (!apiKey) {
    return {
      provider,
      configured: false,
      baseUrl: safeUrl(baseUrl),
      endpoint: safeUrl(endpoint),
      ok: false,
      status: "missing-key",
      message: `${provider} API key 未配置`,
      elapsedMs: 0,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = aiProxyUrl()
      ? await fetchJsonViaHttpProxy(endpoint, apiKey, controller.signal)
      : await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
          signal: controller.signal,
        });
    const status = classifyProviderStatus(response.status);
    return {
      provider,
      configured: true,
      baseUrl: safeUrl(baseUrl),
      endpoint: safeUrl(endpoint),
      ok: response.ok,
      httpStatus: response.status,
      status,
      message: response.ok ? "接口可达" : `接口返回 HTTP ${response.status}`,
      elapsedMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      provider,
      configured: true,
      baseUrl: safeUrl(baseUrl),
      endpoint: safeUrl(endpoint),
      ok: false,
      status: "network-error",
      message: networkErrorMessage(error),
      elapsedMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function probeWorkbench(baseUrl) {
  if (!baseUrl) return null;
  const endpoint = `${String(baseUrl).replace(/\/+$/, "")}/api/health`;
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(endpoint, { signal: controller.signal });
    const payload = await response.json().catch(() => ({}));
    return {
      provider: "workbench",
      endpoint: safeUrl(endpoint),
      ok: Boolean(response.ok && payload.ok),
      httpStatus: response.status,
      message: response.ok && payload.ok ? "本地工作台服务正常" : `本地工作台异常 HTTP ${response.status}`,
      health: {
        openaiConfigured: Boolean(payload.openaiConfigured),
        deepseekConfigured: Boolean(payload.deepseekConfigured),
        qwenConfigured: Boolean(payload.qwenConfigured),
        openaiBaseUrlConfigured: Boolean(payload.openaiBaseUrlConfigured),
        qwenBaseUrlConfigured: Boolean(payload.qwenBaseUrlConfigured),
        aiRequestTimeoutMs: payload.aiRequestTimeoutMs || null,
        qwenRequestTimeoutMs: payload.qwenRequestTimeoutMs || null,
      },
      elapsedMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      provider: "workbench",
      endpoint: safeUrl(endpoint),
      ok: false,
      status: "network-error",
      message: networkErrorMessage(error),
      elapsedMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timer);
  }
}

function printResult(result) {
  if (!result) return;
  const label = result.ok ? "OK" : "WARN";
  console.log(`${label} ${result.provider} - ${result.message}`);
  console.log(`  endpoint: ${result.endpoint}`);
  if (result.httpStatus) console.log(`  http: ${result.httpStatus}`);
  console.log(`  elapsed: ${result.elapsedMs}ms`);
}

const openaiBaseUrl = configuredBaseUrl(env.OPENAI_BASE_URL, "https://api.openai.com/v1");
const deepseekBaseUrl = configuredBaseUrl(env.DEEPSEEK_BASE_URL, "https://api.deepseek.com");
const qwenBaseUrl = configuredBaseUrl(env.QWEN_BASE_URL, "https://dashscope.aliyuncs.com/compatible-mode/v1");
const workbenchBaseUrl = readArg("--base-url") || process.env.SMOKE_BASE_URL || "";

const results = [
  await probeJsonEndpoint({
    provider: "openai",
    baseUrl: openaiBaseUrl,
    path: "/models",
    apiKey: env.OPENAI_API_KEY,
  }),
  await probeJsonEndpoint({
    provider: "deepseek",
    baseUrl: deepseekBaseUrl,
    path: "/models",
    apiKey: env.DEEPSEEK_API_KEY,
  }),
  await probeJsonEndpoint({
    provider: "qwen",
    baseUrl: qwenBaseUrl,
    path: "/models",
    apiKey: env.QWEN_API_KEY,
  }),
  await probeWorkbench(workbenchBaseUrl),
].filter(Boolean);

const openaiResult = results.find((item) => item.provider === "openai");
const deepseekResult = results.find((item) => item.provider === "deepseek");
const qwenResult = results.find((item) => item.provider === "qwen");
const nextSteps = [];
if (openaiResult?.ok) {
  nextSteps.push("OpenAI 链路可达；当前默认不调用 OpenAI，除非后续作为备用 provider 启用。");
} else {
  nextSteps.push("OpenAI 链路未打通或未配置；当前主链路使用 DeepSeek + Qwen-VL，不阻塞本项目。");
}
if (deepseekResult?.ok) {
  nextSteps.push("DeepSeek 链路可达，文本抽取和型号对比总结会优先走 DeepSeek。");
} else if (deepseekResult?.status === "missing-key") {
  nextSteps.push("DeepSeek API key 未配置；如需 DeepSeek 总结，请在 .env.local 填写 DEEPSEEK_API_KEY 后重试。");
} else {
  nextSteps.push("DeepSeek 链路未打通；请检查 DEEPSEEK_BASE_URL、DEEPSEEK_API_KEY 或本机网络。");
}
if (qwenResult?.ok) {
  nextSteps.push("Qwen-VL 链路可达，上传详情页图片和 URL 图片候选会优先走 Qwen-VL。");
} else if (qwenResult?.status === "missing-key") {
  nextSteps.push("Qwen API key 未配置；图片、长图、PDF 页面图像会进入人工复核兜底。");
} else {
  nextSteps.push("Qwen-VL 链路未打通；请检查 QWEN_BASE_URL、QWEN_API_KEY 或本机网络。");
}

mkdirSync(join(root, "reports"), { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  timeoutMs,
  proxy: proxyStatus(),
  results,
  nextStep: nextSteps.join(" "),
};
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("AI connectivity check");
const proxy = proxyStatus();
if (proxy.configured) console.log(`Proxy: ${proxy.protocol}://${proxy.host}:${proxy.port}`);
for (const result of results) printResult(result);
console.log(`Report: ${reportPath}`);
console.log(`Next: ${report.nextStep}`);
