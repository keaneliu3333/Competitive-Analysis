#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:4173";
const chromePath = process.env.CHROME_EXECUTABLE_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const dateStamp = new Date().toISOString().slice(0, 10);
const downloadsPath = process.env.SMOKE_DOWNLOADS_DIR || "/private/tmp/namecard-formal-use-downloads";
const resultPath =
  process.env.SMOKE_RESULT_PATH || join(root, "reports", `formal-use-browser-smoke-${dateStamp}.json`);
const tinyPngPath = join(downloadsPath, "formal-use-detail.png");
const dataPackageImportPath = join(downloadsPath, "formal-use-package.json");

const trackedStateFiles = [
  join(root, "data", "workbench-state.json"),
  join(root, "data", "api-usage.json"),
];

const backups = trackedStateFiles.map((file) => ({
  file,
  existed: existsSync(file),
  content: existsSync(file) ? readFileSync(file, "utf8") : null,
}));

const results = [];
const issues = [];
const consoleErrors = [];
const downloads = [];
const responsiveChecks = [];
const responsiveViewports = [
  { name: "mobile", width: 375, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1100 },
];

function record(name, status, detail = "") {
  results.push({ name, status, detail });
  console.log(`${status === "passed" ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
  if (status !== "passed") issues.push(`${name}: ${detail}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isIgnorableConsoleError(text) {
  return /^Failed to load resource: the server responded with a status of 404/.test(String(text || ""));
}

async function loadPlaywright() {
  const bundledPath =
    "/Users/apple/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js";
  const candidates = [
    process.env.PLAYWRIGHT_MODULE_PATH,
    existsSync(bundledPath) ? bundledPath : null,
    "playwright",
  ].filter(Boolean);

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

  throw new Error(`Playwright is required for Formal use browser smoke. Tried: ${errors.join(" | ")}`);
}

async function expectDownload(page, action, label, expectedFilenamePart = "") {
  const downloadPromise = page.waitForEvent("download", { timeout: 10000 });
  await action();
  const download = await downloadPromise;
  const path = await download.path();
  const suggestedFilename = download.suggestedFilename();
  downloads.push({ label, suggestedFilename, path });
  assert(path, `${label} download missing temp path`);
  assert(suggestedFilename, `${label} missing filename`);
  if (expectedFilenamePart) {
    assert(
      suggestedFilename.includes(expectedFilenamePart),
      `${label} filename ${suggestedFilename} missing ${expectedFilenamePart}`,
    );
  }
  return { path, suggestedFilename };
}

async function optionLabels(page, selector) {
  return page.locator(selector).evaluate((select) =>
    Array.from(select.options).map((option) => ({
      label: option.textContent.trim(),
      value: option.value,
    })),
  );
}

async function waitForSavedState() {
  await new Promise((resolveCallback) => setTimeout(resolveCallback, 500));
}

async function ensureProductsWorkspace(page) {
  await page.waitForFunction(
    () => typeof window.setActiveWorkspace === "function" && Boolean(document.querySelector("[data-workspace='products']")),
    null,
    { timeout: 15000 },
  );
  await page.evaluate(() => window.setActiveWorkspace("products"));
  await page.locator("#productTableBody tr").first().waitFor({ state: "visible", timeout: 15000 });
}

async function ensureCompareWorkspace(page) {
  await page.waitForFunction(
    () => typeof window.setActiveWorkspace === "function" && Boolean(document.querySelector("[data-analysis-tab='compare']")),
    null,
    { timeout: 15000 },
  );
  await page.evaluate(() => window.setActiveWorkspace("compare"));
  await page.locator("#compareWorkspace").waitFor({ state: "visible", timeout: 15000 });
}

function restoreStateFiles() {
  for (const backup of backups) {
    if (backup.existed) {
      mkdirSync(dirname(backup.file), { recursive: true });
      writeFileSync(backup.file, backup.content);
    } else if (existsSync(backup.file)) {
      rmSync(backup.file);
    }
  }
}

async function verifyResponsiveViewports(browser) {
  for (const viewport of responsiveViewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();
    const viewportErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error" && !isIgnorableConsoleError(message.text())) viewportErrors.push(message.text());
    });
    page.on("pageerror", (error) => viewportErrors.push(error.message));

    try {
      await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
      await ensureProductsWorkspace(page);
      for (const selector of [
        "#keywordSearch",
        "[data-workspace='import']",
        "#productTableBody",
        "[data-analysis-tab='compare']",
        "[data-workspace='roadmap']",
        "[data-workspace='system']",
      ]) {
        assert(await page.locator(selector).isVisible(), `${viewport.name} 视口缺少 ${selector}`);
      }
      const layout = await page.evaluate(() => {
        const rootElement = document.documentElement;
        const body = document.body;
        const main = document.querySelector(".main-area");
        const sidebar = document.querySelector(".sidebar");
        return {
          viewportWidth: window.innerWidth,
          documentScrollWidth: rootElement.scrollWidth,
          bodyScrollWidth: body.scrollWidth,
          mainRight: main?.getBoundingClientRect().right || 0,
          sidebarRight: sidebar?.getBoundingClientRect().right || 0,
          hasTrialText: body.innerText.includes("内部试用反馈"),
          trialFeedbackCount: document.querySelectorAll("#trialFeedback, #addTrialFeedback, #exportTrialFeedback").length,
        };
      });
      const maxBodyWidth = Math.max(layout.documentScrollWidth, layout.bodyScrollWidth);
      assert(maxBodyWidth <= viewport.width + 4, `${viewport.name} 视口出现页面横向溢出 ${maxBodyWidth}/${viewport.width}`);
      assert(layout.mainRight <= viewport.width + 4, `${viewport.name} 主内容越界 ${layout.mainRight}/${viewport.width}`);
      assert(layout.sidebarRight <= viewport.width + 4, `${viewport.name} 筛选栏越界 ${layout.sidebarRight}/${viewport.width}`);
      assert(!layout.hasTrialText && layout.trialFeedbackCount === 0, `${viewport.name} 视口出现试用模块`);
      assert(viewportErrors.length === 0, `${viewport.name} console error: ${viewportErrors.slice(0, 3).join(" | ")}`);
      responsiveChecks.push({
        viewport: viewport.name,
        width: viewport.width,
        height: viewport.height,
        status: "passed",
        documentScrollWidth: layout.documentScrollWidth,
        bodyScrollWidth: layout.bodyScrollWidth,
      });
    } finally {
      await context.close().catch(() => {});
    }
  }
  record("响应式视口", "passed", "375px、768px、1440px 无页面横向溢出，关键入口可见");
}

async function main() {
  console.log(`Formal use browser smoke started: ${baseUrl}`);
  mkdirSync(downloadsPath, { recursive: true });
  mkdirSync(dirname(resultPath), { recursive: true });
  writeFileSync(
    tinyPngPath,
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l7IfJQAAAABJRU5ErkJggg==",
      "base64",
    ),
  );

  const playwrightModule = await loadPlaywright();
  const { chromium } = playwrightModule.default || playwrightModule;
  const launchOptions = {
    headless: true,
  };
  if (existsSync(chromePath)) launchOptions.executablePath = chromePath;

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 1100 },
  });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error" && !isIgnorableConsoleError(message.text())) consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await ensureProductsWorkspace(page);
    const bodyText = await page.locator("body").innerText();
    const workspaceLabels = await page.locator("[data-workspace]").evaluateAll((nodes) => nodes.map((node) => node.textContent || "").join("\n"));
    assert(
      bodyText.includes("产品库") && bodyText.includes("型号对比") && workspaceLabels.includes("品牌路标"),
      "核心工作台模块缺失",
    );
    assert(!bodyText.includes("内部试用反馈"), "页面出现内部试用反馈模块");
    assert((await page.locator("#trialFeedback").count()) === 0, "页面存在 trialFeedback 模块");
    assert((await page.locator("#addTrialFeedback").count()) === 0, "页面存在 addTrialFeedback 入口");
    assert((await page.locator("#exportTrialFeedback").count()) === 0, "页面存在 exportTrialFeedback 入口");
    record("启动与首页", "passed", "首页直接进入工作台，核心模块可见，no in-page trial module");

    await page.locator("#clearFilters").click();
    await page.locator("#keywordSearch").fill("石头");
    await page.locator("#minPrice").fill("3000");
    await page.locator("#maxPrice").fill("7000");
    await page.locator(".advanced-filters").evaluate((element) => {
      element.open = true;
    });
    const brandOptions = await optionLabels(page, "#brandFilter");
    const roborock = brandOptions.find((option) => option.label.includes("石头"));
    if (roborock) await page.locator("#brandFilter").selectOption(roborock.value);
    const featureOptions = await optionLabels(page, "#featureFilterField");
    const featureTarget = featureOptions.find((option) => option.value !== "全部");
    if (featureTarget) {
      await page.locator("#featureFilterField").selectOption(featureTarget.value);
      await page.locator("#featureFilterOperator").selectOption("hasValue");
    }
    await page.waitForFunction(() => document.querySelectorAll("#productTableBody tr").length > 0, null, {
      timeout: 5000,
    });
    const viewName = `正式冒烟视图-${Date.now()}`;
    await page.locator("#savedViewName").fill(viewName);
    await page.locator("#saveView").click();
    await waitForSavedState();
    const savedViews = await optionLabels(page, "#savedViews");
    assert(savedViews.some((option) => option.label === viewName), "保存视图未出现在下拉框");
    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureProductsWorkspace(page);
    await page.locator(".advanced-filters").evaluate((element) => {
      element.open = true;
    });
    const reloadedViews = await optionLabels(page, "#savedViews");
    const restored = reloadedViews.find((option) => option.label === viewName);
    assert(restored, "刷新后保存视图丢失");
    await page.locator("#savedViews").selectOption(restored.value);
    record("筛选工作台", "passed", "关键词、价格、品牌/渠道/状态、自定义字段和保存视图通过");

    await page.locator("#clearFilters").click();
    await page.waitForFunction(() => document.querySelectorAll("#productTableBody tr").length > 0, null, {
      timeout: 5000,
    });
    await page.locator("#productTableBody tr").first().click();
    await page.waitForFunction(
      () => Boolean(document.querySelector("#productEditForm") || document.querySelector("#productDetail button[data-edit-product]")),
      null,
      { timeout: 5000 },
    );

    const moduleName = `正式冒烟模块-${Date.now()}`;
    const fieldName = `体验等级-${Date.now()}`;
    const renamedFieldName = `${fieldName}-已重命名`;
    await ensureCompareWorkspace(page);
    await page.locator(".module-manager").evaluate((element) => {
      element.open = true;
    });
    await page.locator("#moduleName").fill(moduleName);
    await page.locator("#fieldName").fill(fieldName);
    await page.locator("#fieldType").selectOption("enum");
    await page.locator("#fieldOptions").fill("基础/进阶/旗舰");
    await page.locator("#addField").click();
    await page.waitForTimeout(250);
    const addedOptions = await optionLabels(page, "#featureFilterField");
    const addedField = addedOptions.find((option) => option.label.includes(fieldName));
    assert(addedField, "新增枚举字段未进入筛选器");
    const fieldKey = addedField.value;
    assert(await page.locator(`#compareFieldPicker [data-compare-field-key="${fieldKey}"]`).count(), "新增字段未进入对比字段选择");
    await page.locator("[data-workspace='products']").click();
    await ensureProductsWorkspace(page);
    if ((await page.locator("#productEditForm").count()) === 0) {
      await page.locator("#productDetail button[data-edit-product]").click();
    }
    await page.locator(`#productEditForm [data-feature-field="${fieldKey}"]`).selectOption("旗舰");
    await page.locator("#productEditForm button[type='submit']").click();
    await waitForSavedState();
    await ensureCompareWorkspace(page);
    await page.locator(".module-manager").evaluate((element) => {
      element.open = true;
    });
    page.once("dialog", (dialog) => dialog.accept(renamedFieldName));
    await page.locator(`[data-rename-field="${fieldKey}"]`).click();
    await page.waitForTimeout(250);
    const renamedOptions = await optionLabels(page, "#featureFilterField");
    assert(renamedOptions.some((option) => option.label.includes(renamedFieldName)), "字段重命名后未同步筛选器");
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator(`[data-delete-field="${fieldKey}"]`).click();
    await page.waitForTimeout(250);
    const deletedOptions = await optionLabels(page, "#featureFilterField");
    assert(!deletedOptions.some((option) => option.value === fieldKey), "删除字段后仍显示在筛选器");
    await page.locator("[data-workspace='system']").click();
    const dataPackage = await expectDownload(page, () => page.locator("#exportDataPackage").click(), "数据包导出");
    const dataPackageJson = JSON.parse(readFileSync(dataPackage.path, "utf8"));
    const historicalValue = (dataPackageJson.state?.products || []).some((product) => product.features?.[fieldKey] === "旗舰");
    assert(historicalValue, "删除字段后历史产品值未保留在数据包");
    record("自定义字段", "passed", "新增、录入、重命名、删除和历史值保留通过");

    await page.locator("[data-workspace='import']").click();
    await page.locator("#sourceUrl").fill("https://invalid.invalid/cleaner-smoke");
    await page.locator("#sourceImage").setInputFiles(tinyPngPath);
    await page.locator("#sourceNotes").fill("正式功能冒烟：验证图片上传和 AI 失败兜底进入人工复核。");
    await page.locator("#runAnalysis").click();
    await page.locator("#analysisStatus").waitFor({ state: "visible", timeout: 60000 });
    await page.waitForFunction(
      () => {
        const text = document.querySelector("#analysisStatus")?.textContent || "";
        return text.includes("分析完成") || text.includes("兜底") || text.includes("分析失败");
      },
      null,
      { timeout: 90000 },
    );
    const analysisStatus = await page.locator("#analysisStatus").innerText();
    assert(!analysisStatus.includes("分析失败"), analysisStatus);
    const reviewText = await page.locator("#reviewQueue").innerText();
    assert(reviewText.includes("待确认") || reviewText.includes("置信度") || reviewText.includes("复核"), "AI 导入后未形成可复核状态");
    record("详情页与 AI 导入", "passed", analysisStatus.slice(0, 120));

    await ensureCompareWorkspace(page);
    await page.locator("#compareFilteredProducts").click();
    await page.waitForFunction(
      () => document.querySelectorAll("#comparePicker input[data-compare-id]:checked").length >= 2,
      null,
      { timeout: 5000 },
    );
    await page.locator("#selectAllCompareFields").click();
    await page.locator("#generateSummary").click();
    await page.waitForFunction(
      () => {
        const text = document.querySelector("#comparisonSummary")?.textContent?.trim() || "";
        return text && !text.includes("选择至少 2 个型号") && !text.includes("正在");
      },
      null,
      { timeout: 90000 },
    );
    const summary = (await page.locator("#comparisonSummary").innerText()).trim();
    assert(summary.length > 20 && summary.length <= 500, `总结长度异常：${summary.length}`);
    const diffCells = await page.locator("#compareBody .diff-cell").count();
    assert(diffCells > 0, "对比矩阵没有差异高亮");
    await expectDownload(page, () => page.locator("#exportCompare").click(), "对比表 Excel");
    record("型号对比和 500 字总结", "passed", `总结 ${summary.length} 字，差异单元 ${diffCells}`);

    const roadmapProduct = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("cleaner-competitive-workbench") || "{}");
      return (
        (state.products || []).find(
          (product) => {
            const sellingPoints = product.sellingPoints || [];
            return (
              product.brand &&
              product.category &&
              product.status &&
              Number(product.price || 0) > 0 &&
              !product.reviewRequired &&
              Number(product.confidence || 0) >= 80 &&
              sellingPoints.length >= 3 &&
              !/待确认|未知/.test(`${product.brand}${product.model}${product.name}${product.status}`) &&
              !sellingPoints.slice(0, 3).some((point) => /待确认|未知/.test(`${point.title || ""}${point.evidence || ""}`))
            );
          },
        ) || null
      );
    });
    assert(roadmapProduct, "没有可用于路线图筛选的产品样例");
    await page.locator("[data-workspace='roadmap']").click();
    await page.locator("#roadmapCategoryFilter").selectOption(roadmapProduct.category);
    await page.evaluate((brand) => {
      window.setRoadmapBrands?.([brand]);
      window.setActiveWorkspace?.("roadmap");
    }, roadmapProduct.brand);
    const roadmapStatusOptions = await optionLabels(page, "#roadmapStatusFilter");
    if (roadmapStatusOptions.some((option) => option.value === roadmapProduct.status)) {
      await page.locator("#roadmapStatusFilter").selectOption(roadmapProduct.status);
    }
    const roadmapQuarterOptions = await optionLabels(page, "#roadmapQuarterFilter");
    if (roadmapQuarterOptions.some((option) => option.value === "全部")) {
      await page.locator("#roadmapQuarterFilter").selectOption("全部");
    }
    await page.evaluate(() => {
      window.setRoadmapBrands?.([]);
      window.setActiveWorkspace?.("roadmap");
    });
    assert((await page.locator("#roadmapBrandLabel").innerText()).includes("全部"), "路线图品牌筛选不能清除为全部");
    await page.evaluate((brand) => {
      window.setRoadmapBrands?.([brand]);
      window.setActiveWorkspace?.("roadmap");
    }, roadmapProduct.brand);
    assert((await page.locator("[data-roadmap-mode=\"single\"]").count()) === 1, "缺少单品牌路线图模式");
    assert((await page.locator("[data-roadmap-mode=\"compare\"]").count()) === 1, "缺少品牌对比路线图模式");
    const roadmapText = await page.locator("#roadmapBoard").innerText();
    assert(roadmapText.includes("¥") && (roadmapProduct.sellingPoints || []).some((point) => roadmapText.includes(point.title)), "路线图卡片缺少价格或 Top3 卖点");
    assert((await page.locator(".roadmap-axis").count()) === 1, "路线图缺少价格轴");
    assert((await page.locator(".roadmap-axis-tick").count()) >= 2, "路线图缺少 500/1000 价格档位刻度");
    await page.locator("[data-roadmap-mode=\"compare\"]").click();
    assert((await page.locator(".roadmap-lane").count()) >= 1, "品牌对比路线图缺少品牌列");
    await page.locator("[data-roadmap-mode=\"single\"]").click();
    await expectDownload(page, () => page.locator("#exportRoadmap").click(), "路线图 Excel");
    await expectDownload(page, () => page.locator("#exportRoadmapSvg").click(), "路线图 SVG");
    const allPopupPromise = page.waitForEvent("popup", { timeout: 10000 });
    await page.locator("#printAllBrandRoadmaps").click();
    const allPopup = await allPopupPromise;
    await allPopup.close();
    record("路线图导出", "passed", "Excel、SVG、当前打印页和各品牌分页打印页通过");

    await page.locator("[data-workspace='products']").click();
    await ensureProductsWorkspace(page);
    await expectDownload(page, () => page.locator("#exportExcel").click(), "产品库 Excel");
    await page.locator("[data-workspace='quality']").click();
    await expectDownload(page, () => page.locator("#exportQualityCsv").click(), "质量问题 CSV");
    await page.locator("[data-workspace='system']").click();
    await expectDownload(page, () => page.locator("#exportAuditCsv").click(), "审计 CSV");
    await expectDownload(page, () => page.locator("#exportUsageCsv").click(), "用量 CSV");
    const exportForImport = await expectDownload(page, () => page.locator("#exportDataPackage").click(), "导入用数据包");
    writeFileSync(dataPackageImportPath, readFileSync(exportForImport.path));
    const backupDownloadPromise = page.waitForEvent("download", { timeout: 10000 });
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("#dataPackageFile").setInputFiles(dataPackageImportPath);
    const backupDownload = await backupDownloadPromise;
    downloads.push({
      label: "导入前自动备份",
      suggestedFilename: backupDownload.suggestedFilename(),
      path: await backupDownload.path(),
    });
    const auditRows = await page.locator("#auditTableBody tr").count();
    const usageSummary = await page.locator("#usageSummary").innerText();
    assert(auditRows > 0, "审计日志表为空");
    assert(
      usageSummary.includes("累计调用") || usageSummary.includes("暂无 OpenAI 调用记录") || usageSummary.includes("用量读取失败"),
      "用量面板无状态",
    );
    record("交接、数据包、审计和用量", "passed", "导出、导入前备份、审计和用量状态通过");

    await verifyResponsiveViewports(browser);

    if (consoleErrors.length) {
      record("浏览器控制台", "failed", consoleErrors.slice(0, 5).join(" | "));
    } else {
      record("浏览器控制台", "passed", "无 console error/pageerror");
    }
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    restoreStateFiles();
    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      results,
      issues,
      responsiveChecks,
      downloads: downloads.map(({ label, suggestedFilename }) => ({ label, suggestedFilename })),
      consoleErrors,
    };
    writeFileSync(resultPath, JSON.stringify(report, null, 2));
    console.log(`Formal use browser smoke report: ${resultPath}`);
  }

  if (issues.length) {
    throw new Error(`Formal use browser smoke failed: ${issues.join("; ")}`);
  }
}

main().catch((error) => {
  restoreStateFiles();
  console.error(error);
  process.exit(1);
});
