#!/usr/bin/env node

import { Readable } from "node:stream";
import { createAppServer } from "../server.mjs";

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

const server = createAppServer();

const health = await requestJson(server, "/api/health");
assert(health.ok === true, "health.ok must be true");
assert(typeof health.model === "string" && health.model.length > 0, "health.model is required");

const state = await requestJson(server, "/api/state");
assert("savedViews" in state, "/api/state must return savedViews");

const usage = await requestJson(server, "/api/usage");
assert(Array.isArray(usage.recent), "/api/usage must return recent array");

const html = await requestText(server, "/");
for (const token of ["清洁电器竞品分析工作台", "mvpReadiness", "exportMvpChecklist", "exportHandoffReport", "sourceImage", "comparePicker", "roadmapBoard"]) {
  assert(html.includes(token), `index page missing ${token}`);
}

const script = await requestText(server, "/script.js");
for (const token of ["renderMvpReadiness", "handoffReportMarkdown", "runAnalysis", "brandRoadmapReportHtml", "normalizeComparisonSummary"]) {
  assert(script.includes(token), `script.js missing ${token}`);
}

const styles = await requestText(server, "/styles.css");
for (const token of [".mvp-checklist", ".roadmap-board", ".comparison-summary"]) {
  assert(styles.includes(token), `styles.css missing ${token}`);
}

const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  throw new Error("runtime verifier blocks external model calls");
};
try {
  const analysis = await postJson(server, "/api/analyze", {
    sourceUrl: "https://example.com/floor-washer",
    notes: "洗地机详情页，重点关注自清洁和贴边能力。",
    featureFields: [
      { key: "hotWash", name: "热水洗", type: "boolean" },
      { key: "base", name: "基站", type: "text" },
    ],
  });
  assert(analysis.product?.reviewRequired === true, "/api/analyze fallback must require review");
  assert(analysis.product?.category === "洗地机", "/api/analyze fallback should infer floor washer category");
  assert(analysis.product?.customFeatures?.length === 2, "/api/analyze fallback should preserve custom feature fields");
  assert(analysis.analysisMeta?.status === "fallback", "/api/analyze must return fallback status when model call fails");

  const comparison = await postJson(server, "/api/compare", {
    products: [
      { brand: "A", model: "A1", category: "扫地机", price: 3999, topSellingPoints: ["热水洗拖布"], differenceFields: [{ name: "基站", value: "全能" }] },
      { brand: "B", model: "B1", category: "扫地机", price: 2999, topSellingPoints: ["高吸力"], differenceFields: [{ name: "基站", value: "基础" }] },
    ],
  });
  assert(comparison.summary === "", "/api/compare fallback should return an empty summary for local UI fallback");
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Runtime verification passed.");
console.log("- Checked local HTTP app, static assets, read APIs, and AI fallback APIs through in-memory request injection.");
