const STORAGE_KEY = "cleaner-competitive-workbench";
const VIEW_KEY = "cleaner-competitive-views";
const TOKEN_KEY = "cleaner-competitive-access-token";

const analysisSteps = [
  { key: "input", label: "资料准备" },
  { key: "files", label: "文件处理" },
  { key: "request", label: "上传调用" },
  { key: "ai", label: "AI 识别" },
  { key: "integrate", label: "入库/复核" },
];

const defaultModules = [
  {
    name: "清洁能力",
    fields: [
      { key: "suction", name: "吸力", type: "text" },
      { key: "mopPressure", name: "拖地压力", type: "text" },
      { key: "edgeCleaning", name: "贴边清洁", type: "boolean" },
    ],
  },
  {
    name: "导航避障",
    fields: [
      { key: "navigation", name: "导航方案", type: "text" },
      { key: "obstacle", name: "避障能力", type: "text" },
    ],
  },
  {
    name: "基站能力",
    fields: [
      { key: "base", name: "基站", type: "text" },
      { key: "hotWash", name: "热水洗拖布", type: "boolean" },
      { key: "dustCollection", name: "自动集尘", type: "boolean" },
    ],
  },
  {
    name: "体验与售后",
    fields: [
      { key: "battery", name: "续航", type: "text" },
      { key: "noise", name: "噪音", type: "text" },
      { key: "app", name: "APP/语音", type: "text" },
    ],
  },
];

const defaultProducts = [
  {
    id: "p-001",
    brand: "Roborock",
    name: "石头 G20S Ultra",
    model: "G20S Ultra",
    category: "扫地机",
    price: 5399,
    channel: "京东",
    status: "在售",
    image: "assets/robot-vacuum.svg",
    confidence: 92,
    reviewRequired: false,
    sourceUrl: "https://example.com/roborock-g20s",
    quarter: "2026 Q2",
    features: {
      suction: "12000Pa",
      mopPressure: "双旋拖布下压",
      edgeCleaning: true,
      navigation: "LDS + 结构光",
      obstacle: "AI 识别小物体",
      base: "洗拖布/烘干/补水/集尘",
      hotWash: true,
      dustCollection: true,
      battery: "180min",
      noise: "约 63dB",
      app: "地图分区、语音控制",
    },
    sellingPoints: [
      { title: "高规格全能基站", evidence: "洗烘补排集尘覆盖完整维护链路" },
      { title: "边角清洁能力强", evidence: "贴边拖布与高吸力组合适合硬地家庭" },
      { title: "智能避障成熟", evidence: "复杂家居环境下减少卡困和误吸" },
    ],
    analysisRuns: [
      {
        id: "run-p-001-seed",
        type: "seed",
        model: "样例数据",
        status: "confirmed",
        confidence: 92,
        source: "内置样例",
        createdAt: "2026-06-05T00:00:00.000Z",
      },
    ],
    auditLog: [
      {
        id: "audit-p-001-seed",
        action: "导入样例",
        actor: "system",
        detail: "初始化石头 G20S Ultra 样例数据",
        createdAt: "2026-06-05T00:00:00.000Z",
      },
    ],
  },
  {
    id: "p-002",
    brand: "Dreame",
    name: "追觅 X40 Pro",
    model: "X40 Pro",
    category: "扫地机",
    price: 4999,
    channel: "天猫",
    status: "在售",
    image: "assets/robot-vacuum.svg",
    confidence: 88,
    reviewRequired: false,
    sourceUrl: "https://example.com/dreame-x40",
    quarter: "2026 Q1",
    features: {
      suction: "11000Pa",
      mopPressure: "机械臂外扩拖布",
      edgeCleaning: true,
      navigation: "LDS + RGB AI",
      obstacle: "宠物用品识别",
      base: "热水洗拖布/热风烘干/自动集尘",
      hotWash: true,
      dustCollection: true,
      battery: "170min",
      noise: "约 64dB",
      app: "多地图、智能托管",
    },
    sellingPoints: [
      { title: "机械臂贴边拖地", evidence: "解决墙边和桌腿周边遗漏" },
      { title: "热水维护链路", evidence: "强调拖布洁净度和长期使用体验" },
      { title: "宠物家庭友好", evidence: "围绕毛发和障碍物做场景化表达" },
    ],
    analysisRuns: [
      {
        id: "run-p-002-seed",
        type: "seed",
        model: "样例数据",
        status: "confirmed",
        confidence: 88,
        source: "内置样例",
        createdAt: "2026-06-05T00:00:00.000Z",
      },
    ],
    auditLog: [
      {
        id: "audit-p-002-seed",
        action: "导入样例",
        actor: "system",
        detail: "初始化追觅 X40 Pro 样例数据",
        createdAt: "2026-06-05T00:00:00.000Z",
      },
    ],
  },
  {
    id: "p-003",
    brand: "ECOVACS",
    name: "科沃斯 T30 Max",
    model: "T30 Max",
    category: "扫地机",
    price: 3999,
    channel: "官网",
    status: "规划",
    image: "assets/robot-vacuum.svg",
    confidence: 78,
    reviewRequired: true,
    sourceUrl: "https://example.com/ecovacs-t30",
    quarter: "2026 Q3",
    features: {
      suction: "10000Pa",
      mopPressure: "恒压拖地",
      edgeCleaning: true,
      navigation: "dToF",
      obstacle: "基础结构光",
      base: "洗拖布/烘干/集尘",
      hotWash: false,
      dustCollection: true,
      battery: "160min",
      noise: "约 66dB",
      app: "YIKO 语音",
    },
    sellingPoints: [
      { title: "价格带更下探", evidence: "以 4K 内全能基站形成防守位" },
      { title: "语音交互突出", evidence: "自有语音助手作为差异化入口" },
      { title: "全链路基础维护", evidence: "覆盖洗烘集尘但热水能力待确认" },
    ],
    analysisRuns: [
      {
        id: "run-p-003-seed",
        type: "seed",
        model: "样例数据",
        status: "review_required",
        confidence: 78,
        source: "内置样例",
        createdAt: "2026-06-05T00:00:00.000Z",
      },
    ],
    auditLog: [
      {
        id: "audit-p-003-seed",
        action: "导入样例",
        actor: "system",
        detail: "初始化科沃斯 T30 Max 样例数据",
        createdAt: "2026-06-05T00:00:00.000Z",
      },
    ],
  },
  {
    id: "p-004",
    brand: "Tineco",
    name: "添可 芙万 Stretch S6",
    model: "Stretch S6",
    category: "洗地机",
    price: 3290,
    channel: "京东",
    status: "在售",
    image: "assets/floor-washer.svg",
    confidence: 91,
    reviewRequired: false,
    sourceUrl: "https://example.com/tineco-s6",
    quarter: "2026 Q2",
    features: {
      suction: "湿干两用",
      mopPressure: "滚刷贴地",
      edgeCleaning: true,
      navigation: "手持牵引",
      obstacle: "低矮空间伸展",
      base: "自清洁/热风烘干",
      hotWash: true,
      dustCollection: false,
      battery: "40min",
      noise: "约 78dB",
      app: "脏污识别提示",
    },
    sellingPoints: [
      { title: "可平躺清洁", evidence: "床底和沙发底等低矮区域更好覆盖" },
      { title: "热水自清洁", evidence: "降低滚刷异味和二次污染" },
      { title: "脏污感知", evidence: "按地面状态调整吸洗强度" },
    ],
  },
  {
    id: "p-005",
    brand: "UWANT",
    name: "友望 X200",
    model: "X200",
    category: "洗地机",
    price: 2599,
    channel: "抖音电商",
    status: "在售",
    image: "assets/floor-washer.svg",
    confidence: 73,
    reviewRequired: true,
    sourceUrl: "https://example.com/uwant-x200",
    quarter: "2026 Q1",
    features: {
      suction: "吸洗拖一体",
      mopPressure: "双滚刷",
      edgeCleaning: true,
      navigation: "手持牵引",
      obstacle: "普通家居场景",
      base: "自清洁/烘干",
      hotWash: false,
      dustCollection: false,
      battery: "35min",
      noise: "约 80dB",
      app: "基础状态提示",
    },
    sellingPoints: [
      { title: "价格竞争力强", evidence: "低于头部旗舰价格带" },
      { title: "双滚刷清洁", evidence: "强调顽固污渍处理效率" },
      { title: "内容电商转化", evidence: "更适合直播场景卖点演示" },
    ],
  },
  {
    id: "p-006",
    brand: "Dyson",
    name: "戴森 V15 Detect",
    model: "V15 Detect",
    category: "吸尘器",
    price: 4690,
    channel: "官网",
    status: "在售",
    image: "assets/stick-vacuum.svg",
    confidence: 95,
    reviewRequired: false,
    sourceUrl: "https://example.com/dyson-v15",
    quarter: "2026 Q2",
    features: {
      suction: "强吸力无绳",
      mopPressure: "不适用",
      edgeCleaning: false,
      navigation: "手持",
      obstacle: "不适用",
      base: "挂墙充电",
      hotWash: false,
      dustCollection: false,
      battery: "60min",
      noise: "约 75dB",
      app: "LCD 灰尘显示",
    },
    sellingPoints: [
      { title: "灰尘可视化", evidence: "激光与颗粒计数强化清洁反馈" },
      { title: "品牌高端心智", evidence: "高价位仍保持强识别度" },
      { title: "多吸头生态", evidence: "覆盖地板、床褥、缝隙等场景" },
    ],
  },
];

const defaultState = {
  products: defaultProducts,
  modules: defaultModules,
  filters: {
    keyword: "",
    categories: [],
    minPrice: "",
    maxPrice: "",
    brand: "全部",
    channel: "全部",
    status: "全部",
    confidence: 60,
    featureField: "全部",
    featureOperator: "contains",
    featureValue: "",
  },
  visibleColumns: {
    product: true,
    brand: true,
    category: true,
    price: true,
    channel: true,
    status: true,
    confidence: true,
    topSellingPoint: true,
  },
  productSort: {
    key: "price",
    direction: "desc",
  },
  selectedProductId: "p-001",
  compareIds: ["p-001", "p-002", "p-003"],
  compareFieldKeys: [],
  compareFilters: {
    keyword: "",
    brand: "全部",
    category: "全部",
    channel: "全部",
    status: "全部",
    minPrice: "",
    maxPrice: "",
  },
  comparisonRuns: [],
  editingProductId: "",
  qualitySeverity: "high",
  activeWorkspace: "products",
  sidebarCollapsed: false,
  roadmapBrand: "全部",
  roadmapCategory: "全部",
  roadmapStatus: "全部",
  roadmapQuarter: "全部",
  roadmapMode: "single",
};

const columns = [
  { key: "product", label: "产品", render: renderProductCell, sortValue: (p) => `${p.brand} ${p.name} ${p.model}` },
  { key: "brand", label: "品牌", render: (p) => displayBrandName(p.brand), sortValue: (p) => p.brand },
  { key: "category", label: "品类", render: (p) => p.category, sortValue: (p) => p.category },
  { key: "price", label: "价格", render: (p) => formatCurrency(p.price), sortValue: (p) => Number(p.price || 0) },
  { key: "channel", label: "渠道", render: (p) => p.channel, sortValue: (p) => p.channel },
  { key: "status", label: "状态", render: (p) => renderStatus(p.status), sortValue: (p) => p.status },
  { key: "confidence", label: "AI 置信度", render: renderConfidence, sortValue: (p) => Number(p.confidence || 0) },
  {
    key: "topSellingPoint",
    label: "Top1 卖点",
    render: (p) => p.sellingPoints?.[0]?.title || "-",
    sortValue: (p) => p.sellingPoints?.[0]?.title || "",
  },
];

let state = loadState();
let savedViews = loadSavedViews();
let selectedSavedViewIndex = "";
let persistTimer = 0;
let filterRenderTimer = 0;
const searchTextCache = new WeakMap();
let sourceMetadata = null;
let analysisStepState = {};
let highlightedReviewProductId = "";
let browserFetchSessionId = "";
let selectedReviewIds = new Set();
let usageState = { count: 0, recent: [], estimatedTotalCostUsd: null, costPricingConfigured: false, loaded: false, error: "" };
let healthState = {
  ok: false,
  openaiConfigured: false,
  deepseekConfigured: false,
  qwenConfigured: false,
  openaiBaseUrlConfigured: false,
  qwenBaseUrlConfigured: false,
  aiRequestTimeoutMs: 60000,
  model: "-",
  deepseekModel: "-",
  qwenModel: "-",
  aiProvider: "deepseek",
  compareProvider: "deepseek",
  visionProvider: "qwen",
  accessTokenRequired: false,
  readTokenRequired: false,
  writeTokenRequired: false,
  readWriteSplitEnabled: false,
  costPricingConfigured: false,
  error: "",
};
const MAX_ANALYSIS_FILE_BYTES = 100 * 1024 * 1024;
const MAX_ANALYSIS_IMAGE_DATA_URL_CHARS = 3_000_000;
const MAX_ANALYSIS_IMAGE_WIDTH = 1400;
const MAX_ANALYSIS_IMAGE_SLICE_HEIGHT = 1100;
const MAX_ANALYSIS_IMAGE_COUNT = 32;
const MIN_ANALYSIS_IMAGE_SLICE_SOURCE_HEIGHT = 96;

function getAccessToken() {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

function setAccessToken(token) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
}

function healthModelForProvider(provider) {
  if (provider === "deepseek") return healthState.deepseekModel || "-";
  if (provider === "qwen") return healthState.qwenModel || "-";
  return healthState.model || "-";
}

async function apiFetch(url, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };
  const token = getAccessToken();
  if (token) headers["X-App-Token"] = token;
  const response = await fetch(url, { ...options, headers });
  if (![401, 403].includes(response.status)) return response;

  let payload = {};
  try {
    payload = await response.clone().json();
  } catch {
    payload = {};
  }
  const nextToken = window.prompt(
    response.status === 403
      ? payload.message || "当前令牌只有只读权限。请输入 APP_WRITE_TOKEN 或 APP_ACCESS_TOKEN："
      : payload.message || "该工作台需要访问令牌。请输入 APP_READ_TOKEN、APP_WRITE_TOKEN 或 APP_ACCESS_TOKEN：",
  );
  if (!nextToken) return response;
  setAccessToken(nextToken.trim());
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "X-App-Token": nextToken.trim(),
    },
  });
}

const els = {
  keywordSearch: document.querySelector("#keywordSearch"),
  categoryFilters: document.querySelector("#categoryFilters"),
  categoryFilterDropdown: document.querySelector("#categoryFilterDropdown"),
  categoryFilterToggle: document.querySelector("#categoryFilterToggle"),
  categoryFilterLabel: document.querySelector("#categoryFilterLabel"),
  navProductsCount: document.querySelector("#navProductsCount"),
  navReviewCount: document.querySelector("#navReviewCount"),
  navQualityCount: document.querySelector("#navQualityCount"),
  navCompareCount: document.querySelector("#navCompareCount"),
  navRoadmapCount: document.querySelector("#navRoadmapCount"),
  sidebarToggle: document.querySelector("#sidebarToggle"),
  brandFilter: document.querySelector("#brandFilter"),
  channelFilter: document.querySelector("#channelFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  minPrice: document.querySelector("#minPrice"),
  maxPrice: document.querySelector("#maxPrice"),
  confidenceFilter: document.querySelector("#confidenceFilter"),
  confidenceLabel: document.querySelector("#confidenceLabel"),
  featureFilterField: document.querySelector("#featureFilterField"),
  featureFilterOperator: document.querySelector("#featureFilterOperator"),
  featureFilterValue: document.querySelector("#featureFilterValue"),
  productTableHead: document.querySelector("#productTableHead"),
  productTableBody: document.querySelector("#productTableBody"),
  filterSummary: document.querySelector("#filterSummary"),
  productDetail: document.querySelector("#productDetail"),
  reviewProductDetail: document.querySelector("#reviewProductDetail"),
  metricProducts: document.querySelector("#metricProducts"),
  metricAvgPrice: document.querySelector("#metricAvgPrice"),
  metricReview: document.querySelector("#metricReview"),
  metricBrands: document.querySelector("#metricBrands"),
  qualityPanel: document.querySelector("#qualityPanel"),
  systemStatus: document.querySelector("#systemStatus"),
  reviewQueue: document.querySelector("#reviewQueue"),
  columnsPopover: document.querySelector("#columnsPopover"),
  comparePicker: document.querySelector("#comparePicker"),
  compareKeywordFilter: document.querySelector("#compareKeywordFilter"),
  compareBrandFilter: document.querySelector("#compareBrandFilter"),
  compareCategoryFilter: document.querySelector("#compareCategoryFilter"),
  compareChannelFilter: document.querySelector("#compareChannelFilter"),
  compareStatusFilter: document.querySelector("#compareStatusFilter"),
  compareMinPrice: document.querySelector("#compareMinPrice"),
  compareMaxPrice: document.querySelector("#compareMaxPrice"),
  compareStatus: document.querySelector("#compareStatus"),
  compareFieldPicker: document.querySelector("#compareFieldPicker"),
  comparisonSummary: document.querySelector("#comparisonSummary"),
  generateSummary: document.querySelector("#generateSummary"),
  exportCompare: document.querySelector("#exportCompare"),
  compareHead: document.querySelector("#compareHead"),
  compareBody: document.querySelector("#compareBody"),
  moduleList: document.querySelector("#moduleList"),
  moduleName: document.querySelector("#moduleName"),
  fieldName: document.querySelector("#fieldName"),
  fieldType: document.querySelector("#fieldType"),
  fieldOptions: document.querySelector("#fieldOptions"),
  roadmapBoard: document.querySelector("#roadmapBoard"),
  roadmapBrandDropdown: document.querySelector("#roadmapBrandDropdown"),
  roadmapBrandToggle: document.querySelector("#roadmapBrandToggle"),
  roadmapBrandLabel: document.querySelector("#roadmapBrandLabel"),
  roadmapBrandMenu: document.querySelector("#roadmapBrandMenu"),
  roadmapBrandClear: document.querySelector("#roadmapBrandClear"),
  roadmapCategoryFilter: document.querySelector("#roadmapCategoryFilter"),
  roadmapStatusFilter: document.querySelector("#roadmapStatusFilter"),
  roadmapQuarterFilter: document.querySelector("#roadmapQuarterFilter"),
  importPanel: document.querySelector("#importPanel"),
  sourceUrl: document.querySelector("#sourceUrl"),
  sourceImage: document.querySelector("#sourceImage"),
  sourceNotes: document.querySelector("#sourceNotes"),
  sourcePreview: document.querySelector("#sourcePreview"),
  analysisStatus: document.querySelector("#analysisStatus"),
  analysisSteps: document.querySelector("#analysisSteps"),
  retryAnalysis: document.querySelector("#retryAnalysis"),
  startBrowserFetch: document.querySelector("#startBrowserFetch"),
  collectBrowserFetch: document.querySelector("#collectBrowserFetch"),
  cancelBrowserFetch: document.querySelector("#cancelBrowserFetch"),
  usageSummary: document.querySelector("#usageSummary"),
  usageTableBody: document.querySelector("#usageTableBody"),
  auditTableBody: document.querySelector("#auditTableBody"),
  savedViewName: document.querySelector("#savedViewName"),
  savedViews: document.querySelector("#savedViews"),
  dataPackageFile: document.querySelector("#dataPackageFile"),
  csvImportFile: document.querySelector("#csvImportFile"),
};

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return mergeState(defaultState);
  try {
    const parsed = JSON.parse(raw);
    return mergeState(parsed);
  } catch {
    return mergeState(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  queuePersist();
}

function loadSavedViews() {
  try {
    return JSON.parse(localStorage.getItem(VIEW_KEY)) || [];
  } catch {
    return [];
  }
}

function saveViews() {
  localStorage.setItem(VIEW_KEY, JSON.stringify(savedViews));
  queuePersist();
}

function groupBy(items, getKey) {
  return items.reduce((groups, item) => {
    const key = getKey(item);
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}

function mergeState(incoming) {
  const merged = {
    ...structuredClone(defaultState),
    ...incoming,
    filters: { ...defaultState.filters, ...incoming?.filters },
    compareFilters: { ...defaultState.compareFilters, ...incoming?.compareFilters },
    visibleColumns: { ...defaultState.visibleColumns, ...incoming?.visibleColumns },
  };
  merged.modules = (merged.modules || []).map((module) => ({
    ...module,
    fields: (module.fields || []).map(normalizeFeatureField),
  }));
  merged.products = (merged.products || []).map(normalizeProduct);
  const allowedWorkspaces = new Set(["products", "import", "quality", "compare", "roadmap", "system"]);
  if (merged.activeWorkspace === "review") merged.activeWorkspace = "import";
  if (!allowedWorkspaces.has(merged.activeWorkspace)) merged.activeWorkspace = "products";
  merged.sidebarCollapsed = Boolean(merged.sidebarCollapsed);
  return merged;
}

function normalizeEnumOptions(options) {
  const seen = new Set();
  return String(Array.isArray(options) ? options.join("、") : options || "")
    .split(/[、,，/|]+/)
    .map((option) => option.trim())
    .filter((option) => {
      if (!option || seen.has(option)) return false;
      seen.add(option);
      return true;
    });
}

function normalizeFeatureField(field) {
  const type = ["text", "number", "boolean", "enum", "price", "image"].includes(field?.type) ? field.type : "text";
  return {
    ...field,
    type,
    options: type === "enum" ? normalizeEnumOptions(field.options) : [],
  };
}

function enumOptions(field, currentValue = "") {
  const options = normalizeEnumOptions(field?.options || []);
  const current = String(currentValue ?? "").trim();
  if (current && current !== "待确认" && !options.includes(current)) options.unshift(current);
  return options;
}

function defaultFeatureValue(field) {
  if (field.type === "boolean") return null;
  if (field.type === "enum") return enumOptions(field)[0] || "待确认";
  return "待确认";
}

function normalizeProductModel(product = {}) {
  const model = String(product.model || "").trim();
  const brandText = `${product.brand || ""} ${product.name || ""} ${product.sourceMetadata?.title || ""} ${product.sourceUrl || ""}`;
  if (/^T90\s+PRO$/i.test(model) && /科沃斯|ECOVACS|1017327646764/.test(brandText)) return "T90PRO";
  return model;
}

function normalizeProduct(product) {
  const now = new Date().toISOString();
  const normalizedModel = normalizeProductModel(product);
  return {
    ...product,
    model: normalizedModel || product.model,
    name: normalizedAnalysisProductName(product, product.brand, normalizedModel || product.model, product.category),
    priceSnapshots:
      product.priceSnapshots?.length
        ? product.priceSnapshots
        : [
            {
              id: `price-${product.id}-legacy`,
              price: Number(product.price || 0),
              channel: product.channel || "未知渠道",
              source: product.sourceUrl || "历史数据",
              note: "为旧数据补齐价格快照",
              createdAt: now,
            },
          ],
    analysisRuns:
      product.analysisRuns?.length
        ? product.analysisRuns
        : [
            {
              id: `run-${product.id}-legacy`,
              type: "legacy",
              model: "历史数据",
              status: product.reviewRequired ? "review_required" : "confirmed",
              confidence: Number(product.confidence || 0),
              source: product.sourceUrl || "人工录入",
              createdAt: now,
            },
          ],
    auditLog:
      product.auditLog?.length
        ? product.auditLog
        : [
            {
              id: `audit-${product.id}-legacy`,
              action: "载入历史数据",
              actor: "system",
              detail: "为旧数据补齐审计时间线",
              createdAt: now,
            },
          ],
  };
}

function nowIso() {
  return new Date().toISOString();
}

function addAudit(product, action, detail, actor = "researcher") {
  product.auditLog = product.auditLog || [];
  product.auditLog.unshift({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    action,
    actor,
    detail,
    createdAt: nowIso(),
  });
}

function addAnalysisRun(product, run) {
  product.analysisRuns = product.analysisRuns || [];
  product.analysisRuns.unshift({
    id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: nowIso(),
    ...run,
  });
}

function addPriceSnapshot(product, { price, channel, source, note }) {
  product.priceSnapshots = product.priceSnapshots || [];
  const normalizedPrice = Number(price || 0);
  const latest = product.priceSnapshots[0];
  if (latest && Number(latest.price) === normalizedPrice && latest.channel === channel) {
    return;
  }
  product.priceSnapshots.unshift({
    id: `price-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    price: normalizedPrice,
    channel: channel || product.channel || "未知渠道",
    source: source || product.sourceUrl || "人工录入",
    note: note || "记录价格快照",
    createdAt: nowIso(),
  });
}

async function hydrateWorkspace() {
  try {
    const response = await apiFetch("/api/state");
    if (response.status === 401) {
      console.warn("State API requires access token.");
      return;
    }
    if (!response.ok) return;
    const payload = await response.json();
    if (payload.state) {
      state = mergeState(payload.state);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    if (Array.isArray(payload.savedViews)) {
      savedViews = payload.savedViews;
      localStorage.setItem(VIEW_KEY, JSON.stringify(savedViews));
    }
  } catch {
    // LocalStorage remains the offline fallback.
  }
}

function queuePersist() {
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(async () => {
    try {
      await apiFetch("/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, savedViews }),
      });
    } catch {
      // Keep the UI usable when the local server is not available.
    }
  }, 350);
}

function updateFilterSoon(key, value) {
  state.filters[key] = value;
  window.clearTimeout(filterRenderTimer);
  filterRenderTimer = window.setTimeout(renderAll, 220);
}

function unique(values) {
  return Array.from(new Set(values)).filter(Boolean).sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatBool(value) {
  if (value === true) return "支持";
  if (value === false) return "不支持";
  return value || "-";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getCategoryImage(category) {
  const imageMap = {
    扫地机: "assets/robot-vacuum.svg",
    洗地机: "assets/floor-washer.svg",
    吸尘器: "assets/stick-vacuum.svg",
  };
  return imageMap[category] || "assets/robot-vacuum.svg";
}

function isFallbackProductImage(value) {
  return !value || /^assets\//.test(String(value));
}

function bestProductImage(product) {
  const image = String(product?.image || "").trim();
  if (!isFallbackProductImage(image)) return image;
  const candidate = String(product?.sourceMetadata?.image || product?.sourceMetadata?.imageCandidates?.[0] || "").trim();
  return candidate || image || getCategoryImage(product?.category);
}

function productDisplayTitle(product) {
  const brand = displayBrandName(safeProductPart(product?.brand, ""));
  const model = safeProductPart(product?.model, "");
  return [brand, model].filter(Boolean).join(" ") || safeProductPart(product?.name, "产品待确认");
}

function normalizeQuarterInput(value) {
  const text = String(value || "").trim();
  if (!text || ["待确认", "未知", "无", "-"].includes(text)) return "未规划";
  const quarterMatch = text.match(/(20\d{2})\s*[年/-]?\s*Q\s*([1-4])/i) || text.match(/(20\d{2})\s*第?\s*([1-4])\s*季/i);
  if (quarterMatch) return `${quarterMatch[1]} Q${quarterMatch[2]}`;
  const halfMatch = text.match(/(20\d{2})\s*[年/-]?\s*H\s*([12])/i) || text.match(/(20\d{2})\s*(上半年|下半年)/);
  if (halfMatch) return `${halfMatch[1]} ${halfMatch[2] === "2" || halfMatch[2] === "下半年" ? "H2" : "H1"}`;
  return text;
}

function sellingPointsToText(points = []) {
  return points
    .slice(0, 3)
    .map((point) => `${point.title || ""} | ${point.evidence || ""}`.trim())
    .join("\n");
}

function textToSellingPoints(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);
  const parsed = lines.map((line) => {
    const [title, ...evidenceParts] = line.split("|");
    return {
      title: title?.trim() || "待确认卖点",
      evidence: evidenceParts.join("|").trim() || "人工录入，待补充证据",
    };
  });
  while (parsed.length < 3) {
    parsed.push({ title: "待确认卖点", evidence: "人工录入，待补充证据" });
  }
  return parsed;
}

function renderFeatureInput(field, product) {
  const value = product.features?.[field.key];
  if (field.type === "boolean") {
    return `
      <label>
        ${escapeHtml(field.module)} · ${escapeHtml(field.name)}
        <select data-feature-field="${escapeHtml(field.key)}" data-feature-type="boolean">
          <option value="null" ${value == null ? "selected" : ""}>待确认</option>
          <option value="true" ${value === true ? "selected" : ""}>支持</option>
          <option value="false" ${value === false ? "selected" : ""}>不支持</option>
        </select>
      </label>
    `;
  }
  if (field.type === "enum") {
    const options = enumOptions(field, value);
    return `
      <label>
        ${escapeHtml(field.module)} · ${escapeHtml(field.name)}
        <select data-feature-field="${escapeHtml(field.key)}" data-feature-type="enum">
          <option value="待确认" ${!value || value === "待确认" ? "selected" : ""}>待确认</option>
          ${options
            .map((option) => `<option value="${escapeHtml(option)}" ${value === option ? "selected" : ""}>${escapeHtml(option)}</option>`)
            .join("")}
        </select>
      </label>
    `;
  }
  return `
    <label>
      ${escapeHtml(field.module)} · ${escapeHtml(field.name)}
      <input data-feature-field="${escapeHtml(field.key)}" data-feature-type="${escapeHtml(field.type)}" type="${field.type === "number" || field.type === "price" ? "number" : "text"}" value="${escapeHtml(value ?? "")}" />
    </label>
  `;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function renderTimeline(product) {
  const runs = (product.analysisRuns || []).slice(0, 4);
  const audits = (product.auditLog || []).slice(0, 6);
  return `
    <div>
      <p class="eyebrow">Analysis runs</p>
      <ul class="timeline-list">
        ${runs
          .map(
            (run) => `
          <li>
            <strong>${escapeHtml(run.type || "analysis")} · ${escapeHtml(run.status || "unknown")}</strong>
            <span>${escapeHtml(run.model || "-")} · ${run.confidence ?? "-"}% · ${formatDateTime(run.createdAt)}</span>
            ${run.usage ? `<small>tokens: ${escapeHtml(JSON.stringify(run.usage))}</small>` : ""}
            <small>${escapeHtml(run.source || "无来源")}</small>
          </li>
        `,
          )
          .join("")}
      </ul>
    </div>
    <div>
      <p class="eyebrow">Audit timeline</p>
      <ul class="timeline-list">
        ${audits
          .map(
            (entry) => `
          <li>
            <strong>${escapeHtml(entry.action)}</strong>
            <span>${escapeHtml(entry.actor || "researcher")} · ${formatDateTime(entry.createdAt)}</span>
            <small>${escapeHtml(entry.detail || "")}</small>
          </li>
        `,
          )
          .join("")}
      </ul>
    </div>
  `;
}

function renderPriceHistory(product) {
  const snapshots = (product.priceSnapshots || []).slice(0, 5);
  if (!snapshots.length) return "";
  return `
    <div>
      <p class="eyebrow">Price history</p>
      <ul class="timeline-list">
        ${snapshots
          .map(
            (snapshot) => `
          <li>
            <strong>${formatCurrency(snapshot.price)} · ${escapeHtml(snapshot.channel || product.channel || "未知渠道")}</strong>
            <span>${formatDateTime(snapshot.createdAt)} · ${escapeHtml(snapshot.source || "无来源")}</span>
            <small>${escapeHtml(snapshot.note || "价格快照")}</small>
          </li>
        `,
          )
          .join("")}
      </ul>
    </div>
  `;
}

function formatUsageValue(usage) {
  if (!usage) return "-";
  const input = usage.input_tokens ?? usage.prompt_tokens;
  const output = usage.output_tokens ?? usage.completion_tokens;
  const total = usage.total_tokens ?? [input, output].filter((value) => Number.isFinite(Number(value))).reduce((sum, value) => sum + Number(value), 0);
  if (input || output || total) {
    return `in ${input ?? "-"} / out ${output ?? "-"} / total ${total || "-"}`;
  }
  return JSON.stringify(usage).slice(0, 120);
}

function formatCostUsd(value) {
  if (value == null || value === "") return "未配置";
  const cost = Number(value);
  if (!Number.isFinite(cost)) return "未配置";
  if (cost === 0) return "$0.000000";
  return `$${cost.toFixed(6)}`;
}

function renderUsage() {
  if (!els.usageSummary || !els.usageTableBody) return;
  if (usageState.error) {
    els.usageSummary.innerHTML = `<span class="usage-badge">用量读取失败：${escapeHtml(usageState.error)}</span>`;
    els.usageTableBody.innerHTML = "";
    return;
  }
  const records = usageState.recent || [];
  const okCount = records.filter((record) => record.status === "ok").length;
  const errorCount = records.filter((record) => record.status === "error").length;
  const totalTokens = records.reduce((sum, record) => sum + Number(record.usage?.total_tokens || 0), 0);
  const recentCost = records.reduce((sum, record) => sum + Number(record.estimatedCostUsd || 0), 0);
  els.usageSummary.innerHTML = `
    <span class="usage-badge">累计调用 ${Number(usageState.count || 0)}</span>
    <span class="usage-badge">最近成功 ${okCount}</span>
    <span class="usage-badge">最近失败 ${errorCount}</span>
    <span class="usage-badge">最近 tokens ${totalTokens || "-"}</span>
    <span class="usage-badge">最近成本 ${usageState.costPricingConfigured ? formatCostUsd(recentCost) : "未配置单价"}</span>
    <span class="usage-badge">累计成本 ${usageState.costPricingConfigured ? formatCostUsd(usageState.estimatedTotalCostUsd) : "未配置单价"}</span>
  `;
  if (!records.length) {
    els.usageTableBody.innerHTML = `<tr><td colspan="9">暂无 AI 调用记录。</td></tr>`;
    return;
  }
  els.usageTableBody.innerHTML = records
    .map(
      (record) => `<tr>
        <td>${formatDateTime(record.createdAt)}</td>
        <td>${escapeHtml(record.provider || "-")}</td>
        <td>${escapeHtml(record.model || "-")}</td>
        <td>${escapeHtml(record.schemaName || "-")}</td>
        <td>${escapeHtml(record.status || "-")}</td>
        <td>${escapeHtml((record.inputModalities || []).join(" + ") || "-")}</td>
        <td>${escapeHtml(formatUsageValue(record.usage))}</td>
        <td>${escapeHtml(formatCostUsd(record.estimatedCostUsd))}</td>
        <td>${escapeHtml(record.error || "-")}</td>
      </tr>`,
    )
    .join("");
}

async function loadUsage() {
  try {
    const response = await apiFetch("/api/usage");
    if (response.status === 401) {
      usageState = { count: 0, recent: [], estimatedTotalCostUsd: null, costPricingConfigured: false, loaded: true, error: "需要访问令牌" };
      renderUsage();
      return;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    usageState = {
      count: Number(payload.count || 0),
      recent: Array.isArray(payload.recent) ? payload.recent : [],
      estimatedTotalCostUsd: payload.estimatedTotalCostUsd ?? null,
      costPricingConfigured: Boolean(payload.costPricingConfigured),
      loaded: true,
      error: "",
    };
  } catch (error) {
    usageState = { count: 0, recent: [], estimatedTotalCostUsd: null, costPricingConfigured: false, loaded: true, error: error.message };
  }
  renderUsage();
}

function exportUsageCsv() {
  const records = usageState.recent || [];
  const headers = [
    "createdAt",
    "provider",
    "model",
    "schemaName",
    "status",
    "inputModalities",
    "inputTokens",
    "outputTokens",
    "totalTokens",
    "estimatedCostUsd",
    "costEstimateSource",
    "responseId",
    "error",
  ];
  const rows = records.map((record) => [
    record.createdAt || "",
    record.provider || "",
    record.model || "",
    record.schemaName || "",
    record.status || "",
    (record.inputModalities || []).join(" + "),
    record.usage?.input_tokens ?? record.usage?.prompt_tokens ?? "",
    record.usage?.output_tokens ?? record.usage?.completion_tokens ?? "",
    record.usage?.total_tokens ?? "",
    record.estimatedCostUsd ?? "",
    record.costEstimateSource || "",
    record.responseId || "",
    record.error || "",
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  download(`ai-usage-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
}

function auditRecords(limit = 80) {
  return state.products
    .flatMap((product) =>
      (product.auditLog || []).map((entry) => ({
        ...entry,
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        model: product.model,
        category: product.category,
      })),
    )
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, limit);
}

function renderAuditLog() {
  if (!els.auditTableBody) return;
  const records = auditRecords();
  if (!records.length) {
    els.auditTableBody.innerHTML = `<tr><td colspan="6">暂无审计日志。</td></tr>`;
    return;
  }
  els.auditTableBody.innerHTML = records
    .map(
      (record) => `<tr>
        <td>${formatDateTime(record.createdAt)}</td>
        <td>${escapeHtml(record.brand || "-")} ${escapeHtml(record.productName || "-")}</td>
        <td>${escapeHtml(record.model || "-")}</td>
        <td><span class="status-badge">${escapeHtml(record.action || "-")}</span></td>
        <td>${escapeHtml(record.actor || "researcher")}</td>
        <td>${escapeHtml(record.detail || "-")}</td>
      </tr>`,
    )
    .join("");
}

function exportAuditCsv() {
  const records = auditRecords(1000);
  if (!records.length) {
    window.alert("暂无可导出的审计日志。");
    return;
  }
  const headers = ["createdAt", "brand", "productName", "model", "category", "action", "actor", "detail"];
  const rows = records.map((record) => [
    record.createdAt || "",
    record.brand || "",
    record.productName || "",
    record.model || "",
    record.category || "",
    record.action || "",
    record.actor || "",
    record.detail || "",
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  download(`audit-log-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
}

function renderHealth() {
  if (!els.systemStatus) return;
  if (healthState.error) {
    els.systemStatus.innerHTML = `<span class="status-badge is-warning">本地服务异常：${escapeHtml(healthState.error)}</span>`;
    return;
  }
  els.systemStatus.innerHTML = `
    <span class="status-badge ${healthState.ok ? "is-ok" : "is-warning"}">服务 ${healthState.ok ? "正常" : "待检查"}</span>
    <span class="status-badge ${healthState.openaiConfigured ? "is-ok" : "is-warning"}">OpenAI ${healthState.openaiConfigured ? "已配置" : "未配置"}</span>
    <span class="status-badge ${healthState.deepseekConfigured ? "is-ok" : "is-warning"}">DeepSeek ${healthState.deepseekConfigured ? "已配置" : "未配置"}</span>
    <span class="status-badge ${healthState.qwenConfigured ? "is-ok" : "is-warning"}">Qwen-VL ${healthState.qwenConfigured ? "已配置" : "未配置"}</span>
    <span class="status-badge ${healthState.openaiBaseUrlConfigured ? "is-ok" : "is-warning"}">OpenAI 网关 ${healthState.openaiBaseUrlConfigured ? "已自定义" : "默认官方"}</span>
    <span class="status-badge ${healthState.qwenBaseUrlConfigured ? "is-ok" : "is-warning"}">Qwen 网关 ${healthState.qwenBaseUrlConfigured ? "已自定义" : "默认百炼"}</span>
    <span class="status-badge">AI 超时 ${Math.round(Number(healthState.aiRequestTimeoutMs || 60000) / 1000)}s</span>
    <span class="status-badge">抽取 ${escapeHtml(healthState.aiProvider || "deepseek")} / ${escapeHtml(healthModelForProvider(healthState.aiProvider))}</span>
    <span class="status-badge">视觉 ${escapeHtml(healthState.visionProvider || "qwen")} / ${escapeHtml(healthModelForProvider(healthState.visionProvider))}</span>
    <span class="status-badge">总结 ${escapeHtml(healthState.compareProvider || "deepseek")} / ${escapeHtml(healthModelForProvider(healthState.compareProvider))}</span>
    <span class="status-badge ${healthState.accessTokenRequired ? "is-ok" : "is-warning"}">访问令牌 ${healthState.accessTokenRequired ? "已启用" : "未启用"}</span>
    <span class="status-badge ${healthState.readWriteSplitEnabled ? "is-ok" : "is-warning"}">读写分离 ${healthState.readWriteSplitEnabled ? "已启用" : "未启用"}</span>
    <span class="status-badge ${healthState.writeTokenRequired ? "is-ok" : "is-warning"}">写权限 ${healthState.writeTokenRequired ? "受保护" : "开放"}</span>
    <span class="status-badge ${healthState.costPricingConfigured ? "is-ok" : "is-warning"}">成本单价 ${healthState.costPricingConfigured ? "已配置" : "未配置"}</span>
  `;
}

async function loadHealth() {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    healthState = {
      ok: Boolean(payload.ok),
      openaiConfigured: Boolean(payload.openaiConfigured),
      deepseekConfigured: Boolean(payload.deepseekConfigured),
      qwenConfigured: Boolean(payload.qwenConfigured),
      openaiBaseUrlConfigured: Boolean(payload.openaiBaseUrlConfigured),
      qwenBaseUrlConfigured: Boolean(payload.qwenBaseUrlConfigured),
      aiRequestTimeoutMs: Number(payload.aiRequestTimeoutMs || 60000),
      model: payload.model || "-",
      deepseekModel: payload.deepseekModel || "-",
      qwenModel: payload.qwenModel || "-",
      aiProvider: payload.aiProvider || "deepseek",
      compareProvider: payload.compareProvider || "deepseek",
      visionProvider: payload.visionProvider || "qwen",
      accessTokenRequired: Boolean(payload.accessTokenRequired),
      readTokenRequired: Boolean(payload.readTokenRequired),
      writeTokenRequired: Boolean(payload.writeTokenRequired),
      readWriteSplitEnabled: Boolean(payload.readWriteSplitEnabled),
      costPricingConfigured: Boolean(payload.costPricingConfigured),
      error: "",
    };
  } catch (error) {
    healthState = {
      ok: false,
      openaiConfigured: false,
      deepseekConfigured: false,
      qwenConfigured: false,
      openaiBaseUrlConfigured: false,
      qwenBaseUrlConfigured: false,
      aiRequestTimeoutMs: 60000,
      model: "-",
      deepseekModel: "-",
      qwenModel: "-",
      aiProvider: "deepseek",
      compareProvider: "deepseek",
      visionProvider: "qwen",
      accessTokenRequired: false,
      readTokenRequired: false,
      writeTokenRequired: false,
      readWriteSplitEnabled: false,
      costPricingConfigured: false,
      error: error.message,
    };
  }
  renderHealth();
}

function renderCustomFeatureEvidence(product) {
  const evidence = product.sourceMetadata?.customFeatureEvidence || [];
  if (!evidence.length) return "";
  const fieldsByKey = new Map(allFields().map((field) => [field.key, field]));
  return `
    <div>
      <p class="eyebrow">Custom feature evidence</p>
      <ul class="timeline-list">
        ${evidence
          .slice(0, 8)
          .map((item) => {
            const field = fieldsByKey.get(item.key);
            const confirmed = isFieldReviewConfirmed(product, item.key);
            return `
          <li>
            <strong>${escapeHtml(field ? `${field.module} · ${field.name}` : item.key)}：${escapeHtml(formatBool(item.value))}</strong>
            <span>置信度 ${Number(item.confidence || 0)}% · ${confirmed ? "已复核" : "待复核"}</span>
            <small>${escapeHtml(item.evidence || "未提供证据")}</small>
          </li>
        `;
          })
          .join("")}
      </ul>
    </div>
  `;
}

function fieldReviewStatus(product) {
  product.sourceMetadata = product.sourceMetadata || {};
  product.sourceMetadata.fieldReviewStatus = product.sourceMetadata.fieldReviewStatus || {};
  return product.sourceMetadata.fieldReviewStatus;
}

function isFieldReviewConfirmed(product, fieldKey) {
  return fieldReviewStatus(product)[fieldKey]?.status === "confirmed";
}

function fieldReviewIssues(product, includeConfirmed = false) {
  const evidence = product.sourceMetadata?.customFeatureEvidence || [];
  const fieldsByKey = new Map(allFields().map((field) => [field.key, field]));
  return evidence
    .filter((item) => {
      if (!item?.key) return false;
      if (!includeConfirmed && isFieldReviewConfirmed(product, item.key)) return false;
      const value = item.value;
      const valueText = String(value ?? "").trim();
      return Number(item.confidence || 0) < 70 || !valueText || valueText === "待确认";
    })
    .map((item) => ({
      ...item,
      field: fieldsByKey.get(item.key) || { module: "自定义字段", name: item.key },
      confirmed: isFieldReviewConfirmed(product, item.key),
    }));
}

function confirmFieldReview(productId, fieldKey) {
  const product = state.products.find((item) => item.id === productId);
  if (!product || !fieldKey) return;
  const issue = fieldReviewIssues(product, true).find((item) => item.key === fieldKey);
  const status = fieldReviewStatus(product);
  status[fieldKey] = {
    status: "confirmed",
    confirmedAt: nowIso(),
    actor: "researcher",
  };
  addAudit(
    product,
    "确认字段证据",
    `${issue?.field ? `${issue.field.module} · ${issue.field.name}` : fieldKey} 已人工复核，字段置信度 ${Number(issue?.confidence || 0)}%`,
  );
  renderAll();
}

function confirmAllFieldReviews(product, actor = "researcher") {
  const issues = fieldReviewIssues(product);
  if (!issues.length) return 0;
  const status = fieldReviewStatus(product);
  issues.forEach((item) => {
    status[item.key] = {
      status: "confirmed",
      confirmedAt: nowIso(),
      actor,
    };
  });
  return issues.length;
}

function renderFieldReviewSummary(product) {
  const issues = fieldReviewIssues(product);
  if (!issues.length) return "";
  return `
    <div class="field-review-panel">
      <div>
        <p class="eyebrow">Field review</p>
        <strong>待复核字段 ${issues.length} 个</strong>
      </div>
      <ul class="field-review-list">
        ${issues
          .slice(0, 8)
          .map(
            (item) => `
          <li>
            <div>
              <strong>${escapeHtml(item.field.module)} · ${escapeHtml(item.field.name)}</strong>
              <span>${escapeHtml(formatBool(item.value))} · 置信度 ${Number(item.confidence || 0)}%</span>
              <small>${escapeHtml(item.evidence || "未提供证据")}</small>
            </div>
            <button class="secondary-button" type="button" data-confirm-field-review="${escapeHtml(product.id)}" data-field-key="${escapeHtml(item.key)}">确认字段</button>
          </li>
        `,
          )
          .join("")}
      </ul>
    </div>
  `;
}

function sourceEvidenceText(metadata = {}) {
  const priceText = (metadata.priceCandidates || [])
    .slice(0, 4)
    .map((item) => `${item.currency || "CNY"} ${item.price} (${item.source || "unknown"})`)
    .join("；");
  const snippetText = (metadata.textSnippets || []).slice(0, 5).join("；");
  const imageText = (metadata.imageCandidates || []).slice(0, 4).join("；");
  return {
    priceText,
    snippetText,
    imageText,
  };
}

function renderSourceMetadataEvidence(product) {
  const metadata = product.sourceMetadata || {};
  const { priceText, snippetText, imageText } = sourceEvidenceText(metadata);
  if (!priceText && !snippetText && !imageText) return "";
  return `
    <div>
      <p class="eyebrow">Source evidence package</p>
      <ul class="timeline-list">
        ${priceText ? `<li><strong>价格候选</strong><small>${escapeHtml(priceText)}</small></li>` : ""}
        ${snippetText ? `<li><strong>文案证据</strong><small>${escapeHtml(snippetText)}</small></li>` : ""}
        ${
          imageText
            ? `<li>
                <strong>图片候选</strong>
                <div class="source-thumbs">${(metadata.imageCandidates || [])
                  .slice(0, 4)
                  .map((url) => `<img src="${escapeHtml(url)}" alt="详情页候选图片" loading="lazy" />`)
                  .join("")}</div>
                <small>${escapeHtml(imageText)}</small>
              </li>`
            : ""
        }
      </ul>
    </div>
  `;
}

function renderProductCell(product) {
  const title = productDisplayTitle(product);
  return `
    <div class="product-cell">
      <img class="product-image" src="${escapeHtml(bestProductImage(product))}" alt="${escapeHtml(title)} 产品图" loading="lazy" />
      <div>
        <p class="product-name">${escapeHtml(title)}</p>
      </div>
    </div>
  `;
}

function renderStatus(status) {
  const className = status === "在售" ? "success" : "warning";
  return `<span class="pill ${className}">${escapeHtml(status)}</span>`;
}

function renderConfidence(product) {
  const value = Number(product.confidence || 0);
  return `
    <div class="stack">
      <span>${value}% ${product.reviewRequired ? "· 待确认" : ""}</span>
      <div class="confidence-bar" aria-label="AI 置信度 ${value}%">
        <span style="width:${value}%"></span>
      </div>
    </div>
  `;
}

function featureFilterMatches(product) {
  const { featureField, featureOperator, featureValue } = state.filters;
  if (!featureField || featureField === "全部") return true;
  const field = allFields().find((item) => item.key === featureField);
  const rawValue = product.features?.[featureField];
  const expected = String(featureValue || "").trim().toLowerCase();

  if (featureOperator === "hasValue") {
    return rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== "";
  }
  if (featureOperator === "isTrue") return rawValue === true;
  if (featureOperator === "isFalse") return rawValue === false;
  if (featureOperator === "empty") {
    return rawValue === undefined || rawValue === null || String(rawValue).trim() === "";
  }

  if (!expected) return true;
  if (featureOperator === "gte" || featureOperator === "lte") {
    const current = Number(String(rawValue ?? "").replace(/[^\d.]/g, ""));
    const target = Number(expected.replace(/[^\d.]/g, ""));
    if (Number.isNaN(current) || Number.isNaN(target)) return false;
    return featureOperator === "gte" ? current >= target : current <= target;
  }

  const normalized = field?.type === "boolean" ? formatBool(rawValue).toLowerCase() : String(rawValue ?? "").toLowerCase();
  if (featureOperator === "equals") return normalized === expected;
  return normalized.includes(expected);
}

function productSearchFingerprint(product) {
  const metadata = product.sourceMetadata || {};
  return JSON.stringify([
    product.brand,
    product.name,
    product.model,
    product.category,
    product.channel,
    product.status,
    product.quarter,
    product.sourceUrl,
    product.features || {},
    product.sellingPoints || [],
    metadata.title,
    metadata.description,
    metadata.textSnippets || [],
    metadata.priceCandidates || [],
  ]);
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function productSearchText(product) {
  const fingerprint = productSearchFingerprint(product);
  const cached = searchTextCache.get(product);
  if (cached?.fingerprint === fingerprint) return cached.text;
  const featureText = Object.entries(product.features || {})
    .map(([key, value]) => `${key} ${formatBool(value)}`)
    .join(" ");
  const sellingText = (product.sellingPoints || []).map((point) => `${point.title || ""} ${point.evidence || ""}`).join(" ");
  const metadata = product.sourceMetadata || {};
  const sourceText = [
    product.sourceUrl,
    metadata.title,
    metadata.description,
    ...(metadata.textSnippets || []),
    ...(metadata.priceCandidates || []).map((item) => `${item.price || ""} ${item.source || ""}`),
  ].join(" ");
  const text = [
    product.brand,
    product.name,
    product.model,
    product.category,
    product.channel,
    product.status,
    product.quarter,
    sellingText,
    featureText,
    sourceText,
  ]
    .join(" ");
  const normalizedText = normalizeText(text);
  searchTextCache.set(product, { fingerprint, text: normalizedText });
  return normalizedText;
}

function keywordMatches(product) {
  const keyword = normalizeText(state.filters.keyword || "");
  if (!keyword) return true;
  const terms = keyword.split(/\s+/).filter(Boolean);
  const searchText = productSearchText(product);
  return terms.every((term) => searchText.includes(term));
}

function isPlaceholderText(value) {
  const text = String(value || "").trim();
  return !text || ["待确认", "未知", "待确认品牌", "待确认型号", "待确认产品", "AI 待确认产品"].includes(text);
}

function productCatalogBlockers(product) {
  const blockers = [];
  if (product.reviewRequired) blockers.push("AI 结果待确认");
  if (Number(product.confidence || 0) < 80) blockers.push(`置信度 ${Number(product.confidence || 0)}%`);
  if (isPlaceholderText(product.brand)) blockers.push("品牌待确认");
  if (isPlaceholderText(product.model)) blockers.push("型号待确认");
  if (isPlaceholderText(product.name)) blockers.push("产品名称待确认");
  if (isPlaceholderText(product.status)) blockers.push("上市状态待确认");
  if (!Number(product.price || 0)) blockers.push("价格待确认");
  return blockers;
}

function isCatalogProduct(product) {
  return productCatalogBlockers(product).length === 0;
}

function getFilteredProducts() {
  return state.products.filter((product) => {
    if (!isCatalogProduct(product)) return false;
    const { filters } = state;
    const min = filters.minPrice === "" ? -Infinity : Number(filters.minPrice);
    const max = filters.maxPrice === "" ? Infinity : Number(filters.maxPrice);
    const categoryOk = !filters.categories.length || filters.categories.includes(product.category);
    const brandOk = filters.brand === "全部" || product.brand === filters.brand;
    const channelOk = filters.channel === "全部" || product.channel === filters.channel;
    const statusOk = filters.status === "全部" || product.status === filters.status;
    const priceOk = product.price >= min && product.price <= max;
    const confidenceOk = Number(product.confidence || 0) >= Number(filters.confidence);
    const keywordOk = keywordMatches(product);
    const featureOk = featureFilterMatches(product);
    return keywordOk && categoryOk && brandOk && channelOk && statusOk && priceOk && confidenceOk && featureOk;
  });
}

function currentSortColumn() {
  const key = state.productSort?.key || "price";
  return columns.find((column) => column.key === key) || columns.find((column) => column.key === "price") || columns[0];
}

function compareSortValues(aValue, bValue) {
  const aNumber = typeof aValue === "number" ? aValue : Number(String(aValue ?? "").replace(/[^\d.-]/g, ""));
  const bNumber = typeof bValue === "number" ? bValue : Number(String(bValue ?? "").replace(/[^\d.-]/g, ""));
  if (Number.isFinite(aNumber) && Number.isFinite(bNumber) && String(aValue ?? "").match(/\d/) && String(bValue ?? "").match(/\d/)) {
    return aNumber - bNumber;
  }
  return String(aValue ?? "").localeCompare(String(bValue ?? ""), "zh-CN", { numeric: true, sensitivity: "base" });
}

function sortedProducts(products) {
  const column = currentSortColumn();
  const direction = state.productSort?.direction === "asc" ? "asc" : "desc";
  return [...products].sort((a, b) => {
    const primary = compareSortValues(column.sortValue?.(a) ?? "", column.sortValue?.(b) ?? "");
    const fallback = String(a.model || "").localeCompare(String(b.model || ""), "zh-CN", { numeric: true, sensitivity: "base" });
    return (primary || fallback) * (direction === "asc" ? 1 : -1);
  });
}

function getVisibleProducts() {
  return sortedProducts(getFilteredProducts());
}

function toggleProductSort(columnKey) {
  if (state.productSort?.key === columnKey) {
    state.productSort.direction = state.productSort.direction === "asc" ? "desc" : "asc";
  } else {
    state.productSort = {
      key: columnKey,
      direction: ["price", "confidence"].includes(columnKey) ? "desc" : "asc",
    };
  }
  renderAll();
}

function categoryFilterLabel(categories, selectedCategories) {
  if (!selectedCategories.length) return "全部品类";
  if (selectedCategories.length === categories.length) return `全部 ${categories.length} 个品类`;
  if (selectedCategories.length <= 2) return selectedCategories.join("、");
  return `已选 ${selectedCategories.length} 个品类`;
}

const brandAliases = {
  Dreame: "追觅",
  Dyson: "戴森",
  ECOVACS: "科沃斯",
  Ecovacs: "科沃斯",
  Roborock: "石头",
  Tineco: "添可",
  UWANT: "友望",
};

function displayBrandName(brand) {
  const raw = String(brand || "").trim();
  if (!raw || raw === "全部") return raw || "全部";
  const cn = brandAliases[raw];
  return cn && cn !== raw ? `${cn}（${raw}）` : raw;
}

function renderFilters() {
  const catalogProducts = state.products.filter(isCatalogProduct);
  const categories = unique(catalogProducts.map((p) => p.category));
  els.keywordSearch.value = state.filters.keyword || "";
  els.categoryFilterLabel.textContent = categoryFilterLabel(categories, state.filters.categories);
  els.categoryFilters.innerHTML = categories
    .map((category) => {
      const active = state.filters.categories.includes(category);
      return `
        <label class="multi-select-option ${active ? "is-active" : ""}">
          <input type="checkbox" value="${escapeHtml(category)}" data-category="${escapeHtml(category)}" ${active ? "checked" : ""} />
          <span>${escapeHtml(category)}</span>
        </label>
      `;
    })
    .join("");

  const brandScopeProducts = state.filters.categories.length
    ? catalogProducts.filter((product) => state.filters.categories.includes(product.category))
    : catalogProducts;
  const brandOptions = ["全部", ...unique(brandScopeProducts.map((p) => p.brand))];
  if (!brandOptions.includes(state.filters.brand)) state.filters.brand = "全部";
  fillSelect(els.brandFilter, brandOptions, state.filters.brand);
  fillSelect(els.channelFilter, ["全部", ...unique(catalogProducts.map((p) => p.channel))], state.filters.channel);
  fillSelect(els.statusFilter, ["全部", ...unique(catalogProducts.map((p) => p.status))], state.filters.status);
  els.minPrice.value = state.filters.minPrice;
  els.maxPrice.value = state.filters.maxPrice;
  els.confidenceFilter.value = state.filters.confidence;
  els.confidenceLabel.textContent = `${state.filters.confidence}% 以上`;
  renderFeatureFilterControls();

  els.savedViews.innerHTML = `<option value="">选择已保存视图</option>${savedViews
    .map((view, index) => `<option value="${index}">${escapeHtml(view.name)}</option>`)
    .join("")}`;
  els.savedViews.value = selectedSavedViewIndex;
  els.savedViewName.value = selectedSavedViewIndex !== "" ? savedViews[Number(selectedSavedViewIndex)]?.name || "" : els.savedViewName.value;
}

function renderFeatureFilterControls() {
  const fields = allFields();
  const fieldOptions = ["全部", ...fields.map((field) => `${field.module} · ${field.name}`)];
  const fieldValues = ["全部", ...fields.map((field) => field.key)];
  els.featureFilterField.innerHTML = fieldOptions
    .map((label, index) => `<option value="${escapeHtml(fieldValues[index])}">${escapeHtml(label)}</option>`)
    .join("");
  els.featureFilterField.value = fieldValues.includes(state.filters.featureField)
    ? state.filters.featureField
    : "全部";

  const selectedField = fields.find((field) => field.key === els.featureFilterField.value);
  const operators =
    selectedField?.type === "boolean"
      ? [
          ["isTrue", "支持"],
          ["isFalse", "不支持"],
          ["hasValue", "有值"],
          ["empty", "为空"],
        ]
      : [
          ["contains", "包含"],
          ["equals", "等于"],
          ["gte", "大于等于"],
          ["lte", "小于等于"],
          ["hasValue", "有值"],
          ["empty", "为空"],
        ];
  els.featureFilterOperator.innerHTML = operators
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join("");
  els.featureFilterOperator.value = operators.some(([value]) => value === state.filters.featureOperator)
    ? state.filters.featureOperator
    : operators[0][0];
  state.filters.featureOperator = els.featureFilterOperator.value;

  const needsValue = !["isTrue", "isFalse", "hasValue", "empty"].includes(state.filters.featureOperator);
  els.featureFilterValue.disabled = !needsValue || els.featureFilterField.value === "全部";
  els.featureFilterValue.value = state.filters.featureValue;
}

function fillSelect(select, options, value) {
  select.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(displayBrandName(option))}</option>`)
    .join("");
  select.value = options.includes(value) ? value : "全部";
}

function updateFieldOptionsState() {
  const isEnum = els.fieldType.value === "enum";
  els.fieldOptions.disabled = !isEnum;
  els.fieldOptions.placeholder = isEnum ? "枚举选项，例如 基础、进阶、旗舰" : "仅枚举字段需要填写选项";
  if (!isEnum) els.fieldOptions.value = "";
}

function renderMetrics(products) {
  els.metricProducts.textContent = products.length;
  els.metricAvgPrice.textContent = unique(products.map((p) => p.category)).length;
  els.metricReview.textContent = getReviewProducts().length;
  els.metricBrands.textContent = unique(products.map((p) => p.brand)).length;
}

function filterSummaryItems(products) {
  const filters = state.filters;
  const items = [];
  const catalogTotal = state.products.filter(isCatalogProduct).length;
  if (filters.keyword) items.push(`关键词：${filters.keyword}`);
  if (filters.categories.length) items.push(`品类：${filters.categories.join("、")}`);
  if (filters.minPrice !== "" || filters.maxPrice !== "") {
    items.push(`价格：${filters.minPrice || "不限"}-${filters.maxPrice || "不限"}`);
  }
  if (filters.brand !== "全部") items.push(`品牌：${filters.brand}`);
  if (filters.channel !== "全部") items.push(`渠道：${filters.channel}`);
  if (filters.status !== "全部") items.push(`状态：${filters.status}`);
  if (Number(filters.confidence) > 0) items.push(`置信度：${filters.confidence}% 以上`);
  if (filters.featureField && filters.featureField !== "全部") {
    const field = allFields().find((item) => item.key === filters.featureField);
    const value = filters.featureValue ? ` ${filters.featureValue}` : "";
    items.push(`功能：${field ? `${field.module} · ${field.name}` : filters.featureField}${value}`);
  }
  return [`结果：${products.length}/${catalogTotal} 个正式产品`, ...(items.length ? items : ["未设置筛选条件"])];
}

function renderFilterSummary(products) {
  if (!els.filterSummary) return;
  els.filterSummary.innerHTML = filterSummaryItems(products)
    .map((item, index) => `<span class="${index === 0 ? "is-primary" : ""}">${escapeHtml(item)}</span>`)
    .join("");
}

function duplicateProductGroups() {
  const groups = new Map();
  state.products.forEach((product) => {
    const key = duplicateProductKey(product);
    if (!key) return;
    groups.set(key, [...(groups.get(key) || []), product]);
  });
  return Array.from(groups.values()).filter((products) => products.length > 1);
}

function productQualityIssues() {
  const issues = [];
  duplicateProductGroups().forEach((products) => {
    products.forEach((product) => {
      issues.push({
        severity: "high",
        type: "重复型号",
        product,
        detail: `${product.brand} ${product.model} 在产品库中出现 ${products.length} 次`,
      });
    });
  });
  state.products.forEach((product) => {
    const sellingPoints = product.sellingPoints || [];
    if (!Number(product.price || 0)) {
      issues.push({ severity: "high", type: "缺少价格", product, detail: "价格为 0 或未填写" });
    }
    if (!product.sourceUrl && !product.sourceMetadata?.title) {
      issues.push({ severity: "medium", type: "缺少来源", product, detail: "缺少详情页 URL 或页面标题证据" });
    }
    if (isFallbackProductImage(bestProductImage(product))) {
      issues.push({ severity: "medium", type: "缺少真实产品图", product, detail: "当前使用本地品类兜底图，建议补充详情页产品图" });
    }
    if (Number(product.confidence || 0) < 80 || product.reviewRequired) {
      issues.push({ severity: "medium", type: "待人工复核", product, detail: `AI 置信度 ${Number(product.confidence || 0)}%` });
    }
    if (sellingPoints.length < 3 || sellingPoints.some((point) => /待确认/.test(`${point.title || ""}${point.evidence || ""}`))) {
      issues.push({ severity: "low", type: "卖点不完整", product, detail: "Top3 卖点缺失或仍包含待确认内容" });
    }
    const fieldIssues = fieldReviewIssues(product);
    if (fieldIssues.length) {
      issues.push({ severity: "low", type: "字段待复核", product, detail: `自定义字段待复核 ${fieldIssues.length} 个` });
    }
  });
  const severityRank = { high: 0, medium: 1, low: 2 };
  return issues.sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || a.product.brand.localeCompare(b.product.brand, "zh-CN"));
}

function renderQualityPanel() {
  const issues = productQualityIssues();
  if (!issues.length) {
    els.qualityPanel.innerHTML = `<div class="review-empty">当前产品库没有明显数据质量问题。</div>`;
    document.querySelector("#exportQualityCsv").disabled = true;
    return;
  }
  document.querySelector("#exportQualityCsv").disabled = false;
  const counts = {
    high: issues.filter((issue) => issue.severity === "high").length,
    medium: issues.filter((issue) => issue.severity === "medium").length,
    low: issues.filter((issue) => issue.severity === "low").length,
  };
  const severityLabels = {
    high: "高优先级",
    medium: "中优先级",
    low: "低优先级",
  };
  const availableSeverities = ["high", "medium", "low"].filter((severity) => counts[severity] > 0);
  if (!availableSeverities.includes(state.qualitySeverity)) {
    state.qualitySeverity = availableSeverities[0] || "high";
  }
  const selectedIssues = issues.filter((issue) => issue.severity === state.qualitySeverity);
  els.qualityPanel.innerHTML = `
    <div class="quality-summary">
      ${["high", "medium", "low"]
        .map(
          (severity) => `
        <button class="quality-priority ${state.qualitySeverity === severity ? "is-active" : ""}" type="button" data-quality-severity="${severity}">
          ${severityLabels[severity]} ${counts[severity]}
        </button>
      `,
        )
        .join("")}
    </div>
    <p class="quality-focus-note">${severityLabels[state.qualitySeverity]}处理 · ${selectedIssues.length} 条，列表内滚动查看</p>
    <div class="quality-list">
      ${selectedIssues
        .map(
          (issue) => `
        <article class="quality-item is-${escapeHtml(issue.severity)}">
          <div>
            <strong>${escapeHtml(issue.type)} · ${escapeHtml(issue.product.brand)} ${escapeHtml(issue.product.model)}</strong>
            <p>${escapeHtml(issue.detail)}</p>
          </div>
          <button class="secondary-button" type="button" data-focus-quality="${escapeHtml(issue.product.id)}">查看</button>
        </article>
      `,
        )
        .join("")}
    </div>
  `;
}

function exportQualityCsv() {
  const issues = productQualityIssues();
  if (!issues.length) {
    window.alert("暂无可导出的数据质量问题。");
    return;
  }
  const headers = ["severity", "type", "brand", "model", "category", "price", "confidence", "detail"];
  const rows = issues.map((issue) => [
    issue.severity,
    issue.type,
    issue.product.brand,
    issue.product.model,
    issue.product.category,
    issue.product.price,
    issue.product.confidence,
    issue.detail,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  download(`quality-issues-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
}

function reviewReason(product) {
  const reasons = [];
  reasons.push(...productCatalogBlockers(product));
  if (product.reviewRequired) reasons.push("标记待确认");
  if (Number(product.confidence || 0) < 80) reasons.push(`置信度 ${product.confidence}%`);
  const fieldIssueCount = fieldReviewIssues(product).length;
  if (fieldIssueCount) reasons.push(`低置信字段 ${fieldIssueCount} 个`);
  if (!product.sourceUrl) reasons.push("缺少来源");
  if ((product.sellingPoints || []).some((point) => /待确认/.test(point.title + point.evidence))) {
    reasons.push("卖点待补充");
  }
  return unique(reasons).join(" · ") || "需要复核";
}

function safeProductPart(value, fallback) {
  const text = String(value || "").trim();
  if (!text || text === "未知" || text === "待确认") return fallback;
  return text;
}

function reviewProductDisplay(product) {
  const brand = displayBrandName(safeProductPart(product.brand, "品牌待确认"));
  const model = safeProductPart(product.model, "型号待确认");
  const name = safeProductPart(product.name, "产品名称待确认");
  const source = product.sourceMetadata?.title || product.sourceUrl || product.analysisRuns?.[0]?.source || "暂无来源标题";
  return { brand, model, name, source };
}

function reviewPendingItems(product) {
  const items = [...productCatalogBlockers(product)];
  if (!Number(product.price || 0)) items.push("价格待确认");
  if (product.reviewRequired) items.push("产品信息待确认");
  if (Number(product.confidence || 0) < 80) items.push(`AI 置信度 ${Number(product.confidence || 0)}%`);
  if (!product.sourceUrl && !product.sourceMetadata?.title) items.push("来源证据待补充");
  fieldReviewIssues(product)
    .slice(0, 4)
    .forEach((item) => items.push(`${item.field.name} ${Number(item.confidence || 0)}%`));
  if (!items.length) items.push("需要人工复核");
  return unique(items);
}

function reviewVisiblePendingItems(product) {
  const items = reviewPendingItems(product);
  const primary = items.filter((item) => !/^AI 置信度\s*0%$/.test(item));
  return (primary.length ? primary : items).slice(0, 4);
}

function getReviewProducts() {
  return state.products
    .filter((product) => !isCatalogProduct(product) || fieldReviewIssues(product).length)
    .sort((a, b) => Number(a.confidence || 0) - Number(b.confidence || 0));
}

function renderReviewQueue() {
  const products = getReviewProducts();
  const visibleReviewIds = new Set(products.map((product) => product.id));
  selectedReviewIds = new Set([...selectedReviewIds].filter((id) => visibleReviewIds.has(id)));
  updateReviewBatchActions(products);
  if (!products.length) {
    els.reviewQueue.innerHTML = `
      <div class="review-empty">
        当前没有待确认产品。新增 AI 解析结果或低置信产品后会自动进入这里。
      </div>
    `;
    document.querySelector("#confirmAllReviews").disabled = true;
    updateReviewBatchActions(products);
    return;
  }
  document.querySelector("#confirmAllReviews").disabled = false;
  els.reviewQueue.innerHTML = products
    .map(
      (product) => {
        const display = reviewProductDisplay(product);
        const pendingItems = reviewPendingItems(product);
        const visibleItems = reviewVisiblePendingItems(product);
        const priceText = Number(product.price || 0) ? formatCurrency(product.price) : "价格待确认";
        const confidenceText = Number(product.confidence || 0) ? `置信度 ${Number(product.confidence || 0)}%` : "置信度待确认";
        const highlightClass = product.id === highlightedReviewProductId ? " is-highlighted" : "";
        const checked = selectedReviewIds.has(product.id) ? "checked" : "";
        return `
      <article class="review-item${highlightClass}" data-review-product="${product.id}">
        <label class="review-select" title="选择待确认产品">
          <input type="checkbox" data-review-select="${product.id}" ${checked} />
        </label>
        <img class="product-image" src="${escapeHtml(bestProductImage(product))}" alt="${escapeHtml(product.name)} 产品图" />
        <div class="review-main">
          <strong>${escapeHtml(display.brand)} · ${escapeHtml(display.model)}</strong>
          <p>${escapeHtml(display.name)} · ${escapeHtml(product.category)} · ${escapeHtml(priceText)}</p>
          <small title="${escapeHtml(display.source)}">来源：${escapeHtml(display.source)}</small>
          <div class="review-summary">
            <span>待处理 ${pendingItems.length} 项</span>
            <span>${escapeHtml(confidenceText)}</span>
          </div>
          <div class="review-field-tags">
            ${visibleItems.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
        </div>
        <div class="review-actions">
          <button class="secondary-button" type="button" data-edit-review="${product.id}">调整信息</button>
          <button class="primary-button" type="button" data-confirm-review="${product.id}">确认</button>
          <button class="secondary-button danger-button" type="button" data-delete-review="${product.id}">删除</button>
        </div>
      </article>
    `;
      },
    )
    .join("");
}

function updateReviewBatchActions(products = getReviewProducts()) {
  const selectedCount = selectedReviewIds.size;
  const selectAllButton = document.querySelector("#selectAllReviews");
  const confirmSelectedButton = document.querySelector("#confirmSelectedReviews");
  const deleteSelectedButton = document.querySelector("#deleteSelectedReviews");
  if (selectAllButton) {
    selectAllButton.disabled = !products.length;
    selectAllButton.textContent = selectedCount && selectedCount === products.length ? "取消全选" : "全选";
  }
  if (confirmSelectedButton) {
    confirmSelectedButton.disabled = !selectedCount;
    confirmSelectedButton.textContent = selectedCount ? `确认所选 ${selectedCount}` : "确认所选";
  }
  if (deleteSelectedButton) {
    deleteSelectedButton.disabled = !selectedCount;
    deleteSelectedButton.textContent = selectedCount ? `删除所选 ${selectedCount}` : "删除所选";
  }
}

function scrollToReviewProduct(productId) {
  window.setTimeout(() => {
    const item = [...document.querySelectorAll("[data-review-product]")].find((node) => node.dataset.reviewProduct === productId);
    if (!item) return;
    item.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 80);
}

function focusPendingAnalysisResult(product) {
  highlightedReviewProductId = product.id;
  state.selectedProductId = product.id;
  state.editingProductId = "";
  state.activeWorkspace = "import";
  renderAll();
  scrollToReviewProduct(product.id);
}

function renderProductTable(products) {
  const visible = columns.filter((column) => state.visibleColumns[column.key]);
  const sortKey = state.productSort?.key || "price";
  const direction = state.productSort?.direction === "asc" ? "asc" : "desc";
  els.productTableHead.innerHTML = visible
    .map((column) => {
      const active = sortKey === column.key;
      return `<th>
        <button class="table-sort-button ${active ? "is-active" : ""}" type="button" data-sort-column="${escapeHtml(column.key)}" aria-label="按${escapeHtml(column.label)}排序">
          <span>${escapeHtml(column.label)}</span>
          <span>${active ? (direction === "asc" ? "↑" : "↓") : "↕"}</span>
        </button>
      </th>`;
    })
    .join("");
  els.productTableBody.innerHTML = products
    .map((product) => {
      const selected = product.id === state.selectedProductId;
      return `<tr class="${selected ? "is-selected" : ""}" data-product-id="${product.id}">
        ${visible.map((column) => `<td>${column.render(product)}</td>`).join("")}
      </tr>`;
    })
    .join("");
}

function renderColumnsPopover() {
  els.columnsPopover.innerHTML = columns
    .map(
      (column) => `
      <label>
        <input type="checkbox" data-column="${column.key}" ${state.visibleColumns[column.key] ? "checked" : ""} />
        ${column.label}
      </label>
    `,
    )
    .join("");
}

function renderProductEditForm(product, options = {}) {
  const submitLabel = options.submitLabel || "保存修改";
  const showCancel = options.showCancel !== false;
  const formId = options.formId ? ` id="${escapeHtml(options.formId)}"` : "";
  return `
      <form class="edit-form"${formId} data-edit-product="${product.id}">
        <div class="detail-hero">
          <img class="product-image" src="${escapeHtml(bestProductImage(product))}" alt="${escapeHtml(product.name)} 产品图" />
          <div>
            <p class="eyebrow">Edit product</p>
            <h3>${escapeHtml(product.model || "新产品")}</h3>
            <p class="small-muted">修改会同步到产品库、对比矩阵和品牌路标。</p>
          </div>
        </div>
        <div class="edit-grid">
          <label>品牌<input name="brand" required value="${escapeHtml(product.brand)}" /></label>
          <label>产品名<input name="name" required value="${escapeHtml(product.name)}" /></label>
          <label>型号<input name="model" required value="${escapeHtml(product.model)}" /></label>
          <label>
            品类
            <select name="category">
              ${["扫地机", "洗地机", "吸尘器"]
                .map((category) => `<option ${product.category === category ? "selected" : ""}>${category}</option>`)
                .join("")}
            </select>
          </label>
          <label>价格<input name="price" type="number" min="0" value="${Number(product.price || 0)}" /></label>
          <label>渠道<input name="channel" value="${escapeHtml(product.channel)}" /></label>
          <label>上市状态<input name="status" value="${escapeHtml(product.status)}" /></label>
          <label>路标季度<input name="quarter" placeholder="例如 2026 Q2；不确定填未规划" value="${escapeHtml(normalizeQuarterInput(product.quarter || "未规划"))}" /></label>
          <label>AI 置信度<input name="confidence" type="number" min="0" max="100" value="${Number(product.confidence || 0)}" /></label>
          <label>产品图 URL<input name="image" value="${escapeHtml(bestProductImage(product))}" /></label>
          <label class="wide-field">来源 URL<input name="sourceUrl" value="${escapeHtml(product.sourceUrl || "")}" /></label>
          <label class="wide-field">
            Top3 卖点（每行：卖点 | 证据）
            <textarea name="sellingPoints" rows="5">${escapeHtml(sellingPointsToText(product.sellingPoints))}</textarea>
          </label>
        </div>
        <div>
          <p class="eyebrow">Feature values</p>
          <div class="edit-grid feature-edit-grid">
            ${allFields().map((field) => renderFeatureInput(field, product)).join("")}
          </div>
        </div>
        <div class="detail-actions">
          <button class="primary-button" type="submit">${escapeHtml(submitLabel)}</button>
          ${showCancel ? `<button class="secondary-button" type="button" data-cancel-edit="${product.id}">取消</button>` : ""}
        </div>
      </form>
    `;
}

function renderReviewDetail() {
  if (!els.reviewProductDetail) return;
  const reviewProducts = getReviewProducts();
  const selectedReviewProduct = reviewProducts.find((product) => product.id === state.selectedProductId) || reviewProducts[0];
  if (!selectedReviewProduct) {
    els.reviewProductDetail.className = "detail-empty";
    els.reviewProductDetail.textContent = "当前没有待确认产品。新产品解析或手动新增后，会在这里调整信息并确认加入产品库。";
    return;
  }
  const pendingItems = reviewVisiblePendingItems(selectedReviewProduct);
  els.reviewProductDetail.className = "detail-card intake-detail-card";
  els.reviewProductDetail.innerHTML = `
    <div class="review-field-tags">
      ${pendingItems.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
    </div>
    ${renderProductEditForm(selectedReviewProduct, { submitLabel: "保存调整", showCancel: false, formId: "reviewProductEditForm" })}
  `;
}

function renderDetail() {
  const product = state.products.find((item) => item.id === state.selectedProductId);
  if (!product) {
    els.productDetail.className = "detail-empty";
    els.productDetail.textContent = "选择一款产品查看图片、价格、Top3 卖点和 AI 证据。";
    return;
  }

  if (state.editingProductId === product.id) {
    els.productDetail.className = "detail-card";
    els.productDetail.innerHTML = renderProductEditForm(product, { formId: "productEditForm" });
    return;
  }

  els.productDetail.className = "detail-card";
  const title = productDisplayTitle(product);
  els.productDetail.innerHTML = `
    <div class="detail-hero">
      <img class="product-image" src="${escapeHtml(bestProductImage(product))}" alt="${escapeHtml(title)} 产品图" />
      <div>
        <h3>${escapeHtml(title)}</h3>
        <p class="small-muted">${escapeHtml(displayBrandName(product.brand))} · ${escapeHtml(product.category)} · ${formatCurrency(product.price)}</p>
        <p class="small-muted">${escapeHtml(product.model)} · ${escapeHtml(product.channel)} · ${escapeHtml(product.status)}</p>
      </div>
    </div>
    <div class="detail-actions">
      <button class="secondary-button" type="button" data-edit-product="${product.id}">
        编辑产品
      </button>
      <button class="primary-button" type="button" data-confirm-product="${product.id}" ${product.reviewRequired ? "" : "disabled"}>
        确认 AI 结果
      </button>
    </div>
    <div class="detail-actions single-danger">
      <button class="secondary-button danger-button" type="button" data-delete-product="${product.id}">
        删除产品
      </button>
    </div>
    <div>
      <p class="eyebrow">Top3 priority selling points</p>
      <ul class="selling-list">
        ${(product.sellingPoints || [])
          .slice(0, 3)
          .map(
            (point, index) => `
          <li>
            <strong>P${index + 1} · ${escapeHtml(point.title)}</strong>
            <span>${escapeHtml(point.evidence)}</span>
          </li>
        `,
          )
          .join("")}
      </ul>
    </div>
    <div>
      <p class="eyebrow">Source & confidence</p>
      <ul class="source-list">
        <li>来源：${escapeHtml(product.sourceUrl || "人工录入")}</li>
        ${product.sourceMetadata?.title ? `<li>页面标题：${escapeHtml(product.sourceMetadata.title)}</li>` : ""}
        ${product.sourceMetadata?.description ? `<li>页面描述：${escapeHtml(product.sourceMetadata.description)}</li>` : ""}
        <li>AI 置信度：${product.confidence}% · ${product.reviewRequired ? "需要人工确认" : "已确认"}</li>
      </ul>
    </div>
    ${renderPriceHistory(product)}
    ${renderSourceMetadataEvidence(product)}
    ${renderFieldReviewSummary(product)}
    ${renderCustomFeatureEvidence(product)}
    ${renderTimeline(product)}
  `;
}

function allFields() {
  return state.modules.flatMap((module) =>
    module.fields.map((field) => ({
      ...field,
      module: module.name,
    })),
  );
}

function getCompareCandidateProducts() {
  const filters = state.compareFilters || defaultState.compareFilters;
  const min = filters.minPrice === "" ? -Infinity : Number(filters.minPrice);
  const max = filters.maxPrice === "" ? Infinity : Number(filters.maxPrice);
  const keyword = normalizeText(filters.keyword || "");
  return sortedProducts(state.products.filter((product) => {
    if (!isCatalogProduct(product)) return false;
    if (keyword && !productSearchText(product).includes(keyword)) return false;
    if (filters.brand !== "全部" && product.brand !== filters.brand) return false;
    if (filters.category !== "全部" && product.category !== filters.category) return false;
    if (filters.channel !== "全部" && product.channel !== filters.channel) return false;
    if (filters.status !== "全部" && product.status !== filters.status) return false;
    return Number(product.price || 0) >= min && Number(product.price || 0) <= max;
  }));
}

function renderCompareFilters() {
  const catalogProducts = state.products.filter(isCatalogProduct);
  const filters = state.compareFilters || defaultState.compareFilters;
  if (els.compareKeywordFilter) els.compareKeywordFilter.value = filters.keyword || "";
  fillSelect(els.compareBrandFilter, ["全部", ...unique(catalogProducts.map((p) => p.brand))], filters.brand);
  fillSelect(els.compareCategoryFilter, ["全部", ...unique(catalogProducts.map((p) => p.category))], filters.category);
  fillSelect(els.compareChannelFilter, ["全部", ...unique(catalogProducts.map((p) => p.channel))], filters.channel);
  fillSelect(els.compareStatusFilter, ["全部", ...unique(catalogProducts.map((p) => p.status))], filters.status);
  if (els.compareMinPrice) els.compareMinPrice.value = filters.minPrice || "";
  if (els.compareMaxPrice) els.compareMaxPrice.value = filters.maxPrice || "";
}

function selectedCompareProducts() {
  return state.products.filter((product) => state.compareIds.includes(product.id) && isCatalogProduct(product));
}

function allCompareFields() {
  return [
    { module: "基础信息", key: "price", name: "价格", value: (p) => formatCurrency(p.price) },
    { module: "基础信息", key: "category", name: "品类", value: (p) => p.category },
    ...allFields().map((field) => ({
      ...field,
      value: (p) => formatBool(p.features?.[field.key]),
    })),
  ];
}

function selectedCompareFieldKeys() {
  const availableKeys = new Set(allCompareFields().map((field) => field.key));
  const keys = (state.compareFieldKeys || []).filter((key) => availableKeys.has(key));
  return keys.length ? keys : Array.from(availableKeys);
}

function compareFields() {
  const selectedKeys = new Set(selectedCompareFieldKeys());
  return allCompareFields().filter((field) => selectedKeys.has(field.key));
}

function normalizedCompareValue(value) {
  return String(value ?? "").replace(/(?<=\d),(?=\d)/g, "").trim();
}

function compareValueScore(field, value) {
  const text = normalizedCompareValue(value);
  if (!text || /待确认|未知|-/.test(text)) return null;
  if (/不支持|无|false/i.test(text)) return 0;
  if (/支持|有|true/i.test(text)) return 1;
  const levelScores = [
    ["旗舰", 4],
    ["高端", 3],
    ["进阶", 2],
    ["基础", 1],
  ];
  const level = levelScores.find(([label]) => text.includes(label));
  if (level) return level[1];
  const numbers = [...text.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0])).filter(Number.isFinite);
  if (!numbers.length) return null;
  const fieldText = `${field.key || ""} ${field.name || ""}`.toLowerCase();
  const lowerIsBetter = /price|价格|noise|噪音|db/.test(fieldText) || /db/i.test(text);
  const valueForScore = lowerIsBetter ? Math.min(...numbers) : Math.max(...numbers);
  return lowerIsBetter ? -valueForScore : valueForScore;
}

function compareStrongValueIndexes(field, values) {
  const scored = values.map((value, index) => ({ index, score: compareValueScore(field, value) })).filter((item) => item.score !== null);
  if (scored.length === 1 && unique(values).length > 1) return new Set([scored[0].index]);
  if (scored.length < 2) return new Set();
  const scores = scored.map((item) => item.score);
  const bestScore = Math.max(...scores);
  const worstScore = Math.min(...scores);
  if (bestScore === worstScore) return new Set();
  return new Set(scored.filter((item) => item.score === bestScore).map((item) => item.index));
}

function compareModuleRowSpans(fields) {
  const spans = new Map();
  fields.forEach((field) => {
    spans.set(field.module, (spans.get(field.module) || 0) + 1);
  });
  return spans;
}

function renderCompareStatus(selected, fields) {
  if (!els.compareStatus) return;
  const selectedCount = selected.length;
  const ready = selectedCount >= 2;
  if (els.generateSummary) els.generateSummary.disabled = !ready;
  if (els.exportCompare) els.exportCompare.disabled = !ready;
  const categories = unique(selected.map((product) => product.category));
  const categoryHint = selectedCount < 2
    ? "建议选择同品类、相近价格带的多个型号，结论更容易复核。"
    : categories.length > 1
      ? `当前跨品类对比：${categories.join("、")}。建议只做粗略参考。`
      : `当前同品类对比：${categories[0]}。`;
  const message = ready
    ? `可以生成总结 · 已选 ${selectedCount} 个型号 · 已选 ${fields.length} 个字段`
    : `还需选择 ${2 - selectedCount} 个型号 · 已选 ${selectedCount} 个型号 · 已选 ${fields.length} 个字段`;
  els.compareStatus.innerHTML = `
    <span class="status-badge ${ready ? "is-ok" : "is-warning"}">${escapeHtml(message)}</span>
    <span class="small-muted">${escapeHtml(categoryHint)}</span>
  `;
}

function setCompareProducts(products, emptyMessage) {
  const nextProducts = products;
  if (nextProducts.length < 2) {
    window.alert(emptyMessage);
    return false;
  }
  state.compareIds = nextProducts.map((product) => product.id);
  renderAll();
  scrollToWorkspace("compareWorkspace");
  return true;
}

function renderCompare() {
  renderCompareFilters();
  const catalogIds = new Set(state.products.filter(isCatalogProduct).map((product) => product.id));
  state.compareIds = state.compareIds.filter((id) => catalogIds.has(id));
  const products = getCompareCandidateProducts();
  els.comparePicker.innerHTML = products
    .map(
      (product) => `
      <label class="compare-option">
        <input type="checkbox" data-compare-id="${product.id}" ${state.compareIds.includes(product.id) ? "checked" : ""} />
        <span>
          <strong>${escapeHtml(product.model)}</strong>
          <small>${escapeHtml(displayBrandName(product.brand))} · ${escapeHtml(product.category)} · ${formatCurrency(product.price)}</small>
        </span>
      </label>
    `,
    )
    .join("") || `<div class="review-empty">当前筛选下没有可对比的正式产品。</div>`;

  const selectedKeys = new Set(selectedCompareFieldKeys());
  state.compareFieldKeys = Array.from(selectedKeys);
  const fieldsByModule = groupBy(allCompareFields(), (field) => field.module);
  els.compareFieldPicker.innerHTML = Object.entries(fieldsByModule)
    .map(
      ([moduleName, moduleFields]) => `
      <section class="compare-field-group">
        <div class="compare-field-group-title">${escapeHtml(moduleName)}</div>
        <div class="compare-field-group-options">
          ${moduleFields
            .map(
              (field) => `
              <label class="compare-field-option">
                <input type="checkbox" data-compare-field-key="${escapeHtml(field.key)}" ${selectedKeys.has(field.key) ? "checked" : ""} />
                <span>${escapeHtml(field.name)}</span>
              </label>
            `,
            )
            .join("")}
        </div>
      </section>
    `,
    )
    .join("");

  const selected = selectedCompareProducts();
  const fields = compareFields();
  renderCompareStatus(selected, fields);

  els.compareHead.innerHTML = `<tr><th>模块</th><th>字段</th>${selected
    .map((product) => `<th><strong>${escapeHtml(productDisplayTitle(product))}</strong></th>`)
    .join("")}</tr>`;

  const moduleRowSpans = compareModuleRowSpans(fields);
  const renderedModules = new Set();
  els.compareBody.innerHTML = fields
    .map((field) => {
      const values = selected.map((product) => field.value(product));
      const hasDiff = unique(values).length > 1;
      const strongIndexes = compareStrongValueIndexes(field, values);
      const moduleCell = renderedModules.has(field.module)
        ? ""
        : `<td class="compare-module-cell" rowspan="${moduleRowSpans.get(field.module) || 1}">${escapeHtml(field.module)}</td>`;
      renderedModules.add(field.module);
      return `<tr>
        ${moduleCell}
        <td>${escapeHtml(field.name)}</td>
        ${values
          .map((value, index) => `<td class="${[hasDiff ? "diff-cell" : "", strongIndexes.has(index) ? "compare-strong-cell" : ""].filter(Boolean).join(" ")}">${escapeHtml(value)}</td>`)
          .join("")}
      </tr>`;
    })
    .join("");
}

function compareFilteredProducts() {
  setCompareProducts(
    getVisibleProducts(),
    "当前筛选结果少于 2 个产品。请先放宽筛选条件，再生成对比选择。",
  );
}

function compareSimilarProducts() {
  const reference =
    state.products.find((product) => product.id === state.selectedProductId) ||
    selectedCompareProducts()[0] ||
    getVisibleProducts()[0];
  if (!reference) {
    window.alert("当前没有可用于对比的产品。请先添加或筛选产品。");
    return;
  }
  const products = state.products
    .filter((product) => isCatalogProduct(product) && product.category === reference.category)
    .sort((a, b) => {
      const priceDiff = Math.abs(Number(a.price || 0) - Number(reference.price || 0)) - Math.abs(Number(b.price || 0) - Number(reference.price || 0));
      return priceDiff || String(a.model || "").localeCompare(String(b.model || ""), "zh-CN", { numeric: true, sensitivity: "base" });
    })
  setCompareProducts(
    products,
    `当前只有 ${products.length} 个 ${reference.category} 产品，暂时无法生成同品类对比。`,
  );
}

function renderModules() {
  els.moduleList.innerHTML = state.modules
    .map(
      (module, moduleIndex) => `
      <div class="module-item">
        <div class="module-main">
          <div class="module-title-row">
            <strong>${escapeHtml(module.name)}</strong>
            <span class="module-sort-actions">
              <button class="icon-button small-icon-button" type="button" data-move-module="${escapeHtml(module.name)}" data-move-direction="-1" title="模块上移" ${moduleIndex === 0 ? "disabled" : ""}>↑</button>
              <button class="icon-button small-icon-button" type="button" data-move-module="${escapeHtml(module.name)}" data-move-direction="1" title="模块下移" ${moduleIndex === state.modules.length - 1 ? "disabled" : ""}>↓</button>
            </span>
          </div>
          <div class="module-fields">
            ${module.fields
              .map(
                (field, fieldIndex) => `
              <span class="field-pill">
                <span>${escapeHtml(field.name)} · ${escapeHtml(field.type)}${field.type === "enum" && field.options?.length ? `: ${escapeHtml(field.options.join("/"))}` : ""}</span>
                <button class="icon-button small-icon-button" type="button" data-move-field="${escapeHtml(field.key)}" data-move-direction="-1" title="字段左移" ${fieldIndex === 0 ? "disabled" : ""}>←</button>
                <button class="icon-button small-icon-button" type="button" data-move-field="${escapeHtml(field.key)}" data-move-direction="1" title="字段右移" ${fieldIndex === module.fields.length - 1 ? "disabled" : ""}>→</button>
                <button class="icon-button small-icon-button" type="button" data-rename-field="${escapeHtml(field.key)}" title="重命名字段">改</button>
                ${field.type === "enum" ? `<button class="icon-button small-icon-button" type="button" data-edit-field-options="${escapeHtml(field.key)}" title="编辑枚举选项">选</button>` : ""}
                <button class="icon-button small-icon-button" type="button" data-delete-field="${escapeHtml(field.key)}" title="删除字段">×</button>
              </span>
            `,
              )
              .join("") || `<span class="small-muted">暂无字段</span>`}
          </div>
        </div>
        <button class="secondary-button" type="button" data-delete-module="${escapeHtml(module.name)}">删除</button>
      </div>
    `,
    )
    .join("");
}

function moveArrayItem(items, fromIndex, direction) {
  const toIndex = fromIndex + direction;
  if (fromIndex < 0 || toIndex < 0 || toIndex >= items.length) return false;
  const [item] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, item);
  return true;
}

function moveModule(moduleName, direction) {
  const index = state.modules.findIndex((module) => module.name === moduleName);
  if (moveArrayItem(state.modules, index, direction)) renderAll();
}

function moveFeatureField(fieldKey, direction) {
  for (const module of state.modules) {
    const index = module.fields.findIndex((field) => field.key === fieldKey);
    if (moveArrayItem(module.fields, index, direction)) {
      renderAll();
      return;
    }
  }
}

function renameFeatureField(fieldKey) {
  const field = allFields().find((item) => item.key === fieldKey);
  if (!field) return;
  const nextName = window.prompt("输入新的字段名称：", field.name);
  if (!nextName?.trim()) return;
  for (const module of state.modules) {
    const target = module.fields.find((item) => item.key === fieldKey);
    if (target) {
      target.name = nextName.trim();
      break;
    }
  }
  renderAll();
}

function editFeatureFieldOptions(fieldKey) {
  const field = allFields().find((item) => item.key === fieldKey);
  if (!field || field.type !== "enum") return;
  const nextOptions = window.prompt("输入枚举选项，用逗号、顿号或斜杠分隔：", enumOptions(field).join("、"));
  if (nextOptions == null) return;
  const options = normalizeEnumOptions(nextOptions);
  if (!options.length) {
    window.alert("枚举字段至少需要保留一个选项。");
    return;
  }
  for (const module of state.modules) {
    const target = module.fields.find((item) => item.key === fieldKey);
    if (target) {
      target.options = options;
      break;
    }
  }
  renderAll();
}

function deleteFeatureField(fieldKey) {
  const field = allFields().find((item) => item.key === fieldKey);
  if (!field) return;
  const confirmed = window.confirm(`删除字段「${field.module} · ${field.name}」？历史产品值会保留在数据包中，但不再显示在筛选、对比和导出里。`);
  if (!confirmed) return;
  state.modules = state.modules
    .map((module) => ({
      ...module,
      fields: module.fields.filter((item) => item.key !== fieldKey),
    }))
    .filter((module) => module.fields.length || module.name !== field.module);
  state.compareFieldKeys = (state.compareFieldKeys || []).filter((key) => key !== fieldKey);
  if (state.filters.featureField === fieldKey) {
    state.filters.featureField = "全部";
    state.filters.featureValue = "";
  }
  renderAll();
}

function selectedRoadmapBrands() {
  const value = state.roadmapBrand;
  if (Array.isArray(value)) return value.filter((brand) => brand && brand !== "全部");
  if (value && value !== "全部") return [value];
  return [];
}

function setRoadmapBrands(brands) {
  state.roadmapBrand = unique((brands || []).filter((brand) => brand && brand !== "全部"));
}

window.setRoadmapBrands = setRoadmapBrands;

function productRoadmapPeriod(product) {
  const raw = String(product.quarter || "").trim();
  const match = raw.match(/(20\d{2})\s*Q([1-4])/i);
  if (!match) return raw && raw !== "待确认" ? raw : "未规划";
  const half = Number(match[2]) <= 2 ? "H1" : "H2";
  return `${match[1]} ${half}`;
}

function getRoadmapProducts() {
  const selectedBrands = selectedRoadmapBrands();
  return state.products.filter((product) => {
    if (!isCatalogProduct(product)) return false;
    const brandMatch = !selectedBrands.length || selectedBrands.includes(product.brand);
    const categoryMatch = !state.roadmapCategory || state.roadmapCategory === "全部" || product.category === state.roadmapCategory;
    const statusMatch = !state.roadmapStatus || state.roadmapStatus === "全部" || product.status === state.roadmapStatus;
    const quarterMatch = !state.roadmapQuarter || state.roadmapQuarter === "全部" || productRoadmapPeriod(product) === state.roadmapQuarter;
    return brandMatch && categoryMatch && statusMatch && quarterMatch;
  });
}

function roadmapSourceLabel(product) {
  return product.sourceMetadata?.title || product.sourceUrl || product.analysisRuns?.[0]?.source || "无来源";
}

function roadmapTitle(prefix = "品牌路标") {
  const selectedBrands = selectedRoadmapBrands();
  const parts = [
    selectedBrands.length ? selectedBrands.map(displayBrandName).join("、") : "",
    state.roadmapCategory && state.roadmapCategory !== "全部" ? state.roadmapCategory : "",
    state.roadmapStatus && state.roadmapStatus !== "全部" ? state.roadmapStatus : "",
    state.roadmapQuarter && state.roadmapQuarter !== "全部" ? state.roadmapQuarter : "",
  ].filter(Boolean);
  return parts.length ? `${parts.join(" · ")} 路标` : prefix;
}

function renderRoadmapSelect(select, values, currentValue) {
  const options = ["全部", ...unique(values)];
  select.innerHTML = options
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join("");
  select.value = options.includes(currentValue) ? currentValue : "全部";
  return select.value;
}

function renderRoadmapBrandFilter() {
  const catalogProducts = state.products.filter(isCatalogProduct);
  state.roadmapCategory = renderRoadmapSelect(els.roadmapCategoryFilter, catalogProducts.map((product) => product.category), state.roadmapCategory);
  const brandScopeProducts = state.roadmapCategory && state.roadmapCategory !== "全部"
    ? catalogProducts.filter((product) => product.category === state.roadmapCategory)
    : catalogProducts;
  const brandOptions = unique(brandScopeProducts.map((product) => product.brand));
  const selectedBrands = selectedRoadmapBrands().filter((brand) => brandOptions.includes(brand));
  setRoadmapBrands(selectedBrands);
  if (els.roadmapBrandLabel) {
    els.roadmapBrandLabel.textContent = selectedBrands.length
      ? selectedBrands.length <= 2
        ? selectedBrands.map(displayBrandName).join("、")
        : `已选 ${selectedBrands.length} 个品牌`
      : "全部品牌";
  }
  if (els.roadmapBrandMenu) {
    els.roadmapBrandMenu.innerHTML = `
      <label class="multi-select-option ${selectedBrands.length ? "" : "is-active"}">
        <input type="checkbox" data-roadmap-brand="__all" ${selectedBrands.length ? "" : "checked"} />
        <span>全选</span>
      </label>
      ${brandOptions
        .map((brand) => {
          const active = selectedBrands.includes(brand);
          return `
            <label class="multi-select-option ${active ? "is-active" : ""}">
              <input type="checkbox" data-roadmap-brand="${escapeHtml(brand)}" value="${escapeHtml(brand)}" ${active ? "checked" : ""} />
              <span>${escapeHtml(displayBrandName(brand))}</span>
            </label>
          `;
        })
        .join("")}
    `;
  }
  state.roadmapStatus = renderRoadmapSelect(els.roadmapStatusFilter, catalogProducts.map((product) => product.status), state.roadmapStatus);
  state.roadmapQuarter = renderRoadmapSelect(els.roadmapQuarterFilter, catalogProducts.map(productRoadmapPeriod), state.roadmapQuarter);
  document.querySelectorAll("[data-roadmap-mode]").forEach((button) => {
    const active = button.dataset.roadmapMode === (state.roadmapMode || "single");
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function roadmapLaneOffset(product, index) {
  const basis = Number(product.price || 0) + index * 137;
  return ((basis % 3) - 1) * 12;
}

function roadmapPriceScale(products) {
  const prices = products.map((product) => Number(product.price || 0)).filter(Number.isFinite);
  const rawMin = Math.min(...prices);
  const rawMax = Math.max(...prices);
  const safeMin = Number.isFinite(rawMin) ? rawMin : 0;
  const safeMax = Number.isFinite(rawMax) ? rawMax : 0;
  const range = Math.max(safeMax - safeMin, 1);
  const step = range <= 3500 ? 500 : 1000;
  const min = Math.max(0, Math.floor(safeMin / step) * step);
  const max = Math.ceil(safeMax / step) * step || step;
  const ticks = [];
  for (let value = max; value >= min; value -= step) {
    ticks.push(value);
  }
  return {
    min,
    max,
    step,
    ticks: ticks.length ? ticks : [max, min],
  };
}

const roadmapBrandPalette = [
  { color: "#1d4ed8", soft: "#dbeafe", line: "#93c5fd" },
  { color: "#047857", soft: "#d1fae5", line: "#6ee7b7" },
  { color: "#b45309", soft: "#fef3c7", line: "#fcd34d" },
  { color: "#7c3aed", soft: "#ede9fe", line: "#c4b5fd" },
  { color: "#be123c", soft: "#ffe4e6", line: "#fda4af" },
  { color: "#0f766e", soft: "#ccfbf1", line: "#5eead4" },
  { color: "#4338ca", soft: "#e0e7ff", line: "#a5b4fc" },
  { color: "#c2410c", soft: "#ffedd5", line: "#fdba74" },
];

function roadmapBrandTheme(brand) {
  const text = String(brand || "未命名品牌");
  const index = Math.abs(Array.from(text).reduce((sum, char) => sum + char.charCodeAt(0), 0)) % roadmapBrandPalette.length;
  return roadmapBrandPalette[index];
}

function roadmapBrandStyle(brand) {
  const theme = roadmapBrandTheme(brand);
  return `--brand-color:${theme.color};--brand-soft:${theme.soft};--brand-line:${theme.line}`;
}

function roadmapCard(product, priceScale, index, laneIndex = 0) {
  const range = Math.max(priceScale.max - priceScale.min, 1);
  const normalized = (priceScale.max - Number(product.price || 0)) / range;
  const y = Math.max(8, Math.min(78, 8 + normalized * 70));
  const x = laneIndex * 220 + roadmapLaneOffset(product, index);
  return `
    <article class="roadmap-card" style="--roadmap-y: ${y}%; --roadmap-x: ${x}px; ${roadmapBrandStyle(product.brand)}">
      <div>
        <h4><span class="brand-dot" aria-hidden="true"></span>${escapeHtml(displayBrandName(product.brand))} · ${escapeHtml(product.name || product.model)}</h4>
        <p class="roadmap-price">${formatCurrency(product.price)}</p>
        <ul>
          ${(product.sellingPoints || [])
            .slice(0, 3)
            .map((point) => `<li>${escapeHtml(point.title)}</li>`)
            .join("")}
        </ul>
      </div>
    </article>
  `;
}

function roadmapAxis(priceScale) {
  const range = Math.max(priceScale.max - priceScale.min, 1);
  return priceScale.ticks
    .map((tick) => {
      const y = Math.max(4, Math.min(92, 8 + ((priceScale.max - tick) / range) * 70));
      return `<div class="roadmap-axis-tick" style="--tick-y: ${y}%"><span>${formatCurrency(tick)}</span></div>`;
    })
    .join("");
}

function renderRoadmapTimeline(products) {
  const brandProducts = [...products].sort((a, b) => productRoadmapPeriod(a).localeCompare(productRoadmapPeriod(b), "zh-CN") || Number(b.price || 0) - Number(a.price || 0));
  const brands = unique(brandProducts.map((product) => product.brand));
  const selectedBrands = selectedRoadmapBrands().filter((brand) => brands.includes(brand));
  const scopedProducts = selectedBrands.length ? brandProducts.filter((product) => selectedBrands.includes(product.brand)) : brandProducts;
  const selectedBrandLabel = selectedBrands.length ? selectedBrands.map(displayBrandName).join("、") : "全部";
  const lanes = unique(scopedProducts.map(productRoadmapPeriod));
  const priceScale = roadmapPriceScale(scopedProducts);
  const chartHeight = Math.max(500, Math.min(780, priceScale.ticks.length * 72));
  return `
    <div class="roadmap-mode-note">单品牌时间 · ${escapeHtml(selectedBrandLabel)} · 横轴为半年度周期，纵轴按 ${priceScale.step} 元价格档位。</div>
    <div class="roadmap-chart" style="--roadmap-lanes: ${Math.max(lanes.length, 1)}; --roadmap-height: ${chartHeight}px">
      <div class="roadmap-axis" aria-hidden="true">${roadmapAxis(priceScale)}</div>
      <div class="roadmap-lanes">
        ${lanes
          .map((period) => {
            const laneProducts = scopedProducts.filter((product) => productRoadmapPeriod(product) === period);
            const laneBrands = unique(laneProducts.map((product) => product.brand));
            return `<section class="roadmap-lane" style="--period-width: ${Math.max(laneBrands.length, 1) * 220 + 28}px">
              <h3>${escapeHtml(period)}</h3>
              ${laneProducts
                .map((product, index) => roadmapCard(product, priceScale, index, Math.max(0, laneBrands.indexOf(product.brand))))
                .join("")}
            </section>`;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderRoadmapBrandCompare(products) {
  const lanes = unique(products.map((product) => product.brand));
  const priceScale = roadmapPriceScale(products);
  const chartHeight = Math.max(500, Math.min(780, priceScale.ticks.length * 72));
  return `
    <div class="roadmap-mode-note">品牌对比 · 横轴为所选品牌，纵轴按 ${priceScale.step} 元价格档位。</div>
    <div class="roadmap-chart" style="--roadmap-lanes: ${Math.max(lanes.length, 1)}; --roadmap-height: ${chartHeight}px">
      <div class="roadmap-axis" aria-hidden="true">${roadmapAxis(priceScale)}</div>
      <div class="roadmap-lanes">
        ${lanes
          .map((brand) => {
            const laneProducts = products
              .filter((product) => product.brand === brand)
              .sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
            return `<section class="roadmap-lane roadmap-brand-lane" style="${roadmapBrandStyle(brand)}">
              <h3><span class="brand-dot" aria-hidden="true"></span>${escapeHtml(displayBrandName(brand))}</h3>
              ${laneProducts.map((product, index) => roadmapCard(product, priceScale, index)).join("")}
            </section>`;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderRoadmap() {
  renderRoadmapBrandFilter();
  const roadmapProducts = getRoadmapProducts();
  if (!roadmapProducts.length) {
    els.roadmapBoard.innerHTML = `<div class="review-empty">当前条件下没有路标产品。</div>`;
    return;
  }
  const mode = state.roadmapMode || "single";
  els.roadmapBoard.innerHTML = mode === "compare"
    ? renderRoadmapBrandCompare(roadmapProducts)
    : renderRoadmapTimeline(roadmapProducts);
}

function renderWorkspaceShell(filteredProducts) {
  const active = state.activeWorkspace || "products";
  const inAnalysisWorkspace = ["products", "compare"].includes(active);
  document.querySelector(".app-shell")?.classList.toggle("is-sidebar-collapsed", Boolean(state.sidebarCollapsed));
  if (els.sidebarToggle) {
    const label = state.sidebarCollapsed ? "展开一级栏" : "折叠一级栏";
    els.sidebarToggle.setAttribute("aria-expanded", String(!state.sidebarCollapsed));
    els.sidebarToggle.setAttribute("aria-label", label);
    els.sidebarToggle.setAttribute("title", label);
  }
  document.querySelectorAll("[data-workspace-page]").forEach((page) => {
    const isActive = page.dataset.workspacePage === active;
    page.classList.toggle("is-active", isActive);
    page.hidden = !isActive;
    page.setAttribute("aria-hidden", String(!isActive));
  });
  document.querySelectorAll("[data-workspace]").forEach((button) => {
    const isActive = button.dataset.workspace === active || (button.dataset.workspace === "products" && inAnalysisWorkspace);
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });
  document.querySelectorAll("[data-analysis-tabs]").forEach((node) => {
    node.hidden = !inAnalysisWorkspace;
    node.setAttribute("aria-hidden", String(!inAnalysisWorkspace));
  });
  document.querySelectorAll("[data-analysis-tab]").forEach((button) => {
    const isActive = button.dataset.analysisTab === active;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  if (els.navProductsCount) els.navProductsCount.textContent = filteredProducts.length;
  if (els.navReviewCount) els.navReviewCount.textContent = getReviewProducts().length;
  if (els.navQualityCount) els.navQualityCount.textContent = productQualityIssues().length;
  if (els.navCompareCount) els.navCompareCount.textContent = selectedCompareProducts().length;
  if (els.navRoadmapCount) els.navRoadmapCount.textContent = getRoadmapProducts().length;
}

function renderAll() {
  const filteredProducts = getVisibleProducts();
  renderFilters();
  renderFilterSummary(filteredProducts);
  renderMetrics(filteredProducts);
  renderQualityPanel();
  renderReviewQueue();
  renderReviewDetail();
  renderProductTable(filteredProducts);
  renderColumnsPopover();
  renderDetail();
  renderCompare();
  renderModules();
  renderRoadmap();
  renderAuditLog();
  renderWorkspaceShell(filteredProducts);
  saveState();
}

function confirmProduct(productId, detailPrefix = "人工确认") {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  const beforeConfidence = Number(product.confidence || 0);
  const fieldCount = confirmAllFieldReviews(product);
  product.reviewRequired = false;
  product.confidence = Math.max(Number(product.confidence || 0), 85);
  addAudit(product, detailPrefix, `置信度 ${beforeConfidence}% -> ${product.confidence}%${fieldCount ? `，同步确认字段 ${fieldCount} 个` : ""}`);
  addAnalysisRun(product, {
    type: "manual_review",
    model: "人工复核",
    status: "confirmed",
    confidence: product.confidence,
    source: product.sourceUrl || "人工录入",
  });
  renderAll();
}

function confirmReviewProductList(products, detailPrefix) {
  products.forEach((product) => {
    const beforeConfidence = Number(product.confidence || 0);
    const fieldCount = confirmAllFieldReviews(product, detailPrefix === "批量确认" ? "batch" : "manual");
    product.reviewRequired = false;
    product.confidence = Math.max(beforeConfidence, 85);
    addAudit(product, detailPrefix, `置信度 ${beforeConfidence}% -> ${product.confidence}%${fieldCount ? `，同步确认字段 ${fieldCount} 个` : ""}`);
    addAnalysisRun(product, {
      type: detailPrefix === "批量确认" ? "batch_manual_review" : "manual_review",
      model: "人工复核",
      status: "confirmed",
      confidence: product.confidence,
      source: product.sourceUrl || "人工录入",
    });
  });
}

function confirmAllReviews() {
  const products = getReviewProducts();
  if (!products.length) return;
  const confirmed = window.confirm(`确认 ${products.length} 个待复核产品？`);
  if (!confirmed) return;
  confirmReviewProductList(products, "批量确认");
  selectedReviewIds.clear();
  renderAll();
}

function selectedReviewProducts() {
  const selected = new Set(selectedReviewIds);
  return getReviewProducts().filter((product) => selected.has(product.id));
}

function toggleAllReviews() {
  const products = getReviewProducts();
  if (!products.length) return;
  if (selectedReviewIds.size === products.length) selectedReviewIds.clear();
  else selectedReviewIds = new Set(products.map((product) => product.id));
  renderReviewQueue();
}

function confirmSelectedReviews() {
  const products = selectedReviewProducts();
  if (!products.length) return;
  const confirmed = window.confirm(`确认所选 ${products.length} 个待复核产品？`);
  if (!confirmed) return;
  confirmReviewProductList(products, "批量确认");
  selectedReviewIds.clear();
  renderAll();
}

function deleteProducts(productIds) {
  const ids = new Set(productIds);
  state.products = state.products.filter((item) => !ids.has(item.id));
  state.compareIds = state.compareIds.filter((id) => !ids.has(id));
  selectedReviewIds = new Set([...selectedReviewIds].filter((id) => !ids.has(id)));
  if (ids.has(state.selectedProductId)) {
    state.selectedProductId = state.products[0]?.id || "";
  }
}

function deleteSelectedReviews() {
  const products = selectedReviewProducts();
  if (!products.length) return;
  const confirmed = window.confirm(`删除所选 ${products.length} 个待确认产品？此操作会从当前工作台移除这些产品。`);
  if (!confirmed) return;
  deleteProducts(products.map((product) => product.id));
  renderAll();
}

function reviewBlockingFields(product) {
  return productCatalogBlockers(product).filter((item) => !/^AI 结果待确认$/.test(item) && !/^置信度\s+\d+%$/.test(item));
}

function confirmReviewFormProduct(product) {
  const blockers = reviewBlockingFields(product);
  if (blockers.length) {
    window.alert(`还有关键信息不能入库：${blockers.join("、")}。请补齐后再确认。`);
    renderAll();
    return;
  }
  confirmProduct(product.id, "表单确认入库");
}

function focusReviewProduct(productId) {
  state.selectedProductId = productId;
  state.editingProductId = "";
  state.activeWorkspace = "products";
  renderAll();
}

function editReviewProduct(productId) {
  state.selectedProductId = productId;
  state.editingProductId = productId;
  state.activeWorkspace = "import";
  highlightedReviewProductId = productId;
  renderAll();
  scrollToReviewProduct(productId);
}

function setActiveWorkspace(workspace) {
  const allowedWorkspaces = new Set(["products", "import", "quality", "compare", "roadmap", "system"]);
  if (workspace === "review") workspace = "import";
  if (!allowedWorkspaces.has(workspace)) return;
  state.activeWorkspace = workspace;
  if (workspace === "import") els.importPanel.classList.add("is-open");
  renderAll();
  document.querySelector(".main-area")?.scrollTo({ top: 0, behavior: "smooth" });
}

window.setActiveWorkspace = setActiveWorkspace;

function toggleSidebar() {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  queuePersist();
  renderAll();
}

window.toggleSidebar = toggleSidebar;

function scrollToWorkspace(targetId) {
  const targetMap = {
    productsWorkspace: "products",
    importPanel: "import",
    reviewTitle: "import",
    systemTitle: "system",
    qualityTitle: "quality",
    compareWorkspace: "compare",
    roadmapPanel: "roadmap",
  };
  setActiveWorkspace(targetMap[targetId] || targetId);
}

function deleteProduct(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  const confirmed = window.confirm(`删除 ${product.model}？此操作会从当前工作台移除该产品。`);
  if (!confirmed) return;
  deleteProducts([productId]);
  renderAll();
}

function blankProduct() {
  return {
    id: `p-${Date.now()}`,
    brand: "待确认品牌",
    name: "新产品",
    model: `NEW-${state.products.length + 1}`,
    category: "扫地机",
    price: 0,
    channel: "人工录入",
    status: "待确认",
    image: "assets/robot-vacuum.svg",
    confidence: 0,
    reviewRequired: true,
    sourceUrl: "",
    quarter: "未规划",
    features: Object.fromEntries(allFields().map((field) => [field.key, defaultFeatureValue(field)])),
    sellingPoints: [
      { title: "待确认卖点", evidence: "人工录入，待补充证据" },
      { title: "待确认卖点", evidence: "人工录入，待补充证据" },
      { title: "待确认卖点", evidence: "人工录入，待补充证据" },
    ],
  };
}

function createProduct() {
  const product = blankProduct();
  addPriceSnapshot(product, {
    price: product.price,
    channel: product.channel,
    source: "人工录入",
    note: "手动新增初始价格",
  });
  addAudit(product, "手动新增", "研究人员创建空白产品并进入编辑");
  addAnalysisRun(product, {
    type: "manual_create",
    model: "人工录入",
    status: "review_required",
    confidence: product.confidence,
    source: "人工录入",
  });
  state.products.unshift(product);
  state.selectedProductId = product.id;
  state.editingProductId = product.id;
  state.activeWorkspace = "import";
  highlightedReviewProductId = product.id;
  renderAll();
  scrollToReviewProduct(product.id);
}

function startEditProduct(productId) {
  state.editingProductId = productId;
  renderAll();
  document.querySelector(".detail-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelEditProduct() {
  state.editingProductId = "";
  renderAll();
}

function saveProductForm(form, options = {}) {
  const product = state.products.find((item) => item.id === form.dataset.editProduct);
  if (!product) return;
  const shouldRender = options.render !== false;
  const before = {
    model: product.model,
    price: product.price,
    confidence: product.confidence,
    reviewRequired: product.reviewRequired,
  };
  const data = new FormData(form);
  const category = String(data.get("category") || product.category);
  product.brand = String(data.get("brand") || "").trim() || "待确认品牌";
  product.name = String(data.get("name") || "").trim() || product.model;
  product.model = String(data.get("model") || "").trim() || product.model;
  product.category = category;
  product.price = Number(data.get("price") || 0);
  product.channel = String(data.get("channel") || "").trim() || "人工录入";
  product.status = String(data.get("status") || "").trim() || "待确认";
  product.quarter = normalizeQuarterInput(data.get("quarter"));
  product.confidence = Math.min(100, Math.max(0, Number(data.get("confidence") || 0)));
  product.image = String(data.get("image") || "").trim() || getCategoryImage(category);
  product.sourceUrl = String(data.get("sourceUrl") || "").trim();
  product.reviewRequired = product.confidence < 80;
  product.sellingPoints = textToSellingPoints(String(data.get("sellingPoints") || ""));

  product.features = product.features || {};
  form.querySelectorAll("[data-feature-field]").forEach((input) => {
    const key = input.dataset.featureField;
    if (input.dataset.featureType === "boolean") {
      product.features[key] =
        input.value === "true" ? true : input.value === "false" ? false : null;
    } else {
      product.features[key] = input.value.trim() || "待确认";
    }
  });

  const changes = [];
  if (before.model !== product.model) changes.push(`型号 ${before.model} -> ${product.model}`);
  if (Number(before.price) !== Number(product.price)) changes.push(`价格 ${before.price} -> ${product.price}`);
  if (Number(before.confidence) !== Number(product.confidence)) changes.push(`置信度 ${before.confidence}% -> ${product.confidence}%`);
  if (before.reviewRequired !== product.reviewRequired) changes.push(product.reviewRequired ? "转为待确认" : "转为已确认");
  if (Number(before.price) !== Number(product.price)) {
    addPriceSnapshot(product, {
      price: product.price,
      channel: product.channel,
      source: product.sourceUrl || "人工编辑",
      note: `人工编辑价格：${before.price} -> ${product.price}`,
    });
  }
  addAudit(product, "编辑产品", changes.join("；") || "更新产品资料");
  addAnalysisRun(product, {
    type: "manual_edit",
    model: "人工编辑",
    status: product.reviewRequired ? "review_required" : "confirmed",
    confidence: product.confidence,
    source: product.sourceUrl || "人工录入",
  });
  state.editingProductId = "";
  if (shouldRender) renderAll();
  return product;
}

function updateFilter(key, value) {
  state.filters[key] = value;
  renderAll();
}

function workspaceViewPayload(name) {
  return {
    schemaVersion: 2,
    name,
    filters: structuredClone(state.filters),
    visibleColumns: structuredClone(state.visibleColumns),
    productSort: structuredClone(state.productSort || defaultState.productSort),
    compareIds: state.compareIds.slice(),
    compareFieldKeys: selectedCompareFieldKeys(),
    selectedProductId: state.selectedProductId,
    roadmapBrand: state.roadmapBrand || "全部",
    roadmapCategory: state.roadmapCategory || "全部",
    roadmapStatus: state.roadmapStatus || "全部",
    roadmapQuarter: state.roadmapQuarter || "全部",
    roadmapMode: state.roadmapMode || "single",
    savedAt: nowIso(),
  };
}

function applyWorkspaceView(view) {
  if (!view) return;
  state.filters = { ...defaultState.filters, ...(view.filters || {}) };
  if (view.visibleColumns) {
    state.visibleColumns = { ...defaultState.visibleColumns, ...view.visibleColumns };
  }
  if (view.productSort?.key && columns.some((column) => column.key === view.productSort.key)) {
    state.productSort = {
      key: view.productSort.key,
      direction: view.productSort.direction === "asc" ? "asc" : "desc",
    };
  }
  if (Array.isArray(view.compareIds)) {
    const productIds = new Set(state.products.map((product) => product.id));
    state.compareIds = view.compareIds.filter((id) => productIds.has(id));
  }
  if (Array.isArray(view.compareFieldKeys)) {
    const availableKeys = new Set(allCompareFields().map((field) => field.key));
    state.compareFieldKeys = view.compareFieldKeys.filter((key) => availableKeys.has(key));
  }
  if (view.selectedProductId && state.products.some((product) => product.id === view.selectedProductId)) {
    state.selectedProductId = view.selectedProductId;
  }
  if (view.roadmapBrand) {
    state.roadmapBrand = view.roadmapBrand;
  }
  if (view.roadmapCategory) {
    state.roadmapCategory = view.roadmapCategory;
  }
  if (view.roadmapStatus) {
    state.roadmapStatus = view.roadmapStatus;
  }
  if (view.roadmapQuarter) {
    state.roadmapQuarter = view.roadmapQuarter;
  }
  if (view.roadmapMode) {
    state.roadmapMode = view.roadmapMode;
  }
}

function saveCurrentView() {
  const defaultName = `视图 ${savedViews.length + 1}`;
  const name = els.savedViewName.value.trim() || window.prompt("输入保存视图名称：", defaultName)?.trim() || defaultName;
  const existingIndex = savedViews.findIndex((view) => view.name === name);
  const nextView = workspaceViewPayload(name);
  if (existingIndex >= 0) {
    savedViews[existingIndex] = nextView;
    selectedSavedViewIndex = String(existingIndex);
  } else {
    savedViews.push(nextView);
    selectedSavedViewIndex = String(savedViews.length - 1);
  }
  saveViews();
  renderAll();
}

function deleteSavedView() {
  const index = Number(els.savedViews.value);
  const view = savedViews[index];
  if (!view) return;
  const confirmed = window.confirm(`删除保存视图「${view.name}」？当前筛选和产品数据不会被删除。`);
  if (!confirmed) return;
  savedViews.splice(index, 1);
  selectedSavedViewIndex = "";
  els.savedViewName.value = "";
  saveViews();
  renderAll();
}

function analysisFeatureFields() {
  return allFields().map((field) => ({
    key: field.key,
    module: field.module,
    name: field.name,
    type: field.type,
    options: field.type === "enum" ? enumOptions(field) : [],
  }));
}

function analysisExamples(categoryHint = "") {
  const fields = allFields().slice(0, 12);
  return state.products
    .filter((product) => !product.reviewRequired && Number(product.confidence || 0) >= 80)
    .sort((a, b) => {
      const categoryScore = Number(b.category === categoryHint) - Number(a.category === categoryHint);
      if (categoryScore) return categoryScore;
      return Number(b.confidence || 0) - Number(a.confidence || 0);
    })
    .slice(0, 3)
    .map((product) => ({
      brand: product.brand,
      model: product.model,
      category: product.category,
      price: product.price,
      features: Object.fromEntries(fields.map((field) => [field.key, formatBool(product.features?.[field.key])])),
      topSellingPoints: (product.sellingPoints || []).slice(0, 3).map((point) => point.title),
    }));
}

function normalizeCustomFeatureValue(field, value) {
  if (value === undefined || value === null || value === "") {
    return field?.type === "boolean" ? null : "待确认";
  }
  if (field?.type === "boolean") return Boolean(value);
  if (field?.type === "number" || field?.type === "price") return String(value).replace(/[^\d.]/g, "") || "待确认";
  if (field?.type === "enum") {
    const normalized = String(value).trim();
    if (!normalized || normalized === "待确认") return "待确认";
    const options = enumOptions(field, normalized);
    return options.includes(normalized) ? normalized : normalized;
  }
  return String(value);
}

function mergeCustomFeatures(baseFeatures, customFeatures = []) {
  const nextFeatures = { ...(baseFeatures || {}) };
  const fieldsByKey = new Map(allFields().map((field) => [field.key, field]));
  for (const item of customFeatures || []) {
    const field = fieldsByKey.get(item.key);
    if (!field) continue;
    nextFeatures[item.key] = normalizeCustomFeatureValue(field, item.value);
  }
  return nextFeatures;
}

function productImageFromAnalysis(result, category) {
  const imageMap = {
    扫地机: "assets/robot-vacuum.svg",
    洗地机: "assets/floor-washer.svg",
    吸尘器: "assets/stick-vacuum.svg",
  };
  const metadata = {
    ...(sourceMetadata || {}),
    ...(result.sourceMetadata || {}),
  };
  const remoteImage = [
    String(result.image || "").trim(),
    String(metadata.image || "").trim(),
    String(metadata.imageCandidates?.[0] || "").trim(),
  ].find((url) => url && !isFallbackProductImage(url));
  return remoteImage || imageMap[category] || "assets/robot-vacuum.svg";
}

function persistableSourceMetadata(metadata = {}) {
  const { sourceScreenshotDataUrls, ...rest } = metadata || {};
  return rest;
}

function isGenericProductName(name, category) {
  const text = String(name || "").trim();
  if (!text) return true;
  if (/^(新产品|待确认产品|产品名称待确认|AI 待确认产品)$/.test(text)) return true;
  if (/^(滚筒)?(洗地|扫地|吸尘).*(机器人|机)$/.test(text)) return true;
  return category && text === category;
}

function normalizedAnalysisProductName(result, brand, model, category) {
  const name = String(result.name || "").trim();
  const title = [String(brand || "").trim(), String(model || "").trim()].filter(Boolean).join(" ");
  return isGenericProductName(name, category) && title ? title : name || title || model || "待确认产品";
}

function productFromAnalysis(result, analysisMeta = {}) {
  const fallbackCategory = result.category || "扫地机";
  const brand = result.brand || "待确认品牌";
  const model = result.model || "待确认型号";
  const product = {
    id: `p-${Date.now()}`,
    brand,
    name: normalizedAnalysisProductName(result, brand, model, fallbackCategory),
    model,
    category: fallbackCategory,
    price: Number(result.price || 0),
    channel: result.channel || "官网",
    status: result.status || "待确认",
    image: productImageFromAnalysis(result, fallbackCategory),
    confidence: Number(result.confidence || 55),
    reviewRequired: Number(result.confidence || 55) < 80 || result.reviewRequired !== false,
    sourceUrl: result.sourceUrl || els.sourceUrl.value.trim(),
    sourceMetadata: {
      ...persistableSourceMetadata(sourceMetadata || {}),
      ...persistableSourceMetadata(result.sourceMetadata || {}),
      customFeatureEvidence: result.customFeatures || [],
    },
    quarter: normalizeQuarterInput(result.quarter),
    features: mergeCustomFeatures(result.features || {}, result.customFeatures || []),
    sellingPoints: (result.sellingPoints || []).slice(0, 3),
  };
  addPriceSnapshot(product, {
    price: product.price,
    channel: product.channel,
    source: product.sourceUrl || "AI 解析",
    note: "AI 解析入库价格",
  });
  addAnalysisRun(product, {
    type: "ai_extraction",
    model: analysisMeta.model || "gpt-5.4-mini",
    status: product.reviewRequired ? "review_required" : "confirmed",
    confidence: product.confidence,
    source: product.sourceMetadata?.title || product.sourceUrl || "上传资料",
    usage: analysisMeta.usage || null,
    responseId: analysisMeta.responseId || "",
  });
  addAudit(
    product,
    "AI 解析入库",
    `从详情页资料抽取 ${product.model}，置信度 ${product.confidence}%${result.customFeatures?.length ? `，自定义字段 ${result.customFeatures.length} 个` : ""}${product.sourceMetadata?.title ? `，来源标题：${product.sourceMetadata.title}` : ""}`,
    "ai",
  );
  return product;
}

function duplicateProductKey(product) {
  const brand = String(product?.brand || "").trim();
  const model = String(product?.model || "").trim();
  if (!brand || !model || brand.includes("待确认") || model.includes("待确认")) return "";
  return `${brand}::${model}`.toLowerCase().replace(/\s+/g, "");
}

function findDuplicateProduct(candidate, products = state.products) {
  const candidateKey = duplicateProductKey(candidate);
  if (!candidateKey) return null;
  return (
    products.find((product) => product.id !== candidate.id && duplicateProductKey(product) === candidateKey) ||
    null
  );
}

function mergeAnalyzedProduct(existing, incoming) {
  const previousConfidence = Number(existing.confidence || 0);
  const previousPrice = Number(existing.price || 0);
  const previousImage = String(existing.image || "");
  const previousId = existing.id;
  Object.assign(existing, {
    ...incoming,
    id: previousId,
    image: previousImage && String(incoming.image || "").startsWith("assets/") ? previousImage : incoming.image || previousImage,
    priceSnapshots: [...(incoming.priceSnapshots || []), ...(existing.priceSnapshots || [])],
    analysisRuns: [...(incoming.analysisRuns || []), ...(existing.analysisRuns || [])],
    auditLog: [...(incoming.auditLog || []), ...(existing.auditLog || [])],
  });
  if (Number(previousPrice) !== Number(existing.price)) {
    addPriceSnapshot(existing, {
      price: existing.price,
      channel: existing.channel,
      source: existing.sourceUrl || "AI 解析",
      note: `AI 更新价格：${previousPrice} -> ${existing.price}`,
    });
  }
  addAudit(existing, "AI 更新入库", `按品牌+型号匹配更新，置信度 ${previousConfidence}% -> ${existing.confidence}%`, "ai");
  return existing;
}

function integrateAnalyzedProduct(product) {
  const duplicate = findDuplicateProduct(product);
  if (!duplicate) {
    state.products.unshift(product);
    return { product, merged: false };
  }
  const shouldMerge = window.confirm(
    `发现同品牌同型号产品：${duplicate.brand} ${duplicate.model}。\n确定更新已有产品并保留分析、审计和价格历史？\n取消则作为新产品加入。`,
  );
  if (!shouldMerge) {
    addAudit(product, "AI 解析入库", "用户选择保留同品牌同型号的新记录，未合并到已有产品。", "ai");
    state.products.unshift(product);
    return { product, merged: false };
  }
  return { product: mergeAnalyzedProduct(duplicate, product), merged: true };
}

async function fileToAnalysisAttachment(file) {
  if (!file) return "";
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!isImage && !isPdf) {
    throw new Error("仅支持图片或 PDF 详情页文件。");
  }
  if (file.size > MAX_ANALYSIS_FILE_BYTES) {
    throw new Error("上传文件不能超过 100MB。");
  }
  if (isImage) {
    return {
      filename: file.name || "detail-image",
      mimeType: file.type || "image/png",
      size: file.size,
      kind: "image",
      objectUrl: URL.createObjectURL(file),
    };
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        filename: file.name || "detail.pdf",
        mimeType: "application/pdf",
        size: file.size,
        kind: "pdf",
        dataUrl: reader.result,
      });
    reader.onerror = () => reject(new Error(`浏览器读取文件失败：${file.name || "未命名文件"}。请确认文件未损坏，或重新截图后上传。`));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "0B";
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(value >= 10 * 1024 * 1024 ? 0 : 1)}MB`;
  return `${Math.max(1, Math.round(value / 1024))}KB`;
}

function normalizeErrorMessage(error, fallback = "操作失败，请稍后重试。") {
  if (error?.message) return error.message;
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error?.target?.error?.message) return error.target.error.message;
  if (error?.type) return `${fallback}（${error.type}）`;
  return fallback;
}

function friendlyAnalysisError(error, fallback = "未能完成分析，请检查文件格式、大小或网络后重试。") {
  const rawMessage = normalizeErrorMessage(error, fallback)
    .replace(/^已使用人工复核兜底结果：/, "")
    .trim();
  const lower = rawMessage.toLowerCase();
  if (!rawMessage) return fallback;
  if (
    /invalidparameter|image length|image size|image.*too large|maximum allowed|payload too large|413/.test(lower) ||
    /图片.*(过大|超出|限制)|单张图片限制|切片仍然过大/.test(rawMessage)
  ) {
    return "图片已进入分析，但模型拒绝处理当前尺寸或长度。请改为上传关键参数/卖点区域截图，或把长图拆成多张截图后重试。";
  }
  if (/fetch failed|networkerror|failed to fetch|econnreset|etimedout|enotfound|econnrefused|eprem|eperm/.test(lower)) {
    return "模型接口或本机网络暂时不可用。请先点击“重新分析”；如果仍失败，请检查代理、API Key，或上传截图后进入人工复核。";
  }
  if (/invalid json|not valid json|unexpected token|json/.test(lower)) {
    return "模型返回格式不完整，系统已保留待人工复核记录。请补充品牌、型号、价格和关键参数后重试。";
  }
  if (/qwen-vl|deepseek|openai/.test(lower)) {
    return "模型服务返回异常，系统已进入人工复核兜底。请点击“重新分析”，或补充品牌、型号、价格和关键参数后再试。";
  }
  return rawMessage.length > 160 ? `${rawMessage.slice(0, 160)}...` : rawMessage;
}

function imageDataUrlSize(dataUrl) {
  return Math.ceil((String(dataUrl).split(",")[1]?.length || 0) * 0.75);
}

function compressedCanvasDataUrl(canvas) {
  const qualities = [0.76, 0.64, 0.52, 0.42, 0.34, 0.28];
  for (const quality of qualities) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= MAX_ANALYSIS_IMAGE_DATA_URL_CHARS) return dataUrl;
  }
  return "";
}

function drawCompressedSlice({ image, sourceY, sourceHeight }) {
  const widthCandidates = [MAX_ANALYSIS_IMAGE_WIDTH, 1200, 1000, 800, 640, 520, 420, 360, 320];
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  for (const widthLimit of widthCandidates) {
    const scale = Math.min(1, widthLimit / Math.max(1, image.width));
    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, sourceY, image.width, sourceHeight, 0, 0, targetWidth, targetHeight);
    const dataUrl = compressedCanvasDataUrl(canvas);
    if (dataUrl) return { dataUrl, targetWidth, targetHeight };
  }
  return null;
}

function assertImageDataUrlWithinModelLimit(attachment) {
  if (String(attachment.dataUrl || "").length <= MAX_ANALYSIS_IMAGE_DATA_URL_CHARS) return;
  throw new Error(
    `${attachment.filename || "详情页图片"} 压缩后仍超过 AI 接口单张图片限制。请改为上传关键参数/卖点区域截图。`,
  );
}

function loadImageElement(sourceUrl, filename = "详情页图片") {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(
        new Error(
          `浏览器无法解析图片：${filename}。如果是 HEIC、AVIF、超大长图或从 App 保存的特殊格式，请先转成 JPG/PNG/WebP，或直接上传截图。`,
        ),
      );
    image.src = sourceUrl;
  });
}

async function sliceLongImageAttachment(attachment) {
  if (attachment.kind !== "image") return [attachment];
  const imageSource = attachment.objectUrl || attachment.dataUrl;
  const image = await loadImageElement(imageSource, attachment.filename);
  const scale = Math.min(1, MAX_ANALYSIS_IMAGE_WIDTH / Math.max(1, image.width));
  const initialSliceHeight = Math.max(1, Math.floor(MAX_ANALYSIS_IMAGE_SLICE_HEIGHT / Math.max(scale, 0.01)));
  const slices = [];

  function pushAdaptiveSlice(sourceY, sourceHeight, depth = 0) {
    const compressed = drawCompressedSlice({ image, sourceY, sourceHeight });
    if (!compressed && sourceHeight > MIN_ANALYSIS_IMAGE_SLICE_SOURCE_HEIGHT && depth < 12) {
      const firstHeight = Math.ceil(sourceHeight / 2);
      pushAdaptiveSlice(sourceY, firstHeight, depth + 1);
      pushAdaptiveSlice(sourceY + firstHeight, sourceHeight - firstHeight, depth + 1);
      return;
    }
    if (!compressed) {
      throw new Error(
        `${attachment.filename || "详情页图片"} 的局部区域压缩后仍超过 AI 接口限制，请截取更小的关键参数/卖点区域上传。`,
      );
    }
    slices.push({
      ...attachment,
      filename: attachment.filename,
      mimeType: "image/jpeg",
      size: imageDataUrlSize(compressed.dataUrl),
      dataUrl: compressed.dataUrl,
      slicedFrom: attachment.filename,
      sourceY,
      sourceHeight,
      originalSize: attachment.size,
      originalMimeType: attachment.mimeType,
      compressedWidth: compressed.targetWidth,
      compressedHeight: compressed.targetHeight,
    });
  }

  for (let sourceY = 0; sourceY < image.height; sourceY += initialSliceHeight) {
    const sourceHeight = Math.min(initialSliceHeight, image.height - sourceY);
    pushAdaptiveSlice(sourceY, sourceHeight);
  }

  const selectedSlices = selectAnalysisImageSlices(slices);
  const total = slices.length;
  return selectedSlices.map((slice, index) => ({
    ...slice,
    filename:
      total > 1
        ? `${attachment.filename}-part-${index + 1}${total > selectedSlices.length ? `-of-${total}-selected` : ""}`
        : attachment.filename,
    originalSliceCount: total,
    selectedSliceCount: selectedSlices.length,
  }));
}

function selectAnalysisImageSlices(slices) {
  if (slices.length <= MAX_ANALYSIS_IMAGE_COUNT) return slices;
  const selectedIndexes = new Set();
  const addRange = (startRatio, endRatio, count) => {
    const start = Math.max(0, Math.floor((slices.length - 1) * startRatio));
    const end = Math.min(slices.length - 1, Math.ceil((slices.length - 1) * endRatio));
    if (count <= 1 || start === end) {
      selectedIndexes.add(start);
      return;
    }
    for (let index = 0; index < count; index += 1) {
      selectedIndexes.add(Math.round(start + ((end - start) * index) / (count - 1)));
    }
  };
  addRange(0, 0.18, 8);
  addRange(0.18, 0.72, 16);
  addRange(0.72, 1, 8);
  for (let index = 0; selectedIndexes.size < MAX_ANALYSIS_IMAGE_COUNT && index < slices.length; index += 1) {
    selectedIndexes.add(index);
  }
  return [...selectedIndexes]
    .sort((a, b) => a - b)
    .slice(0, MAX_ANALYSIS_IMAGE_COUNT)
    .map((index) => slices[index]);
}

async function filesToAnalysisAttachments(files, onProgress = () => {}) {
  const attachments = [];
  const uploadFiles = Array.from(files || []);
  for (const [index, file] of uploadFiles.entries()) {
    onProgress(`正在读取上传文件 ${index + 1}/${uploadFiles.length}：${file.name || "未命名文件"}（${formatBytes(file.size)}）...`);
    const attachment = await fileToAnalysisAttachment(file);
    if (!attachment) continue;
    if (attachment.kind === "image") {
      onProgress(`正在检查长图并切片：${attachment.filename}...`);
      try {
        const slices = await sliceLongImageAttachment(attachment);
        slices.forEach(assertImageDataUrlWithinModelLimit);
        if (slices.length > 1) {
          const originalSliceCount = slices[0]?.originalSliceCount || slices.length;
          const selectedText =
            originalSliceCount > slices.length ? `，已选取 ${slices.length} 张关键切片` : "";
          onProgress(`长图已自动压缩并切成 ${originalSliceCount} 张${selectedText}，正在准备上传分析...`);
        }
        attachments.push(...slices);
      } catch (error) {
        if (String(error?.message || "").includes("超过 AI 接口单张图片限制") || String(error?.message || "").includes("图片切片仍然过大")) {
          throw error;
        }
        throw new Error(
          `${attachment.filename || "详情页图片"} 自动切片失败。请刷新页面后重试，或上传关键参数/卖点区域截图。原始错误：${normalizeErrorMessage(error)}`,
        );
      } finally {
        if (attachment.objectUrl) URL.revokeObjectURL(attachment.objectUrl);
      }
    } else {
      attachments.push(attachment);
    }
  }
  const pdfAttachments = attachments.filter((attachment) => attachment.kind === "pdf");
  if (pdfAttachments.length > 1) throw new Error("一次分析最多上传 1 个 PDF。");
  const imageAttachments = attachments.filter((attachment) => attachment.kind === "image").slice(0, MAX_ANALYSIS_IMAGE_COUNT);
  return [...imageAttachments, ...pdfAttachments];
}

async function runAnalysis() {
  const sourceUrl = els.sourceUrl.value.trim();
  const notes = els.sourceNotes.value.trim();
  const files = Array.from(els.sourceImage.files || []);
  if (!sourceUrl && !files.length && !notes) {
    setAnalysisStatus("请先输入 URL、上传详情页图片或填写说明。", "error");
    resetAnalysisSteps();
    setAnalysisStep("input", "error");
    showRetryAnalysis(false);
    return;
  }
  if (sourceUrl && !sourceMetadata && !hasManualAnalysisEvidence(files, notes)) {
    await fetchSourceMetadata();
    return;
  }
  if (sourceUrl && sourceMetadata && !hasManualAnalysisEvidence(files, notes) && !hasMeaningfulSourceEvidence(sourceMetadata)) {
    setAnalysisStatus(`${insufficientSourceMessage(sourceMetadata)} 正在打开浏览器获取真实详情页...`, "warning");
    resetAnalysisSteps();
    setAnalysisStep("input", "warning");
    showRetryAnalysis(false);
    await startBrowserFetch();
    return;
  }

  setAnalysisBusy(true);
  showRetryAnalysis(false);
  resetAnalysisSteps();
  setAnalysisStep("input", "done");
  setAnalysisStatus(files.length ? "正在准备上传文件..." : "正在自动获取详情页图片和文字证据...", "progress");
  try {
    setAnalysisStep(files.length ? "files" : "request", "active");
    const attachments = await filesToAnalysisAttachments(files, (message) => setAnalysisStatus(message, "progress"));
    setAnalysisStep("files", files.length ? "done" : "idle");
    const imageAttachments = attachments.filter((attachment) => attachment.kind === "image");
    const pdfAttachment = attachments.find((attachment) => attachment.kind === "pdf");
    const uploadNote = attachments.length
      ? `\n上传文件：${attachments.map((attachment) => `${attachment.filename}（${attachment.mimeType}，${formatBytes(attachment.size)}）`).join("；")}`
      : "";
    if (attachments.length) {
      const imageText = imageAttachments.length ? `${imageAttachments.length} 张图片/切片` : "";
      const pdfText = pdfAttachment ? "1 个 PDF" : "";
      setAnalysisStatus(`文件准备完成：${[imageText, pdfText].filter(Boolean).join("，")}。正在上传并调用 AI 分析...`, "progress");
    } else {
      setAnalysisStatus("正在提交 URL，服务会自动下载详情页图片并调用 AI 分析...", "progress");
    }
    setAnalysisStep("request", "active");
    setAnalysisStatus("资料已准备完成，正在获取详情页图片并等待 AI 返回...", "progress");
    const response = await apiFetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceUrl,
        notes: `${notes}${uploadNote}`,
        imageDataUrl: imageAttachments[0]?.dataUrl || "",
        imageDataUrls: imageAttachments.map((attachment) => attachment.dataUrl),
        fileAttachment:
          pdfAttachment
            ? {
                filename: pdfAttachment.filename,
                mimeType: pdfAttachment.mimeType,
                size: pdfAttachment.size,
                fileDataUrl: pdfAttachment.dataUrl,
              }
            : null,
        featureFields: analysisFeatureFields(),
        analysisExamples: analysisExamples(sourceMetadata?.category || notes),
        sourceMetadata,
      }),
    });
    setAnalysisStep("request", "done");
    setAnalysisStep("ai", "active");
    setAnalysisStatus("服务已返回，正在整理分析结果...", "progress");
    let payload = {};
    try {
      payload = await response.json();
    } catch (error) {
      throw new Error(`服务返回内容不是有效 JSON：${normalizeErrorMessage(error, "无法读取服务响应")}`);
    }
    if (!response.ok && !payload.product) {
      throw new Error(payload.error || "分析失败");
    }
    setAnalysisStep("ai", payload.warning ? "warning" : "done");
    setAnalysisStep("integrate", "active");
    const product = productFromAnalysis(payload.product || payload, payload.analysisMeta || {});
    const integrated = integrateAnalyzedProduct(product);
    state.selectedProductId = integrated.product.id;
    const catalogReady = isCatalogProduct(integrated.product);
    if (catalogReady) {
      state.compareIds = unique([integrated.product.id, ...state.compareIds]);
      highlightedReviewProductId = "";
    } else {
      state.activeWorkspace = "import";
      highlightedReviewProductId = integrated.product.id;
    }
    if (catalogReady && !payload.warning) {
      els.importPanel.classList.remove("is-open");
      els.sourceUrl.value = "";
      els.sourceNotes.value = "";
      els.sourceImage.value = "";
      sourceMetadata = null;
      renderSourcePreview(null);
    }
    if (catalogReady) {
      renderAll();
    } else {
      focusPendingAnalysisResult(integrated.product);
    }
    const catalogMessage = integrated.merged ? "分析完成，已按品牌+型号更新已有产品。" : "分析完成，已加入产品库。";
    const reviewMessage = "分析完成，已进入待确认队列。请补全品牌、型号、价格等信息后确认。";
    const warningMessage = payload.warning
      ? `AI 未完全返回有效结果，${reviewMessage}原因：${friendlyAnalysisError(payload.warning)}`
      : "";
    setAnalysisStep("integrate", catalogReady && !warningMessage ? "done" : "warning");
    setAnalysisStatus(warningMessage || (catalogReady ? catalogMessage : reviewMessage), catalogReady && !warningMessage ? "success" : "warning");
    showRetryAnalysis(Boolean(warningMessage || !catalogReady));
    loadUsage();
  } catch (error) {
    setAnalysisStep("ai", "error");
    setAnalysisStep("integrate", "idle");
    setAnalysisStatus(`分析失败：${friendlyAnalysisError(error)}`, "error");
    showRetryAnalysis(true);
    loadUsage();
  } finally {
    setAnalysisBusy(false);
  }
}

function setAnalysisStatus(message, type) {
  els.analysisStatus.textContent = message;
  els.analysisStatus.classList.toggle("is-error", type === "error");
  els.analysisStatus.classList.toggle("is-success", type === "success");
  els.analysisStatus.classList.toggle("is-warning", type === "warning");
  els.analysisStatus.classList.toggle("is-progress", type === "progress");
}

function resetAnalysisSteps() {
  analysisStepState = Object.fromEntries(analysisSteps.map((step) => [step.key, "idle"]));
  renderAnalysisSteps();
}

function setAnalysisStep(key, status) {
  if (!analysisSteps.some((step) => step.key === key)) return;
  analysisStepState = { ...analysisStepState, [key]: status };
  renderAnalysisSteps();
}

function renderAnalysisSteps() {
  if (!els.analysisSteps) return;
  els.analysisSteps.innerHTML = analysisSteps
    .map((step) => {
      const status = analysisStepState[step.key] || "idle";
      return `<li class="analysis-step ${status === "idle" ? "" : `is-${escapeHtml(status)}`}">${escapeHtml(step.label)}</li>`;
    })
    .join("");
}

function showRetryAnalysis(show) {
  if (!els.retryAnalysis) return;
  els.retryAnalysis.hidden = !show;
}

function setBrowserFetchControls(isActive) {
  browserFetchSessionId = isActive ? browserFetchSessionId : "";
  if (els.collectBrowserFetch) els.collectBrowserFetch.hidden = !isActive;
  if (els.cancelBrowserFetch) els.cancelBrowserFetch.hidden = !isActive;
}

function setAnalysisBusy(isBusy) {
  const runButton = document.querySelector("#runAnalysis");
  const fetchButton = document.querySelector("#fetchSourceMetadata");
  if (runButton) {
    runButton.disabled = isBusy;
    runButton.textContent = isBusy ? "分析中..." : "开始分析";
  }
  if (fetchButton) fetchButton.disabled = isBusy;
  if (els.retryAnalysis) els.retryAnalysis.disabled = isBusy;
  if (els.startBrowserFetch) els.startBrowserFetch.disabled = isBusy;
  if (els.collectBrowserFetch) els.collectBrowserFetch.disabled = isBusy;
  if (els.cancelBrowserFetch) els.cancelBrowserFetch.disabled = isBusy;
}

function showSelectedAnalysisFiles() {
  const files = Array.from(els.sourceImage.files || []);
  if (!files.length) {
    setAnalysisStatus("AI 会输出结构化参数、Top3 卖点和置信度。", "");
    return;
  }
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const oversized = files.filter((file) => file.size > MAX_ANALYSIS_FILE_BYTES);
  if (oversized.length) {
    setAnalysisStatus(`已选择 ${files.length} 个文件，但 ${oversized[0].name} 超过 100MB，请压缩或拆分后再上传。`, "error");
    return;
  }
  const pdfCount = files.filter((file) => file.type === "application/pdf" || /\.pdf$/i.test(file.name)).length;
  if (pdfCount > 1) {
    setAnalysisStatus("一次分析最多上传 1 个 PDF，请只保留一个 PDF 或改传图片。", "error");
    return;
  }
  setAnalysisStatus(`已选择 ${files.length} 个文件，总大小 ${formatBytes(totalBytes)}。点击“开始分析”后会先读取文件，再上传分析。`, "success");
}

function renderSourceEvidence(metadata) {
  const priceCandidates = metadata.priceCandidates || [];
  const imageCandidates = metadata.imageCandidates || [];
  const textSnippets = metadata.textSnippets || [];
  const screenshotCount = Number(metadata.sourceScreenshotFetch?.count || metadata.sourceScreenshotDataUrls?.length || 0);
  if (!priceCandidates.length && imageCandidates.length <= 1 && !textSnippets.length && !screenshotCount) return "";
  return `
    <div class="source-evidence">
      ${
        screenshotCount
          ? `<div>
              <strong>浏览器截图</strong>
              <p>已截取 ${escapeHtml(screenshotCount)} 张详情页截图用于视觉识别。</p>
            </div>`
          : ""
      }
      ${
        priceCandidates.length
          ? `<div>
              <strong>价格候选</strong>
              <ul>${priceCandidates
                .slice(0, 4)
                .map((item) => `<li>${escapeHtml(item.currency || "CNY")} ${escapeHtml(item.price)} · ${escapeHtml(item.source || "unknown")}</li>`)
                .join("")}</ul>
            </div>`
          : ""
      }
      ${
        imageCandidates.length
          ? `<div>
              <strong>图片候选</strong>
              <div class="source-thumbs">${imageCandidates
                .slice(0, 4)
                .map((url) => `<img src="${escapeHtml(url)}" alt="详情页候选图片" loading="lazy" />`)
                .join("")}</div>
            </div>`
          : ""
      }
      ${
        textSnippets.length
          ? `<div class="source-snippets">
              <strong>文案证据</strong>
              <ul>${textSnippets
                .slice(0, 5)
                .map((snippet) => `<li>${escapeHtml(snippet)}</li>`)
                .join("")}</ul>
            </div>`
          : ""
      }
    </div>
  `;
}

function renderSourcePreview(metadata) {
  if (!metadata) {
    els.sourcePreview.classList.remove("is-visible");
    els.sourcePreview.innerHTML = "";
    return;
  }
  const image = metadata.image || getCategoryImage("扫地机");
  const fetchDetails = [
    metadata.platform ? `平台：${metadata.platform}` : "",
    metadata.httpStatus ? `HTTP ${metadata.httpStatus}` : "",
    metadata.fetchMode ? `抓取模式：${metadata.fetchMode}` : "",
    metadata.finalUrl && metadata.finalUrl !== metadata.url ? `最终链接：${metadata.finalUrl}` : "",
  ].filter(Boolean);
  els.sourcePreview.classList.add("is-visible");
  els.sourcePreview.innerHTML = `
    <img src="${escapeHtml(image)}" alt="详情页主图预览" />
    <div>
      <h3>${escapeHtml(metadata.title || "未识别标题")}</h3>
      <p>${escapeHtml(metadata.description || "未识别页面描述。AI 分析仍会使用 URL、图片和补充说明。")}</p>
      ${metadata.price ? `<p>预抓取价格：${escapeHtml(metadata.currency || "CNY")} ${escapeHtml(metadata.price)} · ${escapeHtml(metadata.priceSource || "metadata")}</p>` : ""}
      <p>来源：${escapeHtml(metadata.url || els.sourceUrl.value.trim() || "未提供 URL")}</p>
      ${fetchDetails.length ? `<p class="source-fetch-meta">${escapeHtml(fetchDetails.join(" · "))}</p>` : ""}
      ${metadata.fetchWarning ? `<p class="source-warning">${escapeHtml(metadata.fetchWarning)}</p>` : ""}
      ${renderSourceEvidence(metadata)}
    </div>
  `;
}

function meaningfulSourceSnippets(metadata = {}) {
  return (metadata.textSnippets || []).filter(
    (snippet) =>
      !/^(平台：|商品 ID：|SKU ID：|标准化链接：)/.test(String(snippet || "")) &&
      !/动态加载|上传详情页截图|上传截图|链接已识别|未能从链接中提取商品 ID|页面可能需要登录/.test(String(snippet || "")),
  );
}

function hasMeaningfulSourceEvidence(metadata = {}) {
  if (!metadata) return false;
  if (metadata.price || metadata.priceCandidates?.length) return true;
  if (meaningfulSourceSnippets(metadata).length) return true;
  if (!metadata.fetchWarning && metadata.sourceScreenshotDataUrls?.length) return true;
  if (!metadata.fetchWarning && metadata.fetchMode !== "commerce-url-fallback" && metadata.imageCandidates?.length) return true;
  return false;
}

function hasManualAnalysisEvidence(files, notes) {
  return Boolean(files.length || String(notes || "").trim().length >= 12);
}

function insufficientSourceMessage(metadata = {}) {
  const platform = metadata.platform ? `${metadata.platform} ` : "";
  return `未获取到${platform}有效详情页图片和内容：没有商品名、价格、参数或可用于视觉识别的详情图。不会生成空产品；请在弹出的浏览器里完成登录/验证并停留在真实详情页后点击“继续获取”。`;
}

async function fetchSourceMetadata() {
  const url = els.sourceUrl.value.trim();
  if (!url) {
    setAnalysisStatus("请先输入详情页 URL。", "error");
    return;
  }
  setAnalysisStatus("正在获取页面标题、价格候选、图片候选和详情文字...", "");
  try {
    const response = await apiFetch("/api/fetch-metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const metadata = await response.json();
    if (!response.ok) throw new Error(metadata.error || "预抓取失败");
    sourceMetadata = { ...metadata, url, fetchedAt: nowIso() };
    renderSourcePreview(sourceMetadata);
    if (!hasMeaningfulSourceEvidence(sourceMetadata)) {
      setAnalysisStatus(`${insufficientSourceMessage(sourceMetadata)} 正在打开浏览器获取真实详情页...`, "warning");
      await startBrowserFetch();
      return;
    }
    setAnalysisStatus("详情页信息获取完成，正在自动分析...", "success");
    await runAnalysis();
  } catch (error) {
    sourceMetadata = null;
    renderSourcePreview(null);
    setAnalysisStatus(`详情页信息获取失败：${error.message}。仍可上传截图/长图后分析。`, "error");
  }
}

async function startBrowserFetch() {
  const url = els.sourceUrl.value.trim();
  if (!url) {
    setAnalysisStatus("请先输入详情页 URL。", "error");
    return;
  }
  setAnalysisBusy(true);
  showRetryAnalysis(false);
  try {
    setAnalysisStatus("正在打开本机浏览器。打开后请在浏览器里完成登录或验证。", "progress");
    const response = await apiFetch("/api/browser-fetch/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "无法打开浏览器获取");
    browserFetchSessionId = payload.sessionId;
    setBrowserFetchControls(true);
    setAnalysisStatus(
      `${payload.message}${payload.navigationWarning ? ` ${payload.navigationWarning}` : ""}`,
      payload.navigationWarning ? "warning" : "success",
    );
  } catch (error) {
    browserFetchSessionId = "";
    setBrowserFetchControls(false);
    setAnalysisStatus(`浏览器获取启动失败：${normalizeErrorMessage(error)}。仍可上传截图/长图后分析。`, "error");
  } finally {
    setAnalysisBusy(false);
  }
}

async function collectBrowserFetch() {
  if (!browserFetchSessionId) {
    setAnalysisStatus("浏览器获取会话已失效，请重新打开浏览器获取。", "error");
    setBrowserFetchControls(false);
    return;
  }
  setAnalysisBusy(true);
  try {
    setAnalysisStatus("正在读取浏览器当前详情页内容，并自动截取整页截图...", "progress");
    const response = await apiFetch("/api/browser-fetch/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: browserFetchSessionId }),
    });
    const metadata = await response.json();
    if (!response.ok) throw new Error(metadata.error || "浏览器详情页读取失败");
    sourceMetadata = { ...metadata, url: els.sourceUrl.value.trim() || metadata.url || metadata.finalUrl, fetchedAt: nowIso() };
    renderSourcePreview(sourceMetadata);
    setBrowserFetchControls(false);
    if (!hasMeaningfulSourceEvidence(sourceMetadata)) {
      setAnalysisStatus(`浏览器当前页面仍未获取到有效详情页图片和内容。请确认已完成登录/验证，并停留在真实商品详情页后重新点击“打开浏览器获取”。`, "warning");
      return;
    }
    setAnalysisStatus("浏览器详情页和截图获取完成，正在自动分析...", "success");
    await runAnalysis();
  } catch (error) {
    setAnalysisStatus(`浏览器详情页读取失败：${normalizeErrorMessage(error)}。请确认浏览器停留在真实详情页，或上传截图/长图。`, "error");
  } finally {
    setAnalysisBusy(false);
  }
}

async function cancelBrowserFetch() {
  if (!browserFetchSessionId) {
    setBrowserFetchControls(false);
    return;
  }
  const sessionId = browserFetchSessionId;
  setBrowserFetchControls(false);
  await apiFetch("/api/browser-fetch/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  }).catch(() => {});
  setAnalysisStatus("已取消浏览器详情页获取。", "warning");
}

function localSummary(products) {
  if (products.length < 2) return "请选择至少 2 个型号。";
  const payload = comparisonPayload(products);
  const sorted = [...products].sort((a, b) => b.price - a.price);
  const premium = sorted[0];
  const value = sorted[sorted.length - 1];
  const categorySet = unique(products.map((p) => p.category)).join("、");
  const diffText = payload.differenceFields
    .slice(0, 6)
    .map((field) => `${field.module}·${field.name}`)
    .join("、");
  const sellingText = products
    .map((product) => `${product.model}主打${(product.sellingPoints || []).slice(0, 2).map((point) => point.title).join("、") || "待确认卖点"}`)
    .join("；");
  return normalizeComparisonSummary(
    `${products.map((p) => p.model).join("、")}覆盖${categorySet}，价格从${formatCurrency(value.price)}到${formatCurrency(premium.price)}。功能上，${sellingText}。参数对比建议重点看${diffText || "清洁能力、导航避障、基站能力、续航、电池和噪音"}，这些字段决定清洁效率、维护频率和复杂户型适应性。使用感受上，高价型号更适合强调自动维护、少干预和旗舰心智；低价型号适合做入门或性价比防守，但需重点核对拖布清洗、集尘、贴边和避障是否存在体验短板。未确认字段应回到详情页证据复核后再下结论。`,
  );
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

function comparisonPayload(products) {
  const fields = compareFields();
  const differenceFields = fields
    .map((field) => {
      const values = products.map((product) => field.value(product));
      return {
        key: field.key,
        module: field.module,
        name: field.name,
        values: Object.fromEntries(products.map((product, index) => [product.model, values[index]])),
        hasDifference: unique(values).length > 1,
      };
    })
    .filter((field) => field.hasDifference)
    .slice(0, 12);
  return {
    products: products.map((product) => ({
      brand: product.brand,
      model: product.model,
      category: product.category,
      price: product.price,
      status: product.status,
      confidence: product.confidence,
      topSellingPoints: (product.sellingPoints || []).slice(0, 3).map((point) => point.title),
    })),
    differenceFields,
  };
}

function addComparisonRun({ products, summary, source, analysisMeta = null }) {
  state.comparisonRuns = state.comparisonRuns || [];
  const fields = compareFields();
  state.comparisonRuns.unshift({
    id: `compare-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: nowIso(),
    source,
    summary: normalizeComparisonSummary(summary),
    productIds: products.map((product) => product.id),
    productModels: products.map((product) => product.model),
    fieldKeys: fields.map((field) => field.key),
    fieldLabels: fields.map((field) => `${field.module} · ${field.name}`),
    model: analysisMeta?.model || (source === "openai" ? healthState.model : "本地兜底"),
    usage: analysisMeta?.usage || null,
  });
  state.comparisonRuns = state.comparisonRuns.slice(0, 30);
}

async function generateSummary() {
  const products = selectedCompareProducts();
  els.comparisonSummary.textContent = "正在生成竞争对标总结...";
  try {
    const response = await apiFetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: comparisonPayload(products) }),
    });
    const payload = await response.json();
    const summary = normalizeComparisonSummary(payload.summary) || localSummary(products);
    els.comparisonSummary.textContent = summary;
    addComparisonRun({ products, summary, source: payload.analysisMeta?.provider || (payload.summary ? "deepseek" : "local"), analysisMeta: payload.analysisMeta || null });
  } catch {
    const summary = localSummary(products);
    els.comparisonSummary.textContent = summary;
    addComparisonRun({ products, summary, source: "local_fallback" });
  }
  renderAll();
  loadUsage();
}

function addField() {
  const moduleName = els.moduleName.value.trim();
  const fieldName = els.fieldName.value.trim();
  const fieldType = els.fieldType.value;
  const options = fieldType === "enum" ? normalizeEnumOptions(els.fieldOptions.value) : [];
  if (!moduleName || !fieldName) return;
  if (fieldType === "enum" && !options.length) {
    window.alert("枚举字段需要先填写至少一个选项。");
    return;
  }
  const key = `${moduleName}-${fieldName}`
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-|-$/g, "");
  let module = state.modules.find((item) => item.name === moduleName);
  if (!module) {
    module = { name: moduleName, fields: [] };
    state.modules.push(module);
  }
  if (!module.fields.some((field) => field.key === key)) {
    const field = normalizeFeatureField({ key, name: fieldName, type: fieldType, options });
    module.fields.push(field);
    state.products.forEach((product) => {
      product.features = product.features || {};
      if (product.features[key] === undefined) product.features[key] = defaultFeatureValue(field);
    });
  }
  els.moduleName.value = "";
  els.fieldName.value = "";
  els.fieldOptions.value = "";
  renderAll();
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadCsvTemplate() {
  const featureHeaders = allFields().map((field) => `feature:${field.key}`);
  const headers = [
    "品牌",
    "产品名",
    "型号",
    "品类",
    "价格",
    "渠道",
    "上市状态",
    "季度",
    "来源",
    "置信度",
    "卖点1",
    "卖点2",
    "卖点3",
    ...featureHeaders,
  ];
  const example = [
    "示例品牌",
    "旗舰清洁机器人 X1",
    "X1",
    "扫地机",
    "3999",
    "官网",
    "待确认",
    "2026 Q4",
    "https://example.com/product",
    "72",
    "热水洗拖布 | 详情页说明",
    "全能基站 | 页面参数",
    "高吸力 | 商品标题",
    ...allFields().map((field) => (field.type === "boolean" ? "支持" : field.type === "enum" ? enumOptions(field)[0] || "待确认" : "待确认")),
  ];
  const csv = [headers, example].map((row) => row.map(csvCell).join(",")).join("\n");
  download("cleaner-products-template.csv", `\uFEFF${csv}`, "text/csv;charset=utf-8");
}

function sanitizeFilename(value) {
  return String(value || "export")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function excelDocument(title, body) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title>
    <style>
      body{font-family:Arial,"Microsoft YaHei",sans-serif}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #c8d2dc;padding:8px;text-align:left;vertical-align:top}
      th{background:#eef2f6}
      img{width:72px;height:72px;object-fit:contain}
    </style></head><body>${body}</body></html>`;
}

function exportExcel() {
  const products = sortedProducts(state.products.filter(isCatalogProduct));
  const featureFields = allFields();
  const featureHeaders = featureFields.map((field) => `<th>${escapeHtml(field.module)} · ${escapeHtml(field.name)}</th>`).join("");
  const rows = products
    .map(
      (p) => {
        const latestRun = p.analysisRuns?.[0];
        const latestAudit = p.auditLog?.[0];
        const latestPrice = p.priceSnapshots?.[0];
        const sourceEvidence = sourceEvidenceText(p.sourceMetadata);
        const featureCells = featureFields
          .map((field) => `<td>${escapeHtml(formatBool(p.features?.[field.key]))}</td>`)
          .join("");
        return `<tr>
        <td><img src="${p.image}" alt=""></td>
        <td>${escapeHtml(p.brand)}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.model)}</td>
        <td>${escapeHtml(p.category)}</td>
        <td>${p.price}</td>
        <td>${escapeHtml(p.channel)}</td>
        <td>${escapeHtml(p.status)}</td>
        <td>${p.confidence}%</td>
        <td>${(p.sellingPoints || []).map((point, index) => `P${index + 1}:${escapeHtml(point.title)}`).join("<br>")}</td>
        <td>${escapeHtml(latestPrice ? `${formatCurrency(latestPrice.price)} / ${latestPrice.channel} / ${formatDateTime(latestPrice.createdAt)}` : "-")}</td>
        <td>${escapeHtml(latestRun ? `${latestRun.type} / ${latestRun.model} / ${latestRun.status}` : "-")}</td>
        <td>${escapeHtml(latestAudit ? `${latestAudit.action} / ${formatDateTime(latestAudit.createdAt)}` : "-")}</td>
        <td>${escapeHtml(sourceEvidence.priceText || "-")}</td>
        <td>${escapeHtml(sourceEvidence.snippetText || "-")}</td>
        <td>${escapeHtml(sourceEvidence.imageText || "-")}</td>
        ${featureCells}
      </tr>`;
      },
    )
    .join("");
  const html = excelDocument(
    "清洁电器竞品分析",
    `<h1>清洁电器竞品分析</h1><table><thead><tr>
      <th>产品图</th><th>品牌</th><th>产品</th><th>型号</th><th>品类</th><th>价格</th><th>渠道</th><th>状态</th><th>置信度</th><th>Top3 卖点</th><th>最近价格快照</th><th>最近分析</th><th>最近操作</th><th>来源价格候选</th><th>来源文案证据</th><th>来源图片候选</th>${featureHeaders}
    </tr></thead><tbody>${rows}</tbody></table>`,
  );
  download("cleaner-competitive-analysis.xls", html, "application/vnd.ms-excel;charset=utf-8");
}

function exportCompare() {
  const products = selectedCompareProducts();
  if (products.length < 2) {
    window.alert("请选择至少 2 个型号后再导出对比表。");
    return;
  }
  const summaryText = normalizeComparisonSummary(
    els.comparisonSummary.textContent && !els.comparisonSummary.textContent.includes("选择型号")
      ? els.comparisonSummary.textContent
      : localSummary(products),
  );
  const overviewRows = products
    .map(
      (product) => `<tr>
        <td><img src="${escapeHtml(bestProductImage(product))}" alt=""></td>
        <td>${escapeHtml(product.brand)}</td>
        <td>${escapeHtml(product.name)}</td>
        <td>${escapeHtml(product.model)}</td>
        <td>${escapeHtml(product.category)}</td>
        <td>${formatCurrency(product.price)}</td>
        <td>${escapeHtml(product.status)}</td>
        <td>${Number(product.confidence || 0)}%</td>
        <td>${(product.sellingPoints || []).map((point, index) => `P${index + 1}:${escapeHtml(point.title)}<br><small>${escapeHtml(point.evidence || "")}</small>`).join("<br>")}</td>
      </tr>`,
    )
    .join("");
  const matrixRows = compareFields()
    .map((field) => {
      const values = products.map((product) => field.value(product));
      const hasDiff = unique(values).length > 1;
      return `<tr>
        <td>${escapeHtml(field.module)}</td>
        <td>${escapeHtml(field.name)}</td>
        ${values.map((value) => `<td${hasDiff ? ' style="background:#fff9ec"' : ""}>${escapeHtml(value)}</td>`).join("")}
      </tr>`;
    })
    .join("");
  const title = `${products.map((product) => product.model).join("-vs-")} 对比表`;
  const html = excelDocument(
    title,
    `<h1>${escapeHtml(title)}</h1>
    <h2>500 字以内对标总结</h2>
    <p>${escapeHtml(summaryText)}</p>
    <h2>产品概览</h2>
    <table><thead><tr><th>产品图</th><th>品牌</th><th>产品</th><th>型号</th><th>品类</th><th>价格</th><th>状态</th><th>置信度</th><th>Top3 优先级卖点</th></tr></thead><tbody>${overviewRows}</tbody></table>
    <h2>已选功能参数矩阵</h2>
    <table><thead><tr><th>模块</th><th>字段</th>${products.map((product) => `<th>${escapeHtml(product.model)}</th>`).join("")}</tr></thead><tbody>${matrixRows}</tbody></table>`,
  );
  download(`${sanitizeFilename(title)}.xls`, html, "application/vnd.ms-excel;charset=utf-8");
}

function exportRoadmap() {
  const roadmapProducts = getRoadmapProducts();
  const periods = unique(roadmapProducts.map(productRoadmapPeriod));
  const title = roadmapTitle("品牌路标");
  const body = periods
    .map((period) => {
      const rows = roadmapProducts
        .filter((product) => productRoadmapPeriod(product) === period)
        .map(
          (p) => `<tr>
            <td><img src="${p.image}" alt=""></td>
            <td>${escapeHtml(p.brand)}</td>
            <td>${escapeHtml(p.model)}</td>
            <td>${escapeHtml(p.category)}</td>
            <td>${p.price}</td>
            <td>${escapeHtml(p.status)}</td>
            <td>${escapeHtml(roadmapSourceLabel(p))}</td>
            <td>${(p.sellingPoints || []).map((point, index) => `P${index + 1}:${escapeHtml(point.title)}`).join("<br>")}</td>
          </tr>`,
        )
        .join("");
      return `<h2>${escapeHtml(period)}</h2><table><thead><tr><th>产品图</th><th>品牌</th><th>型号</th><th>品类</th><th>价格</th><th>状态</th><th>来源</th><th>Top3 优先级卖点</th></tr></thead><tbody>${rows}</tbody></table>`;
    })
    .join("");
  download("brand-roadmap.xls", excelDocument(title, `<h1>${escapeHtml(title)}</h1>${body}`), "application/vnd.ms-excel;charset=utf-8");
}

function splitSvgText(value, maxChars = 18, maxLines = 2) {
  const text = String(value || "").trim();
  if (!text) return ["-"];
  const lines = [];
  let remaining = text;
  while (remaining.length && lines.length < maxLines) {
    lines.push(remaining.slice(0, maxChars));
    remaining = remaining.slice(maxChars);
  }
  if (remaining.length && lines.length) lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, Math.max(1, maxChars - 1))}...`;
  return lines;
}

function svgTextLines(lines, x, y, options = {}) {
  const { className = "", lineHeight = 18, prefix = "" } = options;
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}"${className ? ` class="${className}"` : ""}>${escapeHtml(prefix)}${escapeHtml(line)}</text>`,
    )
    .join("");
}

function roadmapSvgDocument() {
  const roadmapProducts = getRoadmapProducts();
  const periods = unique(roadmapProducts.map(productRoadmapPeriod));
  const title = roadmapTitle("清洁电器品牌路标");
  const columnWidth = 300;
  const cardHeight = 210;
  const gap = 18;
  const margin = 28;
  const headerHeight = 92;
  const maxCards = Math.max(...periods.map((period) => roadmapProducts.filter((product) => productRoadmapPeriod(product) === period).length), 1);
  const width = Math.max(960, margin * 2 + periods.length * columnWidth + Math.max(0, periods.length - 1) * gap);
  const height = headerHeight + margin + maxCards * (cardHeight + gap) + margin;

  const columns = periods
    .map((period, periodIndex) => {
      const x = margin + periodIndex * (columnWidth + gap);
      const products = roadmapProducts.filter((product) => productRoadmapPeriod(product) === period);
      const cards = products
        .map((product, productIndex) => {
          const y = headerHeight + productIndex * (cardHeight + gap);
          const pointLines = (product.sellingPoints || [])
            .slice(0, 3)
            .flatMap((point, index) => splitSvgText(`P${index + 1} ${point.title || "待确认卖点"}`, 24, 1));
          return `
            <g transform="translate(${x}, ${y})">
              <rect class="card" width="${columnWidth}" height="${cardHeight}" rx="8" />
              <image href="${escapeHtml(bestProductImage(product))}" x="16" y="18" width="68" height="68" preserveAspectRatio="xMidYMid meet" />
              ${svgTextLines(splitSvgText(`${product.brand} ${product.model}`, 18, 2), 98, 34, { className: "model", lineHeight: 18 })}
              <text x="98" y="78" class="meta">${escapeHtml(product.category)} · ${escapeHtml(formatCurrency(product.price))}</text>
              <text x="98" y="96" class="meta">状态 ${escapeHtml(product.status || "待确认")}</text>
              ${svgTextLines(splitSvgText(`来源 ${roadmapSourceLabel(product)}`, 25, 1), 18, 118, { className: "meta", lineHeight: 16 })}
              <line x1="16" y1="132" x2="${columnWidth - 16}" y2="132" class="divider" />
              ${pointLines.map((line, index) => `<text x="18" y="${156 + index * 18}" class="point">${escapeHtml(line)}</text>`).join("")}
            </g>
          `;
        })
        .join("");
      return `
        <g>
          <text x="${x}" y="78" class="period">${escapeHtml(period)}</text>
          ${cards}
        </g>
      `;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(title)}">
  <style>
    .bg{fill:#f6f8fb}
    .title{font:700 26px Arial,"Microsoft YaHei",sans-serif;fill:#17202a}
    .subtitle{font:13px Arial,"Microsoft YaHei",sans-serif;fill:#607080}
    .period{font:700 16px Arial,"Microsoft YaHei",sans-serif;fill:#1f3347}
    .card{fill:#fff;stroke:#d8e0ea;stroke-width:1}
    .model{font:700 14px Arial,"Microsoft YaHei",sans-serif;fill:#17202a}
    .meta{font:12px Arial,"Microsoft YaHei",sans-serif;fill:#607080}
    .point{font:12px Arial,"Microsoft YaHei",sans-serif;fill:#263747}
    .divider{stroke:#edf1f5;stroke-width:1}
  </style>
  <rect class="bg" width="100%" height="100%" />
  <text x="${margin}" y="38" class="title">${escapeHtml(title)}</text>
  <text x="${margin}" y="62" class="subtitle">产品图、价格与 Top3 优先级卖点 · ${escapeHtml(new Date().toLocaleDateString("zh-CN"))}</text>
  ${columns || `<text x="${margin}" y="120" class="subtitle">暂无路标产品</text>`}
</svg>`;
}

function exportRoadmapSvg() {
  const title = roadmapTitle("brand-roadmap");
  download(`${sanitizeFilename(title)}.svg`, roadmapSvgDocument(), "image/svg+xml;charset=utf-8");
}

function roadmapPrintCard(product) {
  const latestRun = product.analysisRuns?.[0];
  const latestPrice = product.priceSnapshots?.[0];
  return `
    <article class="roadmap-print-card">
      <img src="${escapeHtml(bestProductImage(product))}" alt="" />
      <div>
        <h3>${escapeHtml(product.brand)} ${escapeHtml(product.model)}</h3>
        <p>${escapeHtml(product.category)} · ${formatCurrency(product.price)} · ${escapeHtml(product.status)}</p>
        <ol>
          ${(product.sellingPoints || [])
            .slice(0, 3)
            .map((point) => `<li>${escapeHtml(point.title)}</li>`)
            .join("")}
        </ol>
        <small>价格快照：${escapeHtml(latestPrice ? `${formatCurrency(latestPrice.price)} / ${latestPrice.channel}` : "-")}</small><br />
        <small>来源：${escapeHtml(roadmapSourceLabel(product))}</small><br />
        <small>分析：${escapeHtml(latestRun ? `${latestRun.model} / ${latestRun.status} / ${latestRun.confidence}%` : "-")}</small>
      </div>
    </article>
  `;
}

function allBrandRoadmapProducts() {
  return state.products.filter((product) => {
    if (!isCatalogProduct(product)) return false;
    const categoryMatch = !state.roadmapCategory || state.roadmapCategory === "全部" || product.category === state.roadmapCategory;
    const statusMatch = !state.roadmapStatus || state.roadmapStatus === "全部" || product.status === state.roadmapStatus;
    const quarterMatch = !state.roadmapQuarter || state.roadmapQuarter === "全部" || productRoadmapPeriod(product) === state.roadmapQuarter;
    return categoryMatch && statusMatch && quarterMatch;
  });
}

function brandRoadmapReportHtml() {
  const roadmapProducts = allBrandRoadmapProducts();
  const brands = unique(roadmapProducts.map((product) => product.brand)).sort((a, b) => a.localeCompare(b, "zh-CN"));
  const generatedAt = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
  const filterText = [
    state.roadmapCategory && state.roadmapCategory !== "全部" ? `品类 ${state.roadmapCategory}` : "",
    state.roadmapStatus && state.roadmapStatus !== "全部" ? `状态 ${state.roadmapStatus}` : "",
    state.roadmapQuarter && state.roadmapQuarter !== "全部" ? `周期 ${state.roadmapQuarter}` : "",
  ].filter(Boolean).join(" · ") || "全部品类、状态和周期";
  const brandPages = brands
    .map((brand) => {
      const brandProducts = roadmapProducts.filter((product) => product.brand === brand);
      const periods = unique(brandProducts.map(productRoadmapPeriod));
      const columns = periods
        .map((period) => {
          const cards = brandProducts
            .filter((product) => productRoadmapPeriod(product) === period)
            .map(roadmapPrintCard)
            .join("");
          return `<section><h2>${escapeHtml(period)}</h2>${cards}</section>`;
        })
        .join("");
      return `
        <article class="brand-page">
          <header>
            <div>
              <h1>${escapeHtml(brand)} 路标</h1>
              <div class="meta">产品数 ${brandProducts.length} · ${escapeHtml(filterText)}</div>
            </div>
            <div class="meta">生成时间：${generatedAt}</div>
          </header>
          <main class="grid">${columns}</main>
        </article>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <title>各品牌路标</title>
        <style>
          *{box-sizing:border-box}
          body{margin:0;color:#17202a;font-family:Arial,"Microsoft YaHei",sans-serif;background:#eef2f6}
          .brand-page{min-height:100vh;padding:28px;break-after:page;page-break-after:always}
          .brand-page:last-child{break-after:auto;page-break-after:auto}
          header{display:flex;justify-content:space-between;gap:24px;align-items:flex-end;margin-bottom:24px}
          h1{margin:0;font-size:30px}
          .meta{color:#667383;font-size:13px}
          .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
          section{border:1px solid #dbe2e8;border-radius:8px;background:#fff;padding:14px;break-inside:avoid}
          h2{margin:0 0 12px;font-size:18px}
          .roadmap-print-card{display:grid;grid-template-columns:72px 1fr;gap:12px;border:1px solid #dbe2e8;border-radius:8px;padding:10px;margin-bottom:10px;break-inside:avoid}
          img{width:72px;height:72px;object-fit:contain;border:1px solid #dbe2e8;border-radius:8px;background:#f8fafb}
          h3{margin:0 0 5px;font-size:14px}
          p{margin:0 0 8px;color:#667383;font-size:12px}
          ol{margin:0 0 8px;padding-left:18px;font-size:12px;line-height:1.45}
          small{color:#667383;font-size:11px}
          @media print{
            body{background:#fff}
            .brand-page{padding:16px}
            button{display:none}
          }
        </style>
      </head>
      <body>
        ${brandPages || `<article class="brand-page"><header><h1>各品牌路标</h1><div class="meta">当前筛选下暂无路标产品</div></header></article>`}
        <script>window.addEventListener("load",()=>setTimeout(()=>window.print(),300));</script>
      </body>
    </html>`;
}

function printAllBrandRoadmaps() {
  const blob = new Blob([brandRoadmapReportHtml()], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const report = window.open(url, "_blank");
  if (!report) {
    URL.revokeObjectURL(url);
    window.alert("浏览器阻止了各品牌路标窗口，请允许弹窗后重试。");
    return;
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function dataPackagePayload() {
  return {
    schemaVersion: 1,
    exportedAt: nowIso(),
    app: "cleaner-competitive-workbench",
    productCount: state.products.length,
    state,
    savedViews,
  };
}

function exportDataPackage() {
  const payload = dataPackagePayload();
  download(
    `cleaner-workbench-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(payload, null, 2),
    "application/json;charset=utf-8",
  );
}

function backupBeforeDataPackageImport() {
  const payload = {
    ...dataPackagePayload(),
    backupReason: "before-data-package-import",
  };
  download(
    `cleaner-workbench-backup-before-import-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
    JSON.stringify(payload, null, 2),
    "application/json;charset=utf-8",
  );
}

async function importDataPackage(file) {
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    const incomingState = payload.state || payload;
    if (!Array.isArray(incomingState.products) || !Array.isArray(incomingState.modules)) {
      throw new Error("数据包缺少 products 或 modules");
    }
    const confirmed = window.confirm(
      `导入 ${incomingState.products.length} 个产品？当前工作台状态会被替换。`,
    );
    if (!confirmed) return;
    backupBeforeDataPackageImport();
    state = mergeState(incomingState);
    savedViews = Array.isArray(payload.savedViews) ? payload.savedViews : [];
    state.editingProductId = "";
    state.selectedProductId = state.products[0]?.id || "";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(VIEW_KEY, JSON.stringify(savedViews));
    queuePersist();
    renderAll();
  } catch (error) {
    window.alert(`导入失败：${error.message}`);
  } finally {
    els.dataPackageFile.value = "";
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  if (!rows.length) return [];
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() || ""])),
  );
}

function parseCsvBool(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["true", "1", "yes", "y", "支持", "是"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "不支持", "否"].includes(normalized)) return false;
  return null;
}

function parseCsvNumber(value, fallback = 0) {
  const match = String(value ?? "").match(/-?\d+(?:\.\d+)?/);
  const normalized = Number(match?.[0]);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function normalizeCsvCategory(value) {
  const category = String(value || "").trim();
  if (["扫地机", "洗地机", "吸尘器"].includes(category)) return category;
  if (/洗地|floor|wash/i.test(category)) return "洗地机";
  if (/吸尘|stick|vacuum/i.test(category)) return "吸尘器";
  if (/扫地|robot/i.test(category)) return "扫地机";
  return "";
}

function validateCsvRow(row, rowNumber) {
  const brand = (row.brand || row["品牌"] || "").trim();
  const model = (row.model || row["型号"] || "").trim();
  const category = normalizeCsvCategory(row.category || row["品类"] || "扫地机");
  const price = parseCsvNumber(row.price || row["价格"], 0);
  const reasons = [];
  if (!brand) reasons.push("缺少品牌");
  if (!model) reasons.push("缺少型号");
  if (!category) reasons.push("品类无效");
  if (price < 0) reasons.push("价格无效");
  return {
    valid: !reasons.length,
    reason: reasons.join("、"),
    rowNumber,
    brand,
    model,
    category,
    price,
  };
}

function csvRowToProduct(row) {
  const validation = validateCsvRow(row, 0);
  if (!validation.valid) {
    throw new Error(validation.reason);
  }
  const confidence = Math.min(100, Math.max(0, parseCsvNumber(row.confidence || row["置信度"], 70)));
  const product = {
    ...blankProduct(),
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    brand: validation.brand,
    name: row.name || row["产品名"] || validation.model || "批量导入产品",
    model: validation.model,
    category: validation.category,
    price: validation.price,
    channel: row.channel || row["渠道"] || "批量导入",
    status: row.status || row["上市状态"] || "待确认",
    image: row.image || row["产品图"] || getCategoryImage(validation.category),
    confidence,
    sourceUrl: row.sourceUrl || row["来源"] || "",
    quarter: row.quarter || row["季度"] || "未规划",
  };
  product.reviewRequired = product.confidence < 80;
  product.sellingPoints = textToSellingPoints(
    [
      row.sellingPoint1 || row["卖点1"] || "",
      row.sellingPoint2 || row["卖点2"] || "",
      row.sellingPoint3 || row["卖点3"] || "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  for (const [key, value] of Object.entries(row)) {
    if (!key.startsWith("feature:")) continue;
    const featureKey = key.slice("feature:".length);
    const field = allFields().find((item) => item.key === featureKey);
    product.features[featureKey] = field?.type === "boolean" ? parseCsvBool(value) : value || (field ? defaultFeatureValue(field) : "待确认");
  }
  addPriceSnapshot(product, {
    price: product.price,
    channel: product.channel,
    source: product.sourceUrl || "CSV",
    note: "CSV 导入价格",
  });
  addAnalysisRun(product, {
    type: "csv_import",
    model: "CSV 批量导入",
    status: product.reviewRequired ? "review_required" : "confirmed",
    confidence: product.confidence,
    source: product.sourceUrl || "CSV",
  });
  addAudit(product, "CSV 导入", `批量导入 ${product.brand} ${product.model}`);
  return product;
}

async function importCsvProducts(file) {
  if (!file) return;
  try {
    const rows = parseCsv(await file.text());
    if (!rows.length) throw new Error("CSV 没有可导入的数据行");
    let inserted = 0;
    let updated = 0;
    const skipped = [];
    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const validation = validateCsvRow(row, rowNumber);
      if (!validation.valid) {
        skipped.push(`第 ${rowNumber} 行：${validation.reason}`);
        return;
      }
      const incoming = csvRowToProduct(row);
      const existing = findDuplicateProduct(incoming);
      if (existing) {
        const previousConfidence = existing.confidence;
        const previousPrice = existing.price;
        Object.assign(existing, {
          ...incoming,
          id: existing.id,
          analysisRuns: [...(incoming.analysisRuns || []), ...(existing.analysisRuns || [])],
          auditLog: [...(incoming.auditLog || []), ...(existing.auditLog || [])],
        });
        if (Number(previousPrice) !== Number(existing.price)) {
          addPriceSnapshot(existing, {
            price: existing.price,
            channel: existing.channel,
            source: existing.sourceUrl || "CSV",
            note: `CSV 更新价格：${previousPrice} -> ${existing.price}`,
          });
        }
        addAudit(existing, "CSV 更新", `按品牌+型号匹配更新，置信度 ${previousConfidence}% -> ${existing.confidence}%`);
        updated += 1;
      } else {
        state.products.unshift(incoming);
        inserted += 1;
      }
    });
    if (!inserted && !updated && skipped.length) {
      throw new Error(`没有有效数据行。${skipped.slice(0, 3).join("；")}`);
    }
    state.selectedProductId = state.products[0]?.id || "";
    renderAll();
    const skippedText = skipped.length ? `跳过 ${skipped.length} 行：${skipped.slice(0, 3).join("；")}${skipped.length > 3 ? "；..." : ""}` : "无跳过行";
    window.alert(`CSV 导入完成：新增 ${inserted} 个，更新 ${updated} 个，${skippedText}。`);
  } catch (error) {
    window.alert(`CSV 导入失败：${error.message}`);
  } finally {
    els.csvImportFile.value = "";
  }
}

function bindEvents() {
  document.querySelectorAll(".sidebar-nav [data-workspace]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setActiveWorkspace(button.dataset.workspace);
    });
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".sidebar-nav [data-workspace]");
    if (!button) return;
    event.preventDefault();
    setActiveWorkspace(button.dataset.workspace);
  });

  els.categoryFilterToggle.addEventListener("click", () => {
    const isOpen = els.categoryFilterDropdown.classList.toggle("is-open");
    els.categoryFilterToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!els.categoryFilterDropdown.contains(event.target)) {
      els.categoryFilterDropdown.classList.remove("is-open");
      els.categoryFilterToggle.setAttribute("aria-expanded", "false");
    }
    if (els.roadmapBrandDropdown && !els.roadmapBrandDropdown.contains(event.target)) {
      els.roadmapBrandDropdown.classList.remove("is-open");
      els.roadmapBrandToggle?.setAttribute("aria-expanded", "false");
    }
  });

  els.categoryFilters.addEventListener("change", (event) => {
    const input = event.target.closest("[data-category]");
    if (!input) return;
    const category = input.dataset.category;
    const set = new Set(state.filters.categories);
    if (input.checked) set.add(category);
    else set.delete(category);
    state.filters.categories = Array.from(set);
    renderAll();
  });

  els.brandFilter.addEventListener("change", () => updateFilter("brand", els.brandFilter.value));
  els.channelFilter.addEventListener("change", () => updateFilter("channel", els.channelFilter.value));
  els.statusFilter.addEventListener("change", () => updateFilter("status", els.statusFilter.value));
  els.minPrice.addEventListener("input", () => updateFilterSoon("minPrice", els.minPrice.value));
  els.maxPrice.addEventListener("input", () => updateFilterSoon("maxPrice", els.maxPrice.value));
  els.confidenceFilter.addEventListener("input", () => updateFilterSoon("confidence", Number(els.confidenceFilter.value)));
  els.keywordSearch.addEventListener("input", () => updateFilterSoon("keyword", els.keywordSearch.value));
  els.featureFilterField.addEventListener("change", () => {
    state.filters.featureField = els.featureFilterField.value;
    state.filters.featureValue = "";
    renderAll();
  });
  els.featureFilterOperator.addEventListener("change", () => {
    state.filters.featureOperator = els.featureFilterOperator.value;
    renderAll();
  });
  els.featureFilterValue.addEventListener("input", () => updateFilterSoon("featureValue", els.featureFilterValue.value));
  els.sourceUrl.addEventListener("input", () => {
    sourceMetadata = null;
    renderSourcePreview(null);
  });

  document.querySelector("#clearFilters").addEventListener("click", () => {
    state.filters = structuredClone(defaultState.filters);
    renderAll();
  });

  document.querySelector("#toggleColumns").addEventListener("click", () => {
    els.columnsPopover.classList.toggle("is-open");
  });

  document.querySelector("#confirmAllReviews").addEventListener("click", confirmAllReviews);
  document.querySelector("#selectAllReviews")?.addEventListener("click", toggleAllReviews);
  document.querySelector("#confirmSelectedReviews")?.addEventListener("click", confirmSelectedReviews);
  document.querySelector("#deleteSelectedReviews")?.addEventListener("click", deleteSelectedReviews);
  document.querySelector("#exportQualityCsv").addEventListener("click", exportQualityCsv);

  els.columnsPopover.addEventListener("change", (event) => {
    const input = event.target.closest("[data-column]");
    if (!input) return;
    state.visibleColumns[input.dataset.column] = input.checked;
    renderAll();
    els.columnsPopover.classList.add("is-open");
  });

  els.productTableBody.addEventListener("click", (event) => {
    const row = event.target.closest("[data-product-id]");
    if (!row) return;
    state.selectedProductId = row.dataset.productId;
    renderAll();
  });

  els.productTableHead.addEventListener("click", (event) => {
    const button = event.target.closest("[data-sort-column]");
    if (!button) return;
    toggleProductSort(button.dataset.sortColumn);
  });

  els.qualityPanel.addEventListener("click", (event) => {
    const severityButton = event.target.closest("[data-quality-severity]");
    if (severityButton) {
      state.qualitySeverity = severityButton.dataset.qualitySeverity;
      renderQualityPanel();
      return;
    }
    const button = event.target.closest("[data-focus-quality]");
    if (!button) return;
    focusReviewProduct(button.dataset.focusQuality);
  });

  els.reviewQueue.addEventListener("click", (event) => {
    const checkbox = event.target.closest("[data-review-select]");
    if (checkbox) {
      if (checkbox.checked) selectedReviewIds.add(checkbox.dataset.reviewSelect);
      else selectedReviewIds.delete(checkbox.dataset.reviewSelect);
      updateReviewBatchActions();
      return;
    }
    const editButton = event.target.closest("[data-edit-review]");
    if (editButton) {
      editReviewProduct(editButton.dataset.editReview);
      return;
    }
    const focusButton = event.target.closest("[data-focus-review]");
    if (focusButton) {
      focusReviewProduct(focusButton.dataset.focusReview);
      return;
    }
    const confirmButton = event.target.closest("[data-confirm-review]");
    if (confirmButton) {
      confirmProduct(confirmButton.dataset.confirmReview, "队列确认");
      return;
    }
    const deleteButton = event.target.closest("[data-delete-review]");
    if (deleteButton) {
      deleteProduct(deleteButton.dataset.deleteReview);
    }
  });

  els.reviewProductDetail?.addEventListener("click", (event) => {
    const confirmButton = event.target.closest("[data-confirm-review-detail]");
    if (confirmButton) {
      const form = els.reviewProductDetail.querySelector("[data-edit-product]");
      const product = form ? saveProductForm(form, { render: false }) : state.products.find((item) => item.id === confirmButton.dataset.confirmReviewDetail);
      if (product) confirmReviewFormProduct(product);
      return;
    }
    const deleteButton = event.target.closest("[data-delete-review-detail]");
    if (deleteButton) {
      deleteProduct(deleteButton.dataset.deleteReviewDetail);
    }
  });

  els.productDetail.addEventListener("click", (event) => {
    const editButton = event.target.closest("button[data-edit-product]");
    if (editButton) {
      startEditProduct(editButton.dataset.editProduct);
      return;
    }
    const cancelButton = event.target.closest("[data-cancel-edit]");
    if (cancelButton) {
      cancelEditProduct();
      return;
    }
    const confirmButton = event.target.closest("[data-confirm-product]");
    if (confirmButton) {
      confirmProduct(confirmButton.dataset.confirmProduct);
      return;
    }
    const fieldReviewButton = event.target.closest("[data-confirm-field-review]");
    if (fieldReviewButton) {
      confirmFieldReview(fieldReviewButton.dataset.confirmFieldReview, fieldReviewButton.dataset.fieldKey);
      return;
    }
    const deleteButton = event.target.closest("[data-delete-product]");
    if (deleteButton) {
      deleteProduct(deleteButton.dataset.deleteProduct);
    }
  });

  els.productDetail.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-edit-product]");
    if (!form) return;
    event.preventDefault();
    saveProductForm(form);
  });

  els.reviewProductDetail?.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-edit-product]");
    if (!form) return;
    event.preventDefault();
    const product = saveProductForm(form, { render: false });
    if (product) confirmReviewFormProduct(product);
  });

  els.comparePicker.addEventListener("change", (event) => {
    const input = event.target.closest("[data-compare-id]");
    if (!input) return;
    const set = new Set(state.compareIds);
    if (input.checked) {
      set.add(input.dataset.compareId);
    } else {
      set.delete(input.dataset.compareId);
    }
    state.compareIds = Array.from(set);
    renderAll();
  });

  const updateCompareFilter = (key, value) => {
    state.compareFilters = { ...defaultState.compareFilters, ...(state.compareFilters || {}), [key]: value };
    state.compareIds = state.compareIds.filter((id) => getCompareCandidateProducts().some((product) => product.id === id));
    renderAll();
  };
  els.compareKeywordFilter?.addEventListener("input", () => updateCompareFilter("keyword", els.compareKeywordFilter.value));
  els.compareBrandFilter?.addEventListener("change", () => updateCompareFilter("brand", els.compareBrandFilter.value));
  els.compareCategoryFilter?.addEventListener("change", () => updateCompareFilter("category", els.compareCategoryFilter.value));
  els.compareChannelFilter?.addEventListener("change", () => updateCompareFilter("channel", els.compareChannelFilter.value));
  els.compareStatusFilter?.addEventListener("change", () => updateCompareFilter("status", els.compareStatusFilter.value));
  els.compareMinPrice?.addEventListener("input", () => updateCompareFilter("minPrice", els.compareMinPrice.value));
  els.compareMaxPrice?.addEventListener("input", () => updateCompareFilter("maxPrice", els.compareMaxPrice.value));

  els.compareFieldPicker.addEventListener("change", (event) => {
    const input = event.target.closest("[data-compare-field-key]");
    if (!input) return;
    const selected = new Set(selectedCompareFieldKeys());
    if (input.checked) selected.add(input.dataset.compareFieldKey);
    else selected.delete(input.dataset.compareFieldKey);
    state.compareFieldKeys = selected.size ? Array.from(selected) : ["price", "category"];
    renderAll();
  });

  document.querySelector("#selectAllCompareFields").addEventListener("click", () => {
    state.compareFieldKeys = allCompareFields().map((field) => field.key);
    renderAll();
  });

  document.querySelector("#clearCompareFields").addEventListener("click", () => {
    state.compareFieldKeys = ["price", "category"];
    renderAll();
  });

  document.querySelector("#compareFilteredProducts").addEventListener("click", compareFilteredProducts);
  document.querySelector("#compareSimilarProducts").addEventListener("click", compareSimilarProducts);
  document.querySelector("#openImportFromProducts")?.addEventListener("click", () => setActiveWorkspace("import"));

  els.moduleList.addEventListener("click", (event) => {
    const moveModuleButton = event.target.closest("[data-move-module]");
    if (moveModuleButton) {
      moveModule(moveModuleButton.dataset.moveModule, Number(moveModuleButton.dataset.moveDirection || 0));
      return;
    }
    const moveFieldButton = event.target.closest("[data-move-field]");
    if (moveFieldButton) {
      moveFeatureField(moveFieldButton.dataset.moveField, Number(moveFieldButton.dataset.moveDirection || 0));
      return;
    }
    const renameButton = event.target.closest("[data-rename-field]");
    if (renameButton) {
      renameFeatureField(renameButton.dataset.renameField);
      return;
    }
    const optionsButton = event.target.closest("[data-edit-field-options]");
    if (optionsButton) {
      editFeatureFieldOptions(optionsButton.dataset.editFieldOptions);
      return;
    }
    const fieldButton = event.target.closest("[data-delete-field]");
    if (fieldButton) {
      deleteFeatureField(fieldButton.dataset.deleteField);
      return;
    }
    const button = event.target.closest("[data-delete-module]");
    if (!button) return;
    state.modules = state.modules.filter((module) => module.name !== button.dataset.deleteModule);
    renderAll();
  });

  document.querySelector("#addField").addEventListener("click", addField);
  els.fieldType.addEventListener("change", updateFieldOptionsState);
  document.querySelector("#generateSummary").addEventListener("click", generateSummary);
  document.querySelector("#exportCompare").addEventListener("click", exportCompare);
  document.querySelector("#refreshUsage").addEventListener("click", loadUsage);
  document.querySelector("#exportUsageCsv").addEventListener("click", exportUsageCsv);
  document.querySelector("#exportAuditCsv").addEventListener("click", exportAuditCsv);
  document.querySelector("#refreshHealth").addEventListener("click", loadHealth);
  document.querySelector("#exportExcel").addEventListener("click", exportExcel);
  document.querySelector("#exportRoadmap").addEventListener("click", exportRoadmap);
  document.querySelector("#exportRoadmapSvg").addEventListener("click", exportRoadmapSvg);
  document.querySelector("#printAllBrandRoadmaps").addEventListener("click", printAllBrandRoadmaps);
  document.querySelectorAll("[data-roadmap-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.roadmapMode = button.dataset.roadmapMode || "single";
      renderAll();
      scrollToWorkspace("roadmapPanel");
    });
  });
  els.roadmapBrandToggle?.addEventListener("click", () => {
    const isOpen = els.roadmapBrandDropdown.classList.toggle("is-open");
    els.roadmapBrandToggle.setAttribute("aria-expanded", String(isOpen));
  });
  els.roadmapBrandClear?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setRoadmapBrands([]);
    renderAll();
  });
  els.roadmapBrandClear?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    setRoadmapBrands([]);
    renderAll();
  });
  els.roadmapBrandMenu?.addEventListener("change", (event) => {
    const input = event.target.closest("[data-roadmap-brand]");
    if (!input) return;
    if (input.dataset.roadmapBrand === "__all") {
      setRoadmapBrands([]);
      renderAll();
      return;
    }
    const selected = new Set(selectedRoadmapBrands());
    if (input.checked) selected.add(input.dataset.roadmapBrand);
    else selected.delete(input.dataset.roadmapBrand);
    setRoadmapBrands(Array.from(selected));
    renderAll();
  });
  els.roadmapCategoryFilter.addEventListener("change", () => {
    state.roadmapCategory = els.roadmapCategoryFilter.value;
    renderAll();
  });
  els.roadmapStatusFilter.addEventListener("change", () => {
    state.roadmapStatus = els.roadmapStatusFilter.value;
    renderAll();
  });
  els.roadmapQuarterFilter.addEventListener("change", () => {
    state.roadmapQuarter = els.roadmapQuarterFilter.value;
    renderAll();
  });
  document.querySelector("#exportDataPackage")?.addEventListener("click", exportDataPackage);
  document.querySelector("#importDataPackage")?.addEventListener("click", () => els.dataPackageFile.click());
  els.dataPackageFile?.addEventListener("change", () => importDataPackage(els.dataPackageFile.files?.[0]));
  document.querySelector("#importCsv")?.addEventListener("click", () => els.csvImportFile.click());
  document.querySelector("#downloadCsvTemplate")?.addEventListener("click", downloadCsvTemplate);
  els.csvImportFile?.addEventListener("change", () => importCsvProducts(els.csvImportFile.files?.[0]));
  document.querySelector("#runAnalysis").addEventListener("click", runAnalysis);
  els.retryAnalysis?.addEventListener("click", runAnalysis);
  document.querySelector("#fetchSourceMetadata").addEventListener("click", fetchSourceMetadata);
  els.startBrowserFetch?.addEventListener("click", startBrowserFetch);
  els.collectBrowserFetch?.addEventListener("click", collectBrowserFetch);
  els.cancelBrowserFetch?.addEventListener("click", cancelBrowserFetch);
  els.sourceImage.addEventListener("change", showSelectedAnalysisFiles);
  document.querySelector("#createProduct").addEventListener("click", createProduct);
  document.querySelector("#closeImport").addEventListener("click", () => {
    els.importPanel.classList.remove("is-open");
    setActiveWorkspace("products");
  });

  document.querySelector("#saveView").addEventListener("click", saveCurrentView);
  document.querySelector("#deleteSavedView").addEventListener("click", deleteSavedView);

  els.savedViews.addEventListener("change", () => {
    selectedSavedViewIndex = els.savedViews.value;
    const view = savedViews[Number(els.savedViews.value)];
    if (!view) {
      els.savedViewName.value = "";
      return;
    }
    els.savedViewName.value = view.name;
    applyWorkspaceView(view);
    renderAll();
  });
}

async function initialize() {
  await hydrateWorkspace();
  bindEvents();
  updateFieldOptionsState();
  resetAnalysisSteps();
  renderAll();
  renderHealth();
  loadHealth();
  renderUsage();
  loadUsage();
}

initialize();
