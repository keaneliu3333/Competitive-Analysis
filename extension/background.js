const WORKBENCH_IMPORT_URLS = [
  "http://127.0.0.1:4173/api/manual-capture/import",
  "http://127.0.0.1:4175/api/manual-capture/import",
  "http://127.0.0.1:4174/api/manual-capture/import",
  "http://localhost:4173/api/manual-capture/import",
  "http://localhost:4175/api/manual-capture/import",
  "http://localhost:4174/api/manual-capture/import",
];
const JPEG_QUALITY = 76;
const CAPTURE_SCROLL_WAIT_MS = 520;
const DISCOVERY_SCROLL_WAIT_MS = 220;
const DISCOVERY_SETTLE_WAIT_MS = 900;
const MAX_CAPTURE_SAFETY_STEPS = 45;
const MAX_SUBMITTED_SCREENSHOTS = 40;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendTabMessage(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve(response);
    });
  });
}

async function ensureContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"],
  });
}

async function discoverPageExtent(tabId, firstInfo, port) {
  let info = firstInfo;
  let bestInfo = firstInfo;
  let lastHeight = Number(firstInfo.scrollHeight || firstInfo.viewportHeight || 0);
  let stableBottomCount = 0;
  for (let index = 0; index < MAX_CAPTURE_SAFETY_STEPS; index += 1) {
    const viewportHeight = Math.max(480, Number(info.viewportHeight || 900));
    const scrollHeight = Math.max(viewportHeight, Number(info.scrollHeight || viewportHeight));
    const targetY = Math.max(0, scrollHeight - viewportHeight);
    port.postMessage({
      type: "progress",
      message: `正在快速探测详情页长度 ${index + 1} 步，页面约 ${Math.round(scrollHeight)}px...`,
    });
    const nextInfo = await sendTabMessage(tabId, { type: "CAPTURE_SCROLL_TO", y: targetY, waitMs: DISCOVERY_SCROLL_WAIT_MS });
    const nextHeight = Math.max(Number(nextInfo.scrollHeight || 0), Number(nextInfo.viewportHeight || 0));
    const nextMaxY = Math.max(0, Number(nextInfo.scrollHeight || nextInfo.viewportHeight || 0) - Number(nextInfo.viewportHeight || 0));
    const atBottom = Number(nextInfo.scrollY || targetY) >= nextMaxY - 8;
    const heightStable = Math.abs(nextHeight - lastHeight) < 8;
    if (nextHeight >= Number(bestInfo.scrollHeight || 0)) bestInfo = nextInfo;
    if (atBottom && heightStable) stableBottomCount += 1;
    else stableBottomCount = 0;
    info = nextInfo;
    lastHeight = Math.max(lastHeight, nextHeight);
    if (stableBottomCount >= 2) break;
  }
  await sleep(DISCOVERY_SETTLE_WAIT_MS);
  info = await sendTabMessage(tabId, { type: "CAPTURE_PAGE_INFO" }).catch(() => bestInfo);
  return Number(info.scrollHeight || 0) >= Number(bestInfo.scrollHeight || 0) ? info : bestInfo;
}

function sampledScreenshotPositions(firstInfo, finalInfo) {
  const viewportHeight = Math.max(480, Number(finalInfo.viewportHeight || firstInfo.viewportHeight || 900));
  const startY = Math.max(0, Number(firstInfo.scrollY || 0));
  const maxY = Math.max(startY, Number(finalInfo.scrollHeight || viewportHeight) - viewportHeight);
  const count = Math.min(
    MAX_SUBMITTED_SCREENSHOTS,
    Math.max(1, Math.ceil((maxY - startY) / Math.max(1, Math.floor(viewportHeight * 0.72))) + 1),
  );
  if (count <= 1) return [startY];
  const positions = [];
  for (let index = 0; index < count; index += 1) {
    positions.push(Math.round(startY + ((maxY - startY) * index) / (count - 1)));
  }
  return Array.from(new Set(positions)).sort((a, b) => a - b);
}

function captureVisibleTab(windowId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(windowId, { format: "jpeg", quality: JPEG_QUALITY }, (dataUrl) => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else if (!dataUrl) reject(new Error("截图为空"));
      else resolve(dataUrl);
    });
  });
}

async function submitCapture({ sourceUrl, title, screenshots }) {
  const errors = [];
  for (const url of WORKBENCH_IMPORT_URLS) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl, title, screenshots }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `工作台返回 HTTP ${response.status}`);
      return { ...payload, workbenchUrl: url.replace("/api/manual-capture/import", "") };
    } catch (error) {
      errors.push(`${url}: ${error.message || error}`);
    }
  }
  throw new Error(`无法连接本地工作台。请确认已启动 node server.mjs。尝试结果：${errors.join(" | ")}`);
}

async function runCapture(port) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab?.windowId) throw new Error("没有找到当前浏览器标签页");
  if (!/^https?:\/\//i.test(tab.url || "")) throw new Error("请先打开京东或电商商品详情页");

  port.postMessage({ type: "progress", message: "正在注入截图助手..." });
  await ensureContentScript(tab.id);
  const firstInfo = await sendTabMessage(tab.id, { type: "CAPTURE_PAGE_INFO" });
  const finalInfo = await discoverPageExtent(tab.id, firstInfo, port);
  const positions = sampledScreenshotPositions(firstInfo, finalInfo);
  const screenshots = [];

  for (const [index, y] of positions.entries()) {
    port.postMessage({ type: "progress", message: `正在截取关键截图 ${index + 1}/${positions.length}...` });
    await sendTabMessage(tab.id, { type: "CAPTURE_SCROLL_TO", y, waitMs: CAPTURE_SCROLL_WAIT_MS });
    await sleep(60);
    screenshots.push(await captureVisibleTab(tab.windowId));
  }

  await sendTabMessage(tab.id, { type: "CAPTURE_SCROLL_TO", y: firstInfo.scrollY || 0, waitMs: 150 }).catch(() => {});
  port.postMessage({ type: "progress", message: "正在提交到本地工作台..." });
  const payload = await submitCapture({
    sourceUrl: firstInfo.url || tab.url,
    title: firstInfo.title || tab.title || "",
    screenshots,
  });
  port.postMessage({
    type: "done",
    message: payload.workbenchUrl
      ? `已提交 ${screenshots.length} 张截图到 ${payload.workbenchUrl}，请回到工作台点击“刷新扩展截图”。`
      : payload.message || `已提交 ${screenshots.length} 张截图到工作台。`,
    screenshotCount: screenshots.length,
  });
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "capture") return;
  port.onMessage.addListener((message) => {
    if (message?.type !== "start") return;
    runCapture(port).catch((error) => {
      port.postMessage({ type: "error", message: error.message || "截图失败" });
    });
  });
});
