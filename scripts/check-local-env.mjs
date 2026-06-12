#!/usr/bin/env node

import { createConnection } from "node:net";
import { accessSync, constants, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const checks = [];

function addCheck(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

function readEnvFile(path) {
  if (!existsSync(path)) return {};
  const result = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    result[key] = rest.join("=").replace(/^["']|["']$/g, "");
  }
  return result;
}

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port, timeout: 800 });
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => resolve(false));
  });
}

async function fetchText(url) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    return {
      ok: response.ok,
      status: response.status,
      text: await response.text(),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      text: "",
      error: error.message,
    };
  }
}

async function probeWorkbenchService(port) {
  const baseUrl = `http://127.0.0.1:${port}`;
  const [health, home] = await Promise.all([fetchText(`${baseUrl}/api/health`), fetchText(`${baseUrl}/`)]);
  let healthJson = null;
  try {
    healthJson = JSON.parse(health.text);
  } catch {
    healthJson = null;
  }
  return {
    healthOk: Boolean(health.ok && healthJson?.ok === true),
    homeOk: Boolean(home.ok && home.text.includes("清洁电器竞品分析工作台") && home.text.includes("script.js")),
    healthStatus: health.status,
    homeStatus: home.status,
  };
}

const major = Number(process.versions.node.split(".")[0]);
addCheck("Node.js 18+", major >= 18, `当前 ${process.versions.node}`);

for (const file of [
  "index.html",
  "script.js",
  "styles.css",
  "server.mjs",
  "README.md",
  "docs/deployment.md",
  "docs/mvp-acceptance.md",
  "docs/requirements-traceability.md",
  "scripts/verify-mvp.mjs",
]) {
  addCheck(`关键文件 ${file}`, existsSync(join(root, file)));
}

const envExamplePath = join(root, ".env.example");
const envLocalPath = join(root, ".env.local");
const envExample = readEnvFile(envExamplePath);
const envLocal = readEnvFile(envLocalPath);
addCheck(".env.example", existsSync(envExamplePath), "可复制为 .env.local");
for (const key of [
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "OPENAI_BASE_URL",
  "AI_REQUEST_TIMEOUT_MS",
  "HTTPS_PROXY",
  "AI_PROVIDER",
  "COMPARE_AI_PROVIDER",
  "VISION_PROVIDER",
  "DEEPSEEK_API_KEY",
  "DEEPSEEK_MODEL",
  "DEEPSEEK_BASE_URL",
  "QWEN_API_KEY",
  "QWEN_MODEL",
  "QWEN_BASE_URL",
  "QWEN_REQUEST_TIMEOUT_MS",
  "APP_ACCESS_TOKEN",
  "APP_READ_TOKEN",
  "APP_WRITE_TOKEN",
  "PORT",
]) {
  addCheck(`.env.example ${key}`, Object.prototype.hasOwnProperty.call(envExample, key));
}
addCheck(".env.local", existsSync(envLocalPath), existsSync(envLocalPath) ? "已存在，本脚本不会输出密钥值" : "未创建；可从 .env.example 复制");
if (existsSync(envLocalPath)) {
  addCheck("OPENAI_API_KEY 配置", Boolean(envLocal.OPENAI_API_KEY), envLocal.OPENAI_API_KEY ? "已配置" : "未配置，AI 会走待确认兜底");
  addCheck("OPENAI_BASE_URL 配置", Boolean(envLocal.OPENAI_BASE_URL || envExample.OPENAI_BASE_URL), envLocal.OPENAI_BASE_URL ? "已自定义" : "使用默认官方地址");
  addCheck("HTTPS_PROXY 配置", Boolean(envLocal.HTTPS_PROXY || envLocal.AI_HTTPS_PROXY || process.env.HTTPS_PROXY || process.env.https_proxy), envLocal.HTTPS_PROXY || envLocal.AI_HTTPS_PROXY ? "已为本项目配置代理" : "未配置，终端需能直连 API");
  addCheck("COMPARE_AI_PROVIDER 配置", Boolean(envLocal.COMPARE_AI_PROVIDER || envExample.COMPARE_AI_PROVIDER), envLocal.COMPARE_AI_PROVIDER ? `当前 ${envLocal.COMPARE_AI_PROVIDER}` : "使用模板默认值");
  addCheck("VISION_PROVIDER 配置", Boolean(envLocal.VISION_PROVIDER || envExample.VISION_PROVIDER), envLocal.VISION_PROVIDER ? `当前 ${envLocal.VISION_PROVIDER}` : "使用模板默认值");
  addCheck("DEEPSEEK_API_KEY 配置", Boolean(envLocal.DEEPSEEK_API_KEY), envLocal.DEEPSEEK_API_KEY ? "已配置" : "未配置，型号对比会走兜底或 OpenAI");
  addCheck("DEEPSEEK_MODEL 配置", Boolean(envLocal.DEEPSEEK_MODEL || envExample.DEEPSEEK_MODEL), envLocal.DEEPSEEK_MODEL ? `当前 ${envLocal.DEEPSEEK_MODEL}` : "使用模板默认值");
  addCheck("DEEPSEEK_BASE_URL 配置", Boolean(envLocal.DEEPSEEK_BASE_URL || envExample.DEEPSEEK_BASE_URL), envLocal.DEEPSEEK_BASE_URL ? "已自定义" : "使用默认官方地址");
  addCheck("QWEN_API_KEY 配置", Boolean(envLocal.QWEN_API_KEY), envLocal.QWEN_API_KEY ? "已配置" : "未配置，图片/长图会走待确认兜底");
  addCheck("QWEN_MODEL 配置", Boolean(envLocal.QWEN_MODEL || envExample.QWEN_MODEL), envLocal.QWEN_MODEL ? `当前 ${envLocal.QWEN_MODEL}` : "使用模板默认值");
  addCheck("QWEN_BASE_URL 配置", Boolean(envLocal.QWEN_BASE_URL || envExample.QWEN_BASE_URL), envLocal.QWEN_BASE_URL ? "已自定义" : "使用默认百炼兼容地址");
  addCheck("访问令牌配置", Boolean(envLocal.APP_ACCESS_TOKEN || envLocal.APP_READ_TOKEN || envLocal.APP_WRITE_TOKEN), "未配置时适合本机开发");
}

const dataDir = join(root, "data");
try {
  mkdirSync(dataDir, { recursive: true });
  accessSync(dataDir, constants.W_OK);
  addCheck("data/ 可写", true);
} catch (error) {
  addCheck("data/ 可写", false, error.message);
}

const port = Number(envLocal.PORT || envExample.PORT || 4173);
const isPortOpen = await portOpen(port);
addCheck(`端口 ${port}`, !isPortOpen, isPortOpen ? "已有进程监听；启动前需换端口或停止旧服务" : "空闲");
if (isPortOpen) {
  const service = await probeWorkbenchService(port);
  addCheck(
    `端口 ${port} 健康接口`,
    service.healthOk,
    service.healthOk ? "当前监听服务返回工作台健康状态" : `健康接口异常或不是当前工作台，HTTP ${service.healthStatus}`,
  );
  addCheck(
    `端口 ${port} 首页`,
    service.homeOk,
    service.homeOk ? "当前监听服务可返回工作台首页" : `首页异常或不是当前工作台，HTTP ${service.homeStatus}`,
  );
}

const failed = checks.filter((check) => !check.ok);
console.log("Local environment check");
for (const check of checks) {
  console.log(`${check.ok ? "OK" : "WARN"} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`);
}

const allowedWarnings = new Set([
  ".env.local",
  "OPENAI_API_KEY 配置",
  "OPENAI_BASE_URL 配置",
  "HTTPS_PROXY 配置",
  "COMPARE_AI_PROVIDER 配置",
  "VISION_PROVIDER 配置",
  "DEEPSEEK_API_KEY 配置",
  "DEEPSEEK_MODEL 配置",
  "DEEPSEEK_BASE_URL 配置",
  "QWEN_API_KEY 配置",
  "QWEN_MODEL 配置",
  "QWEN_BASE_URL 配置",
  "访问令牌配置",
  `端口 ${port}`,
  `端口 ${port} 健康接口`,
  `端口 ${port} 首页`,
]);

if (failed.some((check) => !allowedWarnings.has(check.name))) {
  process.exit(1);
}
