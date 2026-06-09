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
for (const key of ["OPENAI_API_KEY", "OPENAI_MODEL", "APP_ACCESS_TOKEN", "APP_READ_TOKEN", "APP_WRITE_TOKEN", "PORT"]) {
  addCheck(`.env.example ${key}`, Object.prototype.hasOwnProperty.call(envExample, key));
}
addCheck(".env.local", existsSync(envLocalPath), existsSync(envLocalPath) ? "已存在，本脚本不会输出密钥值" : "未创建；可从 .env.example 复制");
if (existsSync(envLocalPath)) {
  addCheck("OPENAI_API_KEY 配置", Boolean(envLocal.OPENAI_API_KEY), envLocal.OPENAI_API_KEY ? "已配置" : "未配置，AI 会走待确认兜底");
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
  "访问令牌配置",
  `端口 ${port}`,
  `端口 ${port} 健康接口`,
  `端口 ${port} 首页`,
]);

if (failed.some((check) => !allowedWarnings.has(check.name))) {
  process.exit(1);
}
